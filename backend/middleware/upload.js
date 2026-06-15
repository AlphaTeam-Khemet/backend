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

const fs = require('fs/promises');

// Magic numbers for allowed image types
const MAGIC_NUMBERS = {
  jpeg: [0xFF, 0xD8, 0xFF],
  png: [0x89, 0x50, 0x4E, 0x47],
  gif: [0x47, 0x49, 0x46, 0x38],
  webp: [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50],
};

function checkMagicNumber(buffer) {
  for (const [type, magic] of Object.entries(MAGIC_NUMBERS)) {
    let match = true;
    for (let i = 0; i < magic.length; i++) {
      if (magic[i] !== null && buffer[i] !== magic[i]) {
        match = false;
        break;
      }
    }
    if (match) return type;
  }
  return null;
}

module.exports.validateMagicNumber = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const fileHandle = await fs.open(req.file.path, 'r');
    const buffer = Buffer.alloc(12);
    await fileHandle.read(buffer, 0, 12, 0);
    await fileHandle.close();

    const type = checkMagicNumber(buffer);

    if (!type) {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        error: 'INVALID_FILE_TYPE',
        message: 'Uploaded file is not a valid image. Magic number verification failed.',
      });
    }

    next();
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    next(error);
  }
};
