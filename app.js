'use strict';

const STORAGE_KEY = 'dubistgutgenug_routines';

// ── Hilfsfunktionen ──────────────────────────────────────────────

function loadRoutines() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRoutines(routines) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(routines));
}

function formatFreq(freq) {
  return freq === 'weekly' ? 'Wöchentlich' : 'Täglich';
}

function formatDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-');
  return `bis ${d}.${m}.${y}`;
}

// ── Rendering ────────────────────────────────────────────────────

function renderRoutines() {
  const routines = loadRoutines();
  const list = document.getElementById('routine-list');
  const count = document.getElementById('routine-count');

  count.textContent = routines.length;

  if (routines.length === 0) {
    list.innerHTML = '<p class="empty-state">Du hast noch keine Routinen. Leg eine an!</p>';
    return;
  }

  list.innerHTML = routines.map((r) => `
    <div class="routine-item${r.done ? ' done' : ''}" data-id="${r.id}">
      <button class="routine-check" aria-label="Abhaken" data-id="${r.id}"></button>
      <div class="routine-body">
        <div class="routine-name">${escHtml(r.name)}</div>
        ${r.desc ? `<div class="routine-desc">${escHtml(r.desc)}</div>` : ''}
        <div class="routine-meta">
          <span class="tag">${formatFreq(r.freq)}</span>
          ${r.end ? `<span class="tag">${formatDate(r.end)}</span>` : '<span class="tag">Offen</span>'}
          <span class="tag">Aktiv</span>
        </div>
      </div>
      <button class="routine-delete" aria-label="Löschen" data-id="${r.id}">✕</button>
    </div>
  `).join('');
}

function escHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Formular ─────────────────────────────────────────────────────

function validateForm() {
  const nameField = document.getElementById('routine-name');
  const nameGroup = nameField.closest('.field');
  const name = nameField.value.trim();

  if (!name) {
    nameGroup.classList.add('invalid');
    nameField.focus();
    return false;
  }
  nameGroup.classList.remove('invalid');
  return true;
}

document.getElementById('routine-name').addEventListener('input', function () {
  this.closest('.field').classList.remove('invalid');
});

document.getElementById('routine-form').addEventListener('submit', function (e) {
  e.preventDefault();

  if (!validateForm()) return;

  const name = document.getElementById('routine-name').value.trim();
  const desc = document.getElementById('routine-desc').value.trim();
  const freq = document.getElementById('routine-freq').value;
  const end  = document.getElementById('routine-end').value;

  const routine = {
    id:      crypto.randomUUID(),
    name,
    desc,
    freq,
    end:     end || null,
    done:    false,
    created: new Date().toISOString(),
  };

  const routines = loadRoutines();
  routines.unshift(routine);
  saveRoutines(routines);
  renderRoutines();

  // Formular zurücksetzen
  this.reset();
});

// ── Abhaken & Löschen ────────────────────────────────────────────

let pendingDeleteId = null;

document.getElementById('routine-list').addEventListener('click', function (e) {
  // Abhaken
  const checkBtn = e.target.closest('.routine-check');
  if (checkBtn) {
    const id = checkBtn.dataset.id;
    const routines = loadRoutines();
    const r = routines.find(x => x.id === id);
    if (r) { r.done = !r.done; saveRoutines(routines); renderRoutines(); }
    return;
  }

  // Löschen
  const delBtn = e.target.closest('.routine-delete');
  if (delBtn) {
    pendingDeleteId = delBtn.dataset.id;
    document.getElementById('confirm-modal').hidden = false;
  }
});

document.getElementById('confirm-delete').addEventListener('click', function () {
  if (!pendingDeleteId) return;
  const routines = loadRoutines().filter(r => r.id !== pendingDeleteId);
  saveRoutines(routines);
  pendingDeleteId = null;
  document.getElementById('confirm-modal').hidden = true;
  renderRoutines();
});

document.getElementById('cancel-delete').addEventListener('click', function () {
  pendingDeleteId = null;
  document.getElementById('confirm-modal').hidden = true;
});

// Modal bei Klick auf Hintergrund schließen
document.getElementById('confirm-modal').addEventListener('click', function (e) {
  if (e.target === this) {
    pendingDeleteId = null;
    this.hidden = true;
  }
});

// ── Init ─────────────────────────────────────────────────────────
renderRoutines();
