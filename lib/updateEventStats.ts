import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebase";

type Player = {
  uid: string;
  name?: string;
  goals?: number;
  assists?: number;
  isMvp?: boolean;
  team?: "home" | "away";
};

type MatchData = {
  eventId?: string;
  sport?: string;
  homeScore: number;
  awayScore: number;
  players: Player[];
};

export async function updateEventStats(match: MatchData) {
  if (!match.eventId) return;

  const homeScore = Number(match.homeScore || 0);
  const awayScore = Number(match.awayScore || 0);

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  for (const player of match.players) {
    if (!player.uid) continue;

    const won =
      !isDraw &&
      ((player.team === "home" && homeWon) ||
        (player.team === "away" && awayWon));

    const lost =
      !isDraw &&
      ((player.team === "home" && awayWon) ||
        (player.team === "away" && homeWon));

    const points = won ? 3 : isDraw ? 1 : 0;

    const goals = Number(player.goals || 0);
    const assists = Number(player.assists || 0);
    const isMvp = Boolean(player.isMvp);

    const eventStatRef = doc(
      db,
      "eventStats",
      `${match.eventId}_${player.uid}`
    );

    await setDoc(
      eventStatRef,
      {
        eventId: match.eventId,
        uid: player.uid,
        playerName: player.name || "Rivalo Player",
        sport: match.sport || "calcetto",

        points: increment(points),
        matchesPlayed: increment(1),

        wins: increment(won ? 1 : 0),
        draws: increment(isDraw ? 1 : 0),
        losses: increment(lost ? 1 : 0),

        goals: increment(goals),
        assists: increment(assists),
        mvp: increment(isMvp ? 1 : 0),

        goalsFor: increment(
          player.team === "home" ? homeScore : awayScore
        ),
        goalsAgainst: increment(
          player.team === "home" ? awayScore : homeScore
        ),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}