const router = require('express').Router();
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const ctrl = require('../controllers/authController');

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many password reset attempts. Please try again later.' },
});

const emailVerificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many email verification attempts. Please try again later.' },
});

router.post('/register', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').notEmpty().withMessage('Full name is required'),
], validate, ctrl.register);

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], validate, ctrl.login);

router.post('/refresh', ctrl.refresh);
router.post('/logout', ctrl.logout);

router.post('/send-email-verification', auth, emailVerificationLimiter, ctrl.sendEmailVerification);

router.post('/resend-email-verification', auth, emailVerificationLimiter, ctrl.resendEmailVerification);

router.post('/verify-email', auth, emailVerificationLimiter, [
  body('otp')
    .isLength({ min: 2, max: 6 })
    .isNumeric()
    .withMessage('A valid verification number is required'),
], validate, ctrl.verifyEmail);

router.post('/forgot-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
], validate, ctrl.forgotPassword);

router.post('/verify-reset-otp', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('A valid 6-digit OTP is required'),
], validate, ctrl.verifyResetOtp);

router.post('/reset-password', passwordResetLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('A valid 6-digit OTP is required'),
  body('new_password').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
], validate, ctrl.resetPassword);

module.exports = router;
