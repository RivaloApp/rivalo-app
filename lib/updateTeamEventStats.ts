import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

type UpdateTeamEventStatsInput = {
  eventId?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  sport?: string;
  homeScore: number;
  awayScore: number;
};

function makeSafeTeamId(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export async function updateTeamEventStats({
  eventId,
  homeTeam,
  awayTeam,
  homeTeamId,
  awayTeamId,
  sport,
  homeScore,
  awayScore,
}: UpdateTeamEventStatsInput) {
  if (!eventId) return;
  if (!homeTeam || !awayTeam) return;

  const finalHomeScore = Number(homeScore || 0);
  const finalAwayScore = Number(awayScore || 0);

  const isDraw = finalHomeScore === finalAwayScore;
  const homeWon = finalHomeScore > finalAwayScore;
  const awayWon = finalAwayScore > finalHomeScore;

  const teams = [
    {
      id: homeTeamId || makeSafeTeamId(homeTeam),
      name: homeTeam,
      goalsFor: finalHomeScore,
      goalsAgainst: finalAwayScore,
      won: homeWon,
      lost: awayWon,
      draw: isDraw,
    },
    {
      id: awayTeamId || makeSafeTeamId(awayTeam),
      name: awayTeam,
      goalsFor: finalAwayScore,
      goalsAgainst: finalHomeScore,
      won: awayWon,
      lost: homeWon,
      draw: isDraw,
    },
  ];

  for (const team of teams) {
    if (!team.id) continue;

    const points = team.won ? 3 : team.draw ? 1 : 0;

    const teamRef = doc(
      db,
      "teamEventStats",
      `${eventId}_${team.id}`
    );

    await setDoc(
      teamRef,
      {
        eventId,
        sport: sport || "",
        teamId: team.id,
        teamName: team.name,

        points: increment(points),
        matchesPlayed: increment(1),

        wins: increment(team.won ? 1 : 0),
        draws: increment(team.draw ? 1 : 0),
        losses: increment(team.lost ? 1 : 0),

        goalsFor: increment(team.goalsFor),
        goalsAgainst: increment(team.goalsAgainst),
        goalDifference: increment(team.goalsFor - team.goalsAgainst),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
