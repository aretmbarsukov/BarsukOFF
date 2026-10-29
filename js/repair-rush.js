import { submitScore } from './score-api.js';

const MAX_SCORE = 1000;
const DURATION = 60;
const BEST_KEY = 'barsukon-repair-rush-best';
const PREFERENCES_KEY = 'barsukon-preferences';
const CASES = [
  { id: 'charge', title: 'El teléfono no carga', symptom: 'El cable está conectado, pero la batería sigue bajando. No hay señal de humedad.', signal: '⌁', answer: 'Medir consumo del puerto USB-C', distractors: ['Probar un módulo de pantalla', 'Medir el desgaste de batería', 'Revisar el circuito de audio'] },
  { id: 'display', title: 'La imagen parpadea', symptom: 'El táctil responde, pero la pantalla muestra líneas al mover el teléfono.', signal: '▥', answer: 'Probar un módulo de pantalla', distractors: ['Limpiar el puerto de carga', 'Revisar el circuito de audio', 'Comprobar el consumo en reposo'] },
  { id: 'battery', title: 'Se apaga al 30 %', symptom: 'La carga cae de golpe y el equipo se apaga al abrir la cámara.', signal: '◒', answer: 'Medir el desgaste de batería', distractors: ['Probar un módulo de pantalla', 'Limpiar el puerto de carga', 'Revisar el circuito de audio'] },
  { id: 'water', title: 'Se mojó ayer', symptom: 'No enciende después de una salpicadura. La batería no está deformada.', signal: '⌁', answer: 'Desconectar batería e inspeccionar corrosión', distractors: ['Probar un módulo de pantalla', 'Medir el desgaste de batería', 'Revisar el circuito de audio'] },
  { id: 'audio', title: 'No se oye en llamadas', symptom: 'El altavoz funciona, pero el auricular superior está completamente mudo.', signal: '◖', answer: 'Revisar el circuito de audio', distractors: ['Limpiar el puerto de carga', 'Medir el desgaste de batería', 'Probar un módulo de pantalla'] },
  { id: 'heat', title: 'Se calienta en reposo', symptom: 'La temperatura sube incluso con la pantalla apagada y sin apps abiertas.', signal: '⌁', answer: 'Comprobar el consumo en reposo', distractors: ['Probar un módulo de pantalla', 'Revisar el circuito de audio', 'Limpiar el puerto de carga'] }
];

const ui = {
  theme: document.getElementById('themeButton'),
  themeLabel: document.getElementById('themeLabel'),
  timer: document.getElementById('timerValue'),
  score: document.getElementById('scoreValue'),
  combo: document.getElementById('comboValue'),
  repairs: document.getElementById('repairValue'),
  timerFill: document.getElementById('timerFill'),
  timerTrack: document.querySelector('.timer-track'),
  caseNumber: document.getElementById('caseNumber'),
  difficulty: document.getElementById('caseDifficulty'),
  card: document.getElementById('caseCard'),
  title: document.getElementById('caseTitle'),
  symptoms: document.getElementById('caseSymptoms'),
  signal: document.getElementById('deviceSignal'),
  choices: document.getElementById('choiceGrid'),
  feedback: document.getElementById('feedback'),
  dailyCode: document.getElementById('dailyCode'),
  best: document.getElementById('bestValue'),
  share: document.getElementById('shareButton')
};

const state = { running: false, finished: false, seconds: DURATION, score: 0, combo: 0, repairs: 0, mistakes: 0, maxCombo: 0, roundStartedAt: 0, cases: [], caseIndex: 0, lastScore: 0 };
const dateKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let next = value;
    next = Math.imul(next ^ next >>> 15, next | 1);
    next ^= next + Math.imul(next ^ next >>> 7, next | 61);
    return ((next ^ next >>> 14) >>> 0) / 4294967296;
  };
}

function shuffled(items, random) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function loadBest() {
  try { return Math.min(MAX_SCORE, Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0)); }
  catch { return 0; }
}

function saveBest(score) {
  try { localStorage.setItem(BEST_KEY, String(Math.max(loadBest(), score))); } catch {}
  ui.best.textContent = `${Math.max(loadBest(), score)} / ${MAX_SCORE}`;
}

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.dataset.theme = light ? 'light' : 'dark';
  ui.theme.setAttribute('aria-pressed', String(light));
  ui.theme.setAttribute('aria-label', light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  ui.themeLabel.textContent = light ? 'Tema claro' : 'Tema oscuro';
}

function readTheme() {
  try { return JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}').theme === 'light' ? 'light' : 'dark'; }
  catch { return 'dark'; }
}

function setFeedback(message, kind = '') {
  ui.feedback.textContent = message;
  ui.feedback.dataset.kind = kind;
}

function updateHud() {
  ui.timer.textContent = String(state.seconds).padStart(2, '0');
  ui.timer.classList.toggle('is-low', state.seconds <= 10);
  ui.score.textContent = String(state.score);
  ui.combo.textContent = `×${state.combo}`;
  ui.repairs.textContent = String(state.repairs);
  ui.timerFill.style.width = `${state.seconds / DURATION * 100}%`;
  ui.timerTrack.setAttribute('aria-valuenow', String(state.seconds));
}

