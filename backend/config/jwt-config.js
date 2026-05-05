/*
 * Файл: backend/config/jwt-config.js
 * Отвечает за: конфигурацию JWT.
 * Используется в: middleware/auth.js, routes/auth.js.
 */

module.exports = {
  secret: process.env.JWT_SECRET || 'fallback_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
