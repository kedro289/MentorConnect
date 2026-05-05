/*
 * Файл: frontend/js/dashboard-mentor.js
 * Отвечает за: логику личного кабинета ментора.
 * Используется в: pages/mentor-dashboard.html.
 */

let mentorProfile = null;

(async function init() {
  if (!requireAuth()) return;
  const user = getUser();
  if (user && user.role !== 'mentor') {
    window.location.href = user.role === 'admin' ? 'admin.html' : 'student-dashboard.html';
    return;
  }
  await loadProfile();
})();

function showSection(name, el) {
  document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
  document.getElementById('section-' + name).style.display = 'block';
  document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  if (name === 'offers')       loadOffers();
  if (name === 'applications') loadApplications();
  if (name === 'reviews')      loadReviews();
  if (name === 'chats')        loadChats();
  return false;
}

async function loadProfile() {
  try {
    const data = await apiRequest('GET', '/profile/me');
    mentorProfile = data.profile;
    renderProfile(data.profile);
    renderStats(data.profile);
  } catch {
    document.getElementById('profileTable').innerHTML = '<tr><td>Ошибка загрузки</td></tr>';
  }
}

function renderStats(p) {
  if (!p) return;
  const row = document.getElementById('mentorStatsRow');
  if (!row) return;
  document.getElementById('statRating').textContent  = (+(p.avg_rating||0)).toFixed(1);
  document.getElementById('statReviews').textContent = p.total_reviews || 0;
  const user = getUser();
  if (user) {
    apiRequest('GET', `/offers/mentor/${user.id}`)
      .then(d => { document.getElementById('statOffers').textContent = (d.offers||[]).length; })
      .catch(() => {});
  }
  row.style.display = 'grid';
}

function renderProfile(p) {
  if (!p) return;
  const name = p.full_name || 'Не указано';
  document.getElementById('sidebarName').textContent = name;
  document.getElementById('sidebarAvatar').textContent = name.charAt(0).toUpperCase();
  if (p.avatar_url) {
    document.getElementById('sidebarAvatar').innerHTML = `<img src="${p.avatar_url}" style="width:80px;height:80px;border-radius:50%;object-fit:cover">`;
  }
  document.getElementById('sidebarRating').innerHTML =
    `<span class="stars">${starsHtml(p.avg_rating||0)}</span> ${(+p.avg_rating||0).toFixed(1)} (${p.total_reviews||0} отзывов)`;
  document.getElementById('profileTable').innerHTML = `
    <tr><th style="width:160px">Имя</th><td>${p.full_name||'—'}</td></tr>
    <tr><th>Экспертиза</th><td>${(p.expertise||[]).join(', ')||'—'}</td></tr>
    <tr><th>Опыт</th><td>${p.experience_years ? p.experience_years+' лет' : '—'}</td></tr>
    <tr><th>Биография</th><td>${p.bio||'—'}</td></tr>
    <tr><th>Расписание</th><td>${p.available_schedule||'—'}</td></tr>
    <tr><th>Цена</th><td>${p.price_type==='free'?'Бесплатно':(p.price_amount+' ₽/час')}</td></tr>
  `;
}

function showEditForm() {
  const p = mentorProfile || {};
  document.getElementById('editName').value     = p.full_name || '';
  document.getElementById('editBio').value      = p.bio || '';
  document.getElementById('editExpertise').value = (p.expertise||[]).join(', ');
  document.getElementById('editExpYears').value  = p.experience_years || '';
  document.getElementById('editExpText').value   = p.experience_text || '';
  document.getElementById('editSchedule').value  = p.available_schedule || '';
  document.getElementById('editPriceType').value = p.price_type || 'free';
  document.getElementById('editPrice').value     = p.price_amount || '';
  document.getElementById('profileView').style.display = 'none';
  document.getElementById('profileEdit').style.display = 'block';
}
function cancelEdit() {
  document.getElementById('profileView').style.display = 'block';
  document.getElementById('profileEdit').style.display = 'none';
}
async function saveProfile() {
  const alert = document.getElementById('editAlert');
  alert.style.display = 'none';
  const expertiseRaw = document.getElementById('editExpertise').value;
  const expertise = expertiseRaw.split(',').map(s => s.trim()).filter(Boolean);
  try {
    const data = await apiRequest('PUT', '/profile/me', {
      full_name: document.getElementById('editName').value,
      bio: document.getElementById('editBio').value,
      expertise,
      experience_years: parseInt(document.getElementById('editExpYears').value)||null,
      experience_text: document.getElementById('editExpText').value,
      available_schedule: document.getElementById('editSchedule').value,
      price_type: document.getElementById('editPriceType').value,
      price_amount: parseFloat(document.getElementById('editPrice').value)||null,
    });
    mentorProfile = data.profile;
    renderProfile(data.profile);
    cancelEdit();
  } catch (e) {
    alert.className = 'alert alert-error';
    alert.textContent = e.message || 'Ошибка';
    alert.style.display = 'block';
  }
}

