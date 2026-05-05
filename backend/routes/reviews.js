/*
 * Файл: backend/routes/reviews.js
 * Отвечает за: создание и получение отзывов.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

const Review = require('../models/Review');
const { notify } = require('../utils/notify');
const { authenticate, requireRole } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

// POST /api/reviews — оставить отзыв (студент)
router.post('/', authenticate, requireRole('student'), [
  body('mentorId').isInt().withMessage('mentorId должен быть числом'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Рейтинг от 1 до 5'),
], handleValidationErrors, async (req, res) => {
  const { mentorId, rating, comment } = req.body;
  try {
    const canReview = await Review.hasAcceptedApplication(req.user.id, parseInt(mentorId, 10));
    if (!canReview) {
      return res.status(403).json({ error: 'Вы не можете оставить отзыв этому ментору' });
    }
    const review = await Review.create({
      studentId: req.user.id,
      mentorId: parseInt(mentorId, 10),
      rating: parseInt(rating, 10),
      comment,
    });
    // Уведомить ментора о новом отзыве (реалтайм)
    notify({
      userId: parseInt(mentorId, 10),
      type:  'new_review',
      title: `Новый отзыв — ${rating} ★`,
      body:  comment ? comment.slice(0, 120) : 'Студент оставил отзыв о вашей работе.',
      link:  '/pages/mentor-dashboard.html',
    });
    res.status(201).json({ review });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Вы уже оставили отзыв этому ментору' });
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/mentors/:id/reviews — все отзывы ментора (публичный)
router.get('/mentors/:id/reviews', async (req, res) => {
  try {
    const reviews = await Review.getByMentor(req.params.id);
    res.json({ reviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
