/* ═══════════════════════════════════════════════════════════════
   EventPulse — app.js
   SPA Navigation · State · API · Charts · CRUD · Validation
═══════════════════════════════════════════════════════════════ */

'use strict';

// ─── Config ─────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:5000/api';

// ─── App State ───────────────────────────────────────────────────────────────
const State = {
  events: [],
  feedback: [],
  stats: null,
  currentSection: 'home',
  eventFilter: 'all',
  eventSearch: '',
  feedbackSearch: '',
  dashSearch: '',
  dashEventFilter: 'all',
  dashEventSearch: '',
  charts: { perEvent: null, ratingDist: null },
  darkMode: true,
  user: JSON.parse(localStorage.getItem('ep-user') || 'null'),
  token: localStorage.getItem('ep-token') || 'null',
  pendingNavigationSection: null,
};

// ─── DOM Helpers ─────────────────────────────────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// ─── Toast System ────────────────────────────────────────────────────────────
const TOAST_ICONS = {
  success: 'fa-solid fa-circle-check',
  error:   'fa-solid fa-circle-xmark',
  info:    'fa-solid fa-circle-info',
  warning: 'fa-solid fa-triangle-exclamation',
};

function showToast(message, type = 'info', duration = 3500) {
  const container = $('#toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="toast-icon"><i class="${TOAST_ICONS[type]}"></i></div>
    <span>${message}</span>
    <button class="toast-close" aria-label="Dismiss"><i class="fa-solid fa-xmark"></i></button>
  `;

  const close = () => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast-close').addEventListener('click', close);
  container.appendChild(toast);
  setTimeout(close, duration);
}

// ─── SPA Navigation ──────────────────────────────────────────────────────────
function navigateTo(sectionId) {
  if (!['home','events','feedback','dashboard'].includes(sectionId)) return;

  // AUTH INTERCEPTION: Require login for protected pages
  if (sectionId !== 'home' && (!State.user || State.user === 'null')) {
    State.pendingNavigationSection = sectionId;
    openAuthModal();
    showToast('🔑 Please sign in or register to access this section.', 'warning');
    return;
  }

  // ROLE INTERCEPTION: Admin role required for the Dashboard
  if (sectionId === 'dashboard' && State.user && State.user.role !== 'admin') {
    showToast('⚠️ Access Denied: Organizers (Admin) only.', 'error');
    return;
  }

  // Hide all sections
  $$('.section').forEach(s => s.classList.remove('active'));
  // Show target
  const target = $(`#${sectionId}`);
  if (target) target.classList.add('active');

  // Update nav links
  $$('.nav-link, .mobile-nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.section === sectionId);
  });

  State.currentSection = sectionId;

  // Close mobile menu
  $('#mobileNav').classList.remove('open');
  $('#hamburger').setAttribute('aria-expanded', 'false');

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Section-specific init
  if (sectionId === 'events')    loadEvents();
  if (sectionId === 'feedback')  { loadFeedbackList(); populateEventDropdown(); }
  if (sectionId === 'dashboard') loadDashboard();
}

function initNavigation() {
  // Desktop nav links
  $$('.nav-link[data-section]').forEach(link => {
    link.addEventListener('click',  () => navigateTo(link.dataset.section));
    link.addEventListener('keydown', e => e.key === 'Enter' && navigateTo(link.dataset.section));
  });

  // Mobile nav links
  $$('.mobile-nav-link[data-section]').forEach(link => {
    link.addEventListener('click', () => navigateTo(link.dataset.section));
  });

  // Logo → home
  $$('#navLogo, #ctaExplore, #ctaDashboard').forEach(el => {
    if (!el) return;
    el.addEventListener('click', () => navigateTo(el.dataset?.section || 'home'));
    el.addEventListener('keydown', e => e.key === 'Enter' && navigateTo(el.dataset?.section || 'home'));
  });

  // Hero CTA buttons
  $('#ctaExplore')?.addEventListener('click',    () => navigateTo('events'));
  $('#ctaDashboard')?.addEventListener('click',  () => navigateTo('dashboard'));
  $('#navLogo')?.addEventListener('click',       () => navigateTo('home'));

  // Hamburger
  const hamburger = $('#hamburger');
  const mobileNav = $('#mobileNav');
  hamburger.addEventListener('click', () => {
    const open = mobileNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', String(open));
  });
}

// ─── Dark Mode ───────────────────────────────────────────────────────────────
function initDarkMode() {
  const saved = localStorage.getItem('ep-theme');
  State.darkMode = saved !== 'light';
  applyTheme();

  $('#darkModeToggle').addEventListener('click', () => {
    State.darkMode = !State.darkMode;
    applyTheme();
    localStorage.setItem('ep-theme', State.darkMode ? 'dark' : 'light');
    // Re-render charts with new theme colours
    if (State.currentSection === 'dashboard') renderCharts();
  });
}

