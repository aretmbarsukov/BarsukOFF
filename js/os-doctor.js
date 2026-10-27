import { submitScore } from './score-api.js';

const TEXT = {
  startTitle: 'OS Doctor:<br /><span>Clean Up!</span>',
  startCopy: '«¡Estoy lleno! Ayúdame…» Clasifica los archivos para liberar espacio y conserva los archivos importantes del sistema.',
  play: 'Jugar',
  pause: 'Pausar',
  resume: 'Reanudar',
  continue: 'Continuar',
  retry: 'Reintentar',
  level: 'Nivel',
  score: 'Puntuación',
  time: 'Tiempo',
  themeLight: 'Tema claro',
  themeDark: 'Tema oscuro',
  sound: 'Sonido',
  soundOn: 'Sonido activado',
  soundOff: 'Sonido desactivado',
  best: score => `Mejor puntuación: ${score}`,
  playHint: 'Arrastra cada archivo a su papelera. Conserva los archivos verdes del sistema.',
  chooseHint: 'Archivo seleccionado. Usa 1, 2 o 3 para elegir una papelera; Enter confirma.',
  correct: (name, combo) => `${name}: espacio liberado${combo > 1 ? ` · combo ×${combo}` : ''}.`,
  wrong: 'Categoría incorrecta: se pierde una vida y aumenta la memoria ocupada.',
  kept: 'Archivo del sistema conservado. ¡Buena decisión!',
  deletedSystem: '¡Era un archivo del sistema! No lo borres.',
  missedSystem: 'Conserva este archivo del sistema o déjalo pasar.',
  levelComplete: level => `Nivel ${level} completado`,
  levelCopy: 'Buen trabajo: has liberado espacio suficiente.',
  finalTitle: '¡Teléfono recuperado!',
  finalCopy: levels => `Has limpiado el dispositivo y completado ${levels} niveles. El teléfono vuelve a funcionar con agilidad.`,
  finalScore: score => `Puntuación final: <strong>${score}</strong>`,
  finalBest: score => `Mejor puntuación: <strong>${score}</strong>`,
  finalService: '¿Tu móvil va lento? Lo dejamos como nuevo en BarsukON',
  book: 'Reservar cita',
  return: 'Volver a BarsukON',
  loseTitle: 'Misión fallida',
  loseLives: 'Te has quedado sin vidas. La memoria del teléfono sigue saturada.',
  loseTime: 'Se agotó el tiempo antes de liberar suficiente espacio.',
  pauseTitle: 'Partida en pausa',
  pauseCopy: 'El teléfono está a salvo. Reanuda cuando estés listo; el temporizador permanece detenido.',
  stars: count => `${count} de 3 estrellas`,
  levelScore: score => `Puntos de la misión: <strong>${score}</strong>`,
  timeBonus: score => `Bonificación de tiempo: <strong>${score}</strong>`,
  target: value => `Objetivo de memoria: ${value} %`,
  saveError: 'No se pudo guardar la puntuación en este dispositivo. La partida sigue disponible.',
  soundError: 'El sonido no está disponible en este navegador.',
  countdown: '00:00'
};

const FILES = {
  photos: [
    { name: 'IMG_2041 (1).jpg', icon: '▧', size: '3,2 MB', reduction: 5.4 },
    { name: 'IMG_1088 copia.jpg', icon: '▧', size: '4,1 MB', reduction: 6.1 },
    { name: 'Vacaciones (2).png', icon: '▧', size: '2,8 MB', reduction: 4.8 },
    { name: 'Selfie_044 duplicada.jpg', icon: '▧', size: '3,7 MB', reduction: 5.8 },
    { name: 'Captura_2024 (1).png', icon: '▧', size: '2,4 MB', reduction: 4.3 }
  ],
  cache: [
    { name: 'cache_preview.tmp', icon: '⌁', size: '2,6 MB', reduction: 5.2 },
    { name: 'thumbs_old.data', icon: '⌁', size: '3,4 MB', reduction: 6.2 },
    { name: 'temp_session_08', icon: '⌁', size: '1,9 MB', reduction: 4.4 },
    { name: 'cache_video.bin', icon: '⌁', size: '4,2 MB', reduction: 6.8 },
    { name: 'index_cache.tmp', icon: '⌁', size: '2,2 MB', reduction: 4.9 }
  ],
  apps: [
    { name: 'Galaxy Quest · datos', icon: '▣', size: '6,8 MB', reduction: 7.3 },
    { name: 'Editor Pro · sin usar', icon: '▣', size: '5,4 MB', reduction: 6.7 },
    { name: 'Video Studio · copia', icon: '▣', size: '7,1 MB', reduction: 7.8 },
    { name: 'Juego Arena · datos', icon: '▣', size: '4,8 MB', reduction: 6.4 },
    { name: 'Notas Plus · antiguo', icon: '▣', size: '3,9 MB', reduction: 5.6 }
  ],
  system: [
    { name: 'config_sistema.dat', icon: '⚙', size: '0,4 MB', reduction: 0 },
    { name: 'actualizacion_core.sys', icon: '⚙', size: '1,2 MB', reduction: 0 },
    { name: 'datos_redes.sec', icon: '⚙', size: '0,8 MB', reduction: 0 },
    { name: 'inicio_dispositivo.sys', icon: '⚙', size: '0,6 MB', reduction: 0 }
  ]
};

