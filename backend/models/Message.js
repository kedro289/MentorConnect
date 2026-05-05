/*
 * Файл: backend/models/Message.js
 * Отвечает за: CRUD для таблицы messages.
 * Используется в: routes/chats.js, sockets/chatSocket.js.
 */

const pool = require('../config/db');

async function getChatMessages(chatId, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `SELECT m.*, u.email AS sender_email
     FROM messages m
     JOIN users u ON u.id = m.sender_id
     WHERE m.chat_id = $1
     ORDER BY m.created_at ASC
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset]
  );
  return rows;
}

async function create({ chatId, senderId, content }) {
  const { rows } = await pool.query(
    `INSERT INTO messages (chat_id, sender_id, content)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [chatId, senderId, content]
  );
  return rows[0];
}

async function markRead(chatId, userId) {
  await pool.query(
    'UPDATE messages SET is_read = TRUE WHERE chat_id = $1 AND sender_id != $2',
    [chatId, userId]
  );
}

module.exports = { getChatMessages, create, markRead };