function applyTheme() {
  document.body.classList.toggle('light-mode', !State.darkMode);
  document.documentElement.classList.toggle('dark', State.darkMode);
}

async function apiFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (State.token && State.token !== 'null') {
    headers['Authorization'] = `Bearer ${State.token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `API error ${res.status}`);
  return data;
}

// ─── EVENTS ──────────────────────────────────────────────────────────────────
async function loadEvents() {
  const grid = $('#eventsGrid');
  grid.innerHTML = `<div class="spinner-wrap" style="grid-column:1/-1;"><div class="spinner"></div><p>Loading events…</p></div>`;

  try {
    const res = await apiFetch('/events');
    State.events = res.data || [];
    renderEvents();
    loadHomeStats();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p><p style="font-size:0.8rem;margin-top:4px;">Is the backend running on port 5000?</p></div>`;
    showToast('Could not load events. Check backend.', 'error');
  }
}

function renderEvents() {
  const grid = $('#eventsGrid');
  let filtered = State.events;

  if (State.eventFilter !== 'all') {
    filtered = filtered.filter(e => e.category === State.eventFilter);
  }

  if (State.eventSearch.trim()) {
    const q = State.eventSearch.toLowerCase();
    filtered = filtered.filter(e =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.location.toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-calendar-xmark"></i><p>No events match your search.</p></div>`;
    return;
  }

  const isAdmin = State.user && State.user !== 'null' && State.user.role === 'admin';

  grid.innerHTML = filtered.map((ev, i) => `
    <article class="event-card" style="animation-delay:${i * 0.06}s;">
      <div class="event-img-wrap">
        <img
          class="event-img"
          src="${ev.image}"
          alt="${ev.title}"
          loading="lazy"
          onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60'"
        />
        <span class="event-category ${ev.category}">${ev.category}</span>
      </div>
      <div class="event-body">
        <div class="event-meta">
          <span class="event-meta-item"><i class="fa-solid fa-calendar"></i>${formatDate(ev.date)}</span>
          <span class="event-meta-item"><i class="fa-solid fa-location-dot"></i>${ev.location}</span>
        </div>
        <h3 class="event-title">${ev.title}</h3>
        <p class="event-desc">${ev.description}</p>
      </div>
        <div class="event-footer">
          <button class="btn btn-primary btn-sm" onclick="goFeedback('${ev._id}')" id="fb-btn-${ev._id}">
            <i class="fa-solid fa-star"></i> Give Feedback
          </button>
          ${isAdmin ? `
          <button class="btn btn-secondary btn-sm" onclick="copyFeedbackLink('${ev._id}')" id="copy-link-${ev._id}">
            <i class="fa-solid fa-link"></i> Copy Link
          </button>
          ` : ''}
        </div>
    </article>
  `).join('');
}

function goFeedback(eventId) {
  navigateTo('feedback');
  setTimeout(() => {
    const sel = $('#fbEvent');
    if (sel) sel.value = eventId;
  }, 150);
}

// Search + Filter wiring
function initEventControls() {
  $('#eventSearch').addEventListener('input', e => {
    State.eventSearch = e.target.value;
    renderEvents();
  });

  $$('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      State.eventFilter = btn.dataset.filter;
      renderEvents();
    });
  });
}

// ─── FEEDBACK ────────────────────────────────────────────────────────────────
async function loadFeedbackList() {
  const list = $('#feedbackList');
  list.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div><p>Loading feedback…</p></div>`;

  try {
    const res = await apiFetch('/feedback');
    State.feedback = res.data || [];
    renderFeedbackList();
  } catch (err) {
    list.innerHTML = `<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><p>${err.message}</p></div>`;
  }
}

function renderFeedbackList() {
  const list = $('#feedbackList');
  const q = State.feedbackSearch.toLowerCase();

  let filtered = State.feedback;
  if (q) {
    filtered = filtered.filter(f =>
      f.name.toLowerCase().includes(q) ||
      (f.event?.title || '').toLowerCase().includes(q) ||
      f.message.toLowerCase().includes(q)
    );
  }

  if (!filtered.length) {
    list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-comment-dots"></i><p>No feedback yet. Be the first!</p></div>`;
    return;
  }

  list.innerHTML = filtered.map((fb, i) => `
    <div class="feedback-item" style="animation-delay:${i * 0.05}s;">
      <div class="feedback-item-header">
        <div class="feedback-author">
          <div class="author-avatar">${fb.name.charAt(0).toUpperCase()}</div>
          <div>
            <div class="author-name">${escHtml(fb.name)}</div>
            <div class="author-event">${fb.event?.title || 'Unknown Event'}</div>
          </div>
        </div>
        <div class="feedback-stars">${'★'.repeat(fb.rating)}${'☆'.repeat(5 - fb.rating)}</div>
      </div>
      <p class="feedback-msg">"${escHtml(fb.message)}"</p>
      <p class="feedback-date"><i class="fa-regular fa-clock" style="margin-right:4px;"></i>${formatDateFull(fb.createdAt)}</p>
    </div>
  `).join('');
}

