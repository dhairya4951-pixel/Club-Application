import { useState } from 'react';
import Icon from '../common/Icon';
import './ChatInput.css';

export default function ChatInput({ onSend, disabled = false }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input__field form-input"
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your perspective or question..."
        disabled={disabled}
        maxLength={2000}
      />
      <button
        type="submit"
        className="chat-input__send btn btn--primary btn--md"
        disabled={!text.trim() || disabled}
        aria-label="Send message"
      >
        <span>Send</span>
        <Icon name="arrow-right" size={15} />
      </button>
    </form>
  );
}
