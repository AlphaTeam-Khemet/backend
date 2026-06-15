/**
 * ArtifactNarration.js
 * ====================
 * Sequelize model for the artifact narration cache.
 *
 * Stores generated audio narrations indexed by artifact UUID and language.
 * One row per (artifact_id, language) pair — enforced by a unique constraint.
 *
 * audio_url is nullable: if TTS generation failed, the row is still saved
 * with audio_url = null. The backend will retry on the next request.
 *
 * artifact_id references monuments.id (UUID) from the monuments table,
 * stored as VARCHAR — no hard FK constraint to keep services decoupled.
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ArtifactNarration = sequelize.define('ArtifactNarration', {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    defaultValue: DataTypes.UUIDV4,
    allowNull: false,
  },
  // Monument UUID from monuments.id — stored as string, no hard FK
  artifact_id: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Language code — "en" or "ar"
  language: {
    type: DataTypes.STRING(5),
    allowNull: false,
    validate: {
      isIn: [['en', 'ar']],
    },
  },
  // The artifact description text that was passed to TTS
  narration_text: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  // Relative URL to the generated MP3 — null if TTS failed
  audio_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // UTC timestamp of when narration was first generated
  generated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
}, {
  tableName: 'artifact_narrations',
  underscored: true,
  timestamps: false, // generated_at is managed manually
  indexes: [
    {
      // One narration per artifact per language
      unique: true,
      fields: ['artifact_id', 'language'],
      name: 'uq_narration_artifact_lang',
    },
    {
      // Fast lookup by artifact_id
      fields: ['artifact_id'],
      name: 'idx_narrations_artifact_id',
    },
  ],
});

module.exports = ArtifactNarration;
