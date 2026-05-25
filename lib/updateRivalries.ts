import {
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { createActivity } from "./createActivity";

import { db } from "./firebase";

type Player = {
  uid: string;
  name?: string;
  team?: "home" | "away";
};

type MatchData = {
  homeScore: number;
  awayScore: number;
  players: Player[];
};

function getRivalryId(uidA: string, uidB: string) {
  return [uidA, uidB].sort().join("_");
}

export async function updateRivalries(match: MatchData) {
  const homeScore = Number(match.homeScore || 0);
  const awayScore = Number(match.awayScore || 0);

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  const homePlayers = match.players.filter(
    (player) => player.uid && player.team === "home"
  );

  const awayPlayers = match.players.filter(
    (player) => player.uid && player.team === "away"
  );

  for (const homePlayer of homePlayers) {
    for (const awayPlayer of awayPlayers) {
      if (!homePlayer.uid || !awayPlayer.uid) continue;

      const rivalryId = getRivalryId(
        homePlayer.uid,
        awayPlayer.uid
      );

      const rivalryRef = doc(db, "rivalries", rivalryId);

      const winnerUid = homeWon
        ? homePlayer.uid
        : awayWon
        ? awayPlayer.uid
        : null;

      await setDoc(
        rivalryRef,
        {
          users: [homePlayer.uid, awayPlayer.uid].sort(),

          playerNames: {
            [homePlayer.uid]: homePlayer.name || "Player",
            [awayPlayer.uid]: awayPlayer.name || "Player",
          },

          matchesPlayed: increment(1),

          ...(winnerUid
            ? {
                [winnerUid]: increment(1),
              }
            : {
                draws: increment(1),
              }),

          lastScore: `${homeScore}-${awayScore}`,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      await createActivity({
  uid: winnerUid || homePlayer.uid,
  type: "rivalry",
  text: `Rivalità aggiornata: ${homePlayer.name || "Player"} vs ${awayPlayer.name || "Player"}`,
  value: 1,
});
    }
  }
}