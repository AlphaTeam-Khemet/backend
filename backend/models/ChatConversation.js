const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatConversation = sequelize.define('ChatConversation', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  user_id: { type: DataTypes.UUID, allowNull: false },
  title: { type: DataTypes.STRING(120), allowNull: false },
}, {
  tableName: 'chat_conversations',
  underscored: true,
});

module.exports = ChatConversation;
