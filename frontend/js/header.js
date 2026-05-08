/* header.js — MentorConnect redesign header */
(function () {
  'use strict';

  /* --- Тема: применяем мгновенно --- */
  const _theme = localStorage.getItem('mc_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', _theme);

  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('mc_theme', t);
  }

  function getBase() {
    return window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '../' : '';
  }

  /* --- Навигация по роли --- */
  function getNavLinks(user, base) {
    if (!user) {
      return [
        { href: base + 'index.html',              label: 'Главная' },
        { href: base + 'pages/mentors.html',       label: 'Менторы' },
        { href: base + 'pages/how-it-works.html',  label: 'Как это работает' },
        { href: base + 'pages/about.html',         label: 'О проекте' },
        { href: base + 'pages/faq.html',           label: 'FAQ' },
      ];
    }
    if (user.role === 'student') {
      return [
        { href: base + 'index.html',              label: 'Главная' },
        { href: base + 'pages/mentors.html',       label: 'Менторы' },
        { href: base + 'pages/chat.html',          label: 'Чаты' },
        { href: base + 'pages/notifications.html', label: 'Уведомления', notif: true },
        { href: base + 'pages/my-requests.html',   label: 'Заявки' },
      ];
    }
    if (user.role === 'mentor') {
      return [
        { href: base + 'index.html',              label: 'Главная' },
        { href: base + 'pages/chat.html',          label: 'Чаты' },
        { href: base + 'pages/notifications.html', label: 'Уведомления', notif: true },
        { href: base + 'pages/my-students.html',   label: 'Студенты' },
        { href: base + 'pages/my-offers.html',     label: 'Предложения' },
        { href: base + 'pages/reviews.html',       label: 'Отзывы' },
      ];
    }
    if (user.role === 'admin') {
      return [
        { href: base + 'pages/admin.html', label: 'Админ-панель' },
      ];
    }
    return [];
  }

  /* --- Рендер шапки --- */
  function renderHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const base  = getBase();
    const user  = (typeof getUser === 'function') ? getUser() : null;
    const token = localStorage.getItem('mc_token');
    const links = getNavLinks(user, base);

    const currentPath = window.location.pathname.replace(/\\/g, '/');

    /* nav links HTML */
    const navLinksHtml = links.map(link => {
      const isActive = currentPath.endsWith(link.href.replace(/^(\.\.\/|\.\/)?/, '').split('/').pop()) ||
                       (link.href.includes('index') && (currentPath === '/' || currentPath.endsWith('index.html')));
      return `<a href="${link.href}" class="nav-link${isActive ? ' active' : ''}" data-nav-label="${link.label}">
        ${link.label}${link.notif ? `<span class="notif-badge" id="navNotifBadge" style="position:relative;top:-1px;margin-left:4px;display:none"></span>` : ''}
      </a>`;
    }).join('');

    /* auth area */
    const authHtml = token && user ? `
      <div class="notif-wrap" id="headerNotifWrap">
        <button class="icon-btn" id="notifBtn" title="Уведомления">
          ${Icons ? Icons.bell : '🔔'}
          <span class="notif-badge" id="notifBadge"></span>
        </button>
      </div>
      <div style="position:relative">
        <button class="user-menu-btn" id="userMenuBtn" aria-expanded="false">
          <div class="user-avatar-sm" id="headerAvatar">
            ${user.avatar_url ? `<img src="${user.avatar_url}" alt="">` : (user.full_name || user.email || 'U').charAt(0).toUpperCase()}
          </div>
          <span class="user-name-sm">${user.full_name || (user.email || '').split('@')[0]}</span>
          ${Icons ? Icons.chevronDown : '▾'}
        </button>
        <div class="user-dropdown" id="userDropdown">
          ${user.role === 'student' ? `<a href="${base}pages/student-dashboard.html" class="dropdown-item">${Icons ? Icons.home : ''} Кабинет</a>` : ''}
          ${user.role === 'mentor'  ? `<a href="${base}pages/mentor-dashboard.html" class="dropdown-item">${Icons ? Icons.home : ''} Кабинет</a>` : ''}
          <a href="${base}pages/profile.html" class="dropdown-item">${Icons ? Icons.user : ''} Профиль</a>
          <div class="dropdown-divider"></div>
          <button class="dropdown-item dropdown-item-danger" id="logoutBtn">${Icons ? Icons.logOut : ''} Выйти</button>
        </div>
      </div>
    ` : `
      <a href="${base}pages/auth.html" class="btn btn-outline btn-sm">Войти</a>
      <a href="${base}pages/auth.html?mode=register" class="btn btn-primary btn-sm">Регистрация</a>
    `;

    /* theme toggle */
    const themeHtml = `
      <button class="theme-toggle" id="themeToggleBtn" title="Тема">
        ${Icons ? Icons.moon : '🌙'}
      </button>
    `;

    header.innerHTML = `
      <div class="container">
        <a href="${base}index.html" class="logo">Mentor<span>Connect</span></a>
        <nav class="header-nav" id="headerNav" aria-label="Навигация">
          <div class="nav-pill" id="navPill"></div>
          ${navLinksHtml}
        </nav>
        <div class="header-actions">
          ${authHtml}
          ${themeHtml}
          <button class="hamburger" id="hamburgerBtn" aria-label="Меню" aria-expanded="false">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="mobile-menu" id="mobileMenu">
        ${links.map(l => `<a href="${l.href}" class="mobile-menu-item">${l.label}</a>`).join('')}
        ${token && user ? `<button class="mobile-menu-item mobile-menu-logout" id="mobileLogoutBtn">Выйти</button>` : ''}
        <button class="mobile-menu-item" id="mobileThemeBtn">Сменить тему</button>
      </div>
    `;

    /* === Nav Pill (задача 020) === */
    positionNavPill();
    window.addEventListener('resize', positionNavPill);

    function positionNavPill() {
      const pill    = document.getElementById('navPill');
      const active  = document.querySelector('.nav-link.active');
      const nav     = document.getElementById('headerNav');
      if (!pill || !active || !nav) return;
      const navRect    = nav.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      pill.style.width  = activeRect.width + 'px';
      pill.style.transform = `translateX(${activeRect.left - navRect.left}px)`;
      pill.style.top = ((nav.offsetHeight - 32) / 2) + 'px';
    }

    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', function () {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        this.classList.add('active');
        positionNavPill();
      });
    });

    /* === Scroll blur (задача 019) === */
    function onScroll() {
      header.classList.toggle('scrolled', window.scrollY > 20);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* === Hamburger (задача 023) === */
    const hamburger  = document.getElementById('hamburgerBtn');
    const mobileMenu = document.getElementById('mobileMenu');
    if (hamburger && mobileMenu) {
      hamburger.addEventListener('click', e => {
        e.stopPropagation();
        const open = mobileMenu.classList.toggle('open');
        hamburger.classList.toggle('open', open);
        hamburger.setAttribute('aria-expanded', open);
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { mobileMenu.classList.remove('open'); hamburger.classList.remove('open'); }
      });
    }

    /* === User dropdown === */
    const userMenuBtn  = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', e => {
        e.stopPropagation();
        const open = userDropdown.classList.toggle('show');
        userMenuBtn.setAttribute('aria-expanded', open);
      });
    }
    document.addEventListener('click', () => {
      userDropdown && userDropdown.classList.remove('show');
      mobileMenu   && mobileMenu.classList.remove('open');
      hamburger    && hamburger.classList.remove('open');
    });

    /* === Logout === */
    function doLogout() {
      localStorage.removeItem('mc_token');
      localStorage.removeItem('mc_user');
      window.location.href = base + 'index.html';
    }
    document.getElementById('logoutBtn')       && document.getElementById('logoutBtn').addEventListener('click', doLogout);
    document.getElementById('mobileLogoutBtn') && document.getElementById('mobileLogoutBtn').addEventListener('click', doLogout);

    /* === Theme toggle (задача 024) === */
    function toggleTheme() {
      const cur  = document.documentElement.getAttribute('data-theme') || 'dark';
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    }
    document.getElementById('themeToggleBtn') && document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeBtn') && document.getElementById('mobileThemeBtn').addEventListener('click', toggleTheme);

    /* === Notif badge (задача 022) === */
    updateNotifBadge(window._unreadCount || 0);
  }

  /* === Badge notifications (задача 022) === */
  function updateNotifBadge(count) {
    const badge = document.getElementById('notifBadge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  }
  window.updateNotifBadge = updateNotifBadge;

  /* --- Init --- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHeader);
  } else {
    renderHeader();
  }
})();
