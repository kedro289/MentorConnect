/*
 * Файл: backend/utils/helpers.js
 * Отвечает за: вспомогательные утилиты.
 * Используется в: любых файлах backend.
 */

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function paginate(page, limit) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  return { limit: l, offset: (p - 1) * l };
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, ...safe } = user;
  return safe;
}

module.exports = { formatDate, paginate, sanitizeUser };
