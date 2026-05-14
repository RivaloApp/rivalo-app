export type PlayerStats = {
  wins: number;
  losses: number;
  draws?: number;
  mvp: number;
  streak: number;
};

export function calculateRivalScore(stats: PlayerStats) {
  const total = stats.wins + stats.losses + (stats.draws || 0);
  const winRate = total > 0 ? stats.wins / total : 0;

  return Math.round(
    500 +
      stats.wins * 35 -
      stats.losses * 18 +
      (stats.draws || 0) * 8 +
      stats.mvp * 45 +
      stats.streak * 22 +
      winRate * 250
  );
}
