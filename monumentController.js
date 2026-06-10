const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User, RefreshToken } = require('../models');
const { generateOtp, getOtpExpiry, hashOtp, verifyOtp } = require('../utils/otp');
const { sendPasswordResetOtp } = require('../utils/emailClient');

const RESET_SAFE_MESSAGE = 'If this email exists, a password reset code has been sent.';
const RESET_INVALID_MESSAGE = 'Invalid or expired password reset code';

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
    const user = await User.create({ full_name, email, password_hash, preferred_language });

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
      user: { id: user.id, full_name: user.full_name, email: user.email },
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
      user: { id: user.id, full_name: user.full_name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
