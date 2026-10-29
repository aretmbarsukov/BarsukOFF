const CONFIG = { adapter: 'supabase', limit: 10 };
const PENDING_KEY = 'barsukon-leaderboard-pending';
const LOCAL_SCORE_KEY = 'barsukon-score-submissions';
const LOCAL_NICKNAME_KEY = 'barsukon-leaderboard-nickname';
const GAME_IDS = new Set(['phone-rescue', 'micro-soldering', 'os-doctor', 'repair-rush', 'circuit-detective']);
const ERROR_MESSAGES = {
  nickname_taken: 'Ese apodo ya está en uso. Elige otro.',
  invalid_nickname: 'El apodo debe tener entre 3 y 12 letras, números, guiones o guiones bajos.',
  not_authenticated: 'Inicia sesión para continuar.',
  no_nickname: 'Elige un apodo para guardar tus puntuaciones.',
  too_fast: 'Vas demasiado rápido. Espera un momento antes de enviar otra puntuación.',
  invalid_score: 'La puntuación no es válida.',
  unknown_game: 'Ese juego no está disponible en la clasificación.'
};

let activeAdapter = CONFIG.adapter === 'supabase' && window.barsukonSupabaseClient ? 'supabase' : 'local';
let currentUser = null;
let currentNickname = null;
let initialized = false;
let authSubscription = null;
let processingPending = false;
let pendingSyncRequested = false;
const seenEvents = new Set();

function ensureSyncStyles() {
  if (document.getElementById('leaderboardSyncStyles')) return;
  const style = document.createElement('style');
  style.id = 'leaderboardSyncStyles';
  style.textContent = `
    .leaderboard-toast{position:fixed;z-index:9999;right:16px;bottom:max(16px,env(safe-area-inset-bottom));max-width:calc(100vw - 32px);display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid rgba(125,211,252,.38);border-radius:12px;background:#11141cf2;color:#f4f5f7;box-shadow:0 16px 42px #0005;font:10px ui-monospace,monospace}
    .leaderboard-toast-action{flex:0 0 auto;color:#7dd3fc;font-weight:900;text-decoration:underline}
    .leaderboard-prompt{position:fixed;z-index:9998;right:16px;bottom:max(76px,calc(env(safe-area-inset-bottom) + 72px));width:min(440px,calc(100vw - 32px));display:grid;grid-template-columns:1fr auto;gap:8px;padding:14px;border:1px solid #7dd3fc;border-radius:14px;background:#11141cf5;color:#f4f5f7;box-shadow:0 16px 42px #0005;font:12px system-ui,sans-serif}
    .leaderboard-prompt label{grid-column:1/-1;color:#7dd3fc;font:10px ui-monospace,monospace}
    .leaderboard-prompt input{min-width:0;min-height:40px;padding:0 10px;border:1px solid #526078;border-radius:9px;background:#131e2b;color:#f4f5f7}
    .leaderboard-prompt button{min-height:40px;padding:0 12px;border:1px solid #7dd3fc;border-radius:9px;background:#7dd3fc;color:#090a0c;font-weight:900}
    .leaderboard-prompt-error{grid-column:1/-1;margin:0;color:#ff9a9a;font-size:10px}
    body[data-theme="light"] .leaderboard-toast,body[data-theme="light"] .leaderboard-prompt{background:#fffffff2;color:#172033}
    body[data-theme="light"] .leaderboard-prompt input{background:#fff;color:#172033}
  `;
  document.head.append(style);
}

function emitStatus(message, kind = 'info') {
  window.dispatchEvent(new CustomEvent('barsukon:leaderboard-status', { detail: { message, kind } }));
}

function setLocalFallback(reason) {
  if (activeAdapter === 'local') return;
  activeAdapter = 'local';
  emitStatus(`> Supabase no disponible; clasificación local activada. ${reason || ''}`.trim(), 'warning');
}

function mappedError(error) {
  const haystack = [error?.message, error?.details, error?.hint, error?.code].filter(Boolean).join(' ').toLowerCase();
  for (const [code, message] of Object.entries(ERROR_MESSAGES)) {
    if (haystack.includes(code)) return message;
  }
  return 'No se pudo completar la operación. Inténtalo de nuevo más tarde.';
}

