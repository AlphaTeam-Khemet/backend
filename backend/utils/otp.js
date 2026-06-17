const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const OTP_TTL_MINUTES = 10;

function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

function generateChoiceOtp() {
  return crypto.randomInt(10, 100).toString();
}

function getOtpExpiry() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

function hashOtp(otp) {
  return bcrypt.hash(otp, 10);
}

function verifyOtp(otp, hash) {
  if (!otp || !hash) return false;
  return bcrypt.compare(otp, hash);
}

module.exports = {
  OTP_TTL_MINUTES,
  generateOtp,
  generateChoiceOtp,
  getOtpExpiry,
  hashOtp,
  verifyOtp,
};
