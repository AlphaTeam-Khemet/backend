const axios = require('axios');

const FALLBACK_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'can', 'did', 'do', 'does', 'for', 'from',
  'how', 'is', 'it', 'know', 'me', 'of', 'on', 'please', 'tell', 'the', 'to',
  'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'with',
  'you', 'explain', 'describe', 'give', 'show', 'information', 'details',
  'ماذا', 'ما', 'من', 'هو', 'هي', 'عن', 'تعرف', 'اعرف', 'اشرح', 'شرح',
  'حدثني', 'حدثنى', 'قل', 'لي', 'على', 'في', 'فى', 'الى', 'إلى', 'هل',
  'كان', 'كانت', 'هذا', 'هذه', 'ذلك', 'تلك',
]);

const ENGLISH_TYPE_WORDS = new Set([
  'boat', 'coffin', 'mask', 'museum', 'obelisk', 'pyramid', 'sphinx', 'statue',
  'temple', 'tomb',
]);

const ENGLISH_LEADING_DESCRIPTORS = new Set([
  'bent', 'golden', 'great', 'red', 'step', 'white',
]);

const ROMAN_NUMERAL_PATTERN = /^(?:[ivxlcdm]+)$/i;

function titleCaseEnglish(word) {
  if (/^[A-Z]{2,}$/.test(word) || ROMAN_NUMERAL_PATTERN.test(word)) {
    return word.toUpperCase();
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function isArabicText(text) {
  return /[\u0600-\u06FF]/.test(text);
}

function cleanTitle(title) {
  const words = String(title || '')
    .replace(/["'`]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !FALLBACK_STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 3);

  if (words.length === 0) return '';

  if (isArabicText(words.join(' '))) {
    return words.join(' ').trim();
  }

  return words.map(titleCaseEnglish).join(' ').trim();
}

function tokenizeMeaningfulWords(question) {
  return String(question || '')
    .replace(/[؟?!.،,;:()[\]{}"“”'`]/g, ' ')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !FALLBACK_STOP_WORDS.has(word.toLowerCase()));
}

function buildEnglishFallback(words) {
  if (words.length === 0) return '';

  const lowerWords = words.map((word) => word.toLowerCase());

  const romanIndex = lowerWords.findIndex((word) => ROMAN_NUMERAL_PATTERN.test(word));
  if (romanIndex > 0) {
    return cleanTitle(words.slice(romanIndex - 1, romanIndex + 1).join(' '));
  }

  const typeIndex = lowerWords.findIndex((word) => ENGLISH_TYPE_WORDS.has(word));
  if (typeIndex > 0) {
    const firstWord = lowerWords[0];
    if (typeIndex === 1 || ENGLISH_LEADING_DESCRIPTORS.has(firstWord)) {
      return cleanTitle(words.slice(0, 2).join(' '));
    }

    return cleanTitle([words[0], words[typeIndex]].join(' '));
  }

  return cleanTitle(words.slice(0, 2).join(' '));
}

function fallbackTitle(question) {
  const words = tokenizeMeaningfulWords(question);

  const title = isArabicText(question)
    ? cleanTitle(words.slice(0, 3).join(' '))
    : buildEnglishFallback(words);

  return title || 'New Chat';
}

async function generateTitleWithGroq(question) {
  if (!process.env.GROQ_API_KEY) return null;

  const model = process.env.GROQ_TITLE_MODEL || 'llama-3.1-8b-instant';
  const { data } = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      temperature: 0.2,
      max_tokens: 8,
      messages: [
        {
          role: 'system',
          content: [
            'Generate a very short conversation title from the user question.',
            'Use the main historical figure, artifact, place, or topic.',
            'Return only the title.',
            'Do not return a full sentence.',
            'Do not include quotation marks.',
            'Do not include generic words like "What", "Who", "Tell me", "Explain", "ماذا", "من", "اشرح".',
            'Prefer 2 words, maximum 3 words.',
            'Use the same language as the user question if possible.',
          ].join(' '),
        },
        {
          role: 'user',
          content: String(question || '').slice(0, 500),
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: Number(process.env.GROQ_TITLE_TIMEOUT_MS || 4000),
    }
  );

  return cleanTitle(data?.choices?.[0]?.message?.content);
}

async function generateConversationTitle(question) {
  try {
    const aiTitle = await generateTitleWithGroq(question);
    if (aiTitle) return aiTitle;
  } catch {
    // Title generation is best-effort and must never block chat responses.
  }

  return fallbackTitle(question);
}

module.exports = {
  generateConversationTitle,
  fallbackTitle,
};