function isUnavailable(error) {
  return error instanceof TypeError
    || error?.status === 0
    || /failed to fetch|network|fetch failed|load failed/i.test(String(error?.message || ''));
}

function readJson(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed ?? fallback;
  } catch (error) {
    console.warn('No se pudo leer el almacenamiento local de la clasificación.', error);
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar el almacenamiento local de la clasificación.', error);
    return false;
  }
}

function readPending() {
  const stored = readJson(PENDING_KEY, {});
  return stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {};
}

function rememberPending(entry) {
  const pending = readPending();
  const previous = pending[entry.gameId];
  if (!previous || entry.score > previous.score) {
    pending[entry.gameId] = {
      gameId: entry.gameId,
      score: Math.round(entry.score),
      meta: entry.meta && typeof entry.meta === 'object' ? entry.meta : {},
      submittedAt: entry.submittedAt || new Date().toISOString()
    };
    writeJson(PENDING_KEY, pending);
  }
  return pending[entry.gameId];
}

function localScores(period) {
  const history = readJson(LOCAL_SCORE_KEY, []);
  const rows = Array.isArray(history) ? history : [];
  const pending = Object.values(readPending());
  const entries = [...rows, ...pending].filter(entry =>
    entry && typeof entry.gameId === 'string' && Number.isFinite(Number(entry.score))
  );
  const currentNicknameValue = (() => {
    try {
      return localStorage.getItem(LOCAL_NICKNAME_KEY) || 'Invitado';
    } catch (error) {
      console.warn('No se pudo leer el apodo local.', error);
      return 'Invitado';
    }
  })();
  const bestByGame = new Map();
  for (const entry of entries) {
    const timestamp = Date.parse(entry.submittedAt || '');
    if (period === 'week' && entry.submittedAt && Number.isFinite(timestamp) && timestamp < Date.now() - 7 * 86400000) continue;
    const old = bestByGame.get(entry.gameId);
    if (!old || Number(entry.score) > old.score) {
      bestByGame.set(entry.gameId, {
        game: entry.gameId,
        nickname: currentNicknameValue,
        score: Math.round(Number(entry.score)),
        achieved_at: entry.submittedAt || new Date().toISOString(),
        is_me: true
      });
    }
  }
  return bestByGame;
}

const localAdapter = {
  async getTop(game, period, limit) {
    const filtered = [...localScores(period).values()].filter(row => game === 'global' || row.game === game);
    filtered.sort((a, b) => b.score - a.score || Date.parse(a.achieved_at) - Date.parse(b.achieved_at));
    return { rows: filtered.slice(0, limit).map((row, index) => ({ ...row, pos: index + 1 })), myRow: null };
  },
  async submitScore(entry) {
    rememberPending(entry);
    return { saved: true };
  },
  async setNickname(nickname) {
    const value = nickname.trim();
    if (!/^[\p{L}\p{N}_-]{3,12}$/u.test(value)) throw new Error(ERROR_MESSAGES.invalid_nickname);
    try {
      localStorage.setItem(LOCAL_NICKNAME_KEY, value);
    } catch (error) {
      console.warn('No se pudo guardar el apodo local.', error);
      throw new Error('No se pudo guardar el apodo en este dispositivo.');
    }
    return value;
  },
  async myNickname() {
    try {
      return localStorage.getItem(LOCAL_NICKNAME_KEY);
    } catch (error) {
      console.warn('No se pudo leer el apodo local.', error);
      return null;
    }
  },
  async weekEnd() {
    return null;
  }
};

async function rpc(name, args) {
  const client = window.barsukonSupabaseClient;
  if (!client) {
    setLocalFallback();
    return null;
  }
  try {
    const { data, error } = await client.rpc(name, args);
    if (error) throw error;
    return data;
  } catch (error) {
    if (isUnavailable(error)) {
      setLocalFallback();
      return null;
    }
    throw new Error(mappedError(error));
  }
}

function normalizeRows(data) {
  if (!Array.isArray(data)) return [];
  return data.map(row => ({
    pos: Number(row.pos) || 0,
    nickname: String(row.nickname ?? ''),
    score: Number(row.score) || 0,
    achieved_at: String(row.achieved_at ?? ''),
    is_me: row.is_me === true || row.is_me === 'true' || row.is_me === 1
  }));
}

