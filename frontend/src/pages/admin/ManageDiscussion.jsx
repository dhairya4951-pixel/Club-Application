import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { messageService } from '../../services/messageService';
import ChatMessage from '../../components/chat/ChatMessage';
import Loading from '../../components/common/Loading';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';

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

  if (loading) return <Loading fullPage message="Loading messages..." />;

  return (
    <div className="container">
      <div className="page-header">
        <h1>🛡️ Manage Discussion</h1>
        <p>Moderate club discussion messages ({messages.length} total)</p>
      </div>

      {messages.length === 0 ? (
        <EmptyState icon="💬" title="No messages" message="The discussion is empty." />
      ) : (
        <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {messages.map(msg => (
            <ChatMessage key={msg.id} message={msg} onDelete={(id) => setDeleteTarget(id)} />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete"
        loading={deleting}
      />
    </div>
  );
}
