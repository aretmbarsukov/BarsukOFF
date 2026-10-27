import { initializeLeaderboardSync } from './leaderboard-store.js';

const SCORE_STORAGE_KEY = 'barsukon-score-submissions';

export function submitScore(gameId, score, meta = {}) {
  if (typeof gameId !== 'string' || !gameId.trim()) throw new TypeError('El identificador del juego es obligatorio.');
  if (!Number.isFinite(score) || score < 0) throw new TypeError('La puntuación debe ser un número no negativo.');
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new TypeError('Los metadatos de la puntuación deben ser un objeto.');

  const entry = {
    gameId: gameId.trim(),
    score: Math.round(score),
    meta: { ...meta },
    submittedAt: new Date().toISOString()
  };
  let saved = true;

  try {
    const stored = JSON.parse(localStorage.getItem(SCORE_STORAGE_KEY) || '[]');
    if (!Array.isArray(stored)) throw new TypeError('El historial local de puntuaciones no es válido.');
    localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify([...stored, entry].slice(-50)));
  } catch (error) {
    saved = false;
    console.warn('No se pudo guardar el envío de puntuación en este dispositivo.', error);
  }

  window.dispatchEvent(new CustomEvent('barsukon:score', { detail: entry }));
  return { saved, entry };
}

window.submitBarsukScore = submitScore;
initializeLeaderboardSync();