const LEVELS = [
  {
    time: 70, target: 39, flow: 2.8, visible: 3, mistakes: 3,
    sequence: ['photos', 'cache', 'photos', 'apps', 'cache', 'photos', 'apps', 'cache', 'photos', 'apps', 'cache', 'photos', 'apps', 'cache']
  },
  {
    time: 64, target: 43, flow: 2.25, visible: 4, mistakes: 3,
    sequence: ['cache', 'photos', 'apps', 'photos', 'cache', 'apps', 'photos', 'cache', 'apps', 'photos', 'cache', 'apps', 'photos', 'cache', 'apps', 'photos', 'cache']
  },
  {
    time: 58, target: 46, flow: 1.9, visible: 4, mistakes: 3,
    sequence: ['photos', 'system', 'cache', 'apps', 'photos', 'cache', 'system', 'apps', 'cache', 'photos', 'apps', 'system', 'cache', 'photos', 'apps', 'cache', 'photos', 'apps', 'cache']
  },
  {
    time: 52, target: 48, flow: 1.55, visible: 5, mistakes: 3,
    sequence: ['apps', 'photos', 'cache', 'system', 'apps', 'cache', 'photos', 'apps', 'system', 'cache', 'photos', 'apps', 'cache', 'photos', 'system', 'apps', 'cache', 'photos', 'apps', 'cache', 'photos']
  },
  {
    time: 46, target: 50, flow: 1.25, visible: 5, mistakes: 3,
    sequence: ['cache', 'apps', 'photos', 'system', 'cache', 'photos', 'apps', 'cache', 'system', 'photos', 'apps', 'cache', 'photos', 'apps', 'system', 'cache', 'apps', 'photos', 'cache', 'apps', 'photos', 'cache', 'apps']
  }
];

const KEYS = {
  current: 'barsukon-os-doctor-current',
  best: 'barsukon-os-doctor-best',
  preferences: 'barsukon-preferences'
};

const ui = {
  level: document.getElementById('levelValue'),
  timer: document.getElementById('timerValue'),
  score: document.getElementById('scoreValue'),
  memory: document.getElementById('memoryValue'),
  memoryFill: document.getElementById('memoryFill'),
  memoryTrack: document.querySelector('.memory-track'),
  lives: document.getElementById('livesValue'),
  arena: document.getElementById('arena'),
  grid: document.getElementById('fileGrid'),
  empty: document.getElementById('emptyMessage'),
  hint: document.getElementById('boardHint'),
  screen: document.getElementById('screenPanel'),
  start: document.getElementById('startButton'),
  pause: document.getElementById('pauseButton'),
  theme: document.getElementById('themeButton'),
  themeLabel: document.getElementById('themeLabel'),
  sound: document.getElementById('soundButton'),
  soundLabel: document.getElementById('soundLabel'),
  record: document.getElementById('recordLabel')
};

const state = {
  mode: 'start',
  level: 0,
  score: 0,
  best: 0,
  memory: 98,
  lives: 3,
  combo: 0,
  seconds: 0,
  clock: 0,
  spawnClock: 0,
  nextIndex: 0,
  items: [],
  selectedId: null,
  dragging: null,
  nextId: 1,
  soundOn: false,
  audio: null,
  submitted: false,
  lastFrame: 0,
  reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
};

