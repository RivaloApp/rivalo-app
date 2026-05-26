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
  homeScore: number;
  awayScore: number;
};

export async function updateTeamEventStats({
  eventId,
  homeTeam,
  awayTeam,
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
      id: homeTeam.trim().toLowerCase().replace(/\s+/g, "_"),
      name: homeTeam,
      goalsFor: finalHomeScore,
      goalsAgainst: finalAwayScore,
      won: homeWon,
      lost: awayWon,
      draw: isDraw,
    },
    {
      id: awayTeam.trim().toLowerCase().replace(/\s+/g, "_"),
      name: awayTeam,
      goalsFor: finalAwayScore,
      goalsAgainst: finalHomeScore,
      won: awayWon,
      lost: homeWon,
      draw: isDraw,
    },
  ];

  for (const team of teams) {
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
        teamId: team.id,
        teamName: team.name,

        points: increment(points),
        matchesPlayed: increment(1),

        wins: increment(team.won ? 1 : 0),
        draws: increment(team.draw ? 1 : 0),
        losses: increment(team.lost ? 1 : 0),

        goalsFor: increment(team.goalsFor),
        goalsAgainst: increment(team.goalsAgainst),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}