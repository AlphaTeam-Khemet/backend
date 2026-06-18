const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/hieroglyphController');

const imageUpload = upload.single('image');

function handleImageUpload(req, res, next) {
  imageUpload(req, res, (error) => {
    if (!error) return next();

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'IMAGE_TOO_LARGE',
        message: `Image is too large. Maximum allowed size is ${upload.maxUploadSizeMb}MB.`,
      });
    }

    if (error instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: 'UPLOAD_ERROR',
        message: error.message,
      });
    }

    return next(error);
  });
}

router.get('/health', ctrl.health);
router.post('/translate', auth, handleImageUpload, upload.validateMagicNumber, ctrl.translate);
router.post('/detect-only', auth, handleImageUpload, upload.validateMagicNumber, ctrl.detectOnly);

module.exports = router;
