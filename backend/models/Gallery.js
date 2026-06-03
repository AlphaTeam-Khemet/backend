const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Gallery = sequelize.define('Gallery', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  monument_id: { type: DataTypes.UUID },
  session_id: { type: DataTypes.UUID },
  image_url: { type: DataTypes.TEXT },
  saved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'gallery',
  underscored: true,
  createdAt: 'saved_at',
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'session_id'] }],
});

module.exports = Gallery;
