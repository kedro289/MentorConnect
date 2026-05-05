/*
 * Файл: backend/routes/admin.js
 * Отвечает за: администрирование — пользователи, блокировка, статистика.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const User = require('../models/User');
const Rating = require('../models/Rating');
const { authenticate, requireRole } = require('../middleware/auth');

const adminOnly = [authenticate, requireRole('admin')];

// GET /api/admin/users — список всех пользователей
router.get('/users', ...adminOnly, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  try {
    const { rows } = await pool.query(
      `SELECT id, email, role, is_blocked, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit, 10), offset]
    );
    const count = await pool.query('SELECT COUNT(*) FROM users');
    res.json({ users: rows, total: parseInt(count.rows[0].count, 10) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/admin/users/:id/block
router.put('/users/:id/block', ...adminOnly, async (req, res) => {
  try {
    const user = await User.setBlocked(req.params.id, true);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/admin/users/:id/unblock
router.put('/users/:id/unblock', ...adminOnly, async (req, res) => {
  try {
    const user = await User.setBlocked(req.params.id, false);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', ...adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM reviews WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Отзыв не найден' });
    res.json({ message: 'Отзыв удалён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// DELETE /api/admin/offers/:id
router.delete('/offers/:id', ...adminOnly, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM offers WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Предложение не найдено' });
    res.json({ message: 'Предложение удалено' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/admin/ratings/recalculate — пересчёт рейтингов всех менторов
router.post('/ratings/recalculate', ...adminOnly, async (req, res) => {
  try {
    await Rating.recalculateAll();
    res.json({ message: 'Рейтинги пересчитаны' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/admin/stats
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const queries = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'mentor'"),
      pool.query('SELECT COUNT(*) FROM applications'),
      pool.query('SELECT COUNT(*) FROM chats'),
      pool.query('SELECT COUNT(*) FROM reviews'),
    ]);
    res.json({
      totalUsers: parseInt(queries[0].rows[0].count, 10),
      totalStudents: parseInt(queries[1].rows[0].count, 10),
      totalMentors: parseInt(queries[2].rows[0].count, 10),
      totalApplications: parseInt(queries[3].rows[0].count, 10),
      totalChats: parseInt(queries[4].rows[0].count, 10),
      totalReviews: parseInt(queries[5].rows[0].count, 10),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
