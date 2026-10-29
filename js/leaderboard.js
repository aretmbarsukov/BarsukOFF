import { initializeLeaderboardSync, leaderboardStore } from './leaderboard-store.js';
import { normalizeGameScore } from './score-normalization.js';

const GAME_NAMES = {
  'phone-rescue': 'Phone Rescue',
  'micro-soldering': 'Micro-Soldering Master',
  'os-doctor': 'OS Doctor',
  'repair-rush': 'Repair Rush',
  'circuit-detective': 'Circuit Detective'
};
const GAME_IDS = Object.keys(GAME_NAMES);
const PRIZE_PLACEHOLDERS = ['Premio por configurar', 'Premio por configurar', 'Premio por configurar'];

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
  nicknameStatus: document.getElementById('nicknameStatus'),
  prizeList: document.getElementById('weeklyPrizeList'),
  prizeForm: document.getElementById('weeklyPrizeForm'),
  prizeStatus: document.getElementById('weeklyPrizeStatus')
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
  if (row.game) {
    const game = document.createElement('small');
    game.className = 'score-game';
    game.textContent = GAME_NAMES[row.game] || row.game;
    nickname.append(document.createElement('br'), game);
  }
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
    const selectedGame = ui.games.value;
    const games = selectedGame === 'global' ? GAME_IDS : [selectedGame];
    const results = await Promise.all(games.map(game => leaderboardStore.getTop(game, ui.periods.value, 10)));
    const rows = results.flatMap((result, index) => result.rows.map(row => ({
      ...row,
      game: games[index],
      score: normalizeGameScore(games[index], row.score)
    })));
    rows.sort((a, b) => b.score - a.score || Date.parse(a.achieved_at) - Date.parse(b.achieved_at));
    rows.slice(0, 10).forEach((row, index) => appendScoreRow(ui.rows, { ...row, pos: index + 1 }));
    ui.empty.hidden = rows.length > 0;
    const myRows = selectedGame === 'global'
      ? results.map((result, index) => result.myRow && ({
        ...result.myRow,
        game: games[index],
        score: normalizeGameScore(games[index], result.myRow.score)
      })).filter(Boolean).sort((a, b) => b.score - a.score)
      : [results[0].myRow].filter(Boolean);
    const myRow = myRows[0];
    const alreadyInTop = selectedGame === 'global' && rows.slice(0, 10).some(row => row.is_me);
    if (myRow && !alreadyInTop) {
      const heading = document.createElement('p');
      heading.className = 'my-score-heading';
      heading.textContent = selectedGame === 'global' ? '> TU MEJOR RESULTADO' : '> TU POSICIÓN';
      ui.mine.append(heading);
      appendScoreRow(ui.mine, {
        ...myRow,
        game: selectedGame,
        score: normalizeGameScore(selectedGame, myRow.score)
      }, selectedGame === 'global' ? 'Personal' : String(myRow.pos));
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

function renderWeeklyPrizes(prizes = PRIZE_PLACEHOLDERS) {
  ui.prizeList.replaceChildren();
  prizes.forEach((prize, index) => {
    const item = document.createElement('li');
    const place = document.createElement('span');
    const description = document.createElement('strong');
    item.className = 'weekly-prize';
    place.className = 'weekly-prize-place';
    place.textContent = `${index + 1}.º`;
    description.textContent = prize || PRIZE_PLACEHOLDERS[index];
    item.append(place, description);
    ui.prizeList.append(item);
  });
}

async function loadWeeklyPrizes() {
  const client = window.barsukonSupabaseClient;
  if (!client) {
    renderWeeklyPrizes();
    return;
  }

  const { data, error } = await client
    .from('leaderboard_weekly_prizes')
    .select('place,prize')
    .order('place');
  const prizeByPlace = new Map((data || []).map(item => [Number(item.place), item.prize]));
  renderWeeklyPrizes([1, 2, 3].map(place => prizeByPlace.get(place) || PRIZE_PLACEHOLDERS[place - 1]));

  if (error) {
    ui.prizeStatus.textContent = 'Ejecuta la migración de premios semanales en Supabase para activar esta sección.';
    return;
  }

  const { data: userResult } = await client.auth.getUser();
  if (!userResult.user) return;
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('id', userResult.user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') return;

  ui.prizeForm.hidden = false;
  [1, 2, 3].forEach(place => {
    ui.prizeForm.elements.namedItem(`prize${place}`).value = prizeByPlace.get(place) || '';
  });
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
ui.prizeForm.addEventListener('submit', async event => {
  event.preventDefault();
  const client = window.barsukonSupabaseClient;
  if (!client) return;
  ui.prizeStatus.textContent = 'Guardando premios…';
  const button = ui.prizeForm.querySelector('button[type="submit"]');
  button.disabled = true;
  try {
    const prizes = [1, 2, 3].map(place => ({
      place,
      prize: ui.prizeForm.elements.namedItem(`prize${place}`).value.trim()
    }));
    const { error } = await client.from('leaderboard_weekly_prizes').upsert(prizes, { onConflict: 'place' });
    if (error) throw error;
    renderWeeklyPrizes(prizes.map(item => item.prize));
    ui.prizeStatus.textContent = 'Premios semanales actualizados.';
  } catch (error) {
    ui.prizeStatus.textContent = 'No se pudieron guardar los premios. Comprueba la migración y los permisos de administrador.';
  } finally {
    button.disabled = false;
  }
});

initializeLeaderboardSync();
applyTheme(loadTheme());
loadBoard();
loadWeekEnd();
refreshNickname();
loadWeeklyPrizes();
window.setInterval(loadWeekEnd, 60000);
