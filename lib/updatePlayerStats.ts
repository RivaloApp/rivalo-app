import {
  doc,
  getDoc,
  updateDoc,
  increment,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { createActivity } from "./createActivity";
import { db } from "./firebase";
import {
  CURRENT_SEASON_ID,
  CURRENT_SEASON_NAME,
} from "./seasons";

type Player = {
  uid: string;
  name: string;
  goals?: number;
  assists?: number;
  isMvp?: boolean;
  team?: "home" | "away";
};

type MatchData = {
  homeScore: number;
  awayScore: number;
  players: Player[];
  eventId?: string;
  sport?: string;
};

export async function updatePlayerStats(match: MatchData) {
  const homeScore = Number(match.homeScore || 0);
  const awayScore = Number(match.awayScore || 0);

  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;
  const isDraw = homeScore === awayScore;

  const goalDifference = Math.abs(homeScore - awayScore);

  for (const player of match.players) {
    if (!player.uid) continue;

    const userRef = doc(db, "users", player.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) continue;

    const data = userSnap.data();

    const currentRivalScore = Number(data.rivalScore || 1000);
    const currentXp = Number(data.xp || 0);
    const currentWinStreak = Number(data.winStreak || 0);
    const currentBestStreak = Number(data.bestStreak || 0);

    const goals = Number(player.goals || 0);
    const assists = Number(player.assists || 0);
    const isMvp = Boolean(player.isMvp);

    const won =
      !isDraw &&
      ((player.team === "home" && homeWon) ||
        (player.team === "away" && awayWon));

    const lost =
      !isDraw &&
      ((player.team === "home" && awayWon) ||
        (player.team === "away" && homeWon));

    let rivalScoreChange = 0;
    let xpChange = 25;

    if (won) {
      rivalScoreChange += 22;
      xpChange += 90;
    }

    if (lost) {
      rivalScoreChange -= 10;
      xpChange += 35;
    }

    if (isDraw) {
      rivalScoreChange += 5;
      xpChange += 55;
    }

    // Gol e assist contano, ma in modo controllato.
    // Nel calcetto si segna tanto, quindi non devono far esplodere il RivalScore.
    const goalBonus = Math.min(goals, 5);
    const assistBonus = Math.min(assists * 2, 8);

    rivalScoreChange += goalBonus;
    rivalScoreChange += assistBonus;

    xpChange += goals * 8;
    xpChange += assists * 6;

    if (isMvp) {
      rivalScoreChange += 18;
      xpChange += 45;
    }

    // Vittoria larga: piccolo bonus, non enorme.
    if (won && goalDifference >= 3) {
      rivalScoreChange += 4;
      xpChange += 15;
    }

    const nextWinStreak = won ? currentWinStreak + 1 : 0;
    const nextBestStreak = Math.max(currentBestStreak, nextWinStreak);

    // Streak bonus controllato.
    if (nextWinStreak >= 3) {
      rivalScoreChange += 4;
    }

    if (nextWinStreak >= 5) {
      rivalScoreChange += 6;
    }

    // Protezione anti-valori assurdi.
    // Nessun player deve scendere a 100/200 durante i test o per errori vecchi.
    const nextRivalScore = Math.max(
      600,
      currentRivalScore + rivalScoreChange
    );

    const nextXp = currentXp + xpChange;
    const nextLevel = Math.floor(nextXp / 1000) + 1;

    const seasonPoints = won ? 3 : isDraw ? 1 : 0;

    await updateDoc(userRef, {
      matchesPlayed: increment(1),

      wins: increment(won ? 1 : 0),
      losses: increment(lost ? 1 : 0),
      draws: increment(isDraw ? 1 : 0),

      goals: increment(goals),
      assists: increment(assists),
      mvp: increment(isMvp ? 1 : 0),

      rivalScore: nextRivalScore,
      xp: nextXp,
      level: nextLevel,

      winStreak: nextWinStreak,
      bestStreak: nextBestStreak,

      updatedAt: serverTimestamp(),
    });

    const seasonRef = doc(
      db,
      "seasonStats",
      `${CURRENT_SEASON_ID}_${player.uid}`
    );

    await setDoc(
      seasonRef,
      {
        seasonId: CURRENT_SEASON_ID,
        seasonName: CURRENT_SEASON_NAME,

        uid: player.uid,
        playerName: player.name || "Player",
        sport: match.sport || "calcetto",
        mainSport: match.sport || "calcetto",

        points: increment(seasonPoints),
        matchesPlayed: increment(1),

        wins: increment(won ? 1 : 0),
        losses: increment(lost ? 1 : 0),
        draws: increment(isDraw ? 1 : 0),

        goals: increment(goals),
        assists: increment(assists),
        mvp: increment(isMvp ? 1 : 0),

        rivalScoreChange: increment(rivalScoreChange),

        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    if (match.eventId) {
  const eventRef = doc(
    db,
    "eventStats",
    `${match.eventId}_${player.uid}`
  );

  await setDoc(
    eventRef,
    {
      eventId: match.eventId,

      uid: player.uid,
      playerName: player.name || "Player",
      sport: match.sport || "",

      points: increment(seasonPoints),
      matchesPlayed: increment(1),

      wins: increment(won ? 1 : 0),
      losses: increment(lost ? 1 : 0),
      draws: increment(isDraw ? 1 : 0),

      goals: increment(goals),
      assists: increment(assists),
      mvp: increment(isMvp ? 1 : 0),

      goalsFor: increment(
        player.team === "home" ? homeScore : awayScore
      ),
      goalsAgainst: increment(
        player.team === "home" ? awayScore : homeScore
      ),

      rivalScoreChange: increment(rivalScoreChange),

      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

    await createActivity({
      uid: player.uid,
      type: "rivalscore",
      text: `${rivalScoreChange >= 0 ? "+" : ""}${rivalScoreChange} RivalScore`,
      value: rivalScoreChange,
    });

    if (won) {
      await createActivity({
        uid: player.uid,
        type: "match_win",
        text: `Vittoria ${homeScore}-${awayScore}`,
      });
    }

    if (isMvp) {
      await createActivity({
        uid: player.uid,
        type: "mvp",
        text: `${player.name || "Player"} MVP del match`,
      });
    }

    if (nextWinStreak >= 3) {
      await createActivity({
        uid: player.uid,
        type: "streak",
        text: `${nextWinStreak} vittorie consecutive`,
        value: nextWinStreak,
      });
    }
  }
}