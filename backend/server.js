/*
 * Файл: backend/server.js
 * Отвечает за: точку входа Express + Socket.IO, регистрацию роутов.
 * Используется в: npm start / npm run dev.
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Статика для загруженных файлов
app.use('/uploads', express.static('uploads'));

// Раздача статических файлов фронтенда
app.use(express.static(require('path').join(__dirname, '../frontend')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Роуты (подключаются по мере создания)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/profile', require('./routes/profiles'));
app.use('/api/mentors', require('./routes/profiles'));
app.use('/api/mentors', require('./routes/search'));
app.use('/api/offers', require('./routes/offers'));
app.use('/api', require('./routes/chats'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api', require('./routes/reviews'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/favorites',    require('./routes/favorites'));

// Регистрируем io в notify-утилите (до запуска сокетов)
require('./utils/notify').setIo(io);

// Socket.IO
require('./sockets/chatSocket')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = { app, server, io };
