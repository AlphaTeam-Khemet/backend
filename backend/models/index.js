const sequelize = require('../config/database');
const Language = require('./Language');
const User = require('./User');
const RefreshToken = require('./RefreshToken');
const Monument = require('./Monument');
const MonumentTranslation = require('./MonumentTranslation');
const MonumentImage = require('./MonumentImage');
const ScanSession = require('./ScanSession');
const Gallery = require('./Gallery');
const Favorite = require('./Favorite');
const Review = require('./Review');
const ChatConversation = require('./ChatConversation');
const ChatMessage = require('./ChatMessage');
const ArtifactNarration = require('./ArtifactNarration');

// User <-> Language
User.belongsTo(Language, { foreignKey: 'preferred_language', as: 'language' });
Language.hasMany(User, { foreignKey: 'preferred_language' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// Monument <-> MonumentTranslation
Monument.hasMany(MonumentTranslation, { foreignKey: 'monument_id', as: 'translations', onDelete: 'CASCADE' });
MonumentTranslation.belongsTo(Monument, { foreignKey: 'monument_id' });
MonumentTranslation.belongsTo(Language, { foreignKey: 'language_id', as: 'language' });
Language.hasMany(MonumentTranslation, { foreignKey: 'language_id' });

// Monument <-> MonumentImage
Monument.hasMany(MonumentImage, { foreignKey: 'monument_id', as: 'images', onDelete: 'CASCADE' });
MonumentImage.belongsTo(Monument, { foreignKey: 'monument_id' });

// ScanSession
User.hasMany(ScanSession, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ScanSession.belongsTo(User, { foreignKey: 'user_id' });
ScanSession.belongsTo(Monument, { foreignKey: 'monument_id' });
Monument.hasMany(ScanSession, { foreignKey: 'monument_id' });

// Gallery
User.hasMany(Gallery, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Gallery.belongsTo(User, { foreignKey: 'user_id' });
Gallery.belongsTo(Monument, { foreignKey: 'monument_id' });
Gallery.belongsTo(ScanSession, { foreignKey: 'session_id' });

// Favorites
User.hasMany(Favorite, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Favorite.belongsTo(User, { foreignKey: 'user_id' });
Monument.hasMany(Favorite, { foreignKey: 'monument_id', onDelete: 'CASCADE' });
Favorite.belongsTo(Monument, { foreignKey: 'monument_id' });

// Review
User.hasMany(Review, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Review.belongsTo(User, { foreignKey: 'user_id' });
Monument.hasMany(Review, { foreignKey: 'monument_id', as: 'reviews', onDelete: 'CASCADE' });
Review.belongsTo(Monument, { foreignKey: 'monument_id' });

// AI Guide chat history
User.hasMany(ChatConversation, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatConversation.belongsTo(User, { foreignKey: 'user_id' });
ChatConversation.hasMany(ChatMessage, { foreignKey: 'conversation_id', as: 'messages', onDelete: 'CASCADE' });
ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversation_id', as: 'conversation' });
User.hasMany(ChatMessage, { foreignKey: 'user_id', onDelete: 'CASCADE' });
ChatMessage.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  Language,
  User,
  RefreshToken,
  Monument,
  MonumentTranslation,
  MonumentImage,
  ScanSession,
  Gallery,
  Favorite,
  Review,
  ChatConversation,
  ChatMessage,
  ArtifactNarration,
  sequelize,
};
