/*
 * Файл: backend/routes/profiles.js
 * Отвечает за: получение и обновление профилей, загрузку аватара.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();

const StudentProfile = require('../models/StudentProfile');
const MentorProfile = require('../models/MentorProfile');
const Rating = require('../models/Rating');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// GET /api/profile/me — свой профиль
router.get('/me', authenticate, async (req, res) => {
  try {
    let profile;
    if (req.user.role === 'student') {
      profile = await StudentProfile.findByUserId(req.user.id);
    } else if (req.user.role === 'mentor') {
      profile = await MentorProfile.findByUserId(req.user.id);
    } else {
      return res.json({ user: req.user });
    }
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// PUT /api/profile/me — обновить профиль
router.put('/me', authenticate, async (req, res) => {
  try {
    let profile;
    if (req.user.role === 'student') {
      profile = await StudentProfile.update(req.user.id, req.body);
    } else if (req.user.role === 'mentor') {
      profile = await MentorProfile.update(req.user.id, req.body);
    } else {
      return res.status(403).json({ error: 'Администратор не имеет профиля' });
    }
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/profile/avatar — загрузить аватар
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  try {
    let profile;
    if (req.user.role === 'student') {
      profile = await StudentProfile.update(req.user.id, { avatar_url: avatarUrl });
    } else {
      profile = await MentorProfile.update(req.user.id, { avatar_url: avatarUrl });
    }
    res.json({ avatar_url: avatarUrl, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/mentors/:id/rating/history — история рейтинга за 30 дней
router.get('/:id/rating/history', async (req, res) => {
  try {
    const history = await Rating.getHistory(req.params.id, req.query.days || 30);
    res.json({ history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/mentors/:id/rating — детализация рейтинга ментора (публичный)
router.get('/:id/rating', async (req, res) => {
  try {
    const details = await Rating.getDetails(req.params.id);
    if (!details) return res.status(404).json({ error: 'Ментор не найден' });
    res.json(details);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/mentors/:id — публичная карточка ментора
router.get('/mentors/:id', async (req, res) => {
  try {
    const profile = await MentorProfile.findPublicById(req.params.id);
    if (!profile) return res.status(404).json({ error: 'Ментор не найден' });
    res.json({ profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
