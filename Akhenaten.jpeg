const { Review, Monument } = require('../models');

exports.getByMonument = async (req, res) => {
  try {
    const reviews = await Review.findAll({
      where: { monument_id: req.params.monumentId },
      order: [['created_at', 'DESC']],
    });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { monument_id, rating, comment } = req.body;
    const monument = await Monument.findByPk(monument_id);
    if (!monument) return res.status(404).json({ error: 'Monument not found' });

    const [review, created] = await Review.findOrCreate({
      where: { user_id: req.user.id, monument_id },
      defaults: { rating, comment },
    });

    if (!created) {
      await review.update({ rating, comment });
    }

    res.status(created ? 201 : 200).json(review);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Review.destroy({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!deleted) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
