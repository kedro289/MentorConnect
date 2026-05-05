/*
 * Файл: backend/models/Notification.js
 * Отвечает за: CRUD операции с таблицей notifications.
 * Используется в: backend/routes/notifications.js, routes/chats.js, routes/reviews.js, sockets/chatSocket.js.
 */

const pool = require('../config/db');

const Notification = {
  async create({ userId, type, title, body = null, link = null }) {
    const { rows } = await pool.query(
      `INSERT INTO notifications (user_id, type, title, body, link)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, body, link]
    );
    return rows[0];
  },

  async getByUser(userId, { limit = 30, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return rows;
  },

  async getUnreadCount(userId) {
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
    return rows[0].count;
  },

  async markRead(id, userId) {
    const { rows } = await pool.query(
      `UPDATE notifications SET is_read = TRUE
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );
    return rows[0] || null;
  },

  async markAllRead(userId) {
    await pool.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );
  },

  async delete(id, userId) {
    const { rowCount } = await pool.query(
      `DELETE FROM notifications WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    return rowCount > 0;
  },

  // Вспомогательный метод: создать без throw (для fire-and-forget вызовов)
  async safeCreate(params) {
    try {
      return await this.create(params);
    } catch (err) {
      console.error('[Notification.safeCreate] error:', err.message);
      return null;
    }
  },
};

module.exports = Notification;
