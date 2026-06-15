const ragClient = require('../utils/ragClient');
const { ChatConversation, ChatMessage, sequelize } = require('../models');
const { generateConversationTitle } = require('../utils/chatTitle');

function sendRagError(res, error) {
  const statusCode = error.statusCode || 500;
  return res.status(statusCode).json({
    error: error.message || 'RAG service request failed',
    service: 'chatbot-llm',
  });
}

exports.health = async (req, res) => {
  try {
    const data = await ragClient.health();
    res.json(data);
  } catch (error) {
    sendRagError(res, error);
  }
};

async function findOwnedConversation(conversationId, userId) {
  if (!conversationId) return null;

  return ChatConversation.findOne({
    where: {
      id: conversationId,
      user_id: userId,
    },
  });
}

function previewMessage(content) {
  const text = String(content || '').replace(/\s+/g, ' ').trim();
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}...`;
}

exports.askQuestion = async (req, res) => {
  let conversation = null;
  let createdConversation = false;
  const transaction = await sequelize.transaction();

  try {
    const { question, topic, conversation_id } = req.body;
    if (!question) {
      await transaction.rollback();
      return res.status(400).json({ error: 'question is required' });
    }

    if (conversation_id) {
      conversation = await ChatConversation.findOne({
        where: { id: conversation_id, user_id: req.user.id },
        transaction
      });
      if (!conversation) {
        await transaction.rollback();
        return res.status(404).json({ error: 'Conversation not found' });
      }
    } else {
      const title = await generateConversationTitle(question);
      conversation = await ChatConversation.create({
        user_id: req.user.id,
        title,
      }, { transaction });
      createdConversation = true;
    }

    await ChatMessage.create({
      conversation_id: conversation.id,
      user_id: req.user.id,
      role: 'user',
      content: question,
    }, { transaction });

    // Call external AI service - if this fails, we rollback the transaction
    const data = await ragClient.ask({ question, topic });

    await ChatMessage.create({
      conversation_id: conversation.id,
      user_id: req.user.id,
      role: 'assistant',
      content: data.answer || data.response || '',
      sources: data.sources || [],
      latency_ms: data.latency_ms ?? null,
    }, { transaction });

    await conversation.update({ updatedAt: new Date() }, { transaction });
    await transaction.commit();

    res.json({
      ...data,
      conversation_id: conversation.id,
      conversation_title: conversation.title,
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    sendRagError(res, error);
  }
};

exports.describeMonument = async (req, res) => {
  try {
    const { monument_name } = req.body;
    if (!monument_name) return res.status(400).json({ error: 'monument_name is required' });

    const data = await ragClient.describe({ monument_name });
    res.json(data);
  } catch (error) {
    sendRagError(res, error);
  }
};

exports.identifyMonument = async (req, res) => {
  try {
    const { monument_name, question } = req.body;
    if (!monument_name) return res.status(400).json({ error: 'monument_name is required' });
    if (!question) return res.status(400).json({ error: 'question is required' });

    const data = await ragClient.identify({ monument_name, question });
    res.json(data);
  } catch (error) {
    sendRagError(res, error);
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await ChatConversation.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: ChatMessage,
        as: 'messages',
        attributes: ['content', 'created_at'],
        separate: true,
        limit: 1,
        order: [['created_at', 'DESC']],
      }],
      order: [['updated_at', 'DESC']],
    });

    res.json(conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      last_message_preview: previewMessage(conversation.messages?.[0]?.content),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch conversations' });
  }
};

exports.getConversationMessages = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req.params.id, req.user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await ChatMessage.findAll({
      where: {
        conversation_id: conversation.id,
        user_id: req.user.id,
      },
      order: [['created_at', 'ASC']],
    });

    res.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      },
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        sources: message.sources,
        latency_ms: message.latency_ms,
        created_at: message.created_at,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to fetch conversation messages' });
  }
};

exports.deleteConversation = async (req, res) => {
  try {
    const conversation = await findOwnedConversation(req.params.id, req.user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    await conversation.destroy();
    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to delete conversation' });
  }
};

exports.updateConversationTitle = async (req, res) => {
  try {
    const { title } = req.body;
    const cleanTitle = String(title || '').replace(/\s+/g, ' ').trim();

    if (!cleanTitle) return res.status(400).json({ error: 'title is required' });
    if (cleanTitle.length > 120) return res.status(400).json({ error: 'title must be 120 characters or fewer' });

    const conversation = await findOwnedConversation(req.params.id, req.user.id);
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    await conversation.update({ title: cleanTitle });
    res.json({
      id: conversation.id,
      title: conversation.title,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to update conversation title' });
  }
};
