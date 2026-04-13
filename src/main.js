/**
 * src/main.js — DOM wiring, event management, live update loop.
 * Requires a modern browser with ES modules support.
 */

import { getTimeUntil, isSameDay, createEvent, validateEvent } from './countdown.js';
import { t, setLang, getLang, PRESETS } from './i18n.js';

// ── Storage ────────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'countdown_events';

function loadEvents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch {
    // storage unavailable — silently ignore
  }
}

// ── URL Sharing ────────────────────────────────────────────────────────────────

function parseShareParams() {
  const params = new URLSearchParams(location.search);
  const shared = [];
  let i = 0;
  while (params.has(`e${i}_name`)) {
    shared.push({
      id: `shared_${i}`,
      name: params.get(`e${i}_name`) || '',
      date: params.get(`e${i}_date`) || '',
      color: params.get(`e${i}_color`) || '#4f8ef7',
      icon: params.get(`e${i}_icon`) || '🗓️',
      createdAt: new Date().toISOString(),
    });
    i++;
  }
  return shared;
}

function buildShareURL(events) {
  const params = new URLSearchParams();
  events.forEach((ev, i) => {
    params.set(`e${i}_name`,  ev.name);
    params.set(`e${i}_date`,  ev.date);
    params.set(`e${i}_color`, ev.color);
    params.set(`e${i}_icon`,  ev.icon);
  });
  return `${location.origin}${location.pathname}?${params.toString()}`;
}

// ── State ──────────────────────────────────────────────────────────────────────

let events = loadEvents();
let editingId = null;

// Merge shared events from URL once (don't save to storage automatically)
const sharedEvents = parseShareParams();
if (sharedEvents.length && events.length === 0) {
  events = sharedEvents;
  saveEvents(events);
}

// ── DOM helpers ────────────────────────────────────────────────────────────────

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') e.className = v;
    else if (k === 'style') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const c of children) {
    if (c == null) continue;
    e.append(typeof c === 'string' ? c : c);
  }
  return e;
}

// ── Card rendering ─────────────────────────────────────────────────────────────

function formatLiveTime(time, lang) {
  const pad = n => String(n).padStart(2, '0');
  if (lang === 'en') {
    return `${pad(time.hours)}h ${pad(time.minutes)}m ${pad(time.seconds)}s`;
  }
  return `${pad(time.hours)}時間 ${pad(time.minutes)}分 ${pad(time.seconds)}秒`;
}

function renderDaysLabel(time, eventDate, lang) {
  const now = new Date();
  const target = new Date(eventDate);
  if (isSameDay(target, now)) return t('today', lang);
  if (time.isPast) {
    return lang === 'en'
      ? `${time.days} ${t('daysSince', lang)}`
      : `${time.days} ${t('daysSince', lang)}`;
  }
  if (time.days === 0 && !time.isPast) {
    // Less than 24 h but not same day (edge case)
    return lang === 'en' ? t('tomorrow', lang) : t('tomorrow', lang);
  }
  return lang === 'en'
    ? `${time.days} ${t('daysUntil', lang)}`
    : `あと ${time.days} 日`;
}

function buildCard(ev) {
  const lang = getLang();
  const now = new Date();
  const target = new Date(ev.date);
  const time = getTimeUntil(target, now);
  const isToday = isSameDay(target, now);

  const card = el('div', {
    className: `card${time.isPast ? ' card--past' : ''}${isToday ? ' card--today' : ''}`,
    style: { '--card-color': ev.color },
    'data-id': ev.id,
  });

  // Top row: icon + name + actions
  const header = el('div', { className: 'card__header' });
  header.append(
    el('span', { className: 'card__icon' }, ev.icon),
    el('span', { className: 'card__name' }, ev.name),
    el('div', { className: 'card__actions' },
      el('button', {
        className: 'btn-icon',
        title: t('editEvent', lang),
        onClick: () => openModal(ev.id),
      }, '✏️'),
      el('button', {
        className: 'btn-icon',
        title: t('deleteEvent', lang),
        onClick: () => deleteEvent(ev.id),
      }, '🗑️'),
      el('button', {
        className: 'btn-icon',
        title: t('shareLink', lang),
        onClick: (e) => shareEvent(ev, e.currentTarget),
      }, '🔗'),
    ),
  );

  // Days number
  const daysEl = el('div', { className: 'card__days' },
    isToday
      ? el('span', { className: 'card__today-label' }, t('today', lang))
      : el('span', { className: 'card__days-num' }, String(time.days)),
  );

  if (!isToday) {
    daysEl.append(
      el('span', { className: 'card__days-label' },
        time.isPast
          ? (lang === 'en' ? t('daysSince', lang) : `日前`)
          : (lang === 'en' ? t('daysUntil', lang) : `日後`),
      ),
    );
  }

  // Live HMS
  const liveEl = el('div', { className: 'card__live' },
    formatLiveTime(time, lang),
  );

  // Date string
  const dateEl = el('div', { className: 'card__date' },
    target.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    }),
  );

  card.append(header, daysEl, liveEl, dateEl);
  return card;
}

