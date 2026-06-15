const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Monument = sequelize.define('Monument', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  latitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(9, 6), allowNull: false },
  era: { type: DataTypes.STRING(100) },
  category: { type: DataTypes.STRING(100) },
  cover_image: { type: DataTypes.TEXT },
  ai_label: { type: DataTypes.STRING(150) },
  priority: { type: DataTypes.STRING(20), defaultValue: 'mid' },
}, {
  tableName: 'monuments',
  underscored: true,
});

module.exports = Monument;
