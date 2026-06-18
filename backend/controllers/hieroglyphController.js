const hieroglyphClient = require('../utils/hieroglyphClient');

function sendServiceError(res, error) {
  return res.status(error.statusCode || 502).json({
    success: false,
    error: error.name || 'HieroglyphServiceError',
    message: error.message || 'Hieroglyph translator service failed.',
  });
}

exports.health = async (req, res) => {
  try {
    const data = await hieroglyphClient.health();
    res.json(data);
  } catch (error) {
    sendServiceError(res, error);
  }
};

exports.translate = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'IMAGE_REQUIRED',
      message: 'Image is required.',
    });
  }

  try {
    const data = await hieroglyphClient.translate(req.file.path);
    res.status(201).json(data);
  } catch (error) {
    sendServiceError(res, error);
  }
};

exports.detectOnly = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'IMAGE_REQUIRED',
      message: 'Image is required.',
    });
  }

  try {
    const data = await hieroglyphClient.detectOnly(req.file.path);
    res.status(201).json(data);
  } catch (error) {
    sendServiceError(res, error);
  }
};

