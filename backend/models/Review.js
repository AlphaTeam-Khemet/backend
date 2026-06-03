const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  monument_id: { type: DataTypes.UUID, allowNull: false },
  rating: { type: DataTypes.SMALLINT, validate: { min: 1, max: 5 } },
  comment: { type: DataTypes.TEXT },
}, {
  tableName: 'reviews',
  underscored: true,
  updatedAt: false,
  indexes: [{ unique: true, fields: ['user_id', 'monument_id'] }],
});

module.exports = Review;
