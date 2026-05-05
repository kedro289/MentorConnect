/*
 * Файл: frontend/js/rating-widget.js
 * Отвечает за: виджет объективного рейтинга на странице ментора.
 * Используется в: frontend/pages/mentor-profile.html
 */

async function loadRatingWidget(mentorId) {
  try {
    const [data, histData] = await Promise.all([
      apiRequest('GET', `/mentors/${mentorId}/rating`),
      apiRequest('GET', `/mentors/${mentorId}/rating/history`).catch(() => ({ history: [] })),
    ]);
    renderRatingWidget(data, histData.history || []);
  } catch {
    // виджет дополнительный — молча игнорируем ошибку
  }
}

function renderRatingWidget(d, history) {
  const container = document.getElementById('ratingWidget');
  if (!container) return;

  const metrics = [
    {
      icon: '⭐', name: 'Оценки студентов', value: +d.rating_reviews, weight: '40%',
      hint: `Байесовское среднее из ${d.total_reviews || 0} отзывов`,
    },
    {
      icon: '✅', name: 'Активность', value: +d.rating_activity, weight: '25%',
      hint: `Принял ${d.accepted_applications || 0} из ${d.total_applications || 0} заявок`,
    },
    {
      icon: '💬', name: 'Опыт работы', value: +d.rating_sessions, weight: '20%',
      hint: `${d.total_chats || 0} завершённых сессий (макс при 10+)`,
    },
    {
      icon: '⚡', name: 'Время ответа', value: +d.rating_response, weight: '15%',
      hint: `Среднее время ответа: ${Math.round(+d.avg_response_hours || 0)} ч.`,
    },
  ];

  container.innerHTML = `
    <div class="rating-widget">
      <div class="rw-header">
        <div class="rw-total-score">${(+d.rating_score).toFixed(2)}</div>
        <div class="rw-header-info">
          <div class="stars">${typeof starsHtml === 'function' ? starsHtml(+d.rating_score) : ''}</div>
          <div class="rw-label">Объективный рейтинг</div>
        </div>
      </div>
      <div class="rw-metrics">
        ${metrics.map(m => `
          <div class="rw-metric" title="${m.hint}">
            <div class="rw-metric-header">
              <span class="rw-metric-name">${m.icon} ${m.name}</span>
              <span class="rw-metric-right">
                <span class="rw-value">${m.value.toFixed(1)}/5</span>
                <span class="rw-weight">${m.weight}</span>
              </span>
            </div>
            <div class="rw-bar-bg">
              <div class="rw-bar-fill ${rwBarColor(m.value)}"
                   data-pct="${(m.value / 5 * 100).toFixed(1)}"
                   style="width:0%"></div>
            </div>
            <div class="rw-hint">${m.hint}</div>
          </div>`).join('')}
      </div>
      ${history.length >= 2 ? `
      <div class="rw-history">
        <div class="rw-history-title">История рейтинга (30 дней)</div>
        <canvas id="ratingHistoryChart" height="90"></canvas>
      </div>` : ''}
      <div class="rw-info">ℹ️ Рейтинг рассчитывается автоматически на основе 4 метрик. Обновляется при каждом новом отзыве, заявке или сессии.</div>
    </div>`;

  if (history.length >= 2) {
    const labels = history.map(h => {
      const d = new Date(h.recorded_at);
      return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    });
    const scores = history.map(h => parseFloat(h.rating_score));
    const canvas = container.querySelector('#ratingHistoryChart');
    if (canvas && typeof Chart !== 'undefined') {
      new Chart(canvas, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Рейтинг',
            data: scores,
            borderColor: '#f97316',
            backgroundColor: 'rgba(249,115,22,0.08)',
            borderWidth: 2,
            pointRadius: 3,
            fill: true,
            tension: 0.3,
          }],
        },
        options: {
          responsive: true,
          scales: {
            y: { min: 0, max: 5, ticks: { stepSize: 1 } },
            x: { ticks: { maxTicksLimit: 6 } },
          },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: ctx => {
                  const h = history[ctx.dataIndex];
                  return h.reason ? `Причина: ${h.reason}` : '';
                },
              },
            },
          },
        },
      });
    }
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.width = e.target.dataset.pct + '%';
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  container.querySelectorAll('.rw-bar-fill').forEach(b => observer.observe(b));
}

function rwBarColor(val) {
  if (val >= 4) return 'rw-bar-green';
  if (val >= 2) return 'rw-bar-yellow';
  return 'rw-bar-red';
}
