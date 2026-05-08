/* animations.js — анимационная система MentorConnect */

/* ===== 014: useScrollReveal — IntersectionObserver ===== */
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ===== 015: RevealOnScroll — применить классы stagger ===== */
function applyStagger(selector, baseDelay = 0, step = 100) {
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${baseDelay + i * step}ms`;
  });
}

/* ===== 016: Page Transitions ===== */
const PageTransition = {
  init() {
    document.body.classList.add('page-fade-enter');
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript') ||
          href.startsWith('http') || link.target === '_blank') return;
      e.preventDefault();
      document.body.style.animation = 'pageFadeOut 250ms ease forwards';
      setTimeout(() => { window.location.href = href; }, 260);
    });
  }
};

/* ===== 017: useCountUp ===== */
function countUp(el, target, duration = 2000, formatter = null) {
  const start = performance.now();
  const startVal = 0;

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startVal + (target - startVal) * eased);
    el.textContent = formatter ? formatter(current) : current;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

function initCountUps() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const duration = parseInt(el.dataset.duration || '2000', 10);
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      countUp(el, target, duration, v => `${prefix}${v.toLocaleString('ru-RU')}${suffix}`);
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-countup]').forEach(el => observer.observe(el));
}

/* ===== 018: Custom Cursor ===== */
function initCustomCursor() {
  if (window.matchMedia('(pointer: fine)').matches === false) return;

  let cursor = document.querySelector('.custom-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    document.body.appendChild(cursor);
  }

  let mouseX = 0, mouseY = 0;
  let curX = 0, curY = 0;

  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function lerp(a, b, t) { return a + (b - a) * t; }

  function animateCursor() {
    curX = lerp(curX, mouseX, 0.18);
    curY = lerp(curY, mouseY, 0.18);
    cursor.style.left = curX + 'px';
    cursor.style.top  = curY + 'px';
    requestAnimationFrame(animateCursor);
  }
  animateCursor();

  document.addEventListener('mouseover', e => {
    const interactive = e.target.closest('a, button, [role="button"], input, textarea, select, label, .mentor-card, .feature-card, .filter-chip');
    cursor.classList.toggle('hovering', !!interactive);
  });
}

/* ===== INIT ALL ===== */
document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initCountUps();
  initCustomCursor();
  PageTransition.init();
});

window.applyStagger = applyStagger;
window.countUp = countUp;
window.initScrollReveal = initScrollReveal;