function renderRound() {
  if (!state.running) return;
  const ticket = state.cases[state.caseIndex % state.cases.length];
  const random = seededRandom(dateKey.split('-').join('') * 1 + state.caseIndex * 173);
  ui.caseNumber.textContent = `ORDEN ${String(state.repairs + state.mistakes + 1).padStart(2, '0')}`;
  ui.difficulty.textContent = state.repairs < 4 ? 'DIAGNÓSTICO' : state.repairs < 9 ? 'TURNO INTENSIVO' : 'TURNO EXPERTO';
  ui.card.style.setProperty('--case-color', ticket.id === 'water' ? 'var(--blue, #6bb9ff)' : ticket.id === 'heat' ? 'var(--red)' : 'var(--brand)');
  ui.title.textContent = ticket.title;
  ui.symptoms.textContent = ticket.symptom;
  ui.signal.textContent = ticket.signal;
  const choices = shuffled([ticket.answer, ...ticket.distractors], random);
  ui.choices.replaceChildren(...choices.map((choice, index) => {
    const button = document.createElement('button');
    button.className = 'choice-button';
    button.type = 'button';
    button.dataset.answer = choice === ticket.answer ? 'true' : 'false';
    const key = document.createElement('span');
    key.className = 'choice-key';
    key.textContent = String(index + 1);
    const label = document.createElement('span');
    label.textContent = choice;
    button.append(key, label);
    return button;
  }));
  state.roundStartedAt = performance.now();
}

function startGame() {
  const numericDate = Number(dateKey.split('-').join(''));
  state.cases = shuffled(CASES, seededRandom(numericDate));
  state.running = true;
  state.finished = false;
  state.seconds = DURATION;
  state.score = 0;
  state.combo = 0;
  state.repairs = 0;
  state.mistakes = 0;
  state.maxCombo = 0;
  state.caseIndex = 0;
  ui.share.disabled = true;
  ui.dailyCode.textContent = `RETO ${dateKey.replaceAll('-', '')}`;
  renderRound();
  updateHud();
  setFeedback('Turno en marcha. Elige la comprobación que mejor encaja.');
}

function endGame() {
  if (state.finished) return;
  state.running = false;
  state.finished = true;
  state.lastScore = state.score;
  const best = Math.max(loadBest(), state.score);
  saveBest(best);
  ui.share.disabled = false;
  ui.caseNumber.textContent = state.repairs ? `${state.repairs} REPARACIONES` : 'TURNO FINALIZADO';
  ui.difficulty.textContent = `${state.mistakes} ERRORES · MEJOR COMBO ×${state.maxCombo}`;
  ui.title.textContent = state.score >= 800 ? '¡Turno impecable!' : state.score >= 450 ? 'Buen trabajo, equipo.' : 'El taller vuelve a abrir.';
  ui.symptoms.textContent = `Has resuelto ${state.repairs} casos y marcado ${state.score} de 1000 puntos. Tu mejor marca es ${best}.`;
  ui.signal.textContent = state.score >= 800 ? '✦' : '↻';
  ui.choices.replaceChildren();
  const replay = document.createElement('button');
  replay.type = 'button';
  replay.className = 'choice-button';
  replay.dataset.action = 'restart';
  replay.innerHTML = '<span class="choice-key">↻</span><span>Jugar el reto diario otra vez</span>';
  ui.choices.append(replay);
  setFeedback('Tu resultado se guardará en la clasificación si has iniciado sesión.', 'good');
  submitScore('repair-rush', state.score, { dailyCase: dateKey, repairs: state.repairs, mistakes: state.mistakes, maxCombo: state.maxCombo });
  updateHud();
}

function chooseAnswer(button) {
  if (!state.running) {
    if (button.dataset.action === 'start' || button.dataset.action === 'restart') startGame();
    return;
  }
  const ticket = state.cases[state.caseIndex % state.cases.length];
  const correct = button.dataset.answer === 'true';
  const elapsed = performance.now() - state.roundStartedAt;
  ui.choices.querySelectorAll('button').forEach(choice => {
    choice.disabled = true;
    if (choice.dataset.answer === 'true') choice.classList.add('is-correct');
  });
  if (correct) {
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.repairs++;
    const speedBonus = Math.max(0, Math.round(30 * (1 - elapsed / 8000)));
    state.score = Math.min(MAX_SCORE, state.score + 62 + speedBonus + Math.min(24, state.combo * 2));
    setFeedback(state.combo >= 4 ? `Diagnóstico confirmado. ¡Combo ×${state.combo}!` : 'Comprobación correcta. Siguiente teléfono.', 'good');
  } else {
    state.combo = 0;
    state.mistakes++;
    state.seconds = Math.max(0, state.seconds - 5);
    button.classList.add('is-wrong');
    setFeedback(`No es esa. La comprobación correcta era: ${ticket.answer}. Pierdes 5 segundos.`, 'bad');
  }
  updateHud();
  window.setTimeout(() => {
    if (!state.running) return;
    if (state.seconds <= 0) endGame();
    else { state.caseIndex++; renderRound(); }
  }, 620);
}

function shareResult() {
  const text = `Repair Rush · reto ${dateKey}: ${state.lastScore} / 1000 puntos y ${state.repairs} reparaciones.`;
  if (navigator.share) navigator.share({ title: 'Repair Rush', text, url: location.href }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => setFeedback('Resultado copiado para compartir.', 'good')).catch(() => setFeedback(text));
  else setFeedback(text);
}

ui.choices.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button) chooseAnswer(button);
});
ui.theme.addEventListener('click', () => {
  const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}'); preferences.theme = next; localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch {}
});
ui.share.addEventListener('click', shareResult);
window.addEventListener('keydown', event => {
  if (!state.running || !/^[1-5]$/.test(event.key)) return;
  ui.choices.querySelectorAll('button')[Number(event.key) - 1]?.click();
});
window.setInterval(() => {
  if (!state.running) return;
  state.seconds = Math.max(0, state.seconds - 1);
  updateHud();
  if (!state.seconds) endGame();
}, 1000);

applyTheme(readTheme());
ui.best.textContent = `${loadBest()} / ${MAX_SCORE}`;
ui.dailyCode.textContent = `RETO ${dateKey.replaceAll('-', '')}`;
