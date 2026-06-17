const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  password_hash: { type: DataTypes.TEXT, allowNull: false },
  full_name: { type: DataTypes.STRING(100) },
  preferred_language: { type: DataTypes.INTEGER, references: { model: 'languages', key: 'id' } },
  email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  email_otp_hash: { type: DataTypes.TEXT },
  email_otp_expires_at: { type: DataTypes.DATE },
  email_otp_attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  reset_password_otp_hash: { type: DataTypes.TEXT },
  reset_password_otp_expires_at: { type: DataTypes.DATE },
}, {
  tableName: 'users',
  underscored: true,
});

module.exports = User;
