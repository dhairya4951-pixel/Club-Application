/**
 * Message Service
 * ===============
 * Club-wide discussion/chat messages.
 */

const { messages, users } = require('../data/mockData');
const { sanitizeUser } = require('../models/User');
const { generateId, now } = require('../utils/helpers');
const { supabase, SUPABASE_READY } = require('../config/supabase');

async function getAllMessages() {
  if (SUPABASE_READY) {
    const { data: records, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles (
          id, name, profile_image, position
        )
      `)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    
    // Normalize keys to camelCase for the frontend
    const camelCased = records.map(r => ({
      id: r.id,
      senderId: r.sender_id,
      message: r.message,
      createdAt: r.created_at,
      updatedAt: r.updated_at || null,
      sender: r.sender ? {
        id: r.sender.id,
        name: r.sender.name,
        profileImage: r.sender.profile_image,
        position: r.sender.position
      } : null
    }));

    return { data: camelCased };
  }

  // Mock Fallback
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

async function getMessageById(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return { error: 'Message not found', status: 404 };

    return {
      data: {
        id: data.id,
        senderId: data.sender_id,
        message: data.message,
        createdAt: data.created_at,
        updatedAt: data.updated_at || null,
      }
    };
  }

  // Mock fallback
  const msg = messages.find(m => m.id === id);
  if (!msg) return { error: 'Message not found', status: 404 };
  return { data: msg };
}

async function createMessage(senderId, messageText) {
  if (SUPABASE_READY) {
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        message: messageText.trim()
      })
      .select(`
        *,
        sender:profiles (
          id, name, profile_image, position
        )
      `)
      .single();

    if (error) return { error: error.message, status: 500 };

    return { 
      data: {
        id: inserted.id,
        senderId: inserted.sender_id,
        message: inserted.message,
        createdAt: inserted.created_at,
        updatedAt: inserted.updated_at || null,
        sender: inserted.sender ? {
          id: inserted.sender.id,
          name: inserted.sender.name,
          profileImage: inserted.sender.profile_image,
          position: inserted.sender.position
        } : null
      } 
    };
  }

  const newMessage = {
    id: generateId(),
    senderId,
    message: messageText.trim(),
    createdAt: now(),
    updatedAt: null,
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

async function updateMessage(id, newText) {
  if (SUPABASE_READY) {
    // Try updating with updated_at timestamp (requires the column to exist)
    let updatePayload = { message: newText.trim() };
    
    // Attempt with updated_at first
    let { data, error } = await supabase
      .from('messages')
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(`
        *,
        sender:profiles (
          id, name, profile_image, position
        )
      `)
      .single();

    // If the column doesn't exist, retry without updated_at
    if (error && error.message && error.message.includes('updated_at')) {
      console.warn('messages.updated_at column not found — run the migration. Editing without timestamp.');
      ({ data, error } = await supabase
        .from('messages')
        .update(updatePayload)
        .eq('id', id)
        .select(`
          *,
          sender:profiles (
            id, name, profile_image, position
          )
        `)
        .single());
    }

    if (error) return { error: error.message, status: 500 };
    if (!data) return { error: 'Message not found', status: 404 };

    return {
      data: {
        id: data.id,
        senderId: data.sender_id,
        message: data.message,
        createdAt: data.created_at,
        updatedAt: data.updated_at || null,
        sender: data.sender ? {
          id: data.sender.id,
          name: data.sender.name,
          profileImage: data.sender.profile_image,
          position: data.sender.position
        } : null
      }
    };
  }

  // Mock fallback
  const index = messages.findIndex(m => m.id === id);
  if (index === -1) return { error: 'Message not found', status: 404 };

  messages[index].message = newText.trim();
  messages[index].updatedAt = now();

  const sender = users.find(u => u.id === messages[index].senderId);
  return {
    data: {
      ...messages[index],
      sender: sender ? {
        id: sender.id,
        name: sender.name,
        profileImage: sender.profileImage,
        position: sender.position,
      } : null,
    },
  };
}

async function deleteMessage(id) {
  if (SUPABASE_READY) {
    const { data, error } = await supabase
      .from('messages')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) return { error: error.message, status: 500 };
    if (!data) return { error: 'Message not found', status: 404 };
    
    return { data: {
      id: data.id,
      senderId: data.sender_id,
      message: data.message,
      createdAt: data.created_at
    } };
  }

  const index = messages.findIndex(m => m.id === id);
  if (index === -1) {
    return { error: 'Message not found', status: 404 };
  }

  const deleted = messages.splice(index, 1)[0];
  return { data: deleted };
}

module.exports = {
  getAllMessages,
  getMessageById,
  createMessage,
  updateMessage,
  deleteMessage,
};
