import { useState, useEffect, useRef } from 'react';
import { messageService } from '../../services/messageService';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import './DiscussionPage.css';

export default function DiscussionPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchMessages();
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

  if (loading) return <Loading fullPage message="Loading discussion..." />;

  return (
    <div className="discussion-page">
      <div className="discussion-container">
        <div className="discussion-header">
          <h1>💬 Club Discussion</h1>
          <span className="discussion-count">{messages.length} messages</span>
        </div>

        <div className="discussion-messages">
          {messages.length === 0 ? (
            <EmptyState
              icon="💬"
              title="No messages yet"
              message="Start the conversation!"
            />
          ) : (
            <>
              {messages.map(msg => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <ChatInput onSend={handleSend} disabled={sending} />
      </div>
    </div>
  );
}
