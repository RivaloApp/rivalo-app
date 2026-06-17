"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";
import {
  ArrowLeft,
  Crown,
  Medal,
  Shield,
  ShieldCheck,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import { db } from "../../lib/firebase";

type GoalkeeperRow = {
  id: string;
  name?: string;
  nickname?: string;
  mainSport?: string;
  sport?: string;
  role?: string;
  rivalScore?: number;
  level?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  mvp?: number;
  matchesPlayed?: number;
  photoURL?: string;
  photoUrl?: string;
  xp?: number;
  winStreak?: number;
  bestStreak?: number;
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
  accountStatus?: string;
  deletionRequested?: boolean;
};

function normalizeSport(value?: string) {
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

function isGoalkeeper(user: GoalkeeperRow) {
  return (
    normalizeSport(user.mainSport || user.sport) === "calcetto" &&
    normalizeCalcettoRole(user.role) === "portiere"
  );
}

function isActiveGoalkeeper(user: GoalkeeperRow) {
  return Number(user.matchesPlayed || 0) > 0;
}

function isRemovedUser(user?: GoalkeeperRow) {
  return Boolean(
    user?.accountStatus === "deletion_requested" ||
      user?.accountStatus === "deleted" ||
      user?.deletionRequested
  );
}

function getDisplayName(user?: GoalkeeperRow) {
  if (!user) return "Nessun portiere";
  if (isRemovedUser(user)) return "Utente rimosso";

  return user.nickname || user.name || "Rivalo Player";
}

function getDisplayPhoto(user?: GoalkeeperRow) {
  if (!user || isRemovedUser(user)) return "";

  return user.photoURL || user.photoUrl || "";
}

function getGoalsConcededAverage(user: GoalkeeperRow) {
  const matches = Number(user.matchesPlayed || 0);
  const goalsConceded = Number(user.goalsConceded || 0);

  if (matches <= 0) return 999;

  return goalsConceded / matches;
}

function formatGoalsConcededAverage(user?: GoalkeeperRow) {
  if (!user) return "0.0";

  const matches = Number(user.matchesPlayed || 0);
  if (matches <= 0) return "0.0";

  return getGoalsConcededAverage(user).toFixed(1);
}

function calculateGoalkeeperScore(user: GoalkeeperRow) {
  const matches = Number(user.matchesPlayed || 0);

  if (matches <= 0) return 0;

  const wins = Number(user.wins || 0);
  const draws = Number(user.draws || 0);
  const mvp = Number(user.mvp || 0);
  const rivalScore = Number(user.rivalScore || 1000);
  const cleanSheets = Number(user.cleanSheets || 0);
  const penaltiesSaved = Number(user.penaltiesSaved || 0);
  const winStreak = Number(user.winStreak || 0);
  const bestStreak = Number(user.bestStreak || 0);
  const goalsConcededAverage = getGoalsConcededAverage(user);

  const score =
    wins * 120 +
    draws * 35 +
    cleanSheets * 145 +
    penaltiesSaved * 95 +
    mvp * 85 +
    Math.min(matches, 50) * 30 +
    Math.min(winStreak, 10) * 28 +
    Math.min(bestStreak, 15) * 14 +
    Math.max(0, rivalScore - 1000) * 0.5 -
    goalsConcededAverage * 46;

  return Math.max(0, Math.round(score));
}

function compareGoalkeepers(a: GoalkeeperRow, b: GoalkeeperRow) {
  const activeA = isActiveGoalkeeper(a) ? 1 : 0;
  const activeB = isActiveGoalkeeper(b) ? 1 : 0;

  if (activeA !== activeB) {
    return activeB - activeA;
  }

  return (
    calculateGoalkeeperScore(b) - calculateGoalkeeperScore(a) ||
    Number(b.cleanSheets || 0) - Number(a.cleanSheets || 0) ||
    Number(b.penaltiesSaved || 0) - Number(a.penaltiesSaved || 0) ||
    getGoalsConcededAverage(a) - getGoalsConcededAverage(b) ||
    Number(b.wins || 0) - Number(a.wins || 0) ||
    Number(b.matchesPlayed || 0) - Number(a.matchesPlayed || 0) ||
    Number(b.rivalScore || 1000) - Number(a.rivalScore || 1000)
  );
}

function topBy(
  users: GoalkeeperRow[],
  getValue: (user: GoalkeeperRow) => number,
  lowerIsBetter = false
) {
  const activeUsers = users.filter(isActiveGoalkeeper);

  return [...activeUsers].sort((a, b) =>
    lowerIsBetter ? getValue(a) - getValue(b) : getValue(b) - getValue(a)
  )[0];
}

export default function GoalkeepersPage() {
  const [goalkeepers, setGoalkeepers] = useState<GoalkeeperRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGoalkeepers() {
      try {
        const q = query(collection(db, "users"), limit(500));
        const snap = await getDocs(q);

        const users = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<GoalkeeperRow, "id">),
        }));

        setGoalkeepers(users.filter(isGoalkeeper));
      } finally {
        setLoading(false);
      }
    }

    loadGoalkeepers();
  }, []);

  const rankedGoalkeepers = useMemo(() => {
    return [...goalkeepers].sort(compareGoalkeepers);
  }, [goalkeepers]);

  const activeGoalkeepers = useMemo(() => {
    return rankedGoalkeepers.filter(isActiveGoalkeeper);
  }, [rankedGoalkeepers]);

  const topGoalkeeper = useMemo(() => {
    return topBy(goalkeepers, calculateGoalkeeperScore);
  }, [goalkeepers]);

  const topCleanSheets = useMemo(() => {
    return topBy(goalkeepers, (user) => Number(user.cleanSheets || 0));
  }, [goalkeepers]);

  const bestAverage = useMemo(() => {
    return topBy(goalkeepers, getGoalsConcededAverage, true);
  }, [goalkeepers]);

  const topPenaltySaver = useMemo(() => {
    return topBy(goalkeepers, (user) => Number(user.penaltiesSaved || 0));
  }, [goalkeepers]);

  const topRivalScore = useMemo(() => {
    return topBy(goalkeepers, (user) => Number(user.rivalScore || 1000));
  }, [goalkeepers]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-4 py-6 text-white sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla classifica
        </Link>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:mt-8 sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 p-5 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(132,204,22,0.16),transparent_58%),radial-gradient(circle_at_right,rgba(34,211,238,0.12),transparent_45%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-lime-300/30 bg-lime-400/10 text-lime-200 sm:h-16 sm:w-16">
                  <Shield size={32} />
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.28em] text-lime-200 sm:text-sm">
                    Ranking portieri Rivalo
                  </div>

                  <h1 className="mt-2 text-[40px] font-black leading-[1.05] tracking-tight sm:text-5xl">
                    Classifica portieri
                  </h1>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                    Classifica dedicata ai portieri di calcetto, ordinata per continuità,
                    clean sheet, media gol subiti, rigori parati, vittorie, MVP
                    e RivalScore.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <StatPill label="Portieri" value={goalkeepers.length} />
                <StatPill label="Attivi" value={activeGoalkeepers.length} />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento classifica portieri...
              </div>
            ) : rankedGoalkeepers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessun portiere calcetto trovato.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                  <CategoryCard
                    title="Top Portiere"
                    value={
                      topGoalkeeper
                        ? calculateGoalkeeperScore(topGoalkeeper)
                        : 0
                    }
                    user={topGoalkeeper}
                    icon={<Crown className="text-lime-200" />}
                  />

                  <CategoryCard
                    title="Clean sheet"
                    value={topCleanSheets?.cleanSheets || 0}
                    user={topCleanSheets}
                    icon={<ShieldCheck className="text-lime-300" />}
                  />

                  <CategoryCard
                    title="Media GS"
                    value={bestAverage ? formatGoalsConcededAverage(bestAverage) : "0.0"}
                    user={bestAverage}
                    icon={<Target className="text-cyan-300" />}
                  />

                  <CategoryCard
                    title="Rigori parati"
                    value={topPenaltySaver?.penaltiesSaved || 0}
                    user={topPenaltySaver}
                    icon={<Medal className="text-yellow-200" />}
                  />

                  <CategoryCard
                    title="RivalScore"
                    value={topRivalScore?.rivalScore || 0}
                    user={topRivalScore}
                    icon={<Trophy className="text-cyan-200" />}
                  />
                </div>

                <div className="mt-8 sm:mt-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-lime-300" />

                    <h2 className="text-[30px] font-black leading-tight sm:text-3xl">
                      Top portieri calcetto
                    </h2>
                  </div>

                  <div className="grid gap-3">
                    {rankedGoalkeepers.map((user, index) => (
                      <GoalkeeperRowCard
                        key={user.id}
                        user={user}
                        index={index + 1}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function StatPill({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-lime-300/20 bg-lime-400/10 px-4 py-3">
      <div className="break-words text-[10px] font-black uppercase tracking-[0.16em] text-lime-200 sm:text-xs sm:tracking-[0.2em]">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function CategoryCard({
  title,
  value,
  user,
  icon,
}: {
  title: string;
  value: string | number;
  user?: GoalkeeperRow;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4 sm:rounded-[1.6rem]">
      <div className="flex items-center justify-between gap-3">
        <div className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-slate-300 sm:text-xs">
          {title}
        </div>

        <div className="shrink-0">{icon}</div>
      </div>

      <div className="mt-3 text-4xl font-black leading-none text-white sm:text-5xl">
        {value}
      </div>

      <div className="mt-2 break-words text-sm font-bold text-lime-200">
        {getDisplayName(user)}
      </div>
    </div>
  );
}

function GoalkeeperRowCard({
  user,
  index,
}: {
  user: GoalkeeperRow;
  index: number;
}) {
  const removed = isRemovedUser(user);
  const photo = getDisplayPhoto(user);
  const displayName = getDisplayName(user);
  const matches = Number(user.matchesPlayed || 0);
  const score = calculateGoalkeeperScore(user);
  const average = formatGoalsConcededAverage(user);
  const isActive = isActiveGoalkeeper(user);

  const cardClassName = `relative min-w-0 overflow-hidden rounded-[1.55rem] border bg-gradient-to-br from-[#0f172a] to-[#111827] p-4 shadow-xl transition sm:rounded-[1.8rem] sm:p-5 ${
    isActive ? "border-lime-300/20" : "border-white/10 opacity-70"
  } ${removed ? "cursor-default" : "hover:border-lime-300/40"}`;

  const content = (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(132,204,22,.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,.10),transparent_45%)]" />

      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3 sm:w-[34%]">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lg font-black text-lime-200 ring-1 ring-lime-300/20 sm:h-14 sm:w-14">
            #{index}
          </div>

          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border-2 border-lime-300/30 bg-black/30 shadow-lg sm:h-20 sm:w-20">
            {photo ? (
              <img src={photo} alt="Profilo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserRound className="h-9 w-9 text-lime-100" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="break-words text-xl font-black uppercase leading-tight text-white sm:text-2xl">
              {displayName}
            </div>

            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-lime-200">
              {removed ? "Profilo non attivo" : isActive ? "Portiere attivo" : "0 partite"}
            </div>
          </div>
        </div>

        <div className="grid min-w-0 flex-1 grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-9">
          <MiniStat label="Punteggio" value={score} color="text-lime-200" />
          <MiniStat label="Partite" value={matches} />
          <MiniStat label="GS" value={user.goalsConceded || 0} color="text-orange-100" />
          <MiniStat label="Media GS" value={average} color="text-orange-200" />
          <MiniStat label="CS" value={user.cleanSheets || 0} color="text-lime-200" />
          <MiniStat label="RP" value={user.penaltiesSaved || 0} color="text-cyan-200" />
          <MiniStat label="Vittorie" value={user.wins || 0} color="text-lime-300" />
          <MiniStat label="MVP" value={user.mvp || 0} color="text-yellow-100" />
          <MiniStat label="RivalScore" value={user.rivalScore || 1000} color="text-cyan-200" />
        </div>
      </div>
    </>
  );

  if (removed) {
    return <div className={cardClassName}>{content}</div>;
  }

  return (
    <Link href={`/public/${user.id}`} className={cardClassName}>
      {content}
    </Link>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 px-2 py-3 text-center">
      <div className={`break-words text-lg font-black leading-none sm:text-xl ${color || "text-white"}`}>
        {value}
      </div>

      <div className="mt-1 break-words text-[9px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-[10px]">
        {label}
      </div>
    </div>
  );
}
