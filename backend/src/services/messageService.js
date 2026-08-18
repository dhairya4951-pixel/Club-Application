/**
 * Message Service
 * ===============
 * Club-wide discussion/chat messages.
 *
 * SUPABASE MIGRATION:
 *   Replace array operations with:
 *     supabase.from('messages').select/insert/delete
 *   Add Supabase Realtime subscription for live updates:
 *     supabase.channel('messages').on('postgres_changes', ...)
 */

const { messages, users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { generateId, now } = require('../utils/helpers');

function getAllMessages() {
  // Enrich with sender info and sort by time
  const enriched = messages
    .map(msg => {
      const sender = users.find(u => u.id === msg.senderId);
      return {
        ...msg,
        sender: sender ? {
          id: sender.id,
          name: sender.name,
          profileImage: sender.profileImage,
          position: sender.position,
        } : null,
      };
    })
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return { data: enriched };
}

function createMessage(senderId, messageText) {
  const newMessage = {
    id: generateId(),
    senderId,
    message: messageText.trim(),
    createdAt: now(),
  };

  messages.push(newMessage);

  // Return enriched message
  const sender = users.find(u => u.id === senderId);
  return {
    data: {
      ...newMessage,
      sender: sender ? {
        id: sender.id,
        name: sender.name,
        profileImage: sender.profileImage,
        position: sender.position,
      } : null,
    },
  };
}

function deleteMessage(id) {
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) {
    return { error: 'Message not found', status: 404 };
  }

  const deleted = messages.splice(index, 1)[0];
  return { data: deleted };
}

module.exports = {
  getAllMessages,
  createMessage,
  deleteMessage,
};