function initFeedbackSearch() {
  $('#feedbackSearch').addEventListener('input', e => {
    State.feedbackSearch = e.target.value;
    renderFeedbackList();
  });
}

async function populateEventDropdown() {
  const sel = $('#fbEvent');
  if (!sel) return;

  // Use cached events or fetch
  if (!State.events.length) {
    try {
      const res = await apiFetch('/events');
      State.events = res.data || [];
    } catch { /* ignore */ }
  }

  const placeholder = sel.querySelector('option[value=""]');
  sel.innerHTML = '';
  if (placeholder) sel.appendChild(placeholder.cloneNode(true));
  else sel.innerHTML = '<option value="">— Choose an event —</option>';

  State.events.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev._id;
    opt.textContent = `${ev.title} (${formatDate(ev.date)})`;
    sel.appendChild(opt);
  });
}

// ─── Feedback Form ───────────────────────────────────────────────────────────
function initFeedbackForm() {
  const form    = $('#feedbackForm');
  const msgEl   = $('#fbMessage');
  const counter = $('#charCount');

  // Char counter
  msgEl?.addEventListener('input', () => {
    counter.textContent = msgEl.value.length;
  });

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateFeedbackForm()) return;

    const btn     = $('#submitFeedbackBtn');
    const btnText = $('#submitBtnText');
    const spinner = $('#submitBtnSpinner');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    const rating = document.querySelector('input[name="rating"]:checked')?.value;

    const payload = {
      name:    $('#fbName').value.trim(),
      email:   $('#fbEmail').value.trim(),
      event:   $('#fbEvent').value,
      rating:  parseInt(rating),
      message: msgEl.value.trim(),
    };

    try {
      await apiFetch('/feedback', { method: 'POST', body: JSON.stringify(payload) });
      showToast('🎉 Feedback submitted successfully!', 'success');
      form.reset();
      counter.textContent = '0';
      // Uncheck stars
      document.querySelectorAll('input[name="rating"]').forEach(r => r.checked = false);
      clearFormErrors();
      loadFeedbackList();
      loadHomeStats();
    } catch (err) {
      showToast(err.message || 'Submission failed', 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });
}

function validateFeedbackForm() {
  let valid = true;
  clearFormErrors();

  const name    = $('#fbName').value.trim();
  const email   = $('#fbEmail').value.trim();
  const event   = $('#fbEvent').value;
  const rating  = document.querySelector('input[name="rating"]:checked');
  const message = $('#fbMessage').value.trim();

  if (!name) {
    showFieldError('fbName', 'fbNameErr'); valid = false;
  }
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    showFieldError('fbEmail', 'fbEmailErr'); valid = false;
  }
  if (!event) {
    showFieldError('fbEvent', 'fbEventErr'); valid = false;
  }
  if (!rating) {
    $('#fbRatingErr').classList.add('visible'); valid = false;
  }
  if (!message || message.length < 10) {
    showFieldError('fbMessage', 'fbMsgErr'); valid = false;
  }

  return valid;
}

function showFieldError(inputId, errId) {
  $(`#${inputId}`)?.classList.add('error');
  $(`#${errId}`)?.classList.add('visible');
}

