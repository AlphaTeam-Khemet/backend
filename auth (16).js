const multer = require('multer');
const path = require('path');

const configuredMaxUploadSizeMb = Number(process.env.MAX_UPLOAD_SIZE_MB || 10);
const maxUploadSizeMb = Number.isFinite(configuredMaxUploadSizeMb) && configuredMaxUploadSizeMb > 0
  ? configuredMaxUploadSizeMb
  : 10;
const maxUploadSizeBytes = maxUploadSizeMb * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  cb(null, ext && mime);
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxUploadSizeBytes },
});

module.exports.maxUploadSizeMb = maxUploadSizeMb;