const formatNumber = value => Math.max(0, Math.round(value)).toLocaleString('es-ES');

function safeRead(key, fallback = 0) {
  try {
    return Math.max(0, Number(localStorage.getItem(key)) || fallback);
  } catch (error) {
    console.warn('No se pudo leer la puntuación local de OS Doctor.', error);
    return fallback;
  }
}

function safeSaveScores() {
  state.best = Math.max(state.best, state.score);
  try {
    localStorage.setItem(KEYS.current, String(state.score));
    localStorage.setItem(KEYS.best, String(state.best));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar la puntuación local de OS Doctor.', error);
    return false;
  }
}

function updateHud() {
  const level = LEVELS[state.level];
  ui.level.textContent = `${state.level + 1} / ${LEVELS.length}`;
  ui.timer.textContent = formatTime(state.seconds);
  ui.score.textContent = formatNumber(state.score);
  ui.memory.textContent = `${Math.ceil(state.memory)} %`;
  ui.memoryFill.style.width = `${Math.max(0, Math.min(100, state.memory))}%`;
  ui.memoryTrack.setAttribute('aria-valuenow', String(Math.ceil(state.memory)));
  ui.lives.textContent = `${'♥ '.repeat(state.lives)}${'♡ '.repeat(3 - state.lives)}`.trim();
  ui.lives.setAttribute('aria-label', `${state.lives} de 3 vidas`);
  ui.empty.hidden = state.items.length > 0;
  if (state.mode === 'playing') {
    ui.hint.textContent = state.selectedId ? TEXT.chooseHint : TEXT.playHint;
  }
  return level;
}

function formatTime(seconds) {
  const total = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function applyTheme(theme) {
  const isLight = theme === 'light';
  document.body.dataset.theme = isLight ? 'light' : 'dark';
  ui.theme.setAttribute('aria-pressed', String(isLight));
  ui.theme.setAttribute('aria-label', isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  ui.themeLabel.textContent = isLight ? TEXT.themeLight : TEXT.themeDark;
}

function readTheme() {
  try {
    const prefs = JSON.parse(localStorage.getItem(KEYS.preferences) || '{}');
    return prefs.theme === 'light' ? 'light' : 'dark';
  } catch (error) {
    console.warn('No se pudo leer el tema guardado de BarsukON.', error);
    return 'dark';
  }
}

function saveTheme(theme) {
  try {
    const prefs = JSON.parse(localStorage.getItem(KEYS.preferences) || '{}');
    prefs.theme = theme;
    localStorage.setItem(KEYS.preferences, JSON.stringify(prefs));
  } catch (error) {
    console.warn('No se pudo guardar el tema de BarsukON en este dispositivo.', error);
  }
}

function playTone(frequency, duration = .09, type = 'sine') {
  if (!state.soundOn) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) throw new Error('Web Audio API no disponible');
    state.audio ||= new AudioContext();
    if (state.audio.state === 'suspended') state.audio.resume();
    const oscillator = state.audio.createOscillator();
    const gain = state.audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.055, state.audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, state.audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(state.audio.destination);
    oscillator.start();
    oscillator.stop(state.audio.currentTime + duration);
  } catch (error) {
    console.warn(TEXT.soundError, error);
    ui.hint.textContent = TEXT.soundError;
    state.soundOn = false;
    ui.sound.setAttribute('aria-pressed', 'false');
    ui.soundLabel.textContent = TEXT.soundOff;
  }
}

function toast(message) {
  const oldToast = document.querySelector('.toast');
  oldToast?.remove();
  const element = document.createElement('div');
  element.className = 'toast';
  element.setAttribute('role', 'status');
  element.textContent = message;
  document.body.append(element);
  window.setTimeout(() => element.remove(), 1500);
}

