const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const { generateOtp, generateChoiceOtp, getOtpExpiry, hashOtp, verifyOtp } = require('../utils/otp');
const { sendPasswordResetOtp, sendEmailVerificationOtp } = require('../utils/emailClient');
const logger = require('../utils/logger');

const RESET_SAFE_MESSAGE = 'If this email exists, a password reset code has been sent.';
const RESET_INVALID_MESSAGE = 'Invalid or expired password reset code';
const EMAIL_INVALID_MESSAGE = 'Invalid or expired email verification code';
const MAX_EMAIL_OTP_ATTEMPTS = 5;

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    preferred_language: user.preferred_language,
    email_verified: Boolean(user.email_verified),
  };
}

function maskEmail(email) {
  const [localPart, domain] = String(email || '').split('@');
  if (!localPart || !domain) return '';
  const visible = localPart.slice(0, Math.min(5, localPart.length));
  const hiddenLength = Math.max(localPart.length - visible.length, 4);
  return `${visible}${'*'.repeat(hiddenLength)}@${domain}`;
}

function shuffle(values) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOtpOptions(otp) {
  const options = new Set([otp]);
  while (options.size < 3) {
    options.add(generateChoiceOtp());
  }
  return shuffle([...options]);
}

async function issueEmailVerificationOtp(user) {
  const otp = generateChoiceOtp();
  const email_otp_hash = await hashOtp(otp);

  await user.update({
    email_otp_hash,
    email_otp_expires_at: getOtpExpiry(),
    email_otp_attempts: 0,
  });

  try {
    await sendEmailVerificationOtp({ to: user.email, otp });
  } catch (error) {
    logger.warn('Email verification email failed', { error: error.message });
  }

  return {
    masked_email: maskEmail(user.email),
    options: buildOtpOptions(otp),
  };
}

async function verifyUserResetOtp(user, otp) {
  if (!user?.reset_password_otp_hash || !user?.reset_password_otp_expires_at) {
    return false;
  }

  if (user.reset_password_otp_expires_at < new Date()) {
    await user.update({
      reset_password_otp_hash: null,
      reset_password_otp_expires_at: null,
    });
    return false;
  }

  return verifyOtp(otp, user.reset_password_otp_hash);
}

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, preferred_language } = req.body;
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      full_name,
      email,
      password_hash,
      preferred_language,
      email_verified: false,
    });
    const verification = await issueEmailVerificationOtp(user);

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshTokenStr = crypto.randomBytes(64).toString('hex');
    await RefreshToken.create({
      user_id: user.id,
      token: refreshTokenStr,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      user: publicUser(user),
      ...verification,
    });
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const accessToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshTokenStr = crypto.randomBytes(64).toString('hex');
    await RefreshToken.create({
      user_id: user.id,
      token: refreshTokenStr,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({
      access_token: accessToken,
      refresh_token: refreshTokenStr,
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.sendEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) {
      return res.status(409).json({ error: 'Email is already verified' });
    }

    const payload = await issueEmailVerificationOtp(user);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.resendEmailVerification = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) {
      return res.status(409).json({ error: 'Email is already verified' });
    }

    const payload = await issueEmailVerificationOtp(user);
    res.json(payload);
  } catch (err) {
    next(err);
  }
};

exports.verifyEmail = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) {
      return res.status(409).json({ error: 'Email is already verified' });
    }

    if (!user.email_otp_hash || !user.email_otp_expires_at) {
      return res.status(400).json({ error: EMAIL_INVALID_MESSAGE });
    }

    if (user.email_otp_expires_at < new Date()) {
      await user.update({
        email_otp_hash: null,
        email_otp_expires_at: null,
        email_otp_attempts: 0,
      });
      return res.status(400).json({ error: EMAIL_INVALID_MESSAGE });
    }

    if (user.email_otp_attempts >= MAX_EMAIL_OTP_ATTEMPTS) {
      await user.update({
        email_otp_hash: null,
        email_otp_expires_at: null,
        email_otp_attempts: 0,
      });
      return res.status(429).json({ error: 'Too many invalid verification attempts. Please request a new code.' });
    }

    const valid = await verifyOtp(otp, user.email_otp_hash);
    if (!valid) {
      await user.increment('email_otp_attempts');
      return res.status(400).json({ error: EMAIL_INVALID_MESSAGE });
    }

    await user.update({
      email_verified: true,
      email_otp_hash: null,
      email_otp_expires_at: null,
      email_otp_attempts: 0,
    });

    res.json({
      message: 'Email verified successfully',
      user: publicUser(user),
    });
  } catch (err) {
    next(err);
  }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });

    const stored = await RefreshToken.findOne({ where: { token: refresh_token } });
    if (!stored || stored.expires_at < new Date()) {
      if (stored) await stored.destroy();
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const accessToken = jwt.sign({ id: stored.user_id }, process.env.JWT_SECRET, { expiresIn: '15m' });
    res.json({ access_token: accessToken });
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await RefreshToken.destroy({ where: { token: refresh_token } });
    res.json({ message: 'Logged out' });
  } catch (err) {
    next(err);
  }
};

exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (user) {
      const otp = generateOtp();
      const reset_password_otp_hash = await hashOtp(otp);
      await user.update({
        reset_password_otp_hash,
        reset_password_otp_expires_at: getOtpExpiry(),
      });

      try {
        await sendPasswordResetOtp({ to: user.email, otp });
      } catch (error) {
        logger.warn('Password reset email failed', { error: error.message });
      }
    }

    res.json({ message: RESET_SAFE_MESSAGE });
  } catch (err) {
    next(err);
  }
};

exports.verifyResetOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });
    const valid = await verifyUserResetOtp(user, otp);

    if (!valid) return res.status(400).json({ error: RESET_INVALID_MESSAGE });

    res.json({ message: 'Password reset code verified' });
  } catch (err) {
    next(err);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, new_password } = req.body;
    const user = await User.findOne({ where: { email } });
    const valid = await verifyUserResetOtp(user, otp);

    if (!valid) return res.status(400).json({ error: RESET_INVALID_MESSAGE });

    const password_hash = await bcrypt.hash(new_password, 10);
    await user.update({
      password_hash,
      reset_password_otp_hash: null,
      reset_password_otp_expires_at: null,
    });

    await RefreshToken.destroy({ where: { user_id: user.id } });

    res.json({ message: 'Password has been reset successfully' });
  } catch (err) {
    next(err);
  }
};
