import { submitScore } from './score-api.js';

const MAX_SCORE = 1000;
const MAX_TESTS = 3;
const BEST_KEY = 'barsukon-circuit-detective-best';
const PREFERENCES_KEY = 'barsukon-preferences';
const TOOL_NAMES = { usb: 'Medidor USB', thermal: 'Cámara térmica', battery: 'Banco de batería', microscope: 'Microscopio', display: 'Patrón de pantalla' };
const CASES = [
  { title: 'Carga inestable', description: 'Un equipo llega con 8 % de batería. El cliente dice que carga a ratos y que el puerto se mueve al tocar el cable.', status: '8 %', answer: 'Puerto USB-C con soldaduras fisuradas', options: ['Puerto USB-C con soldaduras fisuradas', 'Batería con alta resistencia interna', 'Circuito de carga en cortocircuito', 'Módulo de pantalla dañado'], clues: { usb: 'La negociación USB se interrumpe cuando el conector se mueve; el consumo cae a cero.', thermal: 'No aparece un punto caliente en la placa durante la prueba.', battery: 'La batería mantiene voltaje estable bajo una carga breve.', microscope: 'Dos anclajes del puerto presentan grietas en las soldaduras.', display: 'El patrón de color y las zonas táctiles responden correctamente.' } },
  { title: 'Reinicio bajo carga', description: 'El teléfono se reinicia al abrir la cámara. En reposo indica 42 %, pero la carga baja varios puntos en segundos.', status: '42 %', answer: 'Batería degradada con alta resistencia interna', options: ['Batería degradada con alta resistencia interna', 'Puerto USB-C con soldaduras fisuradas', 'Auricular superior obstruido', 'Módulo de pantalla dañado'], clues: { usb: 'El puerto mantiene una conexión estable y negocia la carga correctamente.', thermal: 'La placa no presenta una concentración anormal de calor.', battery: 'La impedancia interna es alta y el voltaje cae al pedir corriente.', microscope: 'El conector de batería está limpio y firme.', display: 'La imagen y el táctil pasan el patrón completo.' } },
  { title: 'Imagen sin táctil', description: 'La pantalla muestra imagen, pero el cliente no puede desbloquear el teléfono. No hay grietas visibles.', status: 'TOUCH', answer: 'Digitalizador del módulo de pantalla', options: ['Digitalizador del módulo de pantalla', 'Puerto USB-C con soldaduras fisuradas', 'Batería degradada con alta resistencia interna', 'Corrosión en el circuito de carga'], clues: { usb: 'El consumo durante la carga está dentro del rango normal.', thermal: 'No se detecta calentamiento localizado.', battery: 'La batería mantiene capacidad y voltaje normales.', microscope: 'Los flex y conectores del display están asentados y sin corrosión.', display: 'La imagen aparece, pero la cuadrícula táctil no detecta ninguna entrada.' } },
  { title: 'Consumo fantasma', description: 'El dispositivo se calienta dentro del bolsillo y pierde la mitad de la batería durante la noche, incluso apagado.', status: 'HOT', answer: 'Fuga de corriente en una línea de placa', options: ['Fuga de corriente en una línea de placa', 'Auricular superior obstruido', 'Puerto USB-C con soldaduras fisuradas', 'Batería degradada con alta resistencia interna'], clues: { usb: 'El consumo en reposo continúa aunque no haya cable conectado.', thermal: 'Un componente pequeño junto a la línea principal concentra el calor.', battery: 'La batería supera la prueba de capacidad y entrega corriente estable.', microscope: 'No hay residuos visibles en el conector de carga.', display: 'El módulo de pantalla supera las pruebas de imagen y táctil.' } },
  { title: 'Llamadas en silencio', description: 'El cliente oye el tono de llamada en altavoz, pero no escucha nada al acercar el teléfono al oído.', status: 'AUDIO', answer: 'Malla del auricular superior obstruida', options: ['Malla del auricular superior obstruida', 'Fuga de corriente en una línea de placa', 'Digitalizador del módulo de pantalla', 'Batería degradada con alta resistencia interna'], clues: { usb: 'La alimentación funciona con normalidad y el puerto no presenta cortes.', thermal: 'La placa mantiene una temperatura uniforme.', battery: 'La batería entrega voltaje normal bajo carga.', microscope: 'La malla del auricular está cubierta de residuos; el flex está intacto.', display: 'La imagen y todos los puntos táctiles responden.' } },
  { title: 'Puerto sin respuesta', description: 'No hay carga por cable ni datos USB. La carga inalámbrica sí funciona y la batería está en buen estado.', status: 'USB', answer: 'Corrosión en el conector de carga', options: ['Corrosión en el conector de carga', 'Batería degradada con alta resistencia interna', 'Módulo de pantalla dañado', 'Auricular superior obstruido'], clues: { usb: 'No se inicia la negociación por cable, pero la carga inalámbrica permanece estable.', thermal: 'No se detecta corto en la línea principal.', battery: 'Capacidad y resistencia de batería dentro del rango esperado.', microscope: 'Hay corrosión verdosa en los contactos internos del conector USB-C.', display: 'La pantalla y el táctil superan el patrón de prueba.' } }
];

