export type RivaloBadge = {
  id: string;
  name: string;
  description: string;
  color: string;
};

export function getPlayerBadges(user: any): RivaloBadge[] {

  const badges: RivaloBadge[] = [];

  const goals = Number(user?.goals || 0);
  const assists = Number(user?.assists || 0);
  const wins = Number(user?.wins || 0);
  const rivalScore = Number(user?.rivalScore || 0);
  const mvp = Number(user?.mvp || 0);
  const streak = Number(user?.winStreak || 0);

  if (goals >= 10) {
    badges.push({
      id: "goal_machine",
      name: "GOAL MACHINE",
      description: "10+ gol segnati",
      color: "yellow",
    });
  }

  if (goals >= 50) {
    badges.push({
      id: "elite_scorer",
      name: "ELITE SCORER",
      description: "50+ gol segnati",
      color: "orange",
    });
  }

  if (assists >= 15) {
    badges.push({
      id: "assist_king",
      name: "ASSIST KING",
      description: "15+ assist",
      color: "cyan",
    });
  }

  if (wins >= 25) {
    badges.push({
      id: "winner",
      name: "WINNER",
      description: "25 vittorie",
      color: "lime",
    });
  }

  if (mvp >= 5) {
    badges.push({
      id: "mvp_hunter",
      name: "MVP HUNTER",
      description: "5 MVP ottenuti",
      color: "yellow",
    });
  }

  if (streak >= 3) {
    badges.push({
      id: "hot_streak",
      name: "HOT STREAK",
      description: "3 win consecutive",
      color: "orange",
    });
  }

  if (streak >= 5) {
    badges.push({
      id: "unstoppable",
      name: "UNSTOPPABLE",
      description: "5 win consecutive",
      color: "red",
    });
  }

  if (rivalScore >= 1200) {
    badges.push({
      id: "elite_rank",
      name: "ELITE",
      description: "1200 RivalScore",
      color: "cyan",
    });
  }

  if (rivalScore >= 1500) {
    badges.push({
      id: "legend_rank",
      name: "LEGEND",
      description: "1500 RivalScore",
      color: "purple",
    });
  }

  return badges;
}