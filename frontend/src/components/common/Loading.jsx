import './Loading.css';

export default function Loading({ fullPage = false, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="loading-fullpage">
        <div className="loading-spinner" />
        <p className="loading-message">{message}</p>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className="loading-spinner loading-spinner--small" />
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}
