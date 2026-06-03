const { Gallery, Monument, ScanSession } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const items = await Gallery.findAll({
      where: { user_id: req.user.id },
      include: [
        { model: Monument, attributes: ['id', 'cover_image', 'ai_label', 'category'] },
        { model: ScanSession, attributes: ['id', 'scanned_image', 'confidence'] },
      ],
      order: [['saved_at', 'DESC']],
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { monument_id, session_id, image_url } = req.body;
    const [item, created] = await Gallery.findOrCreate({
      where: { user_id: req.user.id, session_id: session_id || null },
      defaults: { monument_id, image_url },
    });
    res.status(created ? 201 : 200).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Gallery.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) return res.status(404).json({ error: 'Gallery item not found' });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
