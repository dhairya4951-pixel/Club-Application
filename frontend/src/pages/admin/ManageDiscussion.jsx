import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { messageService } from '../../services/messageService';
import ChatMessage from '../../components/chat/ChatMessage';
import Loading from '../../components/common/Loading';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import Icon from '../../components/common/Icon';

export default function ManageDiscussion() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { 
    fetchMessages(); 
    
    // Subscribe to realtime updates for admin view
    const channel = supabase
      .channel('admin:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchMessages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchMessages() {
    try {
      const data = await messageService.getAll();
      setMessages(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await messageService.delete(deleteTarget);
      setMessages(prev => prev.filter(m => m.id !== deleteTarget));
      setDeleteTarget(null);
    } catch (err) { console.error(err); }
    finally { setDeleting(false); }
  };

  if (loading) return <Loading fullPage message="Loading moderation queue..." />;

  return (
    <div className="container" style={{ paddingBottom: 'var(--space-4xl)' }}>
      <div className="page-header">
        <div className="page-header-badge">
          <Icon name="shield" size={14} /> Forum Moderation
        </div>
        <h1 className="editorial-title">Manage Discussion</h1>
        <p className="page-subtitle">
          Oversee public policy dialogues, audit message transcripts, and remove non-compliant entries in real time ({messages.length} total messages recorded).
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon="message" title="No Discussion Messages" message="The club discussion forum currently has no logged messages." />
      ) : (
        <div className="card-surface" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: 'var(--space-md) var(--space-lg)', background: '#F8FAFC', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Icon name="message" size={14} /> Live Moderation Feed
            </span>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {messages.length} messages
            </span>
          </div>
          <div>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} onDelete={(id) => setDeleteTarget(id)} />
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message from the forum? This action cannot be undone."
        confirmText="Delete Message"
        loading={deleting}
      />
    </div>
  );
}