function showStart() {
  ui.screen.innerHTML = `
    <p class="eyebrow">// RETO DE MANTENIMIENTO · OS</p>
    <h2>${TEXT.startTitle}</h2>
    <p class="speech-bubble">«¡Estoy lleno! Ayúdame…»</p>
    <p class="screen-copy">${TEXT.startCopy}</p>
    <ol class="instruction-list">
      <li><span>01</span><span>Arrastra cada archivo a la categoría correcta.</span></li>
      <li><span>02</span><span>Conserva los archivos verdes del sistema.</span></li>
      <li><span>03</span><span>Evita errores, encadena combos y baja la memoria al objetivo.</span></li>
    </ol>
    <p class="record-label" id="recordLabel">${TEXT.best(formatNumber(state.best))}</p>
    <button id="startButton" class="primary-button" type="button" aria-label="Jugar"><span>Jugar</span><span aria-hidden="true">↗</span></button>
    <p class="keyboard-hint">Flechas: elegir archivo · 1/2/3: categoría · Enter: confirmar</p>`;
  ui.start = document.getElementById('startButton');
  ui.start.addEventListener('click', startGame);
  ui.pause.disabled = true;
  ui.pause.setAttribute('aria-pressed', 'false');
  ui.pause.textContent = TEXT.pause;
  state.mode = 'start';
  ui.hint.textContent = 'Pulsa «Jugar» para revisar el almacenamiento del teléfono.';
}

function showMessage({ title, body, buttons, detail = '' }) {
  ui.screen.innerHTML = `
    <p class="eyebrow">// ${state.mode === 'paused' ? 'MODO ESPERA' : 'DIAGNÓSTICO DEL DISPOSITIVO'}</p>
    <h2>${title}</h2>
    <p class="screen-copy">${body}</p>
    ${detail ? `<div class="status-box">${detail}</div>` : ''}
    <div class="mission-actions">${buttons.map(button => `<button class="${button.primary ? 'primary-button' : 'secondary-button'}" type="button" data-action="${button.action}" aria-label="${button.label}">${button.label}</button>`).join('')}</div>
    ${state.mode === 'paused' ? `<p class="keyboard-hint">${TEXT.resumeHint || 'Pulsa Escape o selecciona «Reanudar» para volver a la partida.'}</p>` : ''}`;
  ui.screen.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => handleAction(button.dataset.action)));
}

function makeSequence(level) {
  return level.sequence.map((category, index) => {
    const pool = FILES[category];
    const file = pool[Math.floor((index * 2 + state.level) % pool.length)];
    return {
      ...file,
      category,
      system: category === 'system',
      id: state.nextId++,
      sequenceIndex: index
    };
  });
}

function beginLevel() {
  const level = LEVELS[state.level];
  state.mode = 'playing';
  state.seconds = level.time;
  state.clock = 0;
  state.spawnClock = 0;
  state.nextIndex = 0;
  state.items = [];
  state.selectedId = null;
  state.dragging = null;
  state.memory = 98;
  state.levelItems = makeSequence(level);
  ui.pause.disabled = false;
  ui.pause.setAttribute('aria-label', 'Pausar partida');
  ui.pause.textContent = TEXT.pause;
  ui.pause.setAttribute('aria-pressed', 'false');
  ui.arena.setAttribute('aria-label', `Nivel ${state.level + 1}: zona de clasificación de archivos`);
  showMessage({
    title: `Nivel ${state.level + 1}`,
    body: `Libera espacio hasta llegar al ${level.target} % o menos. Tienes ${level.time} segundos y ${level.mistakes} vidas.`,
    detail: `<strong>${TEXT.target(level.target)}</strong><br />Los archivos del sistema aparecen desde el nivel 3. Consérvalos con el botón o deslízalos hacia un lado.`,
    buttons: [{ action: 'begin', label: 'Empezar nivel', primary: true }]
  });
  ui.hint.textContent = `Nivel ${state.level + 1}: libera espacio hasta el ${level.target} %.`;
  updateHud();
}

function startGame() {
  state.level = 0;
  state.score = 0;
  state.lives = 3;
  state.combo = 0;
  state.submitted = false;
  state.nextId = 1;
  beginLevel();
}

function startClock() {
  state.mode = 'playing';
  ui.screen.innerHTML = `
    <p class="eyebrow">// NIVEL ${state.level + 1} · LIMPIEZA EN CURSO</p>
    <h2>Libera<br /><span>espacio</span></h2>
    <p class="speech-bubble">«¡Un poco más y respiro!»</p>
    <p class="screen-copy">Clasifica los archivos antes de que termine el tiempo. Los archivos del sistema deben conservarse.</p>
    <div class="level-meter"><div class="level-meter-head"><span>Memoria ocupada</span><strong>${TEXT.target(LEVELS[state.level].target)}</strong></div><div class="level-meter-track"><span style="width:${state.memory}%"></span></div></div>
    <p class="record-label">${TEXT.best(formatNumber(state.best))}</p>
    <p class="keyboard-hint">Flechas: elegir archivo · 1/2/3: categoría · Enter: confirmar</p>`;
  ui.pause.focus({ preventScroll: true });
}

