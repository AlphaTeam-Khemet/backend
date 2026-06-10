const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScanSession = sequelize.define('ScanSession', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  monument_id: { type: DataTypes.UUID },
  scanned_image: { type: DataTypes.TEXT },
  confidence: { type: DataTypes.DECIMAL(5, 4) },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending' },
  scanned_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'scan_sessions',
  underscored: true,
  createdAt: 'scanned_at',
  updatedAt: false,
});

module.exports = ScanSession;
