import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/common/Button';
import FormField from '../../components/common/FormField';
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
      <div className="login-bg" />
      <div className="login-container animate-fade-in">
        <div className="login-header">
          <span className="login-logo">◆</span>
          <h1 className="login-title">The Policy Circle</h1>
          <p className="login-subtitle">Club Management Platform</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2 className="login-form-title">Welcome Back</h2>
          <p className="login-form-desc">Sign in to your account</p>

          {error && (
            <div className="login-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <FormField
            label="Email"
            name="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@club.edu"
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
          >
            Sign In
          </Button>

          <div className="login-hint">
            <p><strong>Demo Accounts:</strong></p>
            <p>Teacher: <code>drpriya@club.edu</code> / <code>admin123</code></p>
            <p>President: <code>dhairya@club.edu</code> / <code>member123</code></p>
            <p>Member: <code>karan@club.edu</code> / <code>member123</code></p>
          </div>
        </form>
      </div>
    </div>
  );
}
