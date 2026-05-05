/*
 * Файл: backend/models/Chat.js
 * Отвечает за: CRUD для таблиц chats и applications.
 * Используется в: routes/chats.js.
 */

const pool = require('../config/db');

async function createApplication({ studentId, mentorId, message }) {
  const { rows } = await pool.query(
    `INSERT INTO applications (student_id, mentor_id, message)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [studentId, mentorId, message]
  );
  return rows[0];
}

async function findApplicationById(id) {
  const { rows } = await pool.query('SELECT * FROM applications WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getIncomingApplications(mentorId) {
  const { rows } = await pool.query(
    `SELECT a.*, u.email AS student_email, sp.full_name AS student_name
     FROM applications a
     JOIN users u ON u.id = a.student_id
     LEFT JOIN student_profiles sp ON sp.user_id = a.student_id
     WHERE a.mentor_id = $1
     ORDER BY a.created_at DESC`,
    [mentorId]
  );
  return rows;
}

async function updateApplicationStatus(id, status) {
  const { rows } = await pool.query(
    'UPDATE applications SET status = $1 WHERE id = $2 RETURNING *',
    [status, id]
  );
  return rows[0] || null;
}

async function createChat({ studentId, mentorId, applicationId }) {
  const roomName = `chat_${applicationId}`;
  const { rows } = await pool.query(
    `INSERT INTO chats (student_id, mentor_id, application_id, room_name)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (student_id, mentor_id) DO UPDATE SET room_name = EXCLUDED.room_name
     RETURNING *`,
    [studentId, mentorId, applicationId, roomName]
  );
  return rows[0];
}

async function getUserChats(userId) {
  const { rows } = await pool.query(
    `SELECT c.*,
       u_student.email AS student_email, sp.full_name AS student_name,
       u_mentor.email AS mentor_email, mp.full_name AS mentor_name, mp.avatar_url,
       (SELECT content FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message,
       (SELECT created_at FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
     FROM chats c
     JOIN users u_student ON u_student.id = c.student_id
     JOIN users u_mentor ON u_mentor.id = c.mentor_id
     LEFT JOIN student_profiles sp ON sp.user_id = c.student_id
     LEFT JOIN mentor_profiles mp ON mp.user_id = c.mentor_id
     WHERE c.student_id = $1 OR c.mentor_id = $1
     ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );
  return rows;
}

async function findChatById(id) {
  const { rows } = await pool.query('SELECT * FROM chats WHERE id = $1', [id]);
  return rows[0] || null;
}

module.exports = {
  createApplication, findApplicationById, getIncomingApplications,
  updateApplicationStatus, createChat, getUserChats, findChatById,
};
