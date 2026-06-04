import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

type Sport = "calcetto" | "padel" | "tennis";

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

function normalizeSport(value?: string): Sport {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function isRacketSport(value?: string) {
  const sport = normalizeSport(value);

  return sport === "padel" || sport === "tennis";
}

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

  const normalizedSport = normalizeSport(sport);
  const racketSport = isRacketSport(normalizedSport);

  const finalHomeScore = Number(homeScore || 0);
  const finalAwayScore = Number(awayScore || 0);

  const isDraw = finalHomeScore === finalAwayScore;
  const homeWon = finalHomeScore > finalAwayScore;
  const awayWon = finalAwayScore > finalHomeScore;

  const teams = [
    {
      id: homeTeamId || makeSafeTeamId(homeTeam),
      name: homeTeam,
      scoreFor: finalHomeScore,
      scoreAgainst: finalAwayScore,
      won: homeWon,
      lost: awayWon,
      draw: isDraw,
    },
    {
      id: awayTeamId || makeSafeTeamId(awayTeam),
      name: awayTeam,
      scoreFor: finalAwayScore,
      scoreAgainst: finalHomeScore,
      won: awayWon,
      lost: homeWon,
      draw: isDraw,
    },
  ];

  for (const team of teams) {
    if (!team.id) continue;

    const points = team.won ? 3 : team.draw ? 1 : 0;
    const scoreDifference = team.scoreFor - team.scoreAgainst;

    const teamRef = doc(
      db,
      "teamEventStats",
      `${eventId}_${team.id}`
    );

    await setDoc(
      teamRef,
      {
        eventId,
        sport: normalizedSport,
        scoreMode: racketSport ? "racket" : "football",
        teamId: team.id,
        teamName: team.name,

        points: increment(points),
        matchesPlayed: increment(1),

        wins: increment(team.won ? 1 : 0),
        draws: increment(team.draw ? 1 : 0),
        losses: increment(team.lost ? 1 : 0),

        // Campi compatibili con la UI esistente:
        // nel calcetto sono gol fatti/subiti, in padel/tennis sono score/set/game pro/contro.
        goalsFor: increment(team.scoreFor),
        goalsAgainst: increment(team.scoreAgainst),
        goalDifference: increment(scoreDifference),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}
