const { ScanSession, Monument, MonumentTranslation, MonumentImage, Language } = require('../models');
const aiClient = require('../utils/aiClient');
const ragClient = require('../utils/ragClient');
const { getMonumentNameForClass } = require('../utils/classMapping');
const logger = require('../utils/logger');

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

exports.artifact = async (req, res, next) => {
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

    // The LLM description call was removed here because we already have 
    // high-quality pre-written descriptions in the database, and we want 
    // the scan to be as fast as possible.

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
    next(err);
  }
};

exports.translate = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'IMAGE_REQUIRED',
        message: 'Image is required for hieroglyph translation.',
      });
    }

    const scanned_image = `/uploads/${req.file.filename}`;
    let aiResult;
    let status = 'completed';

    try {
      // Call hieroglyph_translator service (YOLO detection + LLM translation)
      aiResult = await aiClient.translateHieroglyph(req.file.path);
    } catch (error) {
      status = 'failed';
      aiResult = {
        error: error.message || 'Hieroglyph translation service unavailable.',
        detection: null,
        translation: null,
      };
    }

    // Save scan session for history
    const session = await ScanSession.create({
      user_id: req.user.id,
      scanned_image,
      confidence: null,
      status,
    });

    if (status === 'failed') {
      return res.status(502).json({
        success: false,
        error: 'BAD_GATEWAY',
        message: aiResult.error || 'Hieroglyph translation service unavailable.',
        error_details: {
          session_id: session.id,
          scanned_image,
        },
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        session_id: session.id,
        scanned_image,
        image_id: aiResult.image_id || null,
        // Detection results — symbols found by YOLO
        detection: aiResult.detection
          ? {
              symbols: aiResult.detection.symbols || [],
              symbol_sequence: aiResult.detection.symbol_sequence || [],
              total_symbols: aiResult.detection.symbols?.length || 0,
            }
          : null,
        // Translation from LLM
        translation: aiResult.translation
          ? {
              text: aiResult.translation.translation || '',
              confidence_note: aiResult.translation.confidence_note || '',
              detected_glyphs: aiResult.translation.detected_glyphs || [],
              combined_phonetics: aiResult.translation.combined_phonetics || '',
              cultural_context: aiResult.translation.cultural_context || '',
              transliteration: aiResult.translation.transliteration || '',
              type: aiResult.translation.type || '',
              unknown_codes: aiResult.translation.unknown_codes || [],
            }
          : null,
        status,
        error: aiResult.error || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.history = async (req, res, next) => {
  try {
    const sessions = await ScanSession.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Monument, attributes: ['id', 'cover_image', 'ai_label', 'category'] }],
      order: [['scanned_at', 'DESC']],
    });
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};
