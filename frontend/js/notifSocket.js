/*
 * Файл: frontend/js/notifSocket.js
 * Отвечает за: реалтайм уведомления, dropdown-панель, badge, toast на всех страницах.
 * Используется в: все HTML страницы после header.js.
 */
(function () {
  'use strict';

  let _unread   = 0;
  let _handlers = [];
  let _socket   = null;
  let _notifs   = [];  // кеш последних уведомлений

  const ICONS = {
    new_application:     '📋',
    application_accepted:'✅',
    application_rejected:'❌',
    new_message:         '💬',
    new_review:          '⭐',
  };

  /* ===== Badge ===== */
  function updateBadge(n) {
    _unread = Math.max(0, n);
    const el = document.getElementById('notifBadge');
    if (!el) return;
    if (_unread > 0) {
      el.textContent = _unread > 99 ? '99+' : String(_unread);
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  }

  /* ===== Toast ===== */
  function ensureContainer() {
    let c = document.getElementById('toastContainer');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toastContainer';
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(notif) {
    const wrap = ensureContainer();
    const el   = document.createElement('div');
    el.className = 'notif-toast';
    const icon = ICONS[notif.type] || '🔔';
    el.innerHTML = `
      <div class="notif-toast-inner">
        <span class="notif-toast-icon">${icon}</span>
        <div class="notif-toast-text">
          <strong>${notif.title}</strong>
          ${notif.body ? `<p>${notif.body.slice(0, 80)}</p>` : ''}
        </div>
      </div>
      <button class="notif-toast-close" aria-label="Закрыть">✕</button>
    `;
    if (notif.link && notif.link !== '#') {
      el.style.cursor = 'pointer';
      el.querySelector('.notif-toast-inner').addEventListener('click', () => {
        window.location.href = notif.link;
      });
    }
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    let timer = setTimeout(dismiss, 5000);
    function dismiss() {
      clearTimeout(timer);
      el.classList.remove('show');
      setTimeout(() => el.remove(), 320);
    }
    el.querySelector('.notif-toast-close').addEventListener('click', (e) => {
      e.stopPropagation();
      dismiss();
    });
  }

  /* ===== Dropdown ===== */
  function getBase() {
    return window.location.pathname.replace(/\\/g, '/').includes('/pages/') ? '../' : '';
  }

  function buildDropdown() {
    const wrap = document.querySelector('.notif-bell-wrap');
    if (!wrap || document.getElementById('notifDropdown')) return;
    const dd = document.createElement('div');
    dd.id = 'notifDropdown';
    dd.className = 'notif-dropdown';
    wrap.appendChild(dd);

    // Toggle on bell click
    const btn = document.getElementById('notifBtn');
    if (btn) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const open = dd.classList.toggle('show');
        if (open) renderDropdown();
      });
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) dd.classList.remove('show');
    });
  }

  function renderDropdown() {
    const dd = document.getElementById('notifDropdown');
    if (!dd) return;
    const base = getBase();
    if (!_notifs.length) {
      dd.innerHTML = `
        <div class="notif-dropdown-hdr"><strong>Уведомления</strong></div>
        <div class="notif-dropdown-empty">Нет уведомлений</div>
        <div class="notif-dropdown-ftr"><a href="${base}pages/notifications.html">Все уведомления</a></div>`;
      return;
    }
    const items = _notifs.slice(0, 8).map(n => {
      const icon = ICONS[n.type] || '🔔';
      const time = n.created_at ? new Date(n.created_at).toLocaleDateString('ru-RU', { day:'2-digit', month:'short' }) : '';
      const href = n.link && n.link !== '#' ? n.link : '#';
      return `<a class="notif-item ${n.is_read?'':'unread'}" href="${href}"
                 onclick="markOne(${n.id})">
        <span class="notif-item-icon">${icon}</span>
        <div class="notif-item-body">
          <div class="notif-item-title">${n.title}</div>
          ${n.body ? `<div class="notif-item-text">${n.body.slice(0,60)}</div>` : ''}
        </div>
        <span class="notif-item-time">${time}</span>
      </a>`;
    }).join('');

    dd.innerHTML = `
      <div class="notif-dropdown-hdr">
        <strong>Уведомления</strong>
        <button class="notif-mark-all" onclick="markAllRead()">Прочитать все</button>
      </div>
      <div class="notif-dropdown-list">${items}</div>
      <div class="notif-dropdown-ftr"><a href="${base}pages/notifications.html">Все уведомления →</a></div>`;
  }

  /* ===== API calls ===== */
  async function loadNotifs() {
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    try {
      const res = await fetch('/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        _notifs = data.notifications || [];
        updateBadge(data.unread_count || 0);
      }
    } catch { /* ignore */ }
  }

  window.markOne = async function(id) {
    const token = localStorage.getItem('mc_token');
    if (!token || !id) return;
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      _notifs = _notifs.map(n => n.id === id ? { ...n, is_read: true } : n);
      const unread = _notifs.filter(n => !n.is_read).length;
      updateBadge(unread);
    } catch { /* ignore */ }
  };

  window.markAllRead = async function() {
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      _notifs = _notifs.map(n => ({ ...n, is_read: true }));
      updateBadge(0);
      renderDropdown();
    } catch { /* ignore */ }
  };

  /* ===== Socket ===== */
  function onNotification(notif) {
    _notifs.unshift(notif);
    updateBadge(_unread + 1);
    _handlers.forEach(h => { try { h(notif); } catch { /* ignore */ } });
    showToast(notif);
    const dd = document.getElementById('notifDropdown');
    if (dd && dd.classList.contains('show')) renderDropdown();
  }

  function connectSocket(token) {
    if (typeof socket !== 'undefined' && socket && socket.connected) {
      socket.on('notification', onNotification);
      return;
    }
    if (typeof io === 'undefined') return;
    _socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    _socket.on('notification', onNotification);
    _socket.on('connect_error', () => {});
  }

  function loadSocketIO(cb) {
    if (typeof io !== 'undefined') { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.socket.io/4.6.1/socket.io.min.js';
    s.onload = cb;
    s.onerror = () => {};
    document.head.appendChild(s);
  }

  /* ===== Init ===== */
  function init() {
    const token = localStorage.getItem('mc_token');
    if (!token) return;
    buildDropdown();
    loadNotifs();
    setTimeout(() => loadSocketIO(() => connectSocket(token)), 350);
  }

  /* ===== Public API ===== */
  window.__notifSocket = {
    on:       (fn) => _handlers.push(fn),
    setBadge: updateBadge,
    getCount: () => _unread,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(init, 80));
  } else {
    setTimeout(init, 80);
  }
})();
