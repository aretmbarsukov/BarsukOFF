import { submitScore } from './score-api.js';

const TEXT = {
  startTitle: 'Micro-Soldering<br /><span>Master</span>',
  startCopy: 'Reconecta la pista dañada antes de que se agote el tiempo. Mantén el pulso firme: demasiado calor provoca un cortocircuito.',
  instructions: [
    'Empieza en la primera plataforma de contacto.',
    'Arrastra hasta el siguiente contacto siguiendo la pista.',
    'Suelta cuando quieras; retoma desde el último punto alcanzado.'
  ],
  play: 'Jugar',
  pause: 'Pausar',
  resume: 'Reanudar',
  level: 'Nivel',
  levelOf: (level, total) => `Nivel ${level} de ${total}`,
  time: 'Tiempo',
  score: 'Puntuación',
  heat: 'Sobrecalentamiento',
  themeLight: 'Tema claro',
  themeDark: 'Tema oscuro',
  sound: 'Sonido',
  soundOn: 'Sonido activado',
  soundOff: 'Sonido desactivado',
  best: score => `Mejor puntuación: ${score}`,
  boardStart: 'Empieza en la plataforma dorada y sigue la pista hasta el siguiente contacto.',
  boardResume: 'Retoma desde el punto brillante; no hace falta volver al inicio.',
  boardOutside: 'Te has salido del corredor: vuelve a la pista para enfriar la soldadura.',
  boardZone: 'Zona prohibida: evita el componente y retoma la pista.',
  boardGood: 'Buen pulso. Mantente dentro del corredor y completa la conexión.',
  wrongStart: 'Coloca el puntero sobre la plataforma inicial o el último punto alcanzado.',
  levelComplete: (level, total) => `Nivel ${level} de ${total} completado`,
  precision: score => `Precisión: <strong>${score}</strong> puntos`,
  timeBonus: score => `Bonificación de tiempo: <strong>${score}</strong> puntos`,
  multiplier: value => `Racha limpia: <strong>×${value}</strong>`,
  continue: 'Continuar',
  retry: 'Reintentar',
  shortCircuitTitle: 'Cortocircuito',
  timeoutTitle: 'Tiempo agotado',
  shortCircuitCopy: 'La placa se ha sobrecalentado. El nivel vuelve a empezar; tu progreso anterior se conserva.',
  timeoutCopy: 'Se agotó el tiempo. Enfría la placa y vuelve a intentarlo.',
  finalTitle: '¡Reparación completada!',
  finalCopy: levels => `Has reconectado todos los contactos y completado ${levels} niveles. Pulso de especialista confirmado.`,
  finalScore: score => `Puntuación final: <strong>${score}</strong>`,
  bestScore: score => `Mejor puntuación: <strong>${score}</strong>`,
  precisionService: 'Así de precisa es nuestra microsoldadura BGA bajo microscopio 40x.',
  book: 'Reservar cita',
  return: 'Volver a BarsukON',
  noLevels: 'No quedan más niveles.',
  pausedTitle: 'Partida en pausa',
  pausedCopy: 'La placa está a salvo. Reanuda cuando estés listo; el temporizador permanece detenido.',
  resumeHint: 'Pulsa Escape o selecciona «Reanudar» para volver a la partida.',
  scoreSaveError: 'No se pudo guardar el resultado en este dispositivo. La partida sigue disponible.',
  levelLabel: 'Nivel',
  starsLabel: count => `${count} de 3 estrellas`,
  contactProgress: (done, total) => `Contactos conectados: ${done} de ${total}`,
  levelIntro: 'Sigue la pista de cobre y conecta cada contacto en orden. Una pausa conserva el último punto alcanzado.',
  levelStart: 'Arrastra desde el contacto dorado hasta el siguiente contacto iluminado.',
  levelTrack: (number, level) => `Nivel ${number}: ${level.title}`,
  pausedStatus: 'Partida en pausa.',
  soundError: 'El sonido no está disponible en este navegador.',
  bookingLabel: 'Abrir reserva de cita en BarsukON',
  countdown: '00:00'
};

