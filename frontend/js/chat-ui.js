/*
 * Файл: frontend/js/chat-ui.js
 * Отвечает за: UI логику чата — список диалогов, отображение сообщений, typing indicator.
 * Используется в: pages/chat.html.
 */

let currentChatId = null;
let currentUser   = null;
let _typingTimer  = null;
let _isTyping     = false;

(async function init() {
  if (!requireAuth()) return;
  currentUser = getUser();

  connectSocket();

  await loadChatList();

  const params = new URLSearchParams(window.location.search);
  const chatId = params.get('chatId');
  if (chatId) openChat(parseInt(chatId, 10));

  if (socket) {
    socket.on('new_message', (msg) => {
      if (msg.chat_id === currentChatId) {
        appendMessage(msg);
        markRead(currentChatId);
      }
      updateChatPreview(msg);
    });

    socket.on('user_typing', ({ chatId, userName }) => {
      if (chatId !== currentChatId) return;
      const ind  = document.getElementById('typingIndicator');
      const name = document.getElementById('typingName');
      if (ind) {
        name.textContent = (userName || 'Собеседник') + ' печатает...';
        ind.classList.add('visible');
        clearTimeout(window._typingHideTimer);
        window._typingHideTimer = setTimeout(() => ind.classList.remove('visible'), 3000);
      }
    });

    socket.on('user_stopped_typing', ({ chatId }) => {
      if (chatId !== currentChatId) return;
      const ind = document.getElementById('typingIndicator');
      if (ind) ind.classList.remove('visible');
    });
  }
})();

/* ===== Typing emit ===== */
function onTyping() {
  if (!currentChatId || !socket) return;
  if (!_isTyping) {
    _isTyping = true;
    socket.emit('typing', { chatId: currentChatId });
  }
  clearTimeout(_typingTimer);
  _typingTimer = setTimeout(() => {
    _isTyping = false;
    socket.emit('stop_typing', { chatId: currentChatId });
  }, 1500);
}

/* ===== Chat list ===== */
async function loadChatList() {
  const el = document.getElementById('chatListItems');
  try {
    const data = await apiRequest('GET', '/chats');
    window._chats = data.chats;
    if (!data.chats.length) {
      el.innerHTML = '<div style="padding:14px;color:#767676;font-size:.87rem">Нет диалогов</div>';
      return;
    }
    renderChatList(data.chats);
  } catch {
    el.innerHTML = '<div style="padding:14px;color:#c0392b">Ошибка загрузки</div>';
  }
}

function renderChatList(chats) {
  const el = document.getElementById('chatListItems');
  el.innerHTML = chats.map(c => {
    const partner = currentUser.role === 'mentor'
      ? (c.student_name || c.student_email)
      : (c.mentor_name  || c.mentor_email);
    const initials = (partner || '?').charAt(0).toUpperCase();
    const preview  = (c.last_message || 'Нет сообщений').slice(0, 40);
    return `<div class="chat-list-item ${c.id===currentChatId?'active':''}"
               id="chatItem-${c.id}" onclick="openChat(${c.id})">
      <div style="display:flex;gap:10px;align-items:center">
        <div style="width:36px;height:36px;border-radius:50%;background:var(--primary-light);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:600;flex-shrink:0">${initials}</div>
        <div style="min-width:0">
          <div class="name">${partner}</div>
          <div class="preview" id="preview-${c.id}">${preview}</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ===== Open chat ===== */
async function openChat(chatId) {
  currentChatId = chatId;
  _isTyping = false;

  document.querySelectorAll('.chat-list-item').forEach(el => el.classList.remove('active'));
  const item = document.getElementById('chatItem-' + chatId);
  if (item) item.classList.add('active');

  joinRoom(chatId);

  const messagesEl = document.getElementById('chatMessages');
  messagesEl.innerHTML = '<div class="loader"><div class="spinner"></div></div>';

  const chat = (window._chats || []).find(c => c.id === chatId);
  if (chat) {
    const partner = currentUser.role === 'mentor'
      ? (chat.student_name || chat.student_email)
      : (chat.mentor_name  || chat.mentor_email);
    document.getElementById('chatHeaderName').textContent = partner;
  }

  const ind = document.getElementById('typingIndicator');
  if (ind) ind.classList.remove('visible');

  try {
    const data = await apiRequest('GET', `/chats/${chatId}/messages`);
    messagesEl.innerHTML = '';
    if (!data.messages.length) {
      messagesEl.innerHTML = '<div class="empty-state"><p>Начните переписку</p></div>';
    } else {
      data.messages.forEach(m => appendMessage(m));
    }
    scrollBottom();
    markRead(chatId);
  } catch {
    messagesEl.innerHTML = '<div class="empty-state"><p>Ошибка загрузки сообщений</p></div>';
  }

  document.getElementById('chatInputArea').style.display = 'flex';
  document.getElementById('msgInput').focus();
}

/* ===== Message rendering ===== */
function appendMessage(msg) {
  const el    = document.getElementById('chatMessages');
  const isOwn = msg.sender_id === currentUser.id;
  const time  = msg.created_at
    ? new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    : '';
  const div = document.createElement('div');
  div.className = `message ${isOwn ? 'own' : ''}`;
  div.innerHTML = `
    <div class="message-bubble">
      ${escapeHtml(msg.content)}
      <div class="message-time">${time}</div>
    </div>`;
  el.appendChild(div);
  scrollBottom();
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function updateChatPreview(msg) {
  const el = document.getElementById('preview-' + msg.chat_id);
  if (el) el.textContent = msg.content.slice(0, 40);
}

function scrollBottom() {
  const el = document.getElementById('chatMessages');
  el.scrollTop = el.scrollHeight;
}

/* ===== Send ===== */
function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendMessage() {
  const input   = document.getElementById('msgInput');
  const content = input.value.trim();
  if (!content || !currentChatId) return;
  if (socket) {
    socket.emit('stop_typing', { chatId: currentChatId });
    _isTyping = false;
  }
  sendSocketMessage(currentChatId, content);
  input.value = '';
}
