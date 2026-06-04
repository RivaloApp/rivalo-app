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

type Sport = "calcetto" | "padel" | "tennis";

type Player = {
  uid: string;
  name: string;
  goals?: number;
  assists?: number;
  isMvp?: boolean;
  team?: "home" | "away";
  role?: string;
  goalsConceded?: number;
  cleanSheet?: boolean;
  penaltiesSaved?: number;
};

type MatchData = {
  homeScore: number;
  awayScore: number;
  players: Player[];
  eventId?: string;
  sport?: string;
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

export async function updatePlayerStats(match: MatchData) {
  const sport = normalizeSport(match.sport);
  const racketSport = isRacketSport(sport);

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

    const playerRole = player.role || data.role || "";
    const goalkeeper =
      sport === "calcetto" && isGoalkeeper({ ...player, role: playerRole });

    const goals = racketSport ? 0 : Number(player.goals || 0);
    const assists = racketSport ? 0 : Number(player.assists || 0);
    const isMvp = Boolean(player.isMvp);

    const goalsConceded = goalkeeper ? Number(player.goalsConceded || 0) : 0;
    const cleanSheet = goalkeeper ? Boolean(player.cleanSheet) : false;
    const penaltiesSaved = goalkeeper ? Number(player.penaltiesSaved || 0) : 0;

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
      rivalScoreChange += racketSport ? 20 : 22;
      xpChange += racketSport ? 80 : 90;
    }

    if (lost) {
      rivalScoreChange -= racketSport ? 8 : 10;
      xpChange += 35;
    }

    if (isDraw) {
      rivalScoreChange += racketSport ? 3 : 5;
      xpChange += racketSport ? 45 : 55;
    }

    if (!racketSport) {
      const goalBonus = Math.min(goals, 5);
      const assistBonus = Math.min(assists * 2, 8);

      rivalScoreChange += goalBonus;
      rivalScoreChange += assistBonus;

      xpChange += goals * 8;
      xpChange += assists * 6;
    }

    if (goalkeeper) {
      if (cleanSheet) {
        rivalScoreChange += 10;
        xpChange += 35;
      }

      if (penaltiesSaved > 0) {
        rivalScoreChange += Math.min(10, penaltiesSaved * 4);
        xpChange += penaltiesSaved * 18;
      }

      if (goalsConceded <= 1) {
        rivalScoreChange += 4;
      }

      if (goalsConceded >= 6) {
        rivalScoreChange -= Math.min(6, goalsConceded - 5);
      }
    }

    if (isMvp) {
      rivalScoreChange += racketSport ? 14 : 18;
      xpChange += racketSport ? 40 : 45;
    }

    if (won && goalDifference >= 3) {
      rivalScoreChange += racketSport ? 2 : 4;
      xpChange += 15;
    }

    const nextWinStreak = won ? currentWinStreak + 1 : 0;
    const nextBestStreak = Math.max(currentBestStreak, nextWinStreak);

    if (nextWinStreak >= 3) {
      rivalScoreChange += 4;
    }

    if (nextWinStreak >= 5) {
      rivalScoreChange += 6;
    }

    const nextRivalScore = Math.max(
      600,
      currentRivalScore + rivalScoreChange
    );

    const nextXp = currentXp + xpChange;
    const nextLevel = Math.floor(nextXp / 1000) + 1;

    const seasonPoints = won ? 3 : isDraw ? 1 : 0;

    await updateDoc(userRef, {
      mainSport: sport,
      sport,
      role: playerRole || data.role || "",

      matchesPlayed: increment(1),

      wins: increment(won ? 1 : 0),
      losses: increment(lost ? 1 : 0),
      draws: increment(isDraw ? 1 : 0),

      goals: increment(goals),
      assists: increment(assists),
      mvp: increment(isMvp ? 1 : 0),

      goalsConceded: increment(goalsConceded),
      cleanSheets: increment(cleanSheet ? 1 : 0),
      penaltiesSaved: increment(penaltiesSaved),

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
        sport,
        mainSport: sport,
        role: playerRole || "",

        points: increment(seasonPoints),
        matchesPlayed: increment(1),

        wins: increment(won ? 1 : 0),
        losses: increment(lost ? 1 : 0),
        draws: increment(isDraw ? 1 : 0),

        goals: increment(goals),
        assists: increment(assists),
        mvp: increment(isMvp ? 1 : 0),

        goalsConceded: increment(goalsConceded),
        cleanSheets: increment(cleanSheet ? 1 : 0),
        penaltiesSaved: increment(penaltiesSaved),

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
          sport,
          role: playerRole || "",

          points: increment(seasonPoints),
          matchesPlayed: increment(1),

          wins: increment(won ? 1 : 0),
          losses: increment(lost ? 1 : 0),
          draws: increment(isDraw ? 1 : 0),

          goals: increment(goals),
          assists: increment(assists),
          mvp: increment(isMvp ? 1 : 0),

          goalsConceded: increment(goalsConceded),
          cleanSheets: increment(cleanSheet ? 1 : 0),
          penaltiesSaved: increment(penaltiesSaved),

          goalsFor: increment(
            player.team === "home" ? homeScore : awayScore
          ),
          goalsAgainst: increment(
            player.team === "home" ? awayScore : homeScore
          ),
          goalDifference: increment(
            player.team === "home"
              ? homeScore - awayScore
              : awayScore - homeScore
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

    if (goalkeeper && cleanSheet) {
      await createActivity({
        uid: player.uid,
        type: "rivalscore",
        text: `${player.name || "Portiere"} clean sheet`,
        value: 1,
      });
    }

    if (goalkeeper && penaltiesSaved > 0) {
      await createActivity({
        uid: player.uid,
        type: "rivalscore",
        text: `${penaltiesSaved} rigori parati`,
        value: penaltiesSaved,
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