const LEVELS = [
  {
    title: 'Conexión directa',
    time: 42,
    corridor: 78,
    points: [{ x: 120, y: 320 }, { x: 470, y: 320 }, { x: 880, y: 320 }],
    curves: [],
    zones: []
  },
  {
    title: 'Esquina de precisión',
    time: 40,
    corridor: 66,
    points: [{ x: 120, y: 500 }, { x: 390, y: 500 }, { x: 390, y: 180 }, { x: 880, y: 180 }],
    curves: [],
    zones: []
  },
  {
    title: 'Puente de cobre',
    time: 38,
    corridor: 56,
    points: [{ x: 110, y: 500 }, { x: 330, y: 500 }, { x: 330, y: 330 }, { x: 590, y: 330 }, { x: 590, y: 150 }, { x: 890, y: 150 }],
    curves: [],
    zones: []
  },
  {
    title: 'Curva bajo microscopio',
    time: 36,
    corridor: 48,
    points: [{ x: 110, y: 480 }, { x: 290, y: 480 }, { x: 440, y: 350 }, { x: 610, y: 350 }, { x: 760, y: 200 }, { x: 900, y: 200 }],
    curves: [
      null,
      { c1: { x: 340, y: 480 }, c2: { x: 390, y: 350 } },
      null,
      { c1: { x: 670, y: 350 }, c2: { x: 700, y: 200 } },
      null
    ],
    zones: [{ x: 760, y: 485, radius: 48, label: 'C1' }]
  },
  {
    title: 'Desvío entre componentes',
    time: 34,
    corridor: 42,
    points: [{ x: 100, y: 510 }, { x: 260, y: 510 }, { x: 260, y: 380 }, { x: 420, y: 380 }, { x: 500, y: 250 }, { x: 650, y: 250 }, { x: 720, y: 400 }, { x: 900, y: 400 }],
    curves: [
      null,
      null,
      null,
      { c1: { x: 460, y: 380 }, c2: { x: 470, y: 250 } },
      null,
      { c1: { x: 690, y: 250 }, c2: { x: 690, y: 400 } },
      null
    ],
    zones: [
      { x: 410, y: 150, radius: 43, label: 'U2' },
      { x: 500, y: 520, radius: 42, label: 'C4' }
    ]
  },
  {
    title: 'Circuito de alta precisión',
    time: 32,
    corridor: 36,
    points: [{ x: 100, y: 490 }, { x: 250, y: 490 }, { x: 250, y: 360 }, { x: 400, y: 360 }, { x: 460, y: 220 }, { x: 620, y: 220 }, { x: 680, y: 390 }, { x: 820, y: 390 }, { x: 900, y: 240 }],
    curves: [
      null,
      null,
      null,
      { c1: { x: 430, y: 360 }, c2: { x: 430, y: 220 } },
      null,
      { c1: { x: 660, y: 220 }, c2: { x: 640, y: 390 } },
      null,
      { c1: { x: 870, y: 390 }, c2: { x: 860, y: 240 } }
    ],
    zones: [
      { x: 520, y: 500, radius: 48, label: 'U4' },
      { x: 810, y: 135, radius: 44, label: 'C8' }
    ]
  }
];

const WIDTH = 1000;
const HEIGHT = 640;
const CURRENT_SCORE_KEY = 'barsukon-micro-soldering-current';
const BEST_SCORE_KEY = 'barsukon-micro-soldering-best';
const PREFERENCES_KEY = 'barsukon-preferences';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canvas = document.getElementById('boardCanvas');
const ctx = canvas.getContext('2d');
const boardFrame = document.querySelector('.board-frame');
const screen = document.getElementById('screenPanel');
const ui = {
  level: document.getElementById('levelValue'),
  timer: document.getElementById('timerValue'),
  score: document.getElementById('scoreValue'),
  heat: document.getElementById('heatValue'),
  heatFill: document.getElementById('heatFill'),
  heatTrack: document.querySelector('.heat-track'),
  hint: document.getElementById('boardHint'),
  pause: document.getElementById('pauseButton'),
  theme: document.getElementById('themeButton'),
  themeLabel: document.getElementById('themeLabel'),
  sound: document.getElementById('soundButton'),
  soundLabel: document.getElementById('soundLabel')
};

function buildRoute(level) {
  return level.points.slice(0, -1).map((start, index) => {
    const end = level.points[index + 1];
    const curve = level.curves[index];
    const estimate = curve
      ? Math.hypot(curve.c1.x - start.x, curve.c1.y - start.y)
        + Math.hypot(curve.c2.x - curve.c1.x, curve.c2.y - curve.c1.y)
        + Math.hypot(end.x - curve.c2.x, end.y - curve.c2.y)
      : Math.hypot(end.x - start.x, end.y - start.y);
    const count = Math.max(2, Math.ceil(estimate / 7));
    const samples = [];
    let length = 0;
    for (let step = 0; step <= count; step++) {
      const t = step / count;
      const inverse = 1 - t;
      const point = curve
        ? {
          x: inverse ** 3 * start.x + 3 * inverse ** 2 * t * curve.c1.x + 3 * inverse * t ** 2 * curve.c2.x + t ** 3 * end.x,
          y: inverse ** 3 * start.y + 3 * inverse ** 2 * t * curve.c1.y + 3 * inverse * t ** 2 * curve.c2.y + t ** 3 * end.y
        }
        : { x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t };
      if (samples.length) length += Math.hypot(point.x - samples[samples.length - 1].x, point.y - samples[samples.length - 1].y);
      samples.push({ ...point, distance: length });
    }
    return { samples, length };
  });
}

const preparedLevels = LEVELS.map(level => ({ ...level, routes: buildRoute(level) }));
const state = {
  mode: 'start',
  levelIndex: 0,
  secondsLeft: 0,
  score: 0,
  best: 0,
  heat: 0,
  maxHeat: 0,
  overallMaxHeat: 0,
  heatWarningPlayed: false,
  contactIndex: 1,
  segmentProgress: 0,
  deviation: 0,
  forbidden: false,
  dragging: false,
  lastPointer: null,
  heatClock: 0,
  frameClock: 0,
  streak: 0,
  bestStreak: 0,
  completedLevels: 0,
  stars: [],
  lastScreen: 'start',
  soundOn: false,
  audio: null,
  sizzle: null,
  sparks: [],
  palette: null,
  scoreSubmitted: false
};

function formatScore(value) {
  return Math.max(0, Math.round(value)).toLocaleString('es-ES');
}

function safeReadBest() {
  try {
    state.best = Math.max(0, Number(localStorage.getItem(BEST_SCORE_KEY)) || 0);
  } catch (error) {
    console.warn('No se pudo leer el récord local de microsoldadura.', error);
    state.best = 0;
  }
}

function saveScores() {
  state.best = Math.max(state.best, state.score);
  try {
    localStorage.setItem(CURRENT_SCORE_KEY, String(state.score));
    localStorage.setItem(BEST_SCORE_KEY, String(state.best));
  } catch (error) {
    console.warn('No se pudo guardar la puntuación local de microsoldadura.', error);
    return false;
  }
  return true;
}

