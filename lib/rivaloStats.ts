import { doc, getDoc, increment, serverTimestamp, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "./firebase";

export type RivaloStatsInput = {
  uid: string;
  result: "win" | "loss" | "draw";
  isMvp?: boolean;
  goals?: number;
  assists?: number;
};

export function calculateRivalScoreChange(input: RivaloStatsInput) {
  let change = 0;
  let xp = 25;

  if (input.result === "win") {
    change += 18;
    xp += 60;
  }

  if (input.result === "loss") {
    change -= 8;
    xp += 25;
  }

  if (input.result === "draw") {
    change += 4;
    xp += 35;
  }

  if (input.isMvp) {
    change += 10;
    xp += 40;
  }

  change += Math.min(12, (input.goals || 0) * 2);
  change += Math.min(8, (input.assists || 0) * 2);

  return { rivalScoreChange: change, xpChange: xp };
}

export function calculateLevelFromXp(xp: number) {
  return Math.max(1, Math.floor(xp / 500) + 1);
}

export async function ensureUserStats(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
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
      createdAt: serverTimestamp(),
    }, { merge: true });
  }
}

export async function applyMatchStats(input: RivaloStatsInput) {
  await ensureUserStats(input.uid);

  const userRef = doc(db, "users", input.uid);
  const snap = await getDoc(userRef);
  const data = snap.data() || {};

  const currentXp = Number(data.xp || 0);
  const currentScore = Number(data.rivalScore || 1000);
const { rivalScoreChange, xpChange } = calculateRivalScoreChange(input);

const bonusXp = input.isMVP ? 25 : 0;);
const performanceBonusXp =
  (input.goals || 0) >= 5
    ? 50
    : (input.goals || 0) >= 3
    ? 40
    : 0;

const assistBonusXp = (input.assists || 0) >= 3 ? 20 : 0;

  const nextXp = currentXp + xpChange + bonusXp + performanceBonusXp + assistBonusXp;
  const nextScore = Math.max(100, currentScore + rivalScoreChange);
  const nextLevel = calculateLevelFromXp(nextXp);

  await updateDoc(userRef, {
    rivalScore: nextScore,
    xp: nextXp,
    level: nextLevel,
    matchesPlayed: increment(1),
    wins: input.result === "win" ? increment(1) : increment(0),
    losses: input.result === "loss" ? increment(1) : increment(0),
    draws: input.result === "draw" ? increment(1) : increment(0),
    
    currentStreak:
  input.result === "win" ? increment(1) : 0,

bestStreak:
  input.result === "win"
    ? Math.max(Number(data.bestStreak || 0), Number(data.currentStreak || 0) + 1)
    : Number(data.bestStreak || 0),
    mvp: input.isMvp ? increment(1) : increment(0),
    goals: increment(input.goals || 0),
    assists: increment(input.assists || 0),
    rivals:
  input.opponentId
    ? arrayUnion(input.opponentId)
    : [],
    updatedAt: serverTimestamp(),
  });

  return {
    rivalScoreChange,
    xpChange,
    nextScore,
    nextXp,
    nextLevel,
  };
}
