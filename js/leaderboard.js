import { initializeLeaderboardSync, leaderboardStore } from './leaderboard-store.js';

const ui = {
  games: document.getElementById('gameSelect'),
  periods: document.getElementById('periodSelect'),
  rows: document.getElementById('scoreRows'),
  empty: document.getElementById('emptyState'),
  mine: document.getElementById('myScoreArea'),
  status: document.getElementById('statusLine'),
  week: document.getElementById('weekCountdown'),
  theme: document.getElementById('themeButton'),
  themeLabel: document.getElementById('themeLabel'),
  nicknameSection: document.getElementById('nicknameSection'),
  nicknameForm: document.getElementById('nicknameForm'),
  nicknameInput: document.getElementById('nicknameInput'),
  nicknameStatus: document.getElementById('nicknameStatus')
};

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.dataset.theme = light ? 'light' : 'dark';
  ui.theme.setAttribute('aria-pressed', String(light));
  ui.theme.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  ui.themeLabel.textContent = light ? 'Tema claro' : 'Tema oscuro';
}

function loadTheme() {
  try {
    const preferences = JSON.parse(localStorage.getItem('barsukon-preferences') || '{}');
    return preferences.theme === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.warn('No se pudo leer el tema guardado de BarsukON.', error);
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    const preferences = JSON.parse(localStorage.getItem('barsukon-preferences') || '{}');
    preferences.theme = theme;
    localStorage.setItem('barsukon-preferences', JSON.stringify(preferences));
  } catch (error) {
    console.warn('No se pudo guardar el tema de BarsukON.', error);
  }
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium' }).format(date);
}

function appendScoreRow(parent, row, positionText = null) {
  const element = document.createElement('div');
  element.className = `score-row${row.is_me ? ' is-me' : ''}`;
  element.setAttribute('role', 'listitem');
  element.setAttribute('aria-label', `${positionText || `Puesto ${row.pos}`}: ${row.nickname}, ${row.score} puntos`);
  const position = document.createElement('span');
  position.className = 'score-position';
  position.textContent = positionText || String(row.pos);
  const nickname = document.createElement('span');
  nickname.className = 'score-nickname';
  nickname.textContent = row.nickname;
  const score = document.createElement('span');
  score.className = 'score-points';
  score.textContent = Number(row.score).toLocaleString('es-ES');
  const date = document.createElement('span');
  date.className = 'score-date';
  date.textContent = formatDate(row.achieved_at);
  element.append(position, nickname, score, date);
  parent.append(element);
}

async function loadBoard() {
  ui.status.textContent = '> Cargando puntuaciones…';
  ui.rows.replaceChildren();
  ui.mine.replaceChildren();
  ui.mine.hidden = true;
  try {
    const { rows, myRow } = await leaderboardStore.getTop(ui.games.value, ui.periods.value, 10);
    rows.forEach(row => appendScoreRow(ui.rows, row));
    ui.empty.hidden = rows.length > 0;
    if (myRow) {
      const heading = document.createElement('p');
      heading.className = 'my-score-heading';
      heading.textContent = '> TU POSICIÓN';
      ui.mine.append(heading);
      appendScoreRow(ui.mine, myRow, String(myRow.pos));
      ui.mine.hidden = false;
    }
    ui.status.textContent = leaderboardStore.adapterName === 'supabase'
      ? '> Clasificación actualizada.'
      : '> Mostrando puntuaciones guardadas en este dispositivo.';
  } catch (error) {
    ui.empty.hidden = true;
    ui.status.textContent = `> ${error instanceof Error ? error.message : 'No se pudo cargar la clasificación.'}`;
  }
}

async function loadWeekEnd() {
  try {
    const value = await leaderboardStore.weekEnd();
    const target = new Date(value).getTime();
    if (!value || !Number.isFinite(target)) {
      ui.week.textContent = '> Cierre semanal: no disponible en modo local.';
      return;
    }
    const remaining = Math.max(0, target - Date.now());
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    ui.week.textContent = `> Cierre semanal en ${days} d ${hours} h ${minutes} min`;
  } catch (error) {
    ui.week.textContent = `> ${error instanceof Error ? error.message : 'Cierre semanal no disponible.'}`;
  }
}

async function refreshNickname() {
  try {
    await leaderboardStore.refreshSession();
    if (!leaderboardStore.isAuthenticated) {
      ui.nicknameSection.hidden = true;
      return;
    }
    const nickname = await leaderboardStore.myNickname();
    ui.nicknameSection.hidden = Boolean(nickname);
    if (!nickname) ui.nicknameInput.focus({ preventScroll: true });
  } catch (error) {
    ui.status.textContent = `> ${error instanceof Error ? error.message : 'No se pudo comprobar el apodo.'}`;
  }
}

ui.games.addEventListener('change', loadBoard);
ui.periods.addEventListener('change', () => {
  loadBoard();
  loadWeekEnd();
});
ui.theme.addEventListener('click', () => {
  const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  saveTheme(next);
});
ui.nicknameForm.addEventListener('submit', async event => {
  event.preventDefault();
  ui.nicknameStatus.textContent = '> Guardando apodo…';
  const button = ui.nicknameForm.querySelector('button');
  button.disabled = true;
  try {
    await leaderboardStore.setNickname(ui.nicknameInput.value);
    ui.nicknameSection.hidden = true;
    ui.nicknameInput.value = '';
    ui.nicknameStatus.textContent = '';
    await loadBoard();
  } catch (error) {
    ui.nicknameStatus.textContent = `> ${error instanceof Error ? error.message : 'No se pudo guardar el apodo.'}`;
  } finally {
    button.disabled = false;
  }
});
window.addEventListener('barsukon:leaderboard-status', event => {
  const { message } = event.detail || {};
  if (typeof message === 'string') ui.status.textContent = message;
});
window.addEventListener('barsukon:leaderboard-nickname-required', () => {
  ui.nicknameSection.hidden = false;
  ui.nicknameInput.focus({ preventScroll: true });
});
window.addEventListener('barsukon:score', () => {
  window.setTimeout(loadBoard, 100);
});

initializeLeaderboardSync();
applyTheme(loadTheme());
loadBoard();
loadWeekEnd();
refreshNickname();
window.setInterval(loadWeekEnd, 60000);