const ui = {
  theme: document.getElementById('themeButton'), themeLabel: document.getElementById('themeLabel'),
  code: document.getElementById('caseCode'), category: document.getElementById('caseCategory'),
  title: document.getElementById('caseTitle'), description: document.getElementById('caseDescription'), status: document.getElementById('phoneStatus'),
  evidence: document.getElementById('evidenceList'), count: document.getElementById('testCount'), checksLeft: document.getElementById('checksLeft'),
  diagnosisForm: document.getElementById('diagnosisForm'), diagnosisChoices: document.getElementById('diagnosisChoices'), diagnosisList: document.getElementById('diagnosisList'),
  diagnose: document.getElementById('diagnoseButton'), feedback: document.getElementById('diagnosisFeedback'), testGrid: document.getElementById('testGrid'),
  best: document.getElementById('bestValue'), fill: document.getElementById('scoreFill'), share: document.getElementById('shareButton')
};
const state = { dailyCase: null, usedTests: new Set(), strikes: 0, startedAt: 0, ended: false, lastScore: 0 };
const dateKey = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });

function loadBest() {
  try { return Math.min(MAX_SCORE, Math.max(0, Number(localStorage.getItem(BEST_KEY)) || 0)); }
  catch { return 0; }
}
function saveBest(score) {
  const best = Math.max(loadBest(), score);
  try { localStorage.setItem(BEST_KEY, String(best)); } catch {}
  ui.best.textContent = `${best} / ${MAX_SCORE}`;
  ui.fill.style.width = `${best / MAX_SCORE * 100}%`;
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
function dailyIndex() {
  return [...dateKey].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7) % CASES.length;
}
function prepareCase() {
  state.dailyCase = CASES[dailyIndex()];
  state.usedTests.clear();
  state.strikes = 0;
  state.startedAt = 0;
  state.ended = false;
  ui.code.textContent = `#${dateKey.replaceAll('-', '')}`;
  ui.category.textContent = 'CASO DIARIO · MÓVILES';
  ui.title.textContent = state.dailyCase.title;
  ui.description.textContent = state.dailyCase.description;
  ui.status.textContent = state.dailyCase.status;
  ui.evidence.replaceChildren();
  const empty = document.createElement('li');
  empty.className = 'evidence-empty';
  empty.textContent = 'Aún no se han realizado comprobaciones.';
  ui.evidence.append(empty);
  ui.diagnosisList.replaceChildren(...state.dailyCase.options.map((option, index) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'diagnosis-option';
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'diagnosis';
    input.id = `diagnosis-${index}`;
    input.value = option;
    input.required = true;
    const label = document.createElement('label');
    label.htmlFor = input.id;
    const number = document.createElement('span');
    number.textContent = String(index + 1);
    label.append(number, document.createTextNode(option));
    wrapper.append(input, label);
    return wrapper;
  }));
  ui.diagnosisChoices.disabled = true;
  ui.diagnose.disabled = true;
  ui.share.disabled = true;
  ui.testGrid.querySelectorAll('button').forEach(button => { button.disabled = false; button.classList.remove('is-used'); });
  ui.count.textContent = '0 / 3';
  ui.checksLeft.textContent = '3';
  ui.feedback.textContent = 'Usa al menos una prueba antes de decidir.';
  ui.feedback.dataset.kind = '';
}

