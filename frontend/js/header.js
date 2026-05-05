/*
 * Файл: frontend/js/header.js
 * Отвечает за: рендеринг универсальной шапки с гамбургером, дропдауном пользователя.
 * Используется в: все HTML страницы (подключается после api.js).
 */
(function () {
  'use strict';

  /* ---- Применяем тему немедленно, чтобы избежать мигания ---- */
  const _storedTheme = localStorage.getItem('mc_theme') || 'light';
  document.documentElement.setAttribute('data-theme', _storedTheme);

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('mc_theme', theme);
  }

  function getBase() {
    return window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '../' : '';
  }

  function renderHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const base  = getBase();
    const user  = (typeof getUser === 'function') ? getUser() : null;
    const token = localStorage.getItem('mc_token');

    let dashLink = base + 'pages/student-dashboard.html';
    if (user) {
      if (user.role === 'mentor') dashLink = base + 'pages/mentor-dashboard.html';
      if (user.role === 'admin')  dashLink = base + 'pages/admin.html';
    }

    const initials = user ? (user.full_name || user.email || 'U').charAt(0).toUpperCase() : 'U';
    const displayName = user ? (user.full_name || (user.email || '').split('@')[0]) : '';

    const desktopAuth = token && user ? `
      <a href="${base}pages/chat.html" class="nav-link nav-icon-link" title="Сообщения">
        <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03
               8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512
               15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
      </a>
      <div class="notif-bell-wrap">
        <button class="nav-icon-btn" id="notifBtn" title="Уведомления" aria-label="Уведомления">
          <svg width="19" height="19" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118
                 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0
                 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0
                 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0
                 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="notif-badge hidden" id="notifBadge"></span>
        </button>
      </div>
      <div class="user-menu-wrap">
        <button class="user-menu-btn" id="userMenuBtn" aria-expanded="false" aria-haspopup="true">
          <div class="user-avatar-sm">${initials}</div>
          <span class="user-name-sm">${displayName}</span>
          <svg class="chevron-icon" width="13" height="13" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        <div class="user-dropdown" id="userDropdown" role="menu">
          <a href="${dashLink}" class="dropdown-item" role="menuitem">Личный кабинет</a>
          <a href="${base}pages/chat.html" class="dropdown-item" role="menuitem">Сообщения</a>
          <a href="${base}pages/notifications.html" class="dropdown-item" role="menuitem">Уведомления</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item dropdown-item-danger" id="dropdownLogoutBtn" role="menuitem">Выйти</button>
        </div>
      </div>
    ` : `
      <a href="${base}pages/login.html" class="btn-login">Войти</a>
      <a href="${base}pages/register.html" class="btn-register">Регистрация</a>
    `;

    const mobileLinks = token && user ? `
      <a href="${base}index.html" class="mobile-menu-item">Менторы</a>
      <a href="${dashLink}" class="mobile-menu-item">Личный кабинет</a>
      <a href="${base}pages/chat.html" class="mobile-menu-item">Сообщения</a>
      <a href="${base}pages/notifications.html" class="mobile-menu-item">Уведомления</a>
      <button class="mobile-menu-item mobile-menu-logout" id="mobileLogoutBtn">Выйти</button>
    ` : `
      <a href="${base}index.html" class="mobile-menu-item">Менторы</a>
      <a href="${base}pages/login.html" class="mobile-menu-item">Войти</a>
      <a href="${base}pages/register.html" class="mobile-menu-item">Регистрация</a>
    `;

    const themeToggleBtn = `
      <button class="theme-toggle" id="themeToggleBtn" title="Сменить тему" aria-label="Сменить тему">
        <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
        <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      </button>`;

    header.innerHTML = `
      <div class="container">
        <a href="${base}index.html" class="logo">Mentor<span>Connect</span></a>
        <nav class="header-nav" aria-label="Основная навигация">
          <a href="${base}index.html" class="nav-link">Менторы</a>
          ${desktopAuth}
          ${themeToggleBtn}
        </nav>
        <button class="hamburger" id="hamburgerBtn" aria-label="Открыть меню" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
      <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
        ${mobileLinks}
        <button class="mobile-menu-item theme-toggle-mobile" id="themeToggleMobileBtn">
          <span id="themeToggleMobileLabel">${_storedTheme === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема'}</span>
        </button>
      </div>
    `;

    /* --- Гамбургер --- */
    const hamburger  = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open);
        mobileMenu.setAttribute('aria-hidden', !open);
      });
    }

    /* --- Дропдаун пользователя --- */
    const userMenuBtn  = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = userDropdown.classList.toggle('show');
        userMenuBtn.setAttribute('aria-expanded', open);
      });
    }

    /* --- Закрытие при клике вне шапки --- */
    document.addEventListener('click', () => {
      if (mobileMenu)  { mobileMenu.classList.remove('open'); }
      if (hamburger)   { hamburger.classList.remove('open'); hamburger.setAttribute('aria-expanded', 'false'); }
      if (userDropdown){ userDropdown.classList.remove('show'); }
      if (userMenuBtn) { userMenuBtn.setAttribute('aria-expanded', 'false'); }
    });

    /* --- Выход --- */
    function doLogout() {
      localStorage.removeItem('mc_token');
      localStorage.removeItem('mc_user');
      window.location.href = base + 'index.html';
    }
    const dropBtn   = document.getElementById('dropdownLogoutBtn');
    const mobileBtn = document.getElementById('mobileLogoutBtn');
    if (dropBtn)   dropBtn.addEventListener('click', doLogout);
    if (mobileBtn) mobileBtn.addEventListener('click', doLogout);

    /* --- Переключение темы --- */
    function toggleTheme() {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next    = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      const mobileLabel = document.getElementById('themeToggleMobileLabel');
      if (mobileLabel) {
        mobileLabel.textContent = next === 'dark' ? '☀️ Светлая тема' : '🌙 Тёмная тема';
      }
    }

    const themeBtn       = document.getElementById('themeToggleBtn');
    const themeBtnMobile = document.getElementById('themeToggleMobileBtn');
    if (themeBtn)       themeBtn.addEventListener('click', toggleTheme);
    if (themeBtnMobile) themeBtnMobile.addEventListener('click', toggleTheme);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
