/*
 * Файл: frontend/js/dashboard-student.js
 * Отвечает за: логику личного кабинета студента.
 * Используется в: pages/student-dashboard.html.
 */

let studentProfile = null;

(async function init() {
  if (!requireAuth()) return;
  const user = getUser();
  if (user && user.role !== 'student') {
    window.location.href = user.role === 'mentor' ? 'mentor-dashboard.html' : 'admin.html';
    return;
  }
  await loadProfile();
})();

function showSection(name, el) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  document.getElementById('section-' + name).style.display = 'block';
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  if (name === 'applications') loadApplications();
  if (name === 'favorites')    loadFavorites();
  if (name === 'chats')        loadChats();
  return false;
}

/* ===== Profile ===== */

async function loadProfile() {
  try {
    const data = await apiRequest('GET', '/profile/me');
    studentProfile = data.profile;
    renderProfile(data.profile);
  } catch {
    document.getElementById('profileTable').innerHTML = '<tr><td>Ошибка загрузки профиля</td></tr>';
  }
}

function calcCompletion(p) {
  if (!p) return 0;
  const fields = ['full_name', 'phone', 'interests', 'bio'];
  const filled = fields.filter(f => p[f] && p[f].toString().trim()).length;
  return Math.round((filled / fields.length) * 100);
}

function renderProfile(p) {
  if (!p) return;
  const name = p.full_name || 'Не указано';
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
  if (p.avatar_url) {
    document.getElementById('sidebarAvatar').innerHTML =
      `<img src="${p.avatar_url}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`;
  }

  const pct = calcCompletion(p);
  document.getElementById('sidebarProgress').style.width = pct + '%';
  document.getElementById('sidebarProgressLabel').textContent =
    pct === 100 ? 'Профиль заполнен ✓' : `Профиль заполнен на ${pct}%`;

  document.getElementById('profileTable').innerHTML = `
    <tr><th style="width:160px">Имя</th><td>${p.full_name || '—'}</td></tr>
    <tr><th>Телефон</th><td>${p.phone || '—'}</td></tr>
    <tr><th>Интересы</th><td>${p.interests || '—'}</td></tr>
    <tr><th>О себе</th><td>${p.bio || '—'}</td></tr>
  `;
}

function showEditForm() {
  const p = studentProfile || {};
  document.getElementById('editName').value      = p.full_name || '';
  document.getElementById('editPhone').value     = p.phone || '';
  document.getElementById('editInterests').value = p.interests || '';
  document.getElementById('editBio').value       = p.bio || '';
  document.getElementById('profileView').style.display = 'none';
  document.getElementById('profileEdit').style.display = 'block';
}

function cancelEdit() {
  document.getElementById('profileView').style.display = 'block';
  document.getElementById('profileEdit').style.display = 'none';
}

async function saveProfile() {
  const alertEl = document.getElementById('editAlert');
  alertEl.style.display = 'none';
  try {
    const data = await apiRequest('PUT', '/profile/me', {
      full_name: document.getElementById('editName').value,
      phone:     document.getElementById('editPhone').value,
      interests: document.getElementById('editInterests').value,
      bio:       document.getElementById('editBio').value,
    });
    studentProfile = data.profile;
    renderProfile(data.profile);
    cancelEdit();
  } catch (e) {
    alertEl.className = 'alert alert-error';
    alertEl.textContent = e.message || 'Ошибка сохранения';
    alertEl.style.display = 'block';
  }
}

/* ===== Applications ===== */

async function loadApplications() {
  const el = document.getElementById('applicationsList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiRequest('GET', '/applications/my');
    const apps = data.applications;
    if (!apps.length) {
      el.innerHTML = '<div class="empty-state"><p>У вас пока нет заявок. <a href="../index.html">Найти ментора →</a></p></div>';
      return;
    }
    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Ментор</th><th>Сообщение</th><th>Статус</th><th>Дата</th></tr></thead>
      <tbody>${apps.map(a => `
        <tr>
          <td><a href="mentor-profile.html?id=${a.mentor_id}">${a.mentor_name || a.mentor_email}</a></td>
          <td>${a.message || '—'}</td>
          <td><span class="badge badge-${a.status}">${statusLabel(a.status)}</span></td>
          <td>${formatDate(a.created_at)}</td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки заявок</p></div>';
  }
}

/* ===== Favorites (T32) ===== */

async function loadFavorites() {
  const el = document.getElementById('favoritesList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await getFavorites();
    const favs = data.favorites;
    if (!favs.length) {
      el.innerHTML = '<div class="empty-state"><p>Нет избранных менторов. <a href="../index.html">Найти →</a></p></div>';
      return;
    }
    el.innerHTML = `<div class="mentors-grid" style="margin-top:0">${favs.map(f => {
      const initials = (f.full_name || 'М').charAt(0).toUpperCase();
      const tags = (f.expertise || []).slice(0, 3).map(e => `<span class="tag">${e}</span>`).join('');
      const price = f.price_type === 'free'
        ? '<span class="price-badge price-free">Бесплатно</span>'
        : `<span class="price-badge price-paid">${f.price_amount || '—'} ₽/час</span>`;
      return `
        <a href="mentor-profile.html?id=${f.mentor_id}" class="mentor-card" style="text-decoration:none;color:inherit">
          <button class="favorite-btn fav-active" onclick="removeFav(event,${f.mentor_id})" title="Убрать из избранного">❤️</button>
          <div class="mentor-avatar">
            ${f.avatar_url ? `<img src="${f.avatar_url}" alt="">` : `<span>${initials}</span>`}
          </div>
          <div class="mentor-info">
            <div class="mentor-name">${f.full_name || 'Имя не указано'}</div>
            <div class="mentor-expertise">${tags}</div>
            <div class="mentor-footer">
              <div class="mentor-rating">
                <span class="stars">${starsHtml(f.avg_rating || 0)}</span>
                <strong>${(+f.avg_rating || 0).toFixed(1)}</strong>
                <span class="review-count">(${f.total_reviews || 0})</span>
              </div>
              ${price}
            </div>
          </div>
        </a>`;
    }).join('')}</div>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки</p></div>';
  }
}

async function removeFav(e, mentorId) {
  e.preventDefault();
  e.stopPropagation();
  try {
    await removeFavorite(mentorId);
    loadFavorites();
  } catch { /* ignore */ }
}

/* ===== Chats ===== */

async function loadChats() {
  const el = document.getElementById('chatsList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiRequest('GET', '/chats');
    const chats = data.chats;
    if (!chats.length) {
      el.innerHTML = '<div class="empty-state"><p>Нет активных чатов</p></div>';
      return;
    }
    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Ментор</th><th>Последнее сообщение</th><th></th></tr></thead>
      <tbody>${chats.map(c => `
        <tr>
          <td>${c.mentor_name || c.mentor_email}</td>
          <td>${c.last_message || 'Нет сообщений'}</td>
          <td><a href="chat.html?chatId=${c.id}" class="btn-primary" style="padding:6px 16px;font-size:.85rem;width:auto;display:inline-block;text-decoration:none">Открыть</a></td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch {
    el.innerHTML = '<div class="empty-state"><p>Ошибка загрузки чатов</p></div>';
  }
}

function statusLabel(s) {
  return s === 'pending' ? 'Ожидает' : s === 'accepted' ? 'Принята' : 'Отклонена';
}