function createFileNode(file) {
  const wrap = document.createElement('div');
  wrap.className = 'file-card-wrap';
  wrap.dataset.fileId = String(file.id);
  const card = document.createElement('div');
  card.className = `file-card${file.system ? ' file-system' : ''}`;
  card.dataset.fileId = String(file.id);
  card.tabIndex = 0;
  card.setAttribute('role', 'button');
  card.setAttribute('aria-pressed', 'false');
  const categoryName = file.system ? 'Sistema · conservar' : `${file.category === 'photos' ? 'Foto duplicada' : file.category === 'cache' ? 'Caché' : 'Aplicación pesada'}`;
  card.setAttribute('aria-label', `${file.name}, ${file.size}, ${categoryName}. Arrastra a una categoría o usa las teclas 1, 2 y 3.`);
  card.innerHTML = `
    <div class="file-card-top">
      <span class="file-icon" aria-hidden="true">${file.icon}</span>
      <span class="file-labels"><span class="file-name"></span><span class="file-category">${file.system ? '⚙ SISTEMA' : `${file.category === 'photos' ? '▧ FOTO' : file.category === 'cache' ? '⌁ CACHÉ' : '▣ APP'}`}</span></span>
    </div>
    <span class="file-size"></span>`;
  card.querySelector('.file-name').textContent = file.name;
  card.querySelector('.file-size').textContent = file.size;
  card.addEventListener('pointerdown', event => beginDrag(event, file.id, card));
  card.addEventListener('pointermove', moveDrag);
  card.addEventListener('pointerup', endDrag);
  card.addEventListener('pointercancel', cancelDrag);
  card.addEventListener('keydown', event => onFileKeydown(event, file.id));
  wrap.append(card);
  if (file.system) {
    const conserve = document.createElement('button');
    conserve.type = 'button';
    conserve.className = 'file-conserve';
    conserve.dataset.conserve = String(file.id);
    conserve.setAttribute('aria-label', `Conservar archivo del sistema ${file.name}`);
    conserve.textContent = '✓ Conservar';
    conserve.addEventListener('click', () => keepSystem(file.id));
    wrap.append(conserve);
  }
  return wrap;
}

function renderFiles() {
  const fragment = document.createDocumentFragment();
  state.items.forEach(file => fragment.append(createFileNode(file)));
  ui.grid.replaceChildren(fragment);
  if (state.selectedId !== null) {
    const selected = ui.grid.querySelector(`[data-file-id="${state.selectedId}"].file-card`);
    selected?.setAttribute('aria-pressed', 'true');
  }
  updateHud();
}

function spawnFiles() {
  const level = LEVELS[state.level];
  let added = false;
  while (state.items.length < level.visible && state.nextIndex < state.levelItems.length) {
    state.items.push(state.levelItems[state.nextIndex++]);
    added = true;
  }
  if (added) {
    renderFiles();
    ui.grid.querySelector('.file-card:last-of-type')?.animate?.(
      state.reducedMotion ? [] : [{ opacity: 0, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: state.reducedMotion ? 0 : 140 }
    );
  }
}

function beginDrag(event, id, card) {
  if (state.mode !== 'playing' || event.button > 0) return;
  event.preventDefault();
  state.selectedId = id;
  state.dragging = {
    id,
    pointerId: event.pointerId,
    card,
    x: event.clientX,
    y: event.clientY,
    dx: 0,
    dy: 0
  };
  card.setPointerCapture(event.pointerId);
  card.setAttribute('aria-pressed', 'true');
  card.classList.add('is-dragging');
  card.focus({ preventScroll: true });
}

function moveDrag(event) {
  if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
  const drag = state.dragging;
  drag.dx = event.clientX - drag.x;
  drag.dy = event.clientY - drag.y;
  drag.card.style.transform = `translate(${drag.dx}px, ${drag.dy}px)`;
  const hit = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-basket]');
  document.querySelectorAll('.basket').forEach(basket => basket.classList.toggle('is-target', basket === hit));
}

