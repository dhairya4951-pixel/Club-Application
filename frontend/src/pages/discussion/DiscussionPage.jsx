import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { messageService } from '../../services/messageService';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Icon from '../../components/common/Icon';
import './DiscussionPage.css';

export default function DiscussionPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();

    if (!supabase) return;

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function fetchMessages() {
    try {
      const data = await messageService.getAll();
      setMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(text) {
    setSending(true);
    try {
      const newMsg = await messageService.send(text);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  }

  async function handleEdit(id, newText) {
    try {
      const updated = await messageService.update(id, newText);
      setMessages(prev =>
        prev.map(m => (m.id === id ? { ...m, message: updated.message, updatedAt: updated.updatedAt } : m))
      );
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  }

  function handleDeleteRequest(id) {
    setDeleteTarget(id);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await messageService.delete(deleteTarget);
      setMessages(prev => prev.filter(m => m.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) {
      console.error('Failed to delete message:', err);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) return <Loading fullPage message="Loading discussion..." />;

  return (
    <div className="container discussion-page">
      <div className="discussion-container card-surface">
        <div className="discussion-header">
          <div>
            <span className="eyebrow-label">Forum</span>
            <h1 className="discussion-title">Club Discussion</h1>
            <p className="discussion-subtitle">
              Share policy perspectives, research questions, and collaborate with club members.
            </p>
          </div>
          <div className="discussion-header__right">
            <span className="discussion-count">
              <Icon name="message" size={14} />
              <span>{messages.length} messages</span>
            </span>
          </div>
        </div>

        <div className="discussion-messages">
          {messages.length === 0 ? (
            <EmptyState
              icon="message"
              title="No discussion yet"
              message="Start the conversation by sharing a policy question or topic."
            />
          ) : (
            <>
              {messages.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onEdit={handleEdit}
                  onDelete={handleDeleteRequest}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={sending} />
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