// Offers
async function loadOffers() {
  const el = document.getElementById('offersList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const user = getUser();
  try {
    const data = await apiRequest('GET', `/offers/mentor/${user.id}`);
    if (!data.offers.length) { el.innerHTML = '<p style="color:#767676">Нет предложений</p>'; return; }
    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Название</th><th>Категория</th><th>Цена</th><th></th></tr></thead>
      <tbody>${data.offers.map(o => `
        <tr>
          <td>${o.title}</td>
          <td>${o.category||'—'}</td>
          <td>${o.price_type==='free'?'Бесплатно':o.price_amount+' ₽'}</td>
          <td><button onclick="deleteOffer(${o.id})" style="background:none;border:none;color:#c0392b;cursor:pointer">Удалить</button></td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch (e) { el.innerHTML = '<p>Ошибка загрузки</p>'; }
}
function showAddOffer()  { document.getElementById('addOfferForm').style.display='block'; }
function hideAddOffer() { document.getElementById('addOfferForm').style.display='none'; }
async function addOffer() {
  try {
    await apiRequest('POST', '/offers', {
      title: document.getElementById('offerTitle').value,
      description: document.getElementById('offerDesc').value,
      category: document.getElementById('offerCat').value,
      price_type: document.getElementById('offerPriceType').value,
      price_amount: parseFloat(document.getElementById('offerPrice').value)||0,
    });
    hideAddOffer();
    loadOffers();
  } catch (e) { alert(e.message); }
}
async function deleteOffer(id) {
  if (!confirm('Удалить предложение?')) return;
  try { await apiRequest('DELETE', `/offers/${id}`); loadOffers(); }
  catch (e) { alert(e.message); }
}

// Applications
async function loadApplications() {
  const el = document.getElementById('applicationsList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiRequest('GET', '/applications/incoming');
    if (!data.applications.length) { el.innerHTML = '<p style="color:#767676">Нет заявок</p>'; return; }
    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Студент</th><th>Сообщение</th><th>Статус</th><th>Действия</th></tr></thead>
      <tbody>${data.applications.map(a => `
        <tr>
          <td>${a.student_name||a.student_email}</td>
          <td>${a.message||'—'}</td>
          <td><span class="badge badge-${a.status}">${statusLabel(a.status)}</span></td>
          <td>${a.status==='pending'?`
            <button onclick="acceptApp(${a.id})" style="background:var(--primary);color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;margin-right:6px">Принять</button>
            <button onclick="rejectApp(${a.id})" style="background:#767676;color:#fff;border:none;padding:5px 12px;border-radius:6px;cursor:pointer">Отклонить</button>
          `:'—'}</td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch (e) { el.innerHTML = '<p>Ошибка загрузки</p>'; }
}
async function acceptApp(id) {
  try { await apiRequest('PUT', `/applications/${id}/accept`); loadApplications(); }
  catch (e) { alert(e.message); }
}
async function rejectApp(id) {
  try { await apiRequest('PUT', `/applications/${id}/reject`); loadApplications(); }
  catch (e) { alert(e.message); }
}

// Reviews
async function loadReviews() {
  const el = document.getElementById('reviewsList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  const user = getUser();
  try {
    const data = await apiRequest('GET', `/mentors/${user.id}/reviews`);
    if (!data.reviews.length) { el.innerHTML = '<p style="color:#767676">Нет отзывов</p>'; return; }
    el.innerHTML = data.reviews.map(r => `
      <div style="border-bottom:1px solid #e0e0e0;padding:14px 0">
        <div style="display:flex;justify-content:space-between">
          <strong>${r.student_name||r.student_email}</strong>
          <span class="stars">${starsHtml(r.rating)}</span>
        </div>
        <p style="margin:6px 0 0;color:#444">${r.comment||''}</p>
        <small style="color:#767676">${formatDate(r.created_at)}</small>
      </div>`).join('');
  } catch (e) { el.innerHTML = '<p>Ошибка загрузки</p>'; }
}

// Chats
async function loadChats() {
  const el = document.getElementById('chatsList');
  el.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
  try {
    const data = await apiRequest('GET', '/chats');
    if (!data.chats.length) { el.innerHTML = '<p style="color:#767676">Нет чатов</p>'; return; }
    el.innerHTML = `<table class="data-table">
      <thead><tr><th>Студент</th><th>Последнее сообщение</th><th></th></tr></thead>
      <tbody>${data.chats.map(c => `
        <tr>
          <td>${c.student_name||c.student_email}</td>
          <td>${c.last_message||'Нет сообщений'}</td>
          <td><a href="chat.html?chatId=${c.id}" class="btn-primary" style="padding:6px 16px;font-size:.85rem;width:auto;display:inline-block;text-decoration:none">Открыть</a></td>
        </tr>`).join('')}
      </tbody></table>`;
  } catch (e) { el.innerHTML = '<p>Ошибка загрузки</p>'; }
}

function statusLabel(s) {
  return s==='pending'?'Ожидает':s==='accepted'?'Принята':'Отклонена';
}
