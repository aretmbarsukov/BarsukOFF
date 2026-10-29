export const MAX_LEADERBOARD_SCORE = 1000;

const GAME_SCORE_MAX = Object.freeze({
  'phone-rescue': 1000,
  'micro-soldering': 10125,
  'os-doctor': 72743,
  'repair-rush': 1000,
  'circuit-detective': 1000
});

export function normalizeGameScore(gameId, score) {
  const maximum = GAME_SCORE_MAX[gameId];
  if (!maximum || !Number.isFinite(Number(score)) || Number(score) <= 0) return 0;
  return Math.min(MAX_LEADERBOARD_SCORE, Math.round(Number(score) / maximum * MAX_LEADERBOARD_SCORE));
}