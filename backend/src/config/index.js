require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'fallback-dev-secret',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtExpiresIn: '24h',
};
