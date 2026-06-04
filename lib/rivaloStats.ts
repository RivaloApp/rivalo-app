import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

type Sport = "calcetto" | "padel" | "tennis";

export type RivaloStatsInput = {
  uid: string;
  result: "win" | "loss" | "draw";
  isMvp?: boolean;
  goals?: number;
  assists?: number;
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

export function calculateRivalScoreChange(input: RivaloStatsInput) {
  const sport = normalizeSport(input.sport);
  const racketSport = isRacketSport(sport);

  const cleanGoals = racketSport ? 0 : Number(input.goals || 0);
  const cleanAssists = racketSport ? 0 : Number(input.assists || 0);

  let change = 0;
  let xp = 25;

  if (input.result === "win") {
    change += racketSport ? 20 : 18;
    xp += racketSport ? 65 : 60;
  }

  if (input.result === "loss") {
    change -= racketSport ? 7 : 8;
    xp += racketSport ? 25 : 25;
  }

  if (input.result === "draw") {
    change += racketSport ? 2 : 4;
    xp += racketSport ? 30 : 35;
  }

  if (input.isMvp) {
    change += racketSport ? 8 : 10;
    xp += racketSport ? 35 : 40;
  }

  if (!racketSport) {
    change += Math.min(12, cleanGoals * 2);
    change += Math.min(8, cleanAssists * 2);
  }

  return { rivalScoreChange: change, xpChange: xp };
}

export function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

export async function ensureUserStats(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        uid,
        rivalScore: 1000,
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        mvp: 0,
        matchesPlayed: 0,
        goals: 0,
        assists: 0,
        winStreak: 0,
        bestStreak: 0,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export async function applyMatchStats(input: RivaloStatsInput) {
  await ensureUserStats(input.uid);

  const userRef = doc(db, "users", input.uid);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};

  const sport = normalizeSport(input.sport || data.mainSport || data.sport);
  const racketSport = isRacketSport(sport);

  const cleanGoals = racketSport ? 0 : Number(input.goals || 0);
  const cleanAssists = racketSport ? 0 : Number(input.assists || 0);

  const currentXp = Number(data.xp || 0);
  const currentScore = Number(data.rivalScore || 1000);
  const currentWinStreak = Number(data.winStreak || 0);
  const currentBestStreak = Number(data.bestStreak || 0);

  const { rivalScoreChange, xpChange } = calculateRivalScoreChange({
    ...input,
    sport,
    goals: cleanGoals,
    assists: cleanAssists,
  });

  const nextXp = currentXp + xpChange;
  const nextScore = Math.max(100, currentScore + rivalScoreChange);
  const nextLevel = calculateLevelFromXp(nextXp);

  const nextWinStreak =
    input.result === "win"
      ? currentWinStreak + 1
      : input.result === "loss"
      ? 0
      : currentWinStreak;

  const nextBestStreak = Math.max(currentBestStreak, nextWinStreak);

  await updateDoc(userRef, {
    mainSport: sport,
    sport,
    rivalScore: nextScore,
    xp: nextXp,
    level: nextLevel,

    matchesPlayed: increment(1),
    wins: input.result === "win" ? increment(1) : increment(0),
    losses: input.result === "loss" ? increment(1) : increment(0),
    draws: input.result === "draw" ? increment(1) : increment(0),
    mvp: input.isMvp ? increment(1) : increment(0),

    goals: increment(cleanGoals),
    assists: increment(cleanAssists),

    winStreak: nextWinStreak,
    bestStreak: nextBestStreak,

    updatedAt: serverTimestamp(),
  });

  return {
    rivalScoreChange,
    xpChange,
    nextScore,
    nextXp,
    nextLevel,
    nextWinStreak,
    nextBestStreak,
    sport,
  };
}