function getSavedTheme() {
  try {
    const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    return preferences.theme === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.warn('No se pudo leer el tema guardado de BarsukON.', error);
    return 'dark';
  }
}

function updatePalette() {
  const styles = getComputedStyle(document.documentElement);
  state.palette = {
    bg: styles.getPropertyValue('--bg').trim(),
    board: styles.getPropertyValue('--board').trim(),
    boardInset: styles.getPropertyValue('--board-inset').trim(),
    trace: styles.getPropertyValue('--trace').trim(),
    chip: styles.getPropertyValue('--chip').trim(),
    metal: styles.getPropertyValue('--metal').trim(),
    gold: styles.getPropertyValue('--gold').trim(),
    danger: styles.getPropertyValue('--danger').trim(),
    good: styles.getPropertyValue('--good').trim(),
    brand: styles.getPropertyValue('--brand').trim()
  };
}

function applyTheme(theme) {
  document.body.dataset.theme = theme === 'light' ? 'light' : 'dark';
  ui.theme.setAttribute('aria-pressed', String(theme === 'light'));
  ui.theme.setAttribute('aria-label', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  ui.themeLabel.textContent = theme === 'light' ? TEXT.themeLight : TEXT.themeDark;
  updatePalette();
}

function saveTheme(theme) {
  try {
    const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
    preferences.theme = theme;
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (error) {
    console.warn('No se pudo guardar el tema de BarsukON en este dispositivo.', error);
  }
}

function resizeCanvas() {
  const bounds = canvas.getBoundingClientRect();
  if (!bounds.width || !bounds.height) return;
  const ratio = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.round(bounds.width * ratio);
  const height = Math.round(bounds.height * ratio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function getCanvasPoint(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - bounds.left) * WIDTH / bounds.width,
    y: (event.clientY - bounds.top) * HEIGHT / bounds.height
  };
}

function closestPoint(route, point, minimumDistance = 0, maximumDistance = route.length) {
  let closest = { distance: Infinity, along: minimumDistance, x: point.x, y: point.y };
  for (let index = 0; index < route.samples.length - 1; index++) {
    const first = route.samples[index];
    const second = route.samples[index + 1];
    const span = second.distance - first.distance;
    if (!span) continue;
    const startT = Math.max(0, (minimumDistance - first.distance) / span);
    const endT = Math.min(1, (maximumDistance - first.distance) / span);
    if (startT > endT) continue;
    const dx = second.x - first.x;
    const dy = second.y - first.y;
    const projected = ((point.x - first.x) * dx + (point.y - first.y) * dy) / (dx * dx + dy * dy);
    const t = Math.max(startT, Math.min(endT, projected));
    const x = first.x + dx * t;
    const y = first.y + dy * t;
    const distance = Math.hypot(point.x - x, point.y - y);
    if (distance < closest.distance) closest = { distance, along: first.distance + span * t, x, y };
  }
  return closest;
}

function pointAtDistance(route, distance) {
  for (let index = 0; index < route.samples.length - 1; index++) {
    const first = route.samples[index];
    const second = route.samples[index + 1];
    if (distance > second.distance) continue;
    const span = second.distance - first.distance || 1;
    const t = Math.max(0, Math.min(1, (distance - first.distance) / span));
    return { x: first.x + (second.x - first.x) * t, y: first.y + (second.y - first.y) * t };
  }
  const end = route.samples[route.samples.length - 1];
  return { x: end.x, y: end.y };
}

function currentTip() {
  if (state.contactIndex <= 0) return preparedLevels[state.levelIndex].points[0];
  const route = preparedLevels[state.levelIndex].routes[state.contactIndex - 1];
  return pointAtDistance(route, state.segmentProgress);
}

function isForbidden(point, level) {
  return level.zones.find(zone => Math.hypot(point.x - zone.x, point.y - zone.y) <= zone.radius + 12) || null;
}

function updateThermal(delta, deviation, forbidden) {
  if (delta <= 0) return;
  const level = preparedLevels[state.levelIndex];
  const tolerance = level.corridor / 2;
  if (!state.dragging) {
    state.heat = Math.max(0, state.heat - delta * 9);
  } else if (forbidden) {
    state.heat += delta * 48;
  } else if (deviation > tolerance) {
    const excess = deviation - tolerance;
    state.heat += delta * (7 + Math.min(28, excess / tolerance * 10));
  } else {
    state.heat = Math.max(0, state.heat - delta * 4);
  }
  state.heat = Math.min(100, state.heat);
  state.maxHeat = Math.max(state.maxHeat, state.heat);
  state.overallMaxHeat = Math.max(state.overallMaxHeat, state.heat);
  if (state.heat >= 70 && !state.heatWarningPlayed) {
    state.heatWarningPlayed = true;
    playTone(220, .16, 'triangle');
  }
  if (state.heat >= 100 && state.mode === 'playing') failLevel('shortCircuit');
}

function addSparks(point) {
  if (reducedMotion) return;
  for (let index = 0; index < 2; index++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 35 + Math.random() * 85;
    state.sparks.push({
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 28,
      life: .12 + Math.random() * .2,
      maxLife: .32,
      size: 2 + Math.random() * 2
    });
  }
  if (state.sparks.length > 50) state.sparks.splice(0, state.sparks.length - 50);
}

function playTone(frequency, duration = .1, type = 'sine') {
  if (!state.soundOn) return;
  try {
    const audio = ensureAudio();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  } catch (error) {
    console.warn('No se pudo reproducir el sonido de microsoldadura.', error);
  }
}

function ensureAudio() {
  if (!state.audio) state.audio = new window.AudioContext();
  if (state.audio.state === 'suspended') state.audio.resume();
  return state.audio;
}

function startSizzle() {
  if (!state.soundOn || state.sizzle) return;
  try {
    const audio = ensureAudio();
    const buffer = audio.createBuffer(1, audio.sampleRate, audio.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index++) samples[index] = (Math.random() * 2 - 1) * .28;
    const source = audio.createBufferSource();
    const filter = audio.createBiquadFilter();
    const gain = audio.createGain();
    source.buffer = buffer;
    source.loop = true;
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    gain.gain.value = .045;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audio.destination);
    source.start();
    state.sizzle = { source, gain };
  } catch (error) {
    console.warn('No se pudo iniciar el sonido de soldadura.', error);
  }
}

function stopSizzle() {
  if (!state.sizzle) return;
  try {
    state.sizzle.source.stop();
    state.sizzle.source.disconnect();
    state.sizzle.gain.disconnect();
  } catch (error) {
    console.warn('No se pudo detener el sonido de soldadura.', error);
  }
  state.sizzle = null;
}

function setSound(enabled) {
  state.soundOn = enabled;
  ui.sound.setAttribute('aria-pressed', String(enabled));
  ui.sound.setAttribute('aria-label', enabled ? 'Desactivar sonido' : 'Activar sonido');
  ui.soundLabel.textContent = enabled ? TEXT.soundOn : TEXT.sound;
  if (!enabled) stopSizzle();
  else {
    try {
      ensureAudio();
      playTone(520, .08);
      if (state.dragging) startSizzle();
    } catch (error) {
      state.soundOn = false;
      ui.sound.setAttribute('aria-pressed', 'false');
      ui.sound.setAttribute('aria-label', 'Activar sonido');
      ui.soundLabel.textContent = TEXT.sound;
      console.warn('El sonido no está disponible en este navegador.', error);
      ui.hint.textContent = TEXT.soundError;
    }
  }
}

function updateHud() {
  const level = preparedLevels[state.levelIndex];
  ui.level.textContent = state.mode === 'start' ? '—' : `${state.levelIndex + 1}/${preparedLevels.length}`;
  ui.timer.textContent = state.mode === 'start' ? TEXT.countdown : `00:${String(Math.max(0, Math.ceil(state.secondsLeft))).padStart(2, '0')}`;
  ui.timer.style.color = state.secondsLeft <= 8 && state.mode === 'playing' ? 'var(--danger)' : '';
  ui.score.textContent = formatScore(state.score);
  ui.heat.textContent = `${Math.round(state.heat)} %`;
  ui.heatFill.style.width = `${state.heat}%`;
  ui.heatTrack.setAttribute('aria-valuenow', String(Math.round(state.heat)));
  ui.pause.disabled = !['playing', 'paused'].includes(state.mode);
  ui.pause.setAttribute('aria-pressed', String(state.mode === 'paused'));
  ui.pause.setAttribute('aria-label', state.mode === 'paused' ? 'Reanudar partida' : 'Pausar partida');
  ui.pause.textContent = state.mode === 'paused' ? TEXT.resume : TEXT.pause;
  boardFrame.dataset.danger = String(state.heat >= 80 && !reducedMotion);
  if (state.mode !== 'start' && level) ui.level.setAttribute('aria-label', TEXT.levelOf(state.levelIndex + 1, preparedLevels.length));
}

function setScreen(markup, mode, boardHint) {
  state.mode = mode;
  screen.innerHTML = markup;
  ui.hint.textContent = boardHint;
  updateHud();
}

function renderStart() {
  const instructions = TEXT.instructions.map((instruction, index) =>
    `<li><span>0${index + 1}</span><span>${instruction}</span></li>`
  ).join('');
  setScreen(`
    <p class="eyebrow">// RETO DE PRECISIÓN · BGA</p>
    <h2>${TEXT.startTitle}</h2>
    <p class="screen-copy">${TEXT.startCopy}</p>
    <ol class="instruction-list">${instructions}</ol>
    <p class="record-label" id="recordLabel">${TEXT.best(formatScore(state.best))}</p>
    <button class="primary-button" type="button" data-action="start" aria-label="Jugar"><span>${TEXT.play}</span><span aria-hidden="true">↗</span></button>
    <p class="keyboard-hint">Ratón, pantalla táctil o lápiz · Esc para pausar</p>
  `, 'start', TEXT.boardStart);
}

function renderPlaying() {
  const level = preparedLevels[state.levelIndex];
  const connected = state.contactIndex - 1;
  setScreen(`
    <p class="eyebrow">// ${TEXT.levelTrack(state.levelIndex + 1, level).toUpperCase()}</p>
    <h2>Soldando<br /><span>pista</span></h2>
    <p class="screen-copy">${TEXT.levelIntro}</p>
    <div class="level-meter">
      <div class="level-meter-head"><span>Contactos conectados</span><strong>${connected} / ${level.points.length - 1}</strong></div>
      <div class="level-meter-track" role="progressbar" aria-label="Contactos conectados" aria-valuemin="0" aria-valuemax="${level.points.length - 1}" aria-valuenow="${connected}"><span style="width:${connected / (level.points.length - 1) * 100}%"></span></div>
    </div>
    <p class="status-box">${TEXT.contactProgress(connected, level.points.length - 1)}. ${TEXT.levelStart}</p>
    <div class="mission-actions">
      <p class="keyboard-hint">Suelta y vuelve a tocar sobre el último punto alcanzado para continuar.</p>
    </div>
  `, 'playing', state.contactIndex > 1 || state.segmentProgress > 0 ? TEXT.boardResume : TEXT.boardGood);
}

function renderPaused() {
  setScreen(`
    <p class="eyebrow">// SESIÓN GUARDADA</p>
    <h2>${TEXT.pausedTitle}</h2>
    <p class="screen-copy">${TEXT.pausedCopy}</p>
    <p class="status-box">${TEXT.resumeHint}</p>
    <div class="mission-actions"><button class="primary-button" type="button" data-action="resume" aria-label="Reanudar partida">${TEXT.resume}</button></div>
  `, 'paused', TEXT.pausedStatus);
}

function calculateStars(level) {
  if (state.maxHeat <= 15 && state.secondsLeft >= level.time * .45) return 3;
  if (state.maxHeat <= 48 && state.secondsLeft >= level.time * .18) return 2;
  return 1;
}

function completeLevel() {
  if (state.mode !== 'playing') return;
  const level = preparedLevels[state.levelIndex];
  state.dragging = false;
  state.lastPointer = null;
  stopSizzle();
  const accuracyPoints = Math.max(0, Math.round(500 - state.maxHeat * 4));
  const timePoints = Math.max(0, Math.floor(state.secondsLeft * 20));
  state.streak++;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  const multiplier = 1 + Math.min(3, (state.streak - 1) * .15);
  const earned = Math.round((accuracyPoints + timePoints) * multiplier);
  const stars = calculateStars(level);
  state.score += earned;
  state.completedLevels = Math.max(state.completedLevels, state.levelIndex + 1);
  state.stars[state.levelIndex] = stars;
  saveScores();
  playTone(720 + stars * 80, .16);
  if (state.levelIndex === preparedLevels.length - 1) {
    setScreen(`
      <p class="eyebrow">// CONTACTOS RESTAURADOS</p>
      <h2>${TEXT.levelComplete(state.levelIndex + 1, preparedLevels.length)}</h2>
      <p class="stars" aria-label="${TEXT.starsLabel(stars)}">${'★'.repeat(stars)}<span>${'☆'.repeat(3 - stars)}</span></p>
      <p class="screen-copy">${TEXT.precision(accuracyPoints)} · ${TEXT.timeBonus(timePoints)} · ${TEXT.multiplier(multiplier.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))}.</p>
      <p class="status-box">${TEXT.finalCopy(state.completedLevels)}<br />${TEXT.finalScore(formatScore(state.score))}</p>
      <div class="mission-actions"><button class="primary-button" type="button" data-action="finish" aria-label="Ver resultado final">Ver resultado final <span aria-hidden="true">→</span></button></div>
    `, 'levelComplete', 'Último nivel conectado. Elige «Ver resultado final» para guardar tu puntuación.');
    return;
  }
  setScreen(`
    <p class="eyebrow">// CONEXIÓN ESTABLE</p>
    <h2>${TEXT.levelComplete(state.levelIndex + 1, preparedLevels.length)}</h2>
    <p class="stars" aria-label="${TEXT.starsLabel(stars)}">${'★'.repeat(stars)}<span>${'☆'.repeat(3 - stars)}</span></p>
    <p class="screen-copy">${TEXT.precision(accuracyPoints)} · ${TEXT.timeBonus(timePoints)} · ${TEXT.multiplier(multiplier.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''))}.</p>
    <p class="status-box">Puntuación acumulada: <strong>${formatScore(state.score)}</strong>. El siguiente nivel añade más contactos y estrecha la pista.</p>
    <div class="mission-actions"><button class="primary-button" type="button" data-action="continue" aria-label="Continuar al siguiente nivel">${TEXT.continue}<span aria-hidden="true">→</span></button></div>
  `, 'levelComplete', 'Conexión completada. Continúa cuando estés listo para el siguiente nivel.');
}

function renderDefeat(reason) {
  const isShortCircuit = reason === 'shortCircuit';
  const title = isShortCircuit ? TEXT.shortCircuitTitle : TEXT.timeoutTitle;
  const copy = isShortCircuit ? TEXT.shortCircuitCopy : TEXT.timeoutCopy;
  setScreen(`
    <p class="eyebrow">// ${isShortCircuit ? 'TEMPERATURA CRÍTICA' : 'TIEMPO AGOTADO'}</p>
    <h2>${title}</h2>
    <p class="screen-copy">${copy}</p>
    <p class="status-box">Nivel ${state.levelIndex + 1} · Puntuación: <strong>${formatScore(state.score)}</strong> · Récord: <strong>${formatScore(state.best)}</strong></p>
    <div class="mission-actions">
      <button class="primary-button" type="button" data-action="retry" aria-label="Reintentar nivel">${TEXT.retry}<span aria-hidden="true">↻</span></button>
      <a class="secondary-button" href="./index.html#games" aria-label="Volver a BarsukON">${TEXT.return}</a>
    </div>
  `, 'defeat', isShortCircuit ? 'Cortocircuito. La placa se ha sobrecalentado.' : 'Se agotó el tiempo de este nivel.');
}

function renderFinal() {
  setScreen(`
    <p class="eyebrow">// MISIÓN COMPLETADA · BGA</p>
    <h2>${TEXT.finalTitle}</h2>
    <p class="screen-copy">${TEXT.finalCopy(state.completedLevels)}</p>
    <div class="status-box">
      <p>${TEXT.finalScore(formatScore(state.score))}</p>
      <p>${TEXT.bestScore(formatScore(state.best))}</p>
      <p>Racha máxima sin cortocircuito: <strong>×${state.bestStreak}</strong></p>
      <p>Estrellas conseguidas: <strong>${state.stars.reduce((sum, value) => sum + value, 0)} / ${preparedLevels.length * 3}</strong></p>
    </div>
    <p class="screen-copy">${TEXT.precisionService}</p>
    <div class="mission-actions">
      <a class="primary-button" href="./index.html?booking=1#home" aria-label="${TEXT.bookingLabel}">${TEXT.book}<span aria-hidden="true">↗</span></a>
      <a class="secondary-button" href="./index.html#games" aria-label="Volver a BarsukON">${TEXT.return}</a>
    </div>
  `, 'final', 'Todos los contactos se han reconectado.');
}

function startLevel(index) {
  if (index < 0 || index >= preparedLevels.length) {
    ui.hint.textContent = TEXT.noLevels;
    return;
  }
  state.levelIndex = index;
  state.mode = 'playing';
  state.secondsLeft = preparedLevels[index].time;
  state.heat = 0;
  state.maxHeat = 0;
  state.heatWarningPlayed = false;
  state.contactIndex = 1;
  state.segmentProgress = 0;
  state.deviation = 0;
  state.forbidden = false;
  state.dragging = false;
  state.lastPointer = null;
  state.heatClock = performance.now();
  state.sparks = [];
  renderPlaying();
}

function startGame() {
  state.score = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.completedLevels = 0;
  state.overallMaxHeat = 0;
  state.stars = [];
  state.scoreSubmitted = false;
  saveScores();
  startLevel(0);
}

function failLevel(reason) {
  if (state.mode !== 'playing') return;
  state.dragging = false;
  state.lastPointer = null;
  state.heat = reason === 'shortCircuit' ? 100 : state.heat;
  state.streak = 0;
  state.score = Math.max(0, state.score - (reason === 'shortCircuit' ? 100 : 50));
  stopSizzle();
  playTone(reason === 'shortCircuit' ? 120 : 180, .28, 'sawtooth');
  saveScores();
  renderDefeat(reason);
}

function finishGame() {
  if (state.scoreSubmitted) return;
  state.scoreSubmitted = true;
  saveScores();
  renderFinal();
  const result = submitScore('micro-soldering', state.score, {
    levelsCompleted: state.completedLevels,
    stars: [...state.stars],
    maximumHeat: Math.round(state.overallMaxHeat),
    cleanLevelStreak: state.bestStreak
  });
  if (!result.saved) ui.hint.textContent = TEXT.scoreSaveError;
}

function pauseGame() {
  if (state.mode !== 'playing') return;
  state.dragging = false;
  state.lastPointer = null;
  state.heatClock = performance.now();
  stopSizzle();
  renderPaused();
}

function resumeGame() {
  if (state.mode !== 'paused') return;
  state.mode = 'playing';
  state.heatClock = performance.now();
  renderPlaying();
}

function handleScreenAction(event) {
  const button = event.target.closest('[data-action]');
  if (!button) return;
  switch (button.dataset.action) {
    case 'start': startGame(); break;
    case 'continue': startLevel(state.levelIndex + 1); break;
    case 'retry': startLevel(state.levelIndex); break;
    case 'pause': pauseGame(); break;
    case 'resume': resumeGame(); break;
    case 'finish': finishGame(); break;
    default: break;
  }
}

function markContact() {
  const level = preparedLevels[state.levelIndex];
  state.contactIndex++;
  state.segmentProgress = 0;
  state.deviation = 0;
  state.forbidden = false;
  playTone(720 + state.contactIndex * 55, .1);
  if (state.contactIndex >= level.points.length) {
    completeLevel();
  } else {
    const progress = screen.querySelector('.level-meter-track span');
    const count = screen.querySelector('.level-meter-head strong');
    const bar = screen.querySelector('[role="progressbar"]');
    const connected = state.contactIndex - 1;
    if (progress) progress.style.width = `${connected / (level.points.length - 1) * 100}%`;
    if (count) count.textContent = `${connected} / ${level.points.length - 1}`;
    if (bar) bar.setAttribute('aria-valuenow', String(connected));
    ui.hint.textContent = TEXT.contactProgress(connected, level.points.length - 1);
  }
}

function processPoint(point, delta) {
  const level = preparedLevels[state.levelIndex];
  const targetZone = isForbidden(point, level);
  let deviation = Infinity;
  if (!targetZone && state.contactIndex > 0) {
    const route = level.routes[state.contactIndex - 1];
    const tolerance = level.corridor / 2;
    const closest = closestPoint(route, point, Math.max(0, state.segmentProgress - tolerance * .35), route.length);
    deviation = closest.distance;
    if (deviation <= tolerance && closest.along <= state.segmentProgress + Math.max(16, level.corridor * .7)) {
      state.segmentProgress = Math.max(state.segmentProgress, closest.along);
      if (deviation < tolerance * .65) addSparks(point);
      const target = level.points[state.contactIndex];
      if (state.segmentProgress >= route.length - Math.max(13, level.corridor * .28)
        && Math.hypot(point.x - target.x, point.y - target.y) <= Math.max(34, level.corridor * .7)) {
        markContact();
      }
    }
  }
  state.deviation = deviation;
  state.forbidden = Boolean(targetZone);
  updateThermal(delta, deviation, state.forbidden);
}

function handlePointerDown(event) {
  if (state.mode !== 'playing' || (event.pointerType === 'mouse' && event.button !== 0)) return;
  const point = getCanvasPoint(event);
  const tip = currentTip();
  const level = preparedLevels[state.levelIndex];
  const startDistance = Math.hypot(point.x - tip.x, point.y - tip.y);
  if (startDistance > Math.max(58, level.corridor * .78)) {
    ui.hint.textContent = TEXT.wrongStart;
    return;
  }
  event.preventDefault();
  state.dragging = true;
  state.lastPointer = point;
  state.heatClock = performance.now();
  state.deviation = 0;
  state.forbidden = false;
  if (event.isTrusted && canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
  startSizzle();
  canvas.focus({ preventScroll: true });
}

function handlePointerMove(event) {
  if (!state.dragging || state.mode !== 'playing') return;
  event.preventDefault();
  const point = getCanvasPoint(event);
  const previous = state.lastPointer || point;
  const distance = Math.hypot(point.x - previous.x, point.y - previous.y);
  const level = preparedLevels[state.levelIndex];
  const step = Math.max(3, level.corridor * .16);
  const count = Math.max(1, Math.ceil(distance / step));
  const now = performance.now();
  const elapsed = Math.min(.12, Math.max(0, (now - state.heatClock) / 1000));
  state.heatClock = now;
  for (let index = 1; index <= count; index++) {
    const ratio = index / count;
    processPoint({
      x: previous.x + (point.x - previous.x) * ratio,
      y: previous.y + (point.y - previous.y) * ratio
    }, elapsed / count);
    if (state.mode !== 'playing') return;
  }
  state.lastPointer = point;
}

function handlePointerUp(event) {
  if (!state.dragging) return;
  if (event.cancelable) event.preventDefault();
  state.dragging = false;
  state.lastPointer = null;
  state.heatClock = performance.now();
  stopSizzle();
  ui.hint.textContent = TEXT.boardResume;
}

function moveSparks(delta) {
  state.sparks = state.sparks.filter(spark => spark.life > 0);
  for (const spark of state.sparks) {
    spark.x += spark.vx * delta;
    spark.y += spark.vy * delta;
    spark.vy += 90 * delta;
    spark.life -= delta;
  }
}

function roundedRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.stroke();
  }
}

