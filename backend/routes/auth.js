/*
 * Файл: backend/routes/auth.js
 * Отвечает за: регистрацию, логин, выдачу JWT, /me.
 * Используется в: server.js.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');

const pool = require('../config/db');
const { secret, expiresIn } = require('../config/jwt-config');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validate');

const registerValidators = [
  body('email').isEmail().normalizeEmail().withMessage('Некорректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
  body('role').isIn(['student', 'mentor']).withMessage('Роль должна быть student или mentor'),
];

// POST /api/auth/register
router.post('/register', registerValidators, handleValidationErrors, async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ error: 'Email уже зарегистрирован' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role });

    // Создать пустой профиль
    if (role === 'student') {
      await pool.query('INSERT INTO student_profiles (user_id) VALUES ($1)', [user.id]);
    } else {
      await pool.query('INSERT INTO mentor_profiles (user_id) VALUES ($1)', [user.id]);
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn });
    res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], handleValidationErrors, async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Неверный email или пароль' });
    if (user.is_blocked) return res.status(403).json({ error: 'Аккаунт заблокирован' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Неверный email или пароль' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, secret, { expiresIn });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Пользователь не найден' });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