const supabaseAdapter = {
  async getTop(game, period, limit) {
    const data = await rpc('lb_get_top', { p_game: game, p_period: period, p_limit: limit });
    if (data === null) return localAdapter.getTop(game, period, limit);
    const rows = normalizeRows(data);
    const mineOutsideTop = rows.find(row => row.is_me && row.pos > limit) || null;
    return { rows: rows.filter(row => row.pos <= limit), myRow: mineOutsideTop };
  },
  async submitScore(entry) {
    const data = await rpc('lb_submit_score', { p_game: entry.gameId, p_score: Math.round(entry.score) });
    if (data === null) return localAdapter.submitScore(entry);
    return data;
  },
  async setNickname(nickname) {
    const data = await rpc('lb_set_nickname', { p_nickname: nickname.trim() });
    if (data === null) return localAdapter.setNickname(nickname);
    return data;
  },
  async myNickname() {
    const data = await rpc('lb_my_nickname', {});
    if (data === null) return localAdapter.myNickname();
    if (Array.isArray(data)) return data[0] ?? null;
    return data || null;
  },
  async weekEnd() {
    const data = await rpc('lb_week_end', {});
    if (data === null) return null;
    if (Array.isArray(data)) return data[0] ?? null;
    return data;
  }
};

function adapter() {
  return activeAdapter === 'supabase' ? supabaseAdapter : localAdapter;
}

export const leaderboardStore = {
  get adapterName() { return activeAdapter; },
  get isAuthenticated() { return Boolean(currentUser); },
  get user() { return currentUser; },
  async getTop(game = 'global', period = 'all', limit = CONFIG.limit) {
    return adapter().getTop(game, period, limit);
  },
  async submitScore(entry) {
    return adapter().submitScore(entry);
  },
  async setNickname(nickname) {
    const result = await adapter().setNickname(nickname);
    currentNickname = typeof result === 'string' ? result : nickname.trim();
    emitStatus(`> Apodo guardado: ${currentNickname}`);
    await syncPendingScores();
    return currentNickname;
  },
  async myNickname() {
    currentNickname = await adapter().myNickname();
    return currentNickname;
  },
  async weekEnd() {
    return adapter().weekEnd();
  },
  async syncPending() {
    return syncPendingScores();
  },
  async refreshSession() {
    return refreshSession();
  }
};

function showLoginToast() {
  ensureSyncStyles();
  let toast = document.getElementById('leaderboardLoginToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'leaderboardLoginToast';
    toast.className = 'leaderboard-toast';
    toast.setAttribute('role', 'status');
    const message = document.createElement('span');
    message.textContent = '> Inicia sesión para guardar tu puntuación';
    const link = document.createElement('a');
    link.href = './index.html#auth';
    link.className = 'leaderboard-toast-action';
    link.textContent = 'Acceder';
    link.setAttribute('aria-label', 'Abrir el acceso a tu cuenta BarsukON');
    toast.append(message, link);
    document.body.append(toast);
  }
  toast.hidden = false;
}

function showNicknamePrompt() {
  if (!currentUser) return;
  window.dispatchEvent(new CustomEvent('barsukon:leaderboard-nickname-required'));
  if (document.getElementById('nicknameSection')) return;
  if (document.getElementById('nicknamePrompt')) return;
  ensureSyncStyles();
  const panel = document.createElement('form');
  panel.id = 'nicknamePrompt';
  panel.className = 'leaderboard-prompt';
  const label = document.createElement('label');
  label.htmlFor = 'nicknamePromptInput';
  label.textContent = '> elige tu apodo (3-12, letras/números/_/-):';
  const input = document.createElement('input');
  input.id = 'nicknamePromptInput';
  input.name = 'nickname';
  input.minLength = 3;
  input.maxLength = 12;
  input.autocomplete = 'nickname';
  input.required = true;
  input.pattern = '[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9_-]{3,12}';
  input.setAttribute('aria-label', 'Apodo de 3 a 12 letras, números, guion o guion bajo');
  const submit = document.createElement('button');
  submit.type = 'submit';
  submit.textContent = 'Guardar apodo';
  submit.setAttribute('aria-label', 'Guardar apodo');
  const error = document.createElement('p');
  error.className = 'leaderboard-prompt-error';
  error.setAttribute('role', 'status');
  panel.append(label, input, submit, error);
  panel.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    try {
      await leaderboardStore.setNickname(input.value);
      panel.remove();
    } catch (reason) {
      error.textContent = reason instanceof Error ? reason.message : mappedError(reason);
    } finally {
      submit.disabled = false;
    }
  });
  document.body.append(panel);
  input.focus({ preventScroll: true });
}

