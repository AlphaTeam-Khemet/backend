const router = require('express').Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const lang = require('../middleware/lang');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/scanController');

const imageUpload = upload.single('image');

function handleImageUpload(req, res, next) {
  imageUpload(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'IMAGE_TOO_LARGE',
        message: `Image is too large. Maximum allowed size is ${upload.maxUploadSizeMb}MB.`,
      });
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        success: false,
        error: 'UPLOAD_ERROR',
        message: err.message,
      });
    }

    return next(err);
  });
}

router.post('/artifact', auth, lang, handleImageUpload, ctrl.artifact);
router.post('/translate', auth, lang, handleImageUpload, ctrl.translate);
router.get('/history', auth, lang, ctrl.history);

module.exports = router;
