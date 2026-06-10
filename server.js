const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonumentTranslation = sequelize.define('MonumentTranslation', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  monument_id: { type: DataTypes.UUID, allowNull: false },
  language_id: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(200), allowNull: false },
  description: { type: DataTypes.TEXT },
  fun_facts: { type: DataTypes.ARRAY(DataTypes.TEXT), defaultValue: [] },
}, {
  tableName: 'monument_translations',
  underscored: true,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['monument_id', 'language_id'] }],
});

module.exports = MonumentTranslation;
