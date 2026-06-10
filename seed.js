const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MonumentImage = sequelize.define('MonumentImage', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  monument_id: { type: DataTypes.UUID, allowNull: false },
  image_url: { type: DataTypes.TEXT, allowNull: false },
  caption: { type: DataTypes.TEXT },
  sort_order: { type: DataTypes.SMALLINT, defaultValue: 0 },
}, {
  tableName: 'monument_images',
  underscored: true,
  updatedAt: false,
});

module.exports = MonumentImage;
