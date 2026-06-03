const { Monument, MonumentTranslation, MonumentImage, Language, Review } = require('../models');
const { Op } = require('sequelize');

function langInclude(langCode) {
  return {
    model: MonumentTranslation,
    as: 'translations',
    include: [{ model: Language, as: 'language', where: { code: [langCode, 'en'] }, attributes: ['code'] }],
    required: false,
  };
}

function pickTranslation(translations = [], langCode = 'en') {
  return (
    translations.find((translation) => translation.language?.code === langCode) ||
    translations.find((translation) => translation.language?.code === 'en') ||
    translations[0] ||
    null
  );
}

exports.getAll = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const monuments = await Monument.findAll({
      include: [
        langInclude(lang),
        { model: MonumentImage, as: 'images', attributes: ['id', 'image_url', 'caption', 'sort_order'] },
      ],
      order: [['created_at', 'ASC']],
    });

    const data = monuments.map(m => {
      const t = pickTranslation(m.translations, lang);
      return {
        id: m.id,
        name: t?.name || 'Untitled Monument',
        description: t?.description || 'No description is available yet.',
        fun_facts: t?.fun_facts || [],
        latitude: m.latitude,
        longitude: m.longitude,
        era: m.era,
        category: m.category,
        cover_image: m.cover_image,
        ai_label: m.ai_label,
        images: m.images,
      };
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const lang = req.lang || 'en';
    const monument = await Monument.findByPk(req.params.id, {
      include: [
        langInclude(lang),
        { model: MonumentImage, as: 'images', attributes: ['id', 'image_url', 'caption', 'sort_order'] },
        { model: Review, as: 'reviews', attributes: ['id', 'user_id', 'rating', 'comment', 'created_at'] },
      ],
    });
    if (!monument) return res.status(404).json({ error: 'Monument not found' });

    const t = pickTranslation(monument.translations, lang);
    res.json({
      id: monument.id,
      name: t?.name || 'Untitled Monument',
      description: t?.description || 'No description is available yet.',
      fun_facts: t?.fun_facts || [],
      latitude: monument.latitude,
      longitude: monument.longitude,
      era: monument.era,
      category: monument.category,
      cover_image: monument.cover_image,
      ai_label: monument.ai_label,
      images: monument.images,
      reviews: monument.reviews,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