function clearDrag() {
  document.querySelectorAll('.basket.is-target').forEach(basket => basket.classList.remove('is-target'));
  state.dragging?.card.classList.remove('is-dragging');
  if (state.dragging) state.dragging.card.style.transform = '';
  state.dragging = null;
}

function endDrag(event) {
  const drag = state.dragging;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-basket]');
  const horizontalConserve = Math.abs(drag.dx) > 85 && Math.abs(drag.dx) > Math.abs(drag.dy) * 1.35;
  const file = state.items.find(item => item.id === drag.id);
  clearDrag();
  if (target) {
    sortFile(drag.id, target.dataset.basket);
  } else if (file?.system && horizontalConserve) {
    keepSystem(drag.id);
  } else {
    state.selectedId = drag.id;
    renderFiles();
  }
}

function cancelDrag(event) {
  if (state.dragging && event.pointerId === state.dragging.pointerId) {
    const id = state.dragging.id;
    clearDrag();
    state.selectedId = id;
    renderFiles();
  }
}

function removeFile(id) {
  state.items = state.items.filter(file => file.id !== id);
  if (state.selectedId === id) state.selectedId = null;
  state.spawnClock = 0;
  renderFiles();
}

function sortFile(id, basket) {
  if (state.mode !== 'playing') return;
  const file = state.items.find(item => item.id === id);
  if (!file) return;
  if (file.system) {
    state.lives -= 1;
    state.combo = 0;
    state.memory = Math.min(100, state.memory + 5);
    removeFile(id);
    playTone(155, .22, 'sawtooth');
    toast(TEXT.deletedSystem);
    updateHud();
    if (state.lives <= 0) endGame(false, 'lives');
    return;
  }
  if (file.category === basket) {
    state.combo += 1;
    const points = Math.round((100 + file.reduction * 24) * Math.min(state.combo, 6));
    state.score += points;
    state.memory = Math.max(0, state.memory - file.reduction);
    removeFile(id);
    playTone(660 + Math.min(state.combo, 6) * 45, .11);
    ui.hint.textContent = TEXT.correct(file.name, state.combo);
    safeSaveScores();
    updateHud();
    if (state.memory <= LEVELS[state.level].target) completeLevel();
    return;
  }
  state.lives -= 1;
  state.combo = 0;
  state.memory = Math.min(100, state.memory + 4);
  removeFile(id);
  playTone(180, .2, 'square');
  ui.hint.textContent = TEXT.wrong;
  updateHud();
  if (state.lives <= 0) endGame(false, 'lives');
}

function keepSystem(id) {
  if (state.mode !== 'playing') return;
  const file = state.items.find(item => item.id === id && item.system);
  if (!file) return;
  state.combo += 1;
  state.score += 45 * Math.min(state.combo, 6);
  removeFile(id);
  playTone(880, .1);
  ui.hint.textContent = TEXT.kept;
}

function onFileKeydown(event, id) {
  if (state.mode !== 'playing') return;
  const cards = [...ui.grid.querySelectorAll('.file-card')];
  const index = cards.findIndex(card => Number(card.dataset.fileId) === id);
  if (['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) {
    event.preventDefault();
    const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
    const next = cards[(index + direction + cards.length) % cards.length];
    if (next) {
      state.selectedId = Number(next.dataset.fileId);
      renderFiles();
      ui.grid.querySelector(`[data-file-id="${state.selectedId}"].file-card`)?.focus();
    }
    return;
  }
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    state.selectedId = id;
    if (state.items.find(file => file.id === id)?.system) keepSystem(id);
    else ui.hint.textContent = TEXT.chooseHint;
  }
}

function selectBasket(key) {
  const file = state.items.find(item => item.id === state.selectedId);
  if (!file) {
    state.selectedId = state.items[0]?.id ?? null;
  }
  const selected = state.items.find(item => item.id === state.selectedId);
  if (!selected) return;
  if (selected.system) {
    if (key === 'Escape') keepSystem(selected.id);
    else ui.hint.textContent = TEXT.missedSystem;
    return;
  }
  const baskets = { '1': 'photos', '2': 'cache', '3': 'apps' };
  if (baskets[key]) sortFile(selected.id, baskets[key]);
}

