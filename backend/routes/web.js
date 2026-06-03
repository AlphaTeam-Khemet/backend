const router = require('express').Router();
const { Monument, MonumentTranslation, MonumentImage, Language } = require('../models');
const lang = require('../middleware/lang');

function pickTranslation(translations = [], langCode = 'en') {
  return (
    translations.find((translation) => translation.language?.code === langCode) ||
    translations.find((translation) => translation.language?.code === 'en') ||
    translations[0] ||
    null
  );
}

router.get('/', (req, res) => {
  res.render('home', { title: 'Home — Grand Egyptian Museum' });
});

router.get('/monuments', lang, async (req, res) => {
  try {
    const language = await Language.findOne({ where: { code: req.lang } });
    if (!language) return res.status(500).send('Language not found');

    const monuments = await Monument.findAll({
      include: [{
        model: MonumentTranslation,
        as: 'translations',
        include: [{ model: Language, as: 'language', where: { code: [req.lang, 'en'] }, attributes: ['code'] }],
        required: false,
      }],
      order: [['created_at', 'ASC']],
    });

    const data = monuments.map(m => {
      const t = pickTranslation(m.translations, req.lang);
      return {
        id: m.id,
        name: t?.name || 'Untitled',
        description: t?.description || '',
        era: m.era,
        category: m.category,
        cover_image: m.cover_image,
      };
    });

    res.render('monuments', { title: 'Monuments — GEM', monuments: data });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/monuments/:id', lang, async (req, res) => {
  try {
    const language = await Language.findOne({ where: { code: req.lang } });
    if (!language) return res.status(500).send('Language not found');

    const monument = await Monument.findByPk(req.params.id, {
      include: [
        {
          model: MonumentTranslation,
          as: 'translations',
          include: [{ model: Language, as: 'language', where: { code: [req.lang, 'en'] }, attributes: ['code'] }],
          required: false,
        },
        {
          model: MonumentImage,
          as: 'images',
        },
      ],
    });
    if (!monument) return res.status(404).send('Not found');

    const t = pickTranslation(monument.translations, req.lang);
    const data = {
      id: monument.id,
      name: t?.name || 'Untitled',
      description: t?.description || '',
      fun_facts: t?.fun_facts || [],
      era: monument.era,
      category: monument.category,
      latitude: monument.latitude,
      longitude: monument.longitude,
      cover_image: monument.cover_image,
      images: monument.images || [],
    };

    res.render('monument', { title: data.name + ' — GEM', monument: data });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = router;