function runTest(button) {
  if (state.ended || state.usedTests.size >= MAX_TESTS || state.usedTests.has(button.dataset.test)) return;
  if (!state.usedTests.size) state.startedAt = performance.now();
  const tool = button.dataset.test;
  const clue = state.dailyCase.clues[tool];
  state.usedTests.add(tool);
  button.disabled = true;
  button.classList.add('is-used');
  const empty = ui.evidence.querySelector('.evidence-empty');
  empty?.remove();
  const item = document.createElement('li');
  item.className = 'evidence-item';
  const index = document.createElement('span');
  index.className = 'evidence-index';
  index.textContent = String(state.usedTests.size).padStart(2, '0');
  const note = document.createElement('span');
  note.textContent = `${TOOL_NAMES[tool]}: ${clue}`;
  item.append(index, note);
  ui.evidence.append(item);
  ui.count.textContent = `${state.usedTests.size} / ${MAX_TESTS}`;
  ui.checksLeft.textContent = String(MAX_TESTS - state.usedTests.size);
  ui.diagnosisChoices.disabled = false;
  ui.diagnose.disabled = false;
  ui.feedback.textContent = state.usedTests.size === MAX_TESTS ? 'Pruebas agotadas. Es hora de emitir un diagnóstico.' : 'La pista queda registrada. Puedes revisar otra señal o decidir.';
  ui.feedback.dataset.kind = '';
}

function submitDiagnosis(event) {
  event.preventDefault();
  if (state.ended || !state.usedTests.size) return;
  const selected = ui.diagnosisForm.querySelector('input[name="diagnosis"]:checked');
  if (!selected) { ui.feedback.textContent = 'Selecciona una causa probable.'; return; }
  if (selected.value !== state.dailyCase.answer) {
    state.strikes++;
    ui.feedback.textContent = state.strikes >= 3 ? `Caso cerrado. La causa era: ${state.dailyCase.answer}.` : `No coincide con las pruebas. Revisa las pistas; quedan ${3 - state.strikes} intentos.`;
    ui.feedback.dataset.kind = 'bad';
    if (state.strikes >= 3) finishCase(false);
    return;
  }
  finishCase(true);
}

function finishCase(solved) {
  if (state.ended) return;
  state.ended = true;
  const elapsed = Math.floor((performance.now() - state.startedAt) / 1000);
  const rawScore = solved ? Math.max(0, 1000 - (state.usedTests.size - 1) * 90 - state.strikes * 170 - Math.min(190, elapsed * 2)) : 0;
  state.lastScore = rawScore;
  saveBest(rawScore);
  ui.category.textContent = solved ? 'CASO RESUELTO' : 'CASO CERRADO';
  ui.title.textContent = solved ? 'Diagnóstico confirmado.' : 'El expediente queda abierto.';
  ui.description.textContent = `${state.dailyCase.answer}. ${state.usedTests.size} comprobaciones, ${state.strikes} diagnósticos fallidos y ${elapsed} segundos.`;
  ui.status.textContent = solved ? '✓' : '×';
  ui.diagnosisChoices.disabled = true;
  ui.diagnose.disabled = true;
  ui.testGrid.querySelectorAll('button').forEach(button => { button.disabled = true; });
  ui.share.disabled = false;
  ui.feedback.textContent = solved ? `Caso resuelto con ${rawScore} / 1000 puntos.` : 'Prueba el próximo caso diario mañana.';
  ui.feedback.dataset.kind = solved ? 'good' : 'bad';
  if (solved) submitScore('circuit-detective', rawScore, { date: dateKey, testsUsed: state.usedTests.size, strikes: state.strikes, elapsedSeconds: elapsed });
}

function shareResult() {
  const text = `Circuit Detective · caso ${dateKey}: ${state.lastScore} / 1000 puntos.`;
  if (navigator.share) navigator.share({ title: 'Circuit Detective', text, url: location.href }).catch(() => {});
  else if (navigator.clipboard) navigator.clipboard.writeText(text).then(() => { ui.feedback.textContent = 'Resultado copiado para compartir.'; }).catch(() => { ui.feedback.textContent = text; });
  else ui.feedback.textContent = text;
}

ui.testGrid.addEventListener('click', event => {
  const button = event.target.closest('button[data-test]');
  if (button) runTest(button);
});
ui.diagnosisForm.addEventListener('submit', submitDiagnosis);
ui.theme.addEventListener('click', () => {
  const next = document.body.dataset.theme === 'light' ? 'dark' : 'light';
  applyTheme(next);
  try { const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}'); preferences.theme = next; localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences)); } catch {}
});
ui.share.addEventListener('click', shareResult);
window.addEventListener('keydown', event => {
  if (!/^[1-5]$/.test(event.key) || state.ended) return;
  const buttons = [...ui.testGrid.querySelectorAll('button')];
  if (buttons[Number(event.key) - 1]) buttons[Number(event.key) - 1].click();
});

applyTheme(readTheme());
ui.best.textContent = `${loadBest()} / ${MAX_SCORE}`;
ui.fill.style.width = `${loadBest() / MAX_SCORE * 100}%`;
prepareCase();
