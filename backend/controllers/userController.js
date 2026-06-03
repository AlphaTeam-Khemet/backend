const { User, Language } = require('../models');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Language, as: 'language' }],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { full_name, preferred_language } = req.body;
    await User.update({ full_name, preferred_language }, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Language, as: 'language' }],
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