function drawBackground(time) {
  const palette = state.palette;
  const background = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  background.addColorStop(0, palette.bg);
  background.addColorStop(1, palette.boardInset);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.save();
  roundedRect(ctx, 32, 28, 936, 584, 26, palette.board, palette.trace);
  roundedRect(ctx, 48, 44, 904, 552, 18, palette.boardInset, `${palette.trace}66`);
  ctx.beginPath();
  ctx.roundRect(48, 44, 904, 552, 18);
  ctx.clip();
  ctx.globalAlpha = .3;
  ctx.strokeStyle = palette.trace;
  ctx.lineWidth = 2;
  for (let x = 70; x < WIDTH; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 45);
    ctx.lineTo(x, HEIGHT - 45);
    ctx.stroke();
  }
  for (let y = 62; y < HEIGHT; y += 32) {
    ctx.beginPath();
    ctx.moveTo(48, y);
    ctx.lineTo(WIDTH - 48, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = `${palette.trace}88`;
  ctx.lineWidth = 4;
  const accents = [
    [[75, 120], [150, 120], [150, 185]],
    [[925, 120], [850, 120], [850, 168]],
    [[75, 535], [150, 535], [150, 480]],
    [[925, 535], [850, 535], [850, 480]]
  ];
  accents.forEach(points => {
    ctx.beginPath();
    points.forEach(([x, y], index) => index ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.stroke();
  });
  ctx.globalAlpha = .7;
  for (let index = 0; index < 18; index++) {
    const x = 75 + (index * 191) % 850;
    const y = 75 + (index * 83) % 490;
    ctx.fillStyle = index % 2 ? palette.gold : palette.trace;
    ctx.beginPath();
    ctx.arc(x, y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  const level = preparedLevels[state.levelIndex];
  drawComponents(level, time);
}

function drawComponents(level, time) {
  const palette = state.palette;
  const components = [
    { x: 155, y: 115, width: 100, height: 54, label: 'IC · 01' },
    { x: 730, y: 104, width: 120, height: 58, label: 'BGA · CPU' },
    { x: 740, y: 495, width: 128, height: 56, label: 'PMIC' },
    { x: 130, y: 480, width: 94, height: 48, label: 'USB-C' }
  ];
  for (const component of components) {
    roundedRect(ctx, component.x, component.y, component.width, component.height, 9, palette.chip, `${palette.metal}88`);
    ctx.fillStyle = palette.metal;
    ctx.font = '700 11px ui-monospace, monospace';
    ctx.fillText(component.label, component.x + 12, component.y + component.height / 2 + 4);
    ctx.strokeStyle = palette.gold;
    ctx.lineWidth = 4;
    for (let pin = 0; pin < 5; pin++) {
      const px = component.x + 12 + pin * (component.width - 24) / 4;
      ctx.beginPath();
      ctx.moveTo(px, component.y - 7);
      ctx.lineTo(px, component.y);
      ctx.moveTo(px, component.y + component.height);
      ctx.lineTo(px, component.y + component.height + 7);
      ctx.stroke();
    }
  }
  for (const zone of level.zones) {
    roundedRect(ctx, zone.x - 26, zone.y - 21, 52, 42, 7, palette.chip, palette.danger);
    ctx.fillStyle = palette.metal;
    ctx.font = '800 10px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(zone.label, zone.x, zone.y + 4);
    ctx.textAlign = 'left';
    ctx.beginPath();
    ctx.arc(zone.x, zone.y, zone.radius + (reducedMotion ? 0 : Math.sin(time * 4) * 3), 0, Math.PI * 2);
    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = palette.danger;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = palette.danger;
    ctx.font = '700 9px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ZONA PROHIBIDA', zone.x, zone.y + zone.radius + 15);
    ctx.textAlign = 'left';
  }
}

function strokeRoute(route, color, width, alpha, dash = []) {
  if (!route.samples.length) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(route.samples[0].x, route.samples[0].y);
  for (let index = 1; index < route.samples.length; index++) ctx.lineTo(route.samples[index].x, route.samples[index].y);
  ctx.stroke();
  ctx.restore();
}

function strokePartialRoute(route, distance, color, width, alpha) {
  if (distance <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(route.samples[0].x, route.samples[0].y);
  for (let index = 1; index < route.samples.length; index++) {
    const sample = route.samples[index];
    if (sample.distance >= distance) {
      const previous = route.samples[index - 1];
      const span = sample.distance - previous.distance || 1;
      const ratio = (distance - previous.distance) / span;
      ctx.lineTo(previous.x + (sample.x - previous.x) * ratio, previous.y + (sample.y - previous.y) * ratio);
      break;
    }
    ctx.lineTo(sample.x, sample.y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawPath() {
  const level = preparedLevels[state.levelIndex];
  for (let index = 0; index < level.routes.length; index++) {
    const route = level.routes[index];
    strokeRoute(route, state.palette.trace, level.corridor, .14);
    strokeRoute(route, state.palette.trace, 3, .46, [8, 8]);
    if (index < state.contactIndex - 1) {
      strokeRoute(route, state.palette.good, 9, .92);
      strokeRoute(route, '#fff3c4', 3, .95);
    } else if (index === state.contactIndex - 1 && state.segmentProgress > 0) {
      strokePartialRoute(route, state.segmentProgress, state.palette.gold, level.corridor * .34, .82);
      strokePartialRoute(route, state.segmentProgress, '#fff1c1', 4, .98);
    }
  }
  level.points.forEach((point, index) => {
    const isStart = index === 0;
    const isConnected = index < state.contactIndex;
    const isNext = index === state.contactIndex;
    const pulse = reducedMotion ? 0 : Math.sin(performance.now() * .004) * 3;
    const radius = isNext ? 19 + pulse : 15;
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = isConnected ? `${state.palette.good}2a` : isNext ? `${state.palette.brand}30` : `${state.palette.gold}22`;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = isConnected ? state.palette.good : isNext ? state.palette.brand : state.palette.gold;
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = state.palette.boardInset;
    ctx.stroke();
    ctx.fillStyle = state.palette.bg;
    ctx.font = '900 11px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(index + 1), point.x, point.y);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (isStart && state.mode === 'start') {
      ctx.fillStyle = state.palette.gold;
      ctx.font = '800 10px ui-monospace, monospace';
      ctx.fillText('INICIO', point.x - 20, point.y + 36);
    }
  });
}

function drawSparks() {
  ctx.save();
  for (const spark of state.sparks) {
    ctx.globalAlpha = Math.max(0, spark.life / spark.maxLife);
    ctx.fillStyle = state.palette.gold;
    ctx.shadowColor = state.palette.gold;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCanvas(time, delta) {
  if (!canvas.width || !canvas.height) return;
  ctx.setTransform(canvas.width / WIDTH, 0, 0, canvas.height / HEIGHT, 0, 0);
  drawBackground(time / 1000);
  drawPath();
  drawSparks();
  moveSparks(delta);
}

function frame(timestamp) {
  const delta = state.frameClock ? Math.min(.1, Math.max(0, (timestamp - state.frameClock) / 1000)) : 0;
  state.frameClock = timestamp;
  if (state.mode === 'playing') {
    state.secondsLeft = Math.max(0, state.secondsLeft - delta);
    const heatDelta = Math.min(.1, Math.max(0, (performance.now() - state.heatClock) / 1000));
    state.heatClock = performance.now();
    updateThermal(heatDelta, state.deviation, state.forbidden);
    if (state.secondsLeft <= 0 && state.mode === 'playing') failLevel('timeout');
  }
  updateHud();
  drawCanvas(timestamp, delta);
  requestAnimationFrame(frame);
}

screen.addEventListener('click', handleScreenAction);
ui.pause.addEventListener('click', () => state.mode === 'paused' ? resumeGame() : pauseGame());
ui.theme.addEventListener('click', () => {
  const theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  saveTheme(theme);
});
ui.sound.addEventListener('click', () => setSound(!state.soundOn));
canvas.addEventListener('pointerdown', handlePointerDown);
canvas.addEventListener('pointermove', handlePointerMove);
canvas.addEventListener('pointerup', handlePointerUp);
canvas.addEventListener('pointercancel', handlePointerUp);
canvas.addEventListener('lostpointercapture', handlePointerUp);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (state.mode === 'playing') pauseGame();
    else if (state.mode === 'paused') resumeGame();
  }
});
window.addEventListener('blur', pauseGame);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseGame();
});
window.addEventListener('resize', resizeCanvas, { passive: true });
window.addEventListener('orientationchange', resizeCanvas, { passive: true });
window.addEventListener('storage', event => {
  if (event.key !== PREFERENCES_KEY && event.key !== null) return;
  applyTheme(getSavedTheme());
});
if ('ResizeObserver' in window) new ResizeObserver(resizeCanvas).observe(canvas);

safeReadBest();
applyTheme(getSavedTheme());
resizeCanvas();
renderStart();
requestAnimationFrame(frame);
