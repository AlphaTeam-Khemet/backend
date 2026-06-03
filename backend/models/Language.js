const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Language = sequelize.define('Language', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(10), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(50), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
  tableName: 'languages',
  underscored: true,
  updatedAt: false,
});

module.exports = Language;
