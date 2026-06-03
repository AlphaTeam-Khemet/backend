require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const path = require('path');
const fs = require('fs');
const sequelize = require('../config/database');
const { Language, Monument, MonumentTranslation, MonumentImage } = require('../models');

const LANGS = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'zh', name: 'Chinese' },
];

const DATA_DIR = path.join(__dirname, '..', 'database', 'data');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'monuments');
const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp)$/i;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function getArtifactFolders() {
  return fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function getImageFiles(folderPath) {
  return fs
    .readdirSync(folderPath)
    .filter((file) => IMAGE_EXTENSIONS.test(file))
    .sort();
}

function resolveCoverImage(info, imageFiles) {
  const configuredName = path.basename(info.cover_image || '');

  if (configuredName && imageFiles.includes(configuredName)) {
    return `/uploads/monuments/${configuredName}`;
  }

  if (!imageFiles.length) {
    throw new Error(`No image file found for ${info.ai_label || info.names?.en || 'unknown artifact'}`);
  }

  return `/uploads/monuments/${imageFiles[0]}`;
}

function validateInfo(info, folderName) {
  if (!info || typeof info !== 'object') throw new Error(`${folderName}/info.json must be an object`);
  if (!info.ai_label) throw new Error(`${folderName}/info.json is missing ai_label`);
  if (!info.names?.en) throw new Error(`${folderName}/info.json is missing names.en`);
  if (!info.descriptions?.en) throw new Error(`${folderName}/info.json is missing descriptions.en`);
  if (info.latitude === undefined || info.longitude === undefined) {
    throw new Error(`${folderName}/info.json is missing latitude or longitude`);
  }
}

async function seed() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Dataset folder not found: ${DATA_DIR}`);
    }

    await sequelize.authenticate();
    console.log('Connected to database');

    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await sequelize.sync({ force: true });
    console.log('Tables created');

    const langMap = {};
    for (const language of LANGS) {
      const created = await Language.create(language);
      langMap[language.code] = created.id;
    }
    console.log('Languages seeded');

    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }

    const artifactFolders = getArtifactFolders();

    for (const folderName of artifactFolders) {
      const folderPath = path.join(DATA_DIR, folderName);
      const infoPath = path.join(folderPath, 'info.json');

      if (!fs.existsSync(infoPath)) {
        throw new Error(`Missing info.json in ${folderPath}`);
      }

      const info = readJson(infoPath);
      validateInfo(info, folderName);

      const imageFiles = getImageFiles(folderPath);
      const coverImage = resolveCoverImage(info, imageFiles);

      const monument = await Monument.create({
        latitude: info.latitude,
        longitude: info.longitude,
        era: info.era || null,
        category: info.category || null,
        cover_image: coverImage,
        ai_label: info.ai_label,
      });

      for (const { code } of LANGS) {
        await MonumentTranslation.create({
          monument_id: monument.id,
          language_id: langMap[code],
          name: info.names?.[code] || info.names.en,
          description: info.descriptions?.[code] || info.descriptions.en,
          fun_facts: Array.isArray(info.fun_facts?.[code])
            ? info.fun_facts[code]
            : Array.isArray(info.fun_facts?.en)
              ? info.fun_facts.en
              : [],
        });
      }

      for (const [index, image] of imageFiles.entries()) {
        const src = path.join(folderPath, image);
        const dest = path.join(UPLOADS_DIR, image);
        fs.copyFileSync(src, dest);

        await MonumentImage.create({
          monument_id: monument.id,
          image_url: `/uploads/monuments/${image}`,
          caption: info.names.en,
          sort_order: index,
        });
      }

      console.log(`Seeded: ${info.names.en}`);
    }

    console.log(`\nDone! ${artifactFolders.length} monuments seeded from info.json files.`);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
