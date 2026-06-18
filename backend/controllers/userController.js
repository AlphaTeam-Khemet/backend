const { User, Language } = require('../models');
const { resolveLanguageId } = require('../utils/language');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Language, as: 'language' }],
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { full_name, preferred_language } = req.body;
    const updates = { full_name };
    if (preferred_language !== undefined) {
      const preferredLanguageId = await resolveLanguageId(preferred_language);
      if (!preferredLanguageId) {
        return res.status(400).json({ error: 'Unsupported preferred language' });
      }
      updates.preferred_language = preferredLanguageId;
    }
    await User.update(updates, { where: { id: req.user.id } });
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{ model: Language, as: 'language' }],
    });
    res.json(user);
  } catch (err) {
    next(err);
  }
};
