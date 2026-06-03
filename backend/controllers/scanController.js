const { ScanSession, Monument, MonumentTranslation, MonumentImage, Language } = require('../models');
const aiClient = require('../utils/aiClient');
const ragClient = require('../utils/ragClient');
const { getMonumentNameForClass } = require('../utils/classMapping');

function pickTranslation(translations = [], langCode = 'en') {
  return (
    translations.find((item) => item.language?.code === langCode) ||
    translations.find((item) => item.language?.code === 'en') ||
    translations[0] ||
    null
  );
}

async function findMonumentByEnglishName(name, langCode = 'en') {
  if (!name) return null;

  const translation = await MonumentTranslation.findOne({
    where: { name },
    include: [
      { model: Language, as: 'language', where: { code: 'en' }, attributes: [] },
      {
        model: Monument,
        include: [{ model: MonumentImage, as: 'images', attributes: ['id', 'image_url', 'caption', 'sort_order'] }],
      },
    ],
  });

  if (!translation?.Monument) return null;

  const monument = await Monument.findByPk(translation.Monument.id, {
    include: [
      {
        model: MonumentTranslation,
        as: 'translations',
        include: [{ model: Language, as: 'language', where: { code: [langCode, 'en'] }, attributes: ['code'] }],
        required: false,
      },
      { model: MonumentImage, as: 'images', attributes: ['id', 'image_url', 'caption', 'sort_order'] },
    ],
  });
  const selectedTranslation = pickTranslation(monument?.translations, langCode) || translation;

  return {
    id: monument.id,
    name: selectedTranslation.name || translation.name,
    description: selectedTranslation.description || translation.description,
    fun_facts: selectedTranslation.fun_facts || [],
    latitude: monument.latitude,
    longitude: monument.longitude,
    era: monument.era,
    category: monument.category,
    cover_image: monument.cover_image,
    ai_label: monument.ai_label,
    images: monument.images || [],
  };
}

exports.artifact = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });

    const scanned_image = `/uploads/${req.file.filename}`;
    let aiResult = null;
    let monument = null;
    let mappedMonumentName = null;
    let aiGuideDescription = null;
    let status = 'completed';

    try {
      // cv-recognition is responsible only for computer vision artifact recognition.
      aiResult = await aiClient.recognizeArtifact(req.file.path);
      mappedMonumentName = getMonumentNameForClass(aiResult.class_name);
      monument = await findMonumentByEnglishName(mappedMonumentName, req.lang || 'en');

      if (!mappedMonumentName || !monument) {
        status = 'not_found';
      }
    } catch (error) {
      status = 'failed';
      aiResult = {
        error: error.message || 'AI service is unavailable. Please try again later.',
        class_name: null,
        confidence: null,
      };
    }

    if (status === 'completed' && mappedMonumentName) {
      try {
        // chatbot-llm adds optional Groq + ChromaDB historical guide text.
        // It must never block the core scan/artifact-recognition flow.
        const guideResult = await ragClient.describe({ monument_name: mappedMonumentName }, { timeout: 8000 });
        aiGuideDescription = guideResult.description || null;
      } catch {
        aiGuideDescription = null;
      }
    }

    const session = await ScanSession.create({
      user_id: req.user.id,
      monument_id: monument?.id || null,
      scanned_image,
      confidence: aiResult.confidence ?? null,
      status,
    });

    res.status(201).json({
      session,
      ai_result: aiResult,
      mapped_monument_name: mappedMonumentName,
      monument,
      ai_guide_description: aiGuideDescription,
      message: status === 'failed'
        ? 'Image uploaded, but the AI service could not process it.'
        : status === 'not_found'
          ? 'AI prediction completed, but no matching monument was found in the database.'
          : 'Artifact recognized successfully.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.translate = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image required' });

    const scanned_image = `/uploads/${req.file.filename}`;
    let aiResult;
    try {
      aiResult = await aiClient.translateHieroglyph(req.file.path);
    } catch {
      aiResult = { error: 'AI service unavailable', detected_text: null, translation: null };
    }

    const session = await ScanSession.create({
      user_id: req.user.id,
      scanned_image,
      confidence: aiResult.confidence ?? null,
      status: aiResult.error ? 'failed' : 'completed',
    });

    res.status(201).json({ session, ai_result: aiResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.history = async (req, res) => {
  try {
    const sessions = await ScanSession.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Monument, attributes: ['id', 'cover_image', 'ai_label', 'category'] }],
      order: [['scanned_at', 'DESC']],
    });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
