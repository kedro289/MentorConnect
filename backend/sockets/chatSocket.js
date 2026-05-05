/*
 * Файл: backend/sockets/chatSocket.js
 * Отвечает за: Socket.IO чат в реальном времени с JWT-авторизацией.
 * Используется в: backend/server.js.
 */

const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt-config');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { notify } = require('../utils/notify');

module.exports = function initChatSocket(io) {
  // JWT middleware для сокетов
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Токен не предоставлен'));
    try {
      socket.user = jwt.verify(token, secret);
      next();
    } catch {
      next(new Error('Токен недействителен'));
    }
  });

  io.on('connection', (socket) => {
    // Присоединяем пользователя к персональной комнате для уведомлений
    socket.join(`user_${socket.user.id}`);
    console.log(`Socket connected: userId=${socket.user.id}`);

    // Войти в комнату чата
    socket.on('join_room', async ({ chatId }) => {
      try {
        const chat = await Chat.findChatById(chatId);
        if (!chat) return socket.emit('error', 'Чат не найден');
        if (chat.student_id !== socket.user.id && chat.mentor_id !== socket.user.id) {
          return socket.emit('error', 'Нет доступа к этому чату');
        }
        socket.join(chat.room_name);
        socket.currentChatId = chatId;
        socket.currentRoomName = chat.room_name;
        socket.emit('joined', { roomName: chat.room_name });
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', 'Ошибка при входе в комнату');
      }
    });

    // Отправить сообщение
    socket.on('send_message', async ({ chatId, content }) => {
      if (!content || !content.trim()) return;
      try {
        const chat = await Chat.findChatById(chatId);
        if (!chat) return socket.emit('error', 'Чат не найден');
        if (chat.student_id !== socket.user.id && chat.mentor_id !== socket.user.id) {
          return socket.emit('error', 'Нет доступа');
        }
        const message = await Message.create({
          chatId,
          senderId: socket.user.id,
          content: content.trim(),
        });
        io.to(chat.room_name).emit('new_message', message);

        // Уведомить получателя в реалтайм через персональную комнату
        const recipientId = socket.user.id === chat.student_id
          ? chat.mentor_id
          : chat.student_id;
        notify({
          userId: recipientId,
          type:  'new_message',
          title: 'Новое сообщение',
          body:  content.trim().slice(0, 100),
          link:  `/pages/chat.html?chatId=${chatId}`,
        });
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', 'Ошибка при отправке сообщения');
      }
    });

    // Отметить сообщения прочитанными
    socket.on('mark_read', async ({ chatId }) => {
      try {
        await Message.markRead(chatId, socket.user.id);
      } catch (err) {
        console.error('mark_read error:', err);
      }
    });

    // Typing indicator
    socket.on('typing', async ({ chatId }) => {
      try {
        const chat = await Chat.findChatById(chatId);
        if (!chat) return;
        if (chat.student_id !== socket.user.id && chat.mentor_id !== socket.user.id) return;
        const userName = socket.user.email ? socket.user.email.split('@')[0] : 'Собеседник';
        socket.to(chat.room_name).emit('user_typing', { chatId, userName });
      } catch { /* ignore */ }
    });

    socket.on('stop_typing', async ({ chatId }) => {
      try {
        const chat = await Chat.findChatById(chatId);
        if (!chat) return;
        socket.to(chat.room_name).emit('user_stopped_typing', { chatId });
      } catch { /* ignore */ }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: userId=${socket.user.id}`);
    });
  });
};
