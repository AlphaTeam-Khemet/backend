const nodemailer = require('nodemailer');
const { OTP_TTL_MINUTES } = require('./otp');

function emailConfigReady() {
  return Boolean(process.env.EMAIL_HOST && process.env.EMAIL_PORT);
}

function createTransporter() {
  const auth = process.env.EMAIL_USER && process.env.EMAIL_PASS
    ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    : undefined;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: String(process.env.EMAIL_SECURE).toLowerCase() === 'true',
    auth,
  });
}

async function sendPasswordResetOtp({ to, otp }) {
  if (!emailConfigReady()) {
    // Development fallback: do not fail forgot-password when SMTP is absent.
    // Never log OTPs in production. Configure Gmail using an App Password:
    // EMAIL_HOST=smtp.gmail.com, EMAIL_PORT=465, EMAIL_SECURE=true.
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[dev] Password reset OTP for ${to}: ${otp}`);
    }
    return { skipped: true };
  }

  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || 'Grand Egyptian Museum Tourist Guide <no-reply@gem-guide.com>';

  await transporter.sendMail({
    from,
    to,
    subject: 'Your password reset code',
    text: `Your Grand Egyptian Museum Tourist Guide password reset code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: `
      <p>Your Grand Egyptian Museum Tourist Guide password reset code is:</p>
      <h2 style="letter-spacing: 4px;">${otp}</h2>
      <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  });

  return { skipped: false };
}

module.exports = {
  sendPasswordResetOtp,
};