function completeLevel() {
  if (state.mode !== 'playing') return;
  state.mode = 'levelComplete';
  state.combo += 1;
  const level = LEVELS[state.level];
  const timeBonus = Math.round(state.seconds * 18);
  const levelScore = state.score + timeBonus;
  state.score += timeBonus;
  const stars = state.lives === 3 && state.memory <= level.target - 12 && state.seconds > level.time * .35 ? 3
    : state.lives >= 2 && state.seconds > 8 ? 2 : 1;
  safeSaveScores();
  playTone(740, .14);
  window.setTimeout(() => playTone(990, .2), 100);
  const isFinal = state.level === LEVELS.length - 1;
  showMessage({
    title: TEXT.levelComplete(state.level + 1),
    body: isFinal ? TEXT.finalCopy(LEVELS.length) : TEXT.levelCopy,
    detail: `<div class="stars" aria-label="${TEXT.stars(stars)}">${'★'.repeat(stars)}<span>${'★'.repeat(3 - stars)}</span></div><p>${TEXT.levelScore(levelScore)}</p><p>${TEXT.timeBonus(timeBonus)}</p><p>${TEXT.target(level.target)}</p>`,
    buttons: [{ action: isFinal ? 'finish' : 'continue', label: isFinal ? 'Ver resultado final' : TEXT.continue, primary: true }]
  });
  ui.pause.disabled = true;
  ui.hint.textContent = `Nivel ${state.level + 1} completado.`;
}

function submitFinalScore() {
  if (state.submitted) return;
  state.submitted = true;
  safeSaveScores();
  try {
    const result = submitScore('os-doctor', state.score, {
      levelsCompleted: state.level + (state.mode === 'victory' ? 1 : 0),
      livesRemaining: state.lives,
      memoryRemaining: Math.ceil(state.memory),
      reason: state.mode === 'victory' ? 'completed' : 'failed'
    });
    if (!result.saved) ui.hint.textContent = TEXT.saveError;
  } catch (error) {
    console.error('No se pudo registrar la puntuación de OS Doctor.', error);
    ui.hint.textContent = TEXT.saveError;
  }
}

function endGame(victory, reason = 'time') {
  state.mode = victory ? 'victory' : 'gameOver';
  state.dragging?.card.classList.remove('is-dragging');
  state.dragging = null;
  ui.pause.disabled = true;
  submitFinalScore();
  if (!victory) {
    showMessage({
      title: 'Cortocircuito',
      body: reason === 'lives' ? TEXT.loseLives : TEXT.loseTime,
      detail: `<strong>${TEXT.finalScore(formatNumber(state.score))}</strong><br />${TEXT.finalBest(formatNumber(state.best))}`,
      buttons: [
        { action: 'retry', label: TEXT.retry, primary: true },
        { action: 'return', label: TEXT.return }
      ]
    });
    ui.hint.textContent = reason === 'lives' ? TEXT.loseLives : TEXT.loseTime;
    playTone(115, .3, 'sawtooth');
    return;
  }
  showFinal();
}

function showFinal() {
  state.mode = 'victory';
  showMessage({
    title: TEXT.finalTitle,
    body: TEXT.finalCopy(LEVELS.length),
    detail: `<strong>${TEXT.finalScore(formatNumber(state.score))}</strong><br />${TEXT.finalBest(formatNumber(state.best))}<p>${TEXT.finalService}</p>`,
    buttons: [
      { action: 'book', label: TEXT.book, primary: true },
      { action: 'return', label: TEXT.return }
    ]
  });
}

