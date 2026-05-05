/*
 * Файл: frontend/js/api.js
 * Отвечает за: базовые функции работы с API.
 * Используется в: всех JS-файлах фронтенда.
 */

const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('mc_token');
}

function setToken(token) {
  localStorage.setItem('mc_token', token);
}

function removeToken() {
  localStorage.removeItem('mc_token');
  localStorage.removeItem('mc_user');
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem('mc_user'));
  } catch {
    return null;
  }
}

function setUser(user) {
  localStorage.setItem('mc_user', JSON.stringify(user));
}

async function apiRequest(method, url, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  const t = token || getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(API_BASE + url, opts);
  const data = await res.json();
  if (!res.ok) throw { status: res.status, message: data.error || 'Ошибка запроса', data };
  return data;
}

async function searchMentors({ keyword='', category='', minRating='', priceType='', maxPrice='', minExperience='', sort='rating', page=1, limit=12 } = {}) {
  const params = new URLSearchParams();
  if (keyword)       params.set('keyword', keyword);
  if (category)      params.set('category', category);
  if (minRating)     params.set('minRating', minRating);
  if (priceType)     params.set('priceType', priceType);
  if (maxPrice)      params.set('maxPrice', maxPrice);
  if (minExperience) params.set('minExperience', minExperience);
  if (sort && sort !== 'rating') params.set('sort', sort);
  params.set('page', page);
  params.set('limit', limit);
  return apiRequest('GET', `/mentors/search?${params}`);
}

async function getFavorites() {
  return apiRequest('GET', '/favorites');
}
async function addFavorite(mentorId) {
  return apiRequest('POST', '/favorites', { mentorId });
}
async function removeFavorite(mentorId) {
  return apiRequest('DELETE', `/favorites/${mentorId}`);
}

async function getMentorCard(mentorId) {
  return apiRequest('GET', `/profile/mentors/${mentorId}`);
}

async function getMentorReviews(mentorId) {
  return apiRequest('GET', `/mentors/${mentorId}/reviews`);
}

async function getMentorOffers(mentorId) {
  return apiRequest('GET', `/offers/mentor/${mentorId}`);
}

function starsHtml(rating) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
}

function requireAuth(redirectTo = '/pages/login.html') {
  if (!getToken()) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

function redirectIfAuth() {
  const user = getUser();
  if (getToken() && user) {
    const dash = user.role === 'mentor' ? '/pages/mentor-dashboard.html'
               : user.role === 'admin'  ? '/pages/admin.html'
               : '/pages/student-dashboard.html';
    window.location.href = dash;
  }
}
