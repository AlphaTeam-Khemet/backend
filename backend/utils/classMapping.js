const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'database', 'data');

const classNameToMonumentName = {
  // Historical/training aliases supported for older CV model outputs.
  'Bent pyramid for senefru': 'Bent Pyramid of Sneferu',
  hanging_obelisk_images: 'Hanging Obelisk',
  'Khafre Pyramid': 'Pyramid of Khafre',
  Khufu_Solar_Boat_Images: 'Khufu Solar Boat',
  'Mask of Tutankhamun': 'Mask of Tutankhamun',
  'Pyramid of Djoser': 'Pyramid of Djoser',
  'Statue of Ramesses II': 'Statue of Ramesses II',
  tut_coffin_images_final: 'Coffin of Tutankhamun',
};

function normalizeClassName(className) {
  return String(className || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function loadDatasetMappings() {
  if (!fs.existsSync(DATA_DIR)) return;

  const folders = fs
    .readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const folder of folders) {
    const infoPath = path.join(DATA_DIR, folder, 'info.json');
    if (!fs.existsSync(infoPath)) continue;

    try {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      const className = info.ai_label || folder;
      const monumentName = info.names?.en;

      if (className && monumentName) {
        classNameToMonumentName[className] = monumentName;
      }
    } catch {
      // Ignore malformed dataset metadata here; seed validation reports those errors.
    }
  }
}

loadDatasetMappings();

const normalizedMap = Object.entries(classNameToMonumentName).reduce((map, [className, monumentName]) => {
  map[normalizeClassName(className)] = monumentName;
  return map;
}, {});

function getMonumentNameForClass(className) {
  if (!className) return null;
  return classNameToMonumentName[className] || normalizedMap[normalizeClassName(className)] || null;
}

module.exports = {
  classNameToMonumentName,
  getMonumentNameForClass,
};
