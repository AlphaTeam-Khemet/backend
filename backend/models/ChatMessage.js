const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatMessage = sequelize.define('ChatMessage', {
  id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  conversation_id: { type: DataTypes.UUID, allowNull: false },
  user_id: { type: DataTypes.UUID, allowNull: false },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['user', 'assistant', 'system']],
    },
  },
  content: { type: DataTypes.TEXT, allowNull: false },
  sources: { type: DataTypes.JSONB, allowNull: true },
  latency_ms: { type: DataTypes.FLOAT, allowNull: true },
}, {
  tableName: 'chat_messages',
  underscored: true,
  updatedAt: false,
});

module.exports = ChatMessage;