function pauseGame() {
  if (state.mode === 'paused') {
    state.mode = 'playing';
    ui.screen.innerHTML = `
      <p class="eyebrow">// NIVEL ${state.level + 1} · LIMPIEZA EN CURSO</p>
      <h2>Libera<br /><span>espacio</span></h2>
      <p class="speech-bubble">«¡Un poco más y respiro!»</p>
      <p class="screen-copy">Clasifica los archivos antes de que termine el tiempo. Los archivos del sistema deben conservarse.</p>
      <div class="level-meter"><div class="level-meter-head"><span>Memoria ocupada</span><strong>${TEXT.target(LEVELS[state.level].target)}</strong></div><div class="level-meter-track"><span style="width:${state.memory}%"></span></div></div>
      <p class="record-label">${TEXT.best(formatNumber(state.best))}</p>
      <p class="keyboard-hint">Flechas: elegir archivo · 1/2/3: categoría · Enter: confirmar</p>`;
    ui.pause.textContent = TEXT.pause;
    ui.pause.setAttribute('aria-label', 'Pausar partida');
    ui.pause.setAttribute('aria-pressed', 'false');
    ui.hint.textContent = TEXT.playHint;
    ui.pause.focus({ preventScroll: true });
    return;
  }
  if (state.mode !== 'playing') return;
  state.mode = 'paused';
  if (state.dragging) {
    state.selectedId = state.dragging.id;
    clearDrag();
  }
  showMessage({
    title: TEXT.pauseTitle,
    body: TEXT.pauseCopy,
    buttons: [{ action: 'resume', label: TEXT.resume, primary: true }]
  });
  ui.pause.textContent = TEXT.resume;
  ui.pause.setAttribute('aria-label', 'Reanudar partida');
  ui.pause.setAttribute('aria-pressed', 'true');
  ui.hint.textContent = 'Partida en pausa.';
}

function handleAction(action) {
  if (action === 'begin') startClock();
  else if (action === 'continue') {
    state.level += 1;
    beginLevel();
  } else if (action === 'finish') {
    state.mode = 'victory';
    submitFinalScore();
    showFinal();
  } else if (action === 'resume') pauseGame();
  else if (action === 'retry') startGame();
  else if (action === 'return' || action === 'book') {
    window.location.href = './index.html#' + (action === 'book' ? 'contact' : 'games');
  }
}

function update(delta) {
  if (state.mode !== 'playing') return;
  state.clock += delta;
  state.seconds = Math.max(0, state.seconds - delta);
  state.spawnClock += delta;
  const level = LEVELS[state.level];
  if (state.spawnClock >= level.flow && state.nextIndex < state.levelItems.length && state.items.length < level.visible) {
    state.spawnClock = 0;
    spawnFiles();
  }
  if (state.seconds <= 0) {
    endGame(false, 'time');
    return;
  }
  updateHud();
}

function frame(timestamp) {
  if (!state.lastFrame) state.lastFrame = timestamp;
  const delta = Math.min((timestamp - state.lastFrame) / 1000, .05);
  state.lastFrame = timestamp;
  update(delta);
  window.requestAnimationFrame(frame);
}

ui.start.addEventListener('click', startGame);
ui.pause.addEventListener('click', pauseGame);
ui.theme.addEventListener('click', () => {
  const theme = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(theme);
  saveTheme(theme);
});
ui.sound.addEventListener('click', () => {
  state.soundOn = !state.soundOn;
  ui.sound.setAttribute('aria-pressed', String(state.soundOn));
  ui.sound.setAttribute('aria-label', state.soundOn ? 'Desactivar sonido' : 'Activar sonido');
  ui.soundLabel.textContent = state.soundOn ? TEXT.soundOn : TEXT.sound;
  if (state.soundOn) playTone(540, .09);
});
document.querySelectorAll('[data-basket]').forEach(button => button.addEventListener('click', () => {
  const selected = state.items.find(file => file.id === state.selectedId);
  if (selected) sortFile(selected.id, button.dataset.basket);
  else ui.hint.textContent = 'Selecciona primero un archivo.';
}));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (state.mode === 'playing' || state.mode === 'paused') {
      event.preventDefault();
      pauseGame();
    } else if (state.mode === 'start') {
      ui.start.focus();
    }
    return;
  }
  if (['1', '2', '3'].includes(event.key) && state.mode === 'playing') {
    event.preventDefault();
    selectBasket(event.key);
  } else if (event.key === 'Enter' && state.mode === 'playing' && state.selectedId !== null && document.activeElement === document.body) {
    event.preventDefault();
    selectBasket('Enter');
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden && state.mode === 'playing') pauseGame();
});

state.best = safeRead(KEYS.best);
ui.record.textContent = TEXT.best(formatNumber(state.best));
applyTheme(readTheme());
ui.soundLabel.textContent = TEXT.sound;
updateHud();
window.requestAnimationFrame(frame);
