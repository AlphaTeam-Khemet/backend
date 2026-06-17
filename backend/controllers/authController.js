const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const { generateOtp, generateChoiceOtp, getOtpExpiry, hashOtp, verifyOtp, OTP_TTL_MINUTES } = require('../utils/otp');
const { sendEmailVerificationOtp, sendPasswordResetOtp } = require('../utils/emailClient');

const RESET_SAFE_MESSAGE = 'If this email exists, a password reset code has been sent.';
const RESET_INVALID_MESSAGE = 'Invalid or expired password reset code';
const EMAIL_VERIFY_INVALID_MESSAGE = 'Invalid or expired email verification code';
const EMAIL_OTP_MAX_ATTEMPTS = 3;

function publicUser(user) {
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    preferred_language: user.preferred_language,
    email_verified: Boolean(user.email_verified),
  };
}

function maskEmail(email = '') {
  const [name, domain] = email.split('@');
  if (!name || !domain) return email;

  const visible = name.slice(0, Math.min(5, Math.max(2, name.length)));
  return `${visible}${'*'.repeat(Math.max(4, name.length - visible.length))}@${domain}`;
}

function shuffle(values) {
  const copy = [...values];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = crypto.randomInt(0, index + 1);
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function createEmailVerificationOptions(correctOtp) {
  const options = new Set([correctOtp]);
  while (options.size < 3) {
    options.add(generateChoiceOtp());
  }
  return shuffle([...options]);
}

async function issueEmailVerification(user) {
  const otp = generateChoiceOtp();
  const email_otp_hash = await hashOtp(otp);

  await user.update({
    email_verified: false,
    email_otp_hash,
    email_otp_expires_at: getOtpExpiry(),
    email_otp_attempts: 0,
  });

  try {
    await sendEmailVerificationOtp({ to: user.email, otp });
  } catch (error) {
    console.error('Email verification email failed:', error.message);
  }

  return {
    masked_email: maskEmail(user.email),
    options: createEmailVerificationOptions(otp),
    expires_in_minutes: OTP_TTL_MINUTES,
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

exports.register = async (req, res) => {
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
    const emailVerification = await issueEmailVerification(user);

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
      ...emailVerification,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) {
      return res.status(409).json({
        error: 'EMAIL_ALREADY_VERIFIED',
        message: 'Email is already verified.',
      });
    }

    const emailVerification = await issueEmailVerification(user);
    return res.json({
      message: 'Email verification code sent.',
      ...emailVerification,
    });
  } catch {
    return res.status(500).json({ error: 'Unable to send email verification code' });
  }
};

exports.resendEmailVerification = exports.sendEmailVerification;

exports.verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) {
      return res.json({
        message: 'Email is already verified.',
        email_verified: true,
        user: publicUser(user),
      });
    }

    if (!user.email_otp_hash || !user.email_otp_expires_at) {
      return res.status(400).json({ error: EMAIL_VERIFY_INVALID_MESSAGE });
    }

    if (user.email_otp_expires_at < new Date()) {
      await user.update({
        email_otp_hash: null,
        email_otp_expires_at: null,
        email_otp_attempts: 0,
      });
      return res.status(400).json({ error: EMAIL_VERIFY_INVALID_MESSAGE });
    }

    if (user.email_otp_attempts >= EMAIL_OTP_MAX_ATTEMPTS) {
      await user.update({
        email_otp_hash: null,
        email_otp_expires_at: null,
        email_otp_attempts: 0,
      });
      return res.status(429).json({
        error: 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED',
        message: 'Too many verification attempts. Please request a new code.',
      });
    }

    const valid = await verifyOtp(otp, user.email_otp_hash);
    if (!valid) {
      const nextAttempts = user.email_otp_attempts + 1;
      const clearCode = nextAttempts >= EMAIL_OTP_MAX_ATTEMPTS;
      await user.update({
        email_otp_attempts: clearCode ? 0 : nextAttempts,
        email_otp_hash: clearCode ? null : user.email_otp_hash,
        email_otp_expires_at: clearCode ? null : user.email_otp_expires_at,
      });

      return res.status(clearCode ? 429 : 400).json({
        error: clearCode ? 'EMAIL_VERIFICATION_ATTEMPTS_EXCEEDED' : EMAIL_VERIFY_INVALID_MESSAGE,
        message: clearCode
          ? 'Too many verification attempts. Please request a new code.'
          : EMAIL_VERIFY_INVALID_MESSAGE,
      });
    }

    await user.update({
      email_verified: true,
      email_otp_hash: null,
      email_otp_expires_at: null,
      email_otp_attempts: 0,
    });

    return res.json({
      message: 'Email verified successfully.',
      email_verified: true,
      user: publicUser(user),
    });
  } catch {
    return res.status(500).json({ error: 'Unable to verify email' });
  }
};

exports.refresh = async (req, res) => {
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
    res.status(500).json({ error: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (refresh_token) await RefreshToken.destroy({ where: { token: refresh_token } });
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
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
        console.error('Password reset email failed:', error.message);
      }
    }

    res.json({ message: RESET_SAFE_MESSAGE });
  } catch {
    res.status(500).json({ error: 'Unable to process password reset request' });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ where: { email } });
    const valid = await verifyUserResetOtp(user, otp);

    if (!valid) return res.status(400).json({ error: RESET_INVALID_MESSAGE });

    res.json({ message: 'Password reset code verified' });
  } catch {
    res.status(500).json({ error: 'Unable to verify password reset code' });
  }
};

exports.resetPassword = async (req, res) => {
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
  } catch {
    res.status(500).json({ error: 'Unable to reset password' });
  }
};
