import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { createActivity } from "./createActivity";

import { db } from "./firebase";

type Sport = "calcetto" | "padel" | "tennis";

type Player = {
  uid: string;
  name?: string;
  team?: "home" | "away";
  role?: string;
};

type MatchData = {
  id?: string;
  matchId?: string;
  homeScore: number;
  awayScore: number;
  players: Player[];
  sport?: string;
  status?: string;
  resultStatus?: string;
};

function normalizeSport(value?: string): Sport {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function normalizeCalcettoRole(value?: string) {
  const role = (value || "").toLowerCase().trim();

  if (role.includes("port")) return "portiere";
  if (role.includes("dif")) return "difensore";
  if (role.includes("cent")) return "centrocampista";
  if (role.includes("att")) return "attaccante";
  if (role.includes("jolly")) return "jolly";

  return role;
}

function isGoalkeeper(player: Player) {
  return normalizeCalcettoRole(player.role) === "portiere";
}

function getRivalryId(sport: string, uidA: string, uidB: string) {
  const [firstUid, secondUid] = [uidA, uidB].sort();

  return `${normalizeSport(sport)}_${firstUid}_${secondUid}`;
}

function isOfficialMatch(match: MatchData) {
  const hasStatus =
    typeof match.status === "string" || typeof match.resultStatus === "string";

  if (!hasStatus) return true;

  return match.status === "ufficiale" || match.resultStatus === "confermato";
}

function shouldCreateRivalryBetween(homePlayer: Player, awayPlayer: Player) {
  const homeGoalkeeper = isGoalkeeper(homePlayer);
  const awayGoalkeeper = isGoalkeeper(awayPlayer);

  if (homeGoalkeeper || awayGoalkeeper) {
    return homeGoalkeeper && awayGoalkeeper;
  }

  return true;
}

export async function updateRivalries(match: MatchData) {
  if (!isOfficialMatch(match)) return;

  const sport = normalizeSport(match.sport);
  const matchId = match.matchId || match.id || "";

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
      if (!shouldCreateRivalryBetween(homePlayer, awayPlayer)) continue;

      const rivalryId = getRivalryId(
        sport,
        homePlayer.uid,
        awayPlayer.uid
      );

      const rivalryRef = doc(db, "rivalries", rivalryId);

      if (matchId) {
        const rivalrySnap = await getDoc(rivalryRef);
        const rivalryData = rivalrySnap.exists() ? rivalrySnap.data() : {};
        const appliedMatchIds = Array.isArray(rivalryData.appliedMatchIds)
          ? rivalryData.appliedMatchIds
          : [];

        if (appliedMatchIds.includes(matchId)) {
          continue;
        }
      }

      const winnerUid = homeWon
        ? homePlayer.uid
        : awayWon
        ? awayPlayer.uid
        : null;

      const users = [homePlayer.uid, awayPlayer.uid].sort();

      await setDoc(
        rivalryRef,
        {
          id: rivalryId,
          users,
          sport,

          playerNames: {
            [homePlayer.uid]: homePlayer.name || "Player",
            [awayPlayer.uid]: awayPlayer.name || "Player",
          },

          matchesPlayed: increment(1),
          officialMatches: increment(1),

          ...(matchId
            ? {
                appliedMatchIds: arrayUnion(matchId),
                lastMatchId: matchId,
              }
            : {}),

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
        text: `Rivalità aggiornata: ${homePlayer.name || "Player"} vs ${
          awayPlayer.name || "Player"
        }`,
        value: 1,
      });
    }
  }
}
