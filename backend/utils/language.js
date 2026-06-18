const { Language } = require('../models');

async function resolveLanguageId(value, defaultCode = null) {
  const candidate = value ?? defaultCode;
  if (candidate === null || candidate === undefined || candidate === '') return null;

  if (Number.isInteger(candidate) || /^\d+$/.test(String(candidate))) {
    const language = await Language.findByPk(Number(candidate));
    return language?.id || null;
  }

  const language = await Language.findOne({
    where: { code: String(candidate).trim().toLowerCase(), is_active: true },
  });
  return language?.id || null;
}

module.exports = { resolveLanguageId };
