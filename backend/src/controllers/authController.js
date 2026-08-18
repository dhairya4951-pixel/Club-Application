/**
 * Auth Controller
 */

const authService = require('../services/authService');
const { validateLogin } = require('../validators/authValidator');

async function login(req, res, next) {
  try {
    const errors = validateLogin(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors.join(', ') });
    }

    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.data);
  } catch (err) {
    next(err);
  }
}

function logout(req, res) {
  // Client-side token discard. In Supabase: supabase.auth.signOut()
  res.json({ message: 'Logged out successfully' });
}

function getMe(req, res) {
  // req.user is set by requireAuth middleware
  res.json(req.user);
}

module.exports = { login, logout, getMe };