async function syncPendingScores() {
  if (processingPending) {
    pendingSyncRequested = true;
    return;
  }
  if (!initialized || activeAdapter !== 'supabase' || !currentUser) return;
  processingPending = true;
  try {
    currentNickname = await leaderboardStore.myNickname();
    if (!currentNickname) {
      showNicknamePrompt();
      return;
    }
    const pending = readPending();
    for (const [gameId, entry] of Object.entries(pending)) {
      if (!GAME_IDS.has(gameId) || !entry || !Number.isFinite(Number(entry.score))) continue;
      try {
        await supabaseAdapter.submitScore(entry);
        if (activeAdapter !== 'supabase') break;
        const latest = readPending();
        if (Number(latest[gameId]?.score) <= Number(entry.score)) {
          delete latest[gameId];
          writeJson(PENDING_KEY, latest);
        }
        emitStatus(`> Puntuación de ${gameId} guardada en la clasificación.`);
      } catch (error) {
        emitStatus(`> ${error instanceof Error ? error.message : mappedError(error)}`, 'error');
      }
    }
  } catch (error) {
    emitStatus(`> ${error instanceof Error ? error.message : mappedError(error)}`, 'error');
  } finally {
    processingPending = false;
    if (pendingSyncRequested) {
      pendingSyncRequested = false;
      if (activeAdapter === 'supabase' && currentUser) queueMicrotask(() => syncPendingScores());
    }
  }
}

function scoreEventKey(entry) {
  return `${entry.gameId}:${Math.round(entry.score)}:${entry.submittedAt || ''}`;
}

async function onScore(event) {
  const entry = event.detail;
  if (!entry || !GAME_IDS.has(entry.gameId) || !Number.isFinite(Number(entry.score)) || Number(entry.score) < 0) return;
  const key = scoreEventKey(entry);
  if (seenEvents.has(key)) return;
  seenEvents.add(key);
  if (seenEvents.size > 200) seenEvents.delete(seenEvents.values().next().value);
  rememberPending(entry);
  if (activeAdapter !== 'supabase') {
    await localAdapter.submitScore(entry);
    emitStatus('> Puntuación guardada en esta sesión local.');
    return;
  }
  if (!currentUser) {
    showLoginToast();
    return;
  }
  await syncPendingScores();
}

async function refreshSession() {
  const client = window.barsukonSupabaseClient;
  if (!client) {
    setLocalFallback();
    initialized = true;
    return null;
  }
  const { data, error } = await client.auth.getSession();
  if (error) {
    if (isUnavailable(error)) setLocalFallback();
    else emitStatus(`> No se pudo comprobar la sesión: ${mappedError(error)}`, 'error');
    initialized = true;
    return null;
  }
  currentUser = data.session?.user ?? null;
  initialized = true;
  if (!currentUser) {
    currentNickname = null;
    return null;
  }
  document.getElementById('leaderboardLoginToast')?.remove();
  await syncPendingScores();
  return currentUser;
}

export function initializeLeaderboardSync() {
  if (window.__barsukonLeaderboardSyncInitialized) return;
  window.__barsukonLeaderboardSyncInitialized = true;
  window.addEventListener('barsukon:score', onScore);
  if (activeAdapter !== 'supabase') {
    emitStatus('> Supabase no disponible; clasificación local activada.');
    initialized = true;
    return;
  }
  refreshSession().catch(error => {
    console.error('No se pudo iniciar la sincronización de la clasificación.', error);
    setLocalFallback(mappedError(error));
  });
  const client = window.barsukonSupabaseClient;
  if (client) {
    const { data } = client.auth.onAuthStateChange((_event, session) => {
      currentUser = session?.user ?? null;
      if (currentUser) {
        refreshSession().catch(error => emitStatus(`> ${mappedError(error)}`, 'error'));
      } else {
        currentNickname = null;
      }
    });
    authSubscription = data.subscription;
  } else {
    setLocalFallback();
  }
  window.addEventListener('pagehide', () => authSubscription?.unsubscribe(), { once: true });
}
