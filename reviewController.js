const { Favorite, Monument } = require('../models');

exports.getAll = async (req, res) => {
  try {
    const favorites = await Favorite.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Monument }],
      order: [['created_at', 'DESC']],
    });
    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { monument_id } = req.body;
    const monument = await Monument.findByPk(monument_id);
    if (!monument) return res.status(404).json({ error: 'Monument not found' });

    const [fav, created] = await Favorite.findOrCreate({
      where: { user_id: req.user.id, monument_id },
    });
    res.status(created ? 201 : 200).json(fav);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Favorite.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) return res.status(404).json({ error: 'Favorite not found' });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