function clearFormErrors() {
  $$('.form-input, .form-select, .form-textarea').forEach(el => el.classList.remove('error'));
  $$('.form-error').forEach(el => el.classList.remove('visible'));
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
async function loadDashboard() {
  try {
    const [evRes, fbRes, stRes] = await Promise.all([
      apiFetch('/events'),
      apiFetch('/feedback'),
      apiFetch('/feedback/stats'),
    ]);

    State.events   = evRes.data   || [];
    State.feedback = fbRes.data   || [];
    State.stats    = stRes.data   || {};

    updateDashStats();
    renderCharts();
    renderFeedbackTable();
    renderEventsTable();
    populateDashEventFilter();
    loadHomeStats();
  } catch (err) {
    showToast('Dashboard load failed: ' + err.message, 'error');
  }
}

function updateDashStats() {
  const { stats, events } = State;
  $('#dTotalEvents').textContent   = events.length;
  $('#dTotalFeedback').textContent = stats.totalFeedback ?? 0;
  $('#dAvgRating').textContent     = stats.avgRating ? `${stats.avgRating}★` : '—';

  const top = stats.feedbackPerEvent?.[0]?._id;
  $('#dTopEvent').textContent = top ? truncate(top, 12) : '—';
}

function loadHomeStats() {
  $('#statTotalEvents').textContent   = State.events.length  || '—';
  $('#statTotalFeedback').textContent = State.feedback.length || State.stats?.totalFeedback || '—';
  const avg = State.stats?.avgRating;
  $('#statAvgRating').textContent = avg ? `${avg}★` : '—';
}

// ─── Charts ──────────────────────────────────────────────────────────────────
function renderCharts() {
  const isDark  = State.darkMode;
  const textCol = isDark ? '#a0a0c0' : '#4a4a6a';
  const gridCol = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.color       = textCol;

  // ── Feedback Per Event ──
  const fpeCanvas = $('#feedbackPerEventChart');
  if (State.charts.perEvent) State.charts.perEvent.destroy();

  const fpeData = State.stats?.feedbackPerEvent || [];
  State.charts.perEvent = new Chart(fpeCanvas, {
    type: 'bar',
    data: {
      labels:   fpeData.map(d => truncate(d._id, 16)),
      datasets: [{
        label: 'Feedback Count',
        data:  fpeData.map(d => d.count),
        backgroundColor: [
          'rgba(108,99,255,0.7)',
          'rgba(0,212,255,0.7)',
          'rgba(255,107,157,0.7)',
          'rgba(0,229,160,0.7)',
          'rgba(255,183,3,0.7)',
        ],
        borderColor: [
          'rgba(108,99,255,1)',
          'rgba(0,212,255,1)',
          'rgba(255,107,157,1)',
          'rgba(0,229,160,1)',
          'rgba(255,183,3,1)',
        ],
        borderWidth: 1,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? '#1a1a2e' : '#fff',
          borderColor: 'rgba(108,99,255,0.4)',
          borderWidth: 1,
          titleColor: textCol,
          bodyColor: textCol,
        }
      },
      scales: {
        x: { grid: { color: gridCol }, ticks: { color: textCol } },
        y: { grid: { color: gridCol }, ticks: { color: textCol, stepSize: 1 }, beginAtZero: true },
      }
    }
  });

  // ── Rating Distribution ──
  const rdCanvas = $('#ratingDistChart');
  if (State.charts.ratingDist) State.charts.ratingDist.destroy();

  const rdRaw  = State.stats?.ratingDistribution || [];
  const rdLabels = ['1★', '2★', '3★', '4★', '5★'];
  const rdData   = [1,2,3,4,5].map(r => (rdRaw.find(d => d._id === r) || { count: 0 }).count);

  State.charts.ratingDist = new Chart(rdCanvas, {
    type: 'doughnut',
    data: {
      labels: rdLabels,
      datasets: [{
        data: rdData,
        backgroundColor: [
          'rgba(255,71,87,0.75)',
          'rgba(255,183,3,0.75)',
          'rgba(0,212,255,0.75)',
          'rgba(108,99,255,0.75)',
          'rgba(0,229,160,0.75)',
        ],
        borderColor: isDark ? '#0f0f2a' : '#f0f2ff',
        borderWidth: 3,
        hoverOffset: 10,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'right',
          labels: { color: textCol, padding: 16, usePointStyle: true },
        },
        tooltip: {
          backgroundColor: isDark ? '#1a1a2e' : '#fff',
          borderColor: 'rgba(108,99,255,0.4)',
          borderWidth: 1,
          titleColor: textCol,
          bodyColor: textCol,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${ctx.parsed} feedback`,
          }
        }
      }
    }
  });
}

// ─── Feedback Table ───────────────────────────────────────────────────────────
function renderFeedbackTable() {
  const tbody = $('#feedbackTableBody');
  let data = State.feedback;

  // Search filter
  if (State.dashSearch) {
    const q = State.dashSearch.toLowerCase();
    data = data.filter(f =>
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q) ||
      (f.event?.title || '').toLowerCase().includes(q) ||
      f.message.toLowerCase().includes(q)
    );
  }

  // Event filter
  if (State.dashEventFilter !== 'all') {
    data = data.filter(f => f.event?._id === State.dashEventFilter || f.event?.title === State.dashEventFilter);
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="table-empty"><i class="fa-regular fa-comment-dots"></i><p>No feedback found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((fb, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:0.8rem;">${i + 1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div class="author-avatar" style="width:30px;height:30px;font-size:0.75rem;">${fb.name.charAt(0).toUpperCase()}</div>
          <div>
            <div style="font-weight:600;font-size:0.85rem;">${escHtml(fb.name)}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${escHtml(fb.email)}</div>
          </div>
        </div>
      </td>
      <td style="font-size:0.85rem;max-width:140px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${fb.event?.title || '—'}</td>
      <td><span class="rating-stars">${'★'.repeat(fb.rating)}</span></td>
      <td style="font-size:0.82rem;max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(fb.message)}</td>
      <td style="font-size:0.78rem;white-space:nowrap;">${formatDateShort(fb.createdAt)}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-success btn-sm" onclick="openEditModal('${fb._id}')" id="edit-btn-${fb._id}" title="Edit">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="deleteFeedback('${fb._id}')" id="del-btn-${fb._id}" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function populateDashEventFilter() {
  const sel = $('#dashEventFilter');
  sel.innerHTML = '<option value="all">All Events</option>';
  State.events.forEach(ev => {
    const opt = document.createElement('option');
    opt.value = ev._id;
    opt.textContent = ev.title;
    sel.appendChild(opt);
  });
}

function initDashControls() {
  $('#dashSearch').addEventListener('input', e => {
    State.dashSearch = e.target.value;
    renderFeedbackTable();
  });

  $('#dashEventFilter').addEventListener('change', e => {
    State.dashEventFilter = e.target.value;
    renderFeedbackTable();
  });

  $('#refreshDashBtn').addEventListener('click', () => {
    showToast('Refreshing dashboard…', 'info', 1500);
    loadDashboard();
  });

  $('#dashEventSearch')?.addEventListener('input', e => {
    State.dashEventSearch = e.target.value;
    renderEventsTable();
  });
}

// ─── Events Table (Dashboard) ──────────────────────────────────────────────────
function renderEventsTable() {
  const tbody = $('#eventsTableBody');
  if (!tbody) return;
  let data = State.events;

  if (State.dashEventSearch) {
    const q = State.dashEventSearch.toLowerCase();
    data = data.filter(ev =>
      ev.title.toLowerCase().includes(q) ||
      ev.category.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q)
    );
  }

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="table-empty"><i class="fa-regular fa-calendar-xmark"></i><p>No events found</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((ev, i) => `
    <tr>
      <td style="color:var(--text-muted);font-size:0.8rem;">${i + 1}</td>
      <td>
        <div style="display:flex;align-items:center;gap:10px;">
          <img src="${ev.image}"
            alt="${escHtml(ev.title)}"
            style="width:44px;height:34px;object-fit:cover;border-radius:6px;flex-shrink:0;"
            onerror="this.src='https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=80&auto=format&fit=crop&q=60'"
          />
          <span style="font-weight:600;font-size:0.85rem;">${escHtml(ev.title)}</span>
        </div>
      </td>
      <td>
        <span class="event-category ${ev.category}" style="position:static;display:inline-block;font-size:0.72rem;">${ev.category}</span>
      </td>
      <td style="font-size:0.82rem;white-space:nowrap;">${formatDate(ev.date)}</td>
      <td style="font-size:0.82rem;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escHtml(ev.location)}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteEventFromDashboard('${ev._id}')" id="del-ev-${ev._id}" title="Delete Event">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

async function deleteEventFromDashboard(id) {
  if (!confirm('Delete this event? All associated feedback will become orphaned. This cannot be undone.')) return;

  try {
    await apiFetch(`/events/${id}`, { method: 'DELETE' });
    State.events = State.events.filter(ev => ev._id !== id);
    renderEventsTable();
    // Update stat counters immediately
    $('#dTotalEvents').textContent  = State.events.length;
    $('#statTotalEvents').textContent = State.events.length;
    // Refresh the feedback-table event filter dropdown
    populateDashEventFilter();
    showToast('Event deleted successfully.', 'success');
  } catch (err) {
    showToast(err.message || 'Failed to delete event.', 'error');
  }
}

// ─── DELETE Feedback ─────────────────────────────────────────────────────────
async function deleteFeedback(id) {
  if (!confirm('Delete this feedback? This action cannot be undone.')) return;

  try {
    await apiFetch(`/feedback/${id}`, { method: 'DELETE' });
    State.feedback = State.feedback.filter(f => f._id !== id);
    renderFeedbackTable();
    renderFeedbackList();
    showToast('Feedback deleted.', 'success');
    // Reload stats
    const stRes = await apiFetch('/feedback/stats');
    State.stats = stRes.data;
    updateDashStats();
    renderCharts();
    loadHomeStats();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ─── EDIT Feedback ────────────────────────────────────────────────────────────
function openEditModal(id) {
  const fb = State.feedback.find(f => f._id === id);
  if (!fb) return;

  $('#editId').value      = id;
  $('#editName').value    = fb.name;
  $('#editEmail').value   = fb.email;
  $('#editRating').value  = fb.rating;
  $('#editMessage').value = fb.message;

  clearEditErrors();
  $('#editModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  $('#editModal').classList.remove('open');
  document.body.style.overflow = '';
}

function clearEditErrors() {
  $$('#editForm .form-input, #editForm .form-textarea').forEach(el => el.classList.remove('error'));
  $$('#editForm .form-error').forEach(el => el.classList.remove('visible'));
}

function initEditModal() {
  $('#closeModal').addEventListener('click', closeEditModal);
  $('#cancelEdit').addEventListener('click', closeEditModal);

  // Close on backdrop click
  $('#editModal').addEventListener('click', e => {
    if (e.target === $('#editModal')) closeEditModal();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeEditModal();
      closeAddEventModal();
    }
  });

  $('#editForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearEditErrors();

    const name    = $('#editName').value.trim();
    const email   = $('#editEmail').value.trim();
    const rating  = parseInt($('#editRating').value);
    const message = $('#editMessage').value.trim();

    let valid = true;
    if (!name)   { showFieldError('editName', 'editNameErr');  valid = false; }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) { showFieldError('editEmail', 'editEmailErr'); valid = false; }
    if (!message || message.length < 10) { showFieldError('editMessage', 'editMsgErr'); valid = false; }

    if (!valid) return;

    const id      = $('#editId').value;
    const saveBtn = $('#saveEditBtn');
    const saveText   = $('#saveEditText');
    const saveSpinner = $('#saveEditSpinner');

    saveBtn.disabled = true;
    saveText.style.display = 'none';
    saveSpinner.style.display = 'inline-block';

    try {
      const res = await apiFetch(`/feedback/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, email, rating, message }),
      });

      // Update local state
      const idx = State.feedback.findIndex(f => f._id === id);
      if (idx !== -1) State.feedback[idx] = res.data;

      renderFeedbackTable();
      renderFeedbackList();
      closeEditModal();
      showToast('Feedback updated successfully!', 'success');

      // Refresh stats
      const stRes = await apiFetch('/feedback/stats');
      State.stats = stRes.data;
      updateDashStats();
      renderCharts();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
      saveText.style.display = '';
      saveSpinner.style.display = 'none';
    }
  });
}

// ─── Seed Events ─────────────────────────────────────────────────────────────
async function seedEventsIfEmpty() {
  try {
    await apiFetch('/events/seed', { method: 'POST' });
  } catch { /* already seeded or backend unavailable */ }
}

// ─── Utilities ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateFull(dateStr) {
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDateShort(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str || ''));
  return div.innerHTML;
}

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

// ─── AUTHENTICATION (LOGIN, SIGNUP, GOOGLE) ──────────────────────────────────
function openAuthModal() {
  clearAuthErrors();
  $('#authModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAuthModal() {
  $('#authModal').classList.remove('open');
  document.body.style.overflow = '';
  State.pendingNavigationSection = null;
}

function clearAuthErrors() {
  $$('#authModal .form-input').forEach(el => el.classList.remove('error'));
  $$('#authModal .form-error').forEach(el => el.classList.remove('visible'));
}

function updateAuthUI() {
  const userProfile = $('#userProfile');
  const loginBtn = $('#loginBtn');
  const navDash = $('#navDashboard');
  const mobDash = $$('#mobileNav .mobile-nav-link').find(l => l.dataset.section === 'dashboard');
  const navFeedback = $('#navFeedback');
  const mobFeedback = $$('#mobileNav .mobile-nav-link').find(l => l.dataset.section === 'feedback');
  const ctaDashboard = $('#ctaDashboard');

  if (State.user && State.user !== 'null') {
    // Logged in
    if (loginBtn) loginBtn.style.display = 'none';
    if (userProfile) {
      userProfile.style.display = 'inline-flex';
      $('#userNameText').textContent = State.user.name;
      $('#userAvatarText').textContent = State.user.name.charAt(0).toUpperCase();
    }

    // Prefill feedback form with user name and email (and make read-only)
    const fbName = $('#fbName');
    const fbEmail = $('#fbEmail');
    if (fbName) {
      fbName.value = State.user.name;
      fbName.readOnly = true;
      fbName.style.opacity = '0.7';
    }
    if (fbEmail) {
      fbEmail.value = State.user.email;
      fbEmail.readOnly = true;
      fbEmail.style.opacity = '0.7';
    }

    // Limit dashboard visibility based on role
    if (State.user.role === 'admin') {
      // Show Dashboard tab for admins
      if (navDash) navDash.style.display = '';
      if (mobDash) mobDash.style.display = '';
      // Hide attendee Feedback tab (admins manage via Dashboard table instead)
      if (navFeedback) navFeedback.style.display = 'none';
      if (mobFeedback) mobFeedback.style.display = 'none';
      if (ctaDashboard) ctaDashboard.style.display = '';
    } else {
      // Regular users: hide Dashboard, show Feedback
      if (navDash) navDash.style.display = 'none';
      if (mobDash) mobDash.style.display = 'none';
      if (navFeedback) navFeedback.style.display = '';
      if (mobFeedback) mobFeedback.style.display = '';
      if (ctaDashboard) ctaDashboard.style.display = 'none';
      // If we are currently inside the dashboard page as a regular user, boot them to home
      if (State.currentSection === 'dashboard') {
        navigateTo('home');
      }
    }
  } else {
    // Logged out
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (userProfile) userProfile.style.display = 'none';

    // Reset feedback fields
    const fbName = $('#fbName');
    const fbEmail = $('#fbEmail');
    if (fbName) {
      fbName.value = '';
      fbName.readOnly = false;
      fbName.style.opacity = '';
    }
    if (fbEmail) {
      fbEmail.value = '';
      fbEmail.readOnly = false;
      fbEmail.style.opacity = '';
    }

    // Show both nav links so users can click to trigger auth modal
    if (navDash) navDash.style.display = '';
    if (mobDash) mobDash.style.display = '';
    if (navFeedback) navFeedback.style.display = '';
    if (mobFeedback) mobFeedback.style.display = '';
    if (ctaDashboard) ctaDashboard.style.display = '';
  }
}

function resolveAndNavigate(user, target) {
  let finalTarget = target;
  if (user && user.role === 'admin') {
    if (!finalTarget || finalTarget === 'feedback') {
      finalTarget = 'dashboard';
    }
  } else {
    if (!finalTarget || finalTarget === 'dashboard') {
      finalTarget = 'events';
    }
  }
  navigateTo(finalTarget);
}

function initAuth() {
  // Tabs switching
  $('#tabLoginBtn').addEventListener('click', () => {
    $('#tabLoginBtn').classList.add('active');
    $('#tabSignupBtn').classList.remove('active');
    $('#loginForm').style.display = 'block';
    $('#signupForm').style.display = 'none';
    clearAuthErrors();
  });

  $('#tabSignupBtn').addEventListener('click', () => {
    $('#tabSignupBtn').classList.add('active');
    $('#tabLoginBtn').classList.remove('active');
    $('#signupForm').style.display = 'block';
    $('#loginForm').style.display = 'none';
    clearAuthErrors();
  });

  // Open / Close modal
  $('#loginBtn')?.addEventListener('click', openAuthModal);
  $('#closeAuthModal').addEventListener('click', closeAuthModal);
  $('#authModal').addEventListener('click', e => {
    if (e.target === $('#authModal')) closeAuthModal();
  });

  // Logout
  $('#logoutBtn')?.addEventListener('click', () => {
    State.user = null;
    State.token = null;
    localStorage.removeItem('ep-user');
    localStorage.removeItem('ep-token');
    showToast('🚪 Logged out successfully.', 'info');
    updateAuthUI();
    navigateTo('home');
  });

  // Login Submit
  $('#loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearAuthErrors();

    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;

    let valid = true;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showFieldError('loginEmail', 'loginEmailErr');
      valid = false;
    }
    if (!password) {
      showFieldError('loginPassword', 'loginPasswordErr');
      valid = false;
    }

    if (!valid) return;

    const btnText = $('#loginBtnText');
    const spinner = $('#loginSpinner');
    const btn = $('#submitLoginBtn');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      State.user = res.data;
      State.token = res.data.token;
      localStorage.setItem('ep-user', JSON.stringify(res.data));
      localStorage.setItem('ep-token', res.data.token);

      showToast(`👋 Welcome back, ${res.data.name}!`, 'success');
      
      const target = State.pendingNavigationSection;
      closeAuthModal();
      updateAuthUI();

      if (sessionStorage.getItem('feedbackFor')) {
        processPendingFeedback();
      } else {
        resolveAndNavigate(res.data, target);
      }
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });

  // Signup Submit
  $('#signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearAuthErrors();

    const name = $('#signupName').value.trim();
    const email = $('#signupEmail').value.trim();
    const password = $('#signupPassword').value;
    const role = $('#signupRole').value;

    let valid = true;
    if (!name) {
      showFieldError('signupName', 'signupNameErr');
      valid = false;
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      showFieldError('signupEmail', 'signupEmailErr');
      valid = false;
    }
    if (!password || password.length < 6) {
      showFieldError('signupPassword', 'signupPasswordErr');
      valid = false;
    }

    if (!valid) return;

    const btnText = $('#signupBtnText');
    const spinner = $('#signupSpinner');
    const btn = $('#submitSignupBtn');

    btn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';

    try {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role }),
      });

      State.user = res.data;
      State.token = res.data.token;
      localStorage.setItem('ep-user', JSON.stringify(res.data));
      localStorage.setItem('ep-token', res.data.token);

      showToast(`🎉 Account created successfully! Welcome, ${res.data.name}.`, 'success');
      
      const target = State.pendingNavigationSection;
      closeAuthModal();
      updateAuthUI();

      if (sessionStorage.getItem('feedbackFor')) {
        processPendingFeedback();
      } else {
        resolveAndNavigate(res.data, target);
      }
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      btn.disabled = false;
      btnText.style.display = '';
      spinner.style.display = 'none';
    }
  });
}

// ─── Utility: Copy Feedback Link ────────────────────────────────────────
function copyFeedbackLink(eventId) {
  const url = `${window.location.origin}${window.location.pathname}?feedbackFor=${eventId}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Link copied to clipboard!', 'success');
  }).catch(() => {
    showToast('Failed to copy link.', 'error');
  });
}

// ─── Open Add Event Modal ───────────────────────────────────────────────
function openAddEventModal() {
  const modal = $('#addEventModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeAddEventModal() {
  const modal = $('#addEventModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ─── Add Event Form Submit Handler ─────────────────────────────────────
async function handleAddEventSubmit(e) {
  e.preventDefault();
  const title = $('#newEventTitle').value.trim();
  const desc = $('#newEventDesc').value.trim();
  const date = $('#newEventDate').value;
  const location = $('#newEventLocation').value.trim();
  const category = $('#newEventCategory').value;
  const image = $('#newEventImage').value.trim();

  if (!title || !desc || !date || !location) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const btn = $('#saveAddEventBtn');
  const btnText = $('#addEventBtnText');
  const spinner = $('#addEventSpinner');

  btn.disabled = true;
  if (btnText) btnText.style.display = 'none';
  if (spinner) spinner.style.display = 'inline-block';

  const payload = { title, description: desc, date, location, category, image: image || undefined };

  try {
    await apiFetch('/events', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Event created successfully!', 'success');
    $('#addEventForm').reset();
    closeAddEventModal();
    await loadEvents();
    if (State.currentSection === 'dashboard') {
      await loadDashboard();
    }
  } catch (err) {
    showToast(err.message || 'Failed to create event.', 'error');
  } finally {
    btn.disabled = false;
    if (btnText) btnText.style.display = '';
    if (spinner) spinner.style.display = 'none';
  }
}

// ─── Init Add Event Modal ───────────────────────────────────────────────
function initAddEventModal() {
  $('#openAddEventBtn')?.addEventListener('click', openAddEventModal);
  $('#closeAddEventModal')?.addEventListener('click', closeAddEventModal);
  $('#cancelAddEvent')?.addEventListener('click', closeAddEventModal);

  // Close on backdrop click
  $('#addEventModal')?.addEventListener('click', e => {
    if (e.target === $('#addEventModal')) closeAddEventModal();
  });

  // Form submit
  $('#addEventForm')?.addEventListener('submit', handleAddEventSubmit);
}

// ─── URL Parameter Handling ─────────────────────────────────────────────
function handleFeedbackParam() {
  const params = new URLSearchParams(window.location.search);
  const feedbackFor = params.get('feedbackFor');
  if (feedbackFor) {
    sessionStorage.setItem('feedbackFor', feedbackFor);
  }
}
function processPendingFeedback() {
  const feedbackFor = sessionStorage.getItem('feedbackFor');
  if (feedbackFor && State.user) {
    navigateTo('feedback');
    const sel = $('#fbEvent');
    if (sel) sel.value = feedbackFor;
    sessionStorage.removeItem('feedbackFor');
  }
}

// ─── Page Loader ─────────────────────────────────────────────────────────────
function hideLoader() {
  const loader = $('#pageLoader');
  if (loader) {
    loader.classList.add('hidden');
    setTimeout(() => loader.remove(), 500);
  }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  initDarkMode();
  initNavigation();
  initEventControls();
  initFeedbackForm();
  initFeedbackSearch();
  initDashControls();
  initEditModal();
  initAddEventModal();
  initAuth();
  
  // Handle feedback URL parameter
  handleFeedbackParam();
  
  updateAuthUI();

  // Seed & load initial data
  await seedEventsIfEmpty();
  await loadEvents();

  // If user is not logged in but there is a pending feedback parameter, trigger login
  if (sessionStorage.getItem('feedbackFor') && (!State.user || State.user === 'null')) {
    openAuthModal();
    showToast('🔑 Please sign in or register to give feedback for this event.', 'warning');
  } else if (sessionStorage.getItem('feedbackFor')) {
    processPendingFeedback();
  }

  // Hide loader
  setTimeout(hideLoader, 1200);

  // Auto-redirect logged-in users to their respective landing pages immediately on load
  if (State.user && State.user !== 'null') {
    navigateTo(State.user.role === 'admin' ? 'dashboard' : 'events');
  }
}

// Google Identity Services (Real OAuth Callback) - Defined at top-level to prevent race conditions with async Google GSI script
window.handleGoogleCredentialResponse = async (response) => {
  try {
    const res = await apiFetch('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token: response.credential }),
    });

    State.user = res.data;
    State.token = res.data.token;
    localStorage.setItem('ep-user', JSON.stringify(res.data));
    localStorage.setItem('ep-token', res.data.token);

    showToast(`🌐 Signed in via Google as ${res.data.name}!`, 'success');
    
    const target = State.pendingNavigationSection;
    closeAuthModal();
    updateAuthUI();

    if (sessionStorage.getItem('feedbackFor')) {
      processPendingFeedback();
    } else {
      resolveAndNavigate(res.data, target);
    }
  } catch (err) {
    showToast(err.message || 'Google Auth failed', 'error');
  }
};

// Expose globals for inline onclick handlers
window.openEditModal            = openEditModal;
window.deleteFeedback           = deleteFeedback;
window.goFeedback               = goFeedback;
window.copyFeedbackLink         = copyFeedbackLink;
window.deleteEventFromDashboard = deleteEventFromDashboard;

// Boot
document.addEventListener('DOMContentLoaded', init);
