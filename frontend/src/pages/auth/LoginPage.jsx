import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
import Icon from '../../components/common/Icon';
import './LoginPage.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-backdrop" />
      <div className="login-container animate-fade-in">
        <form className="login-card" onSubmit={handleSubmit}>
          {/* Card Brand Header */}
          <div className="login-card__brand">
            <div className="login-card__logo-wrap">
              <img src="/logo.png" alt="Public Policy Club Logo" className="login-card__logo-img" />
            </div>
            <h1 className="login-card__title">Public Policy Club</h1>
            <p className="login-card__subtitle">Ideas · Dialogue · Action</p>
          </div>

          <div className="login-card__divider" />

          {/* Form Content */}
          <div className="login-card__body">
            <div className="login-card__heading">
              <h2 className="login-card__heading-title">Institutional Portal Access</h2>
              <p className="login-card__heading-desc">Sign in with your registered club credentials</p>
            </div>

            {error && (
              <div className="login-error">
                <Icon name="alert-circle" size={16} />
                <span>{error}</span>
              </div>
            )}

            <FormField
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@university.edu"
              required
            />

            <FormField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
              className="login-submit-btn"
            >
              <span>Sign In to Portal</span>
              <Icon name="arrow-right" size={15} />
            </Button>
          </div>

          {/* Card Footer Security Watermark */}
          <div className="login-card__footer">
            <Icon name="shield" size={13} />
            <span>Authorized Student & Faculty Access Only</span>
          </div>
        </form>
      </div>
    </div>
  );
}