// ── Live update ────────────────────────────────────────────────────────────────

function updateLiveTimes() {
  const lang = getLang();
  const now = new Date();
  $$('[data-id]').forEach(card => {
    const id = card.dataset.id;
    const ev = events.find(e => e.id === id);
    if (!ev) return;

    const target = new Date(ev.date);
    const time = getTimeUntil(target, now);
    const isToday = isSameDay(target, now);

    const liveEl = card.querySelector('.card__live');
    if (liveEl) liveEl.textContent = formatLiveTime(time, lang);

    const daysNum = card.querySelector('.card__days-num');
    if (daysNum) daysNum.textContent = String(time.days);

    // Toggle classes
    card.classList.toggle('card--past', time.isPast && !isToday);
    card.classList.toggle('card--today', isToday);
  });
}

setInterval(updateLiveTimes, 1000);

// ── Render grid ────────────────────────────────────────────────────────────────

function renderGrid() {
  const lang = getLang();
  const grid = $('#grid');
  grid.innerHTML = '';

  if (events.length === 0) {
    grid.append(el('p', { className: 'empty-msg' }, t('noEvents', lang)));
    return;
  }

  const now = new Date();
  const upcoming = events.filter(ev => {
    const t = new Date(ev.date);
    return !getTimeUntil(t, now).isPast || isSameDay(t, now);
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  const past = events.filter(ev => {
    const t = new Date(ev.date);
    return getTimeUntil(t, now).isPast && !isSameDay(t, now);
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  if (upcoming.length) {
    const sec = el('section', { className: 'section' });
    sec.append(el('h2', { className: 'section__title' }, t('upcomingEvents', lang)));
    const g = el('div', { className: 'cards-grid' });
    upcoming.forEach(ev => g.append(buildCard(ev)));
    sec.append(g);
    grid.append(sec);
  }

  if (past.length) {
    const sec = el('section', { className: 'section' });
    sec.append(el('h2', { className: 'section__title' }, t('pastEvents', lang)));
    const g = el('div', { className: 'cards-grid' });
    past.forEach(ev => g.append(buildCard(ev)));
    sec.append(g);
    grid.append(sec);
  }
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function openModal(id = null) {
  editingId = id;
  const lang = getLang();
  const modal = $('#modal');
  const title = $('#modal-title');
  const nameInput = $('#input-name');
  const dateInput = $('#input-date');
  const iconInput = $('#input-icon');
  const colorInput = $('#input-color');

  title.textContent = id ? t('editEvent', lang) : t('addEvent', lang);

  if (id) {
    const ev = events.find(e => e.id === id);
    if (ev) {
      nameInput.value = ev.name;
      dateInput.value = ev.date;
      iconInput.value = ev.icon;
      colorInput.value = ev.color;
    }
  } else {
    nameInput.value = '';
    dateInput.value = '';
    iconInput.value = '🗓️';
    colorInput.value = '#4f8ef7';
  }

  clearErrors();
  modal.classList.add('modal--open');
  nameInput.focus();
}

function closeModal() {
  $('#modal').classList.remove('modal--open');
  editingId = null;
}

function clearErrors() {
  $$('.field-error').forEach(e => (e.textContent = ''));
}

function showError(fieldId, msg) {
  const err = $(`#err-${fieldId}`);
  if (err) err.textContent = msg;
}

function saveModal() {
  const lang = getLang();
  const name  = $('#input-name').value.trim();
  const date  = $('#input-date').value;
  const icon  = $('#input-icon').value.trim() || '🗓️';
  const color = $('#input-color').value || '#4f8ef7';

  clearErrors();
  const validation = validateEvent({ name, date });
  if (!validation.valid) {
    validation.errors.forEach(err => {
      if (err.includes('Name')) showError('name', t(err.includes('100') ? 'nameTooLong' : 'required', lang));
      if (err.includes('Date')) showError('date', t(err.includes('invalid') ? 'invalidDate' : 'required', lang));
    });
    return;
  }

  if (editingId) {
    const idx = events.findIndex(e => e.id === editingId);
    if (idx !== -1) {
      events[idx] = { ...events[idx], name, date, icon, color };
    }
  } else {
    events.push(createEvent(name, date, color, icon));
  }

  saveEvents(events);
  closeModal();
  renderGrid();
}

// ── Delete ─────────────────────────────────────────────────────────────────────

function deleteEvent(id) {
  const lang = getLang();
  if (!window.confirm(t('deleteConfirm', lang))) return;
  events = events.filter(e => e.id !== id);
  saveEvents(events);
  renderGrid();
}

// ── Share ──────────────────────────────────────────────────────────────────────

function shareEvent(ev, btn) {
  const url = buildShareURL([ev]);
  navigator.clipboard.writeText(url).then(() => {
    const lang = getLang();
    const orig = btn.textContent;
    btn.textContent = '✅';
    setTimeout(() => (btn.textContent = orig), 1500);
  });
}

// ── Preset picker ──────────────────────────────────────────────────────────────

function renderPresets() {
  const lang = getLang();
  const container = $('#preset-list');
  if (!container) return;
  container.innerHTML = '';
  PRESETS.forEach(preset => {
    const btn = el('button', {
      className: 'preset-btn',
      onClick: () => applyPreset(preset),
    },
      el('span', { className: 'preset-icon' }, preset.icon),
      el('span', { className: 'preset-name' }, lang === 'ja' ? preset.nameJa : preset.nameEn),
    );
    container.append(btn);
  });
}

function applyPreset(preset) {
  const lang = getLang();
  $('#input-name').value = lang === 'ja' ? preset.nameJa : preset.nameEn;
  $('#input-icon').value = preset.icon;
  $('#input-color').value = preset.color;
  const date = preset.dateFactory();
  if (date) $('#input-date').value = date;
}

// ── Language toggle ────────────────────────────────────────────────────────────

function updateI18n() {
  const lang = getLang();
  document.documentElement.lang = lang;
  $('#btn-lang').textContent = t('langToggle', lang);
  $('#btn-add').textContent = t('addEvent', lang);
  renderPresets();
  renderGrid();
}

// ── Theme ──────────────────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = saved ? saved === 'dark' : prefersDark;
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// ── Boot ───────────────────────────────────────────────────────────────────────

function init() {
  initTheme();

  // Detect language from browser
  const browserLang = navigator.language?.startsWith('ja') ? 'ja' : 'en';
  const savedLang = localStorage.getItem('lang');
  setLang(savedLang || browserLang);

  // Button wiring
  $('#btn-add').addEventListener('click', () => openModal());
  $('#btn-theme').addEventListener('click', toggleTheme);
  $('#btn-lang').addEventListener('click', () => {
    const next = getLang() === 'ja' ? 'en' : 'ja';
    setLang(next);
    localStorage.setItem('lang', next);
    updateI18n();
  });

  // Modal wiring
  $('#btn-save').addEventListener('click', saveModal);
  $('#btn-cancel').addEventListener('click', closeModal);
  $('#modal-backdrop').addEventListener('click', closeModal);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    if (e.key === 'Enter' && $('#modal').classList.contains('modal--open')) {
      saveModal();
    }
  });

  renderPresets();
  updateI18n();
}

document.addEventListener('DOMContentLoaded', init);
