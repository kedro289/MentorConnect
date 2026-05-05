/*
 * Файл: frontend/js/socketClient.js
 * Отвечает за: подключение к Socket.IO с JWT.
 * Используется в: pages/chat.html.
 */

let socket = null;

function connectSocket() {
  const token = getToken();
  if (!token) return null;

  socket = io(window.location.origin, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.error('Socket error:', err.message);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

function joinRoom(chatId) {
  if (socket) socket.emit('join_room', { chatId });
}

function sendSocketMessage(chatId, content) {
  if (socket) socket.emit('send_message', { chatId, content });
}

function markRead(chatId) {
  if (socket) socket.emit('mark_read', { chatId });
}
