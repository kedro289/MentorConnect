/*
 * Файл: backend/models/Rating.js
 * Отвечает за: пересчёт и получение объективного рейтинга менторов.
 * Формула: (О×0.40) + (А×0.25) + (З×0.20) + (В×0.15) с байесовской поправкой.
 * Используется в: backend/routes/profiles.js, backend/routes/admin.js.
 */

const pool = require('../config/db');

async function recalculate(mentorId) {
  await pool.query('SELECT recalculate_mentor_rating($1)', [mentorId]);
}

async function getDetails(mentorId) {
  const { rows } = await pool.query(`
    SELECT
      mp.rating_score,
      mp.rating_reviews,
      mp.rating_activity,
      mp.rating_sessions,
      mp.rating_response,
      mp.last_rating_update,
      mp.total_reviews,
      mp.avg_rating,
      (SELECT COUNT(*) FROM applications WHERE mentor_id = $1)                              AS total_applications,
      (SELECT COUNT(*) FROM applications WHERE mentor_id = $1 AND status = 'accepted')      AS accepted_applications,
      (SELECT COUNT(*) FROM chats WHERE mentor_id = $1)                                     AS total_chats,
      (SELECT COALESCE(AVG(
        EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600.0
      ), 0)
       FROM applications a
       JOIN chats c ON c.application_id = a.id
       WHERE a.mentor_id = $1)                                                               AS avg_response_hours
    FROM mentor_profiles mp
    WHERE mp.user_id = $1
  `, [mentorId]);
  return rows[0] || null;
}

async function recalculateAll() {
  await pool.query('SELECT recalculate_mentor_rating(user_id) FROM mentor_profiles');
}

async function getHistory(mentorId, days = 30) {
  const { rows } = await pool.query(`
    SELECT rating_score, rating_reviews, rating_activity,
           rating_sessions, rating_response, reason, recorded_at
    FROM rating_history
    WHERE mentor_id = $1
      AND recorded_at >= NOW() - ($2 || ' days')::INTERVAL
    ORDER BY recorded_at ASC
  `, [mentorId, days]);
  return rows;
}

module.exports = { recalculate, getDetails, recalculateAll, getHistory };
