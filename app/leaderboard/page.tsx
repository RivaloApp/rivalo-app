"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, query } from "firebase/firestore";

import { db } from "../../lib/firebase";

import {
  ArrowLeft,
  Crown,
  Medal,
  UserRound,
  Flame,
  Target,
  Shield,
  ShieldCheck,
  Globe2,
} from "lucide-react";

type UserRow = {
  id: string;
  name?: string;
  nickname?: string;
  activeSport?: string;
  mainSport?: string;
  sport?: string;
  statsBySport?: Record<string, any>;
  rivalScore?: number;
  level?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  mvp?: number;
  goals?: number;
  assists?: number;
  matchesPlayed?: number;
  photoURL?: string;
  photoUrl?: string;
  xp?: number;
  winStreak?: number;
  role?: string;
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
  accountStatus?: string;
  deletionRequested?: boolean;
};

type SportFilter = "all" | "calcetto" | "padel" | "tennis";

function normalizeSport(value?: string) {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";
  return "calcetto";
}

function getUserSport(user: UserRow) {
  return normalizeSport(user.activeSport || user.mainSport || user.sport || "calcetto");
}

function getSportStats(user: UserRow, sportFilter: SportFilter) {
  const sport = sportFilter === "all" ? getUserSport(user) : sportFilter;
  const stats = user.statsBySport?.[sport];

  if (!stats || typeof stats !== "object") {
    return user;
  }

  return {
    ...user,
    ...stats,
    id: user.id,
    name: user.name,
    nickname: user.nickname,
    activeSport: user.activeSport,
    mainSport: user.mainSport,
    sport: user.sport,
    role: user.role,
    photoURL: user.photoURL,
    photoUrl: user.photoUrl,
    accountStatus: user.accountStatus,
    deletionRequested: user.deletionRequested,
    statsBySport: user.statsBySport,
  } as UserRow;
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

function isGoalkeeper(user?: UserRow) {
  return getUserSport(user || { id: "" }) === "calcetto" &&
    normalizeCalcettoRole(user?.role) === "portiere";
}

function sportLabel(filter: SportFilter) {
  if (filter === "padel") return "Padel";
  if (filter === "tennis") return "Tennis";
  if (filter === "calcetto") return "Calcetto";
  return "Tutti gli sport";
}

function rankScoreLabel(filter: SportFilter) {
  if (filter === "calcetto") return "RivalScore";
  if (filter === "padel") return "Padel Score";
  if (filter === "tennis") return "Tennis Score";

  return "RivalScore";
}

function rankingDescription(filter: SportFilter) {
  if (filter === "calcetto") {
    return "Peso maggiore a vittorie, RivalScore, MVP, costanza e ruolo. Portieri valutati con clean sheet, gol subiti e rigori parati.";
  }

  if (filter === "padel") {
    return "Peso maggiore a vittorie, percentuale vittorie, serie positiva, MVP e costanza.";
  }

  if (filter === "tennis") {
    return "Peso maggiore a vittorie, percentuale vittorie, serie positiva, RivalScore e costanza.";
  }

  return "Ranking generale Rivalo: confronta tutti gli sport usando criteri tecnici separati.";
}

function isActiveUser(user: UserRow) {
  return Number(user.matchesPlayed || 0) > 0;
}

function isRemovedUser(user?: UserRow) {
  return Boolean(
    user?.accountStatus === "deletion_requested" ||
      user?.accountStatus === "deleted" ||
      user?.deletionRequested
  );
}

function getDisplayName(user?: UserRow) {
  if (!user) return "Nessun utente attivo";
  if (isRemovedUser(user)) return "Utente rimosso";

  return user.name || user.nickname || "Rivalo Player";
}

function getDisplayPhoto(user?: UserRow) {
  if (!user || isRemovedUser(user)) return "";

  return user.photoURL || user.photoUrl || "";
}

function calculateUniversalRankScore(user: UserRow) {
  const matches = Number(user.matchesPlayed || 0);
  const wins = Number(user.wins || 0);
  const draws = Number(user.draws || 0);
  const losses = Number(user.losses || 0);
  const mvp = Number(user.mvp || 0);
  const winStreak = Number(user.winStreak || 0);
  const rivalScore = Number(user.rivalScore || 1000);
  const xp = Number(user.xp || 0);

  if (matches <= 0) return 0;

  const winRate = wins / matches;

  const score =
    wins * 120 +
    draws * 35 +
    mvp * 90 +
    matches * 18 +
    Math.min(winStreak, 10) * 25 +
    Math.round(winRate * 140) +
    Math.max(0, rivalScore - 1000) * 0.45 +
    Math.min(xp, 5000) * 0.025 -
    losses * 35;

  return Math.max(0, Math.round(score));
}

function calculateCalcettoRankScore(user: UserRow) {
  const matches = Number(user.matchesPlayed || 0);
  const goals = Number(user.goals || 0);
  const assists = Number(user.assists || 0);

  if (matches <= 0) return 0;

  return Math.max(
    0,
    Math.round(
      calculateUniversalRankScore(user) +
        Math.min(goals, 120) * 4 +
        Math.min(assists, 80) * 5
    )
  );
}

function calculateGoalkeeperRankScore(user: UserRow) {
  const matches = Number(user.matchesPlayed || 0);
  const wins = Number(user.wins || 0);
  const draws = Number(user.draws || 0);
  const mvp = Number(user.mvp || 0);
  const rivalScore = Number(user.rivalScore || 1000);
  const cleanSheets = Number(user.cleanSheets || 0);
  const penaltiesSaved = Number(user.penaltiesSaved || 0);
  const goalsConceded = Number(user.goalsConceded || 0);
  const winStreak = Number(user.winStreak || 0);

  if (matches <= 0) return 0;

  const goalsConcededAverage = goalsConceded / matches;

  const score =
    wins * 115 +
    draws * 35 +
    cleanSheets * 135 +
    penaltiesSaved * 95 +
    mvp * 80 +
    Math.min(matches, 45) * 28 +
    Math.min(winStreak, 10) * 25 +
    Math.max(0, rivalScore - 1000) * 0.45 -
    goalsConcededAverage * 42;

  return Math.max(0, Math.round(score));
}

function calculateRacketRankScore(user: UserRow, sport: "padel" | "tennis") {
  const matches = Number(user.matchesPlayed || 0);
  const wins = Number(user.wins || 0);
  const losses = Number(user.losses || 0);
  const draws = Number(user.draws || 0);
  const mvp = Number(user.mvp || 0);
  const winStreak = Number(user.winStreak || 0);
  const rivalScore = Number(user.rivalScore || 1000);
  const xp = Number(user.xp || 0);
  const level = Number(user.level || 1);

  if (matches <= 0) return 0;

  const winRate = wins / matches;
  const consistencyBonus = Math.min(matches, 40) * (sport === "padel" ? 22 : 24);
  const winRateBonus = Math.round(winRate * (sport === "padel" ? 260 : 285));
  const streakBonus = Math.min(winStreak, 12) * (sport === "padel" ? 32 : 36);
  const mvpBonus = mvp * (sport === "padel" ? 70 : 65);
  const levelBonus = Math.min(level, 80) * 6;

  const score =
    wins * (sport === "padel" ? 135 : 145) +
    draws * 20 +
    consistencyBonus +
    winRateBonus +
    streakBonus +
    mvpBonus +
    levelBonus +
    Math.max(0, rivalScore - 1000) * 0.5 +
    Math.min(xp, 6000) * 0.02 -
    losses * (sport === "padel" ? 28 : 30);

  return Math.max(0, Math.round(score));
}

function calculateSportRankScore(user: UserRow, filter: SportFilter) {
  const userSport = getUserSport(user);
  const statsUser = getSportStats(user, filter);

  if (filter === "calcetto") {
    return isGoalkeeper(statsUser)
      ? calculateGoalkeeperRankScore(statsUser)
      : calculateCalcettoRankScore(statsUser);
  }
  if (filter === "padel") return calculateRacketRankScore(statsUser, "padel");
  if (filter === "tennis") return calculateRacketRankScore(statsUser, "tennis");

  if (userSport === "padel") return calculateRacketRankScore(statsUser, "padel");
  if (userSport === "tennis") return calculateRacketRankScore(statsUser, "tennis");

  return isGoalkeeper(statsUser)
    ? calculateGoalkeeperRankScore(statsUser)
    : calculateCalcettoRankScore(statsUser);
}

function compareUsers(a: UserRow, b: UserRow, filter: SportFilter) {
  const statsA = getSportStats(a, filter);
  const statsB = getSportStats(b, filter);

  const activeA = isActiveUser(statsA) ? 1 : 0;
  const activeB = isActiveUser(statsB) ? 1 : 0;

  if (activeA !== activeB) {
    return activeB - activeA;
  }

  const scoreA = calculateSportRankScore(a, filter);
  const scoreB = calculateSportRankScore(b, filter);

  const matchesA = Number(statsA.matchesPlayed || 0);
  const matchesB = Number(statsB.matchesPlayed || 0);
  const winRateA = matchesA > 0 ? Number(statsA.wins || 0) / matchesA : 0;
  const winRateB = matchesB > 0 ? Number(statsB.wins || 0) / matchesB : 0;

  const baseCompare =
    scoreB - scoreA ||
    Number(statsB.rivalScore || 1000) - Number(statsA.rivalScore || 1000) ||
    Number(statsB.wins || 0) - Number(statsA.wins || 0) ||
    winRateB - winRateA ||
    Number(statsB.mvp || 0) - Number(statsA.mvp || 0) ||
    matchesB - matchesA ||
    Number(statsB.winStreak || 0) - Number(statsA.winStreak || 0);

  if (baseCompare !== 0) return baseCompare;

  if (filter === "calcetto" || filter === "all") {
    const goalkeeperCompare =
      Number(statsB.cleanSheets || 0) - Number(statsA.cleanSheets || 0) ||
      Number(statsB.penaltiesSaved || 0) - Number(statsA.penaltiesSaved || 0) ||
      Number(statsA.goalsConceded || 0) - Number(statsB.goalsConceded || 0);

    if (isGoalkeeper(a) || isGoalkeeper(b)) return goalkeeperCompare;

    return (
      Number(statsB.goals || 0) - Number(statsA.goals || 0) ||
      Number(statsB.assists || 0) - Number(statsA.assists || 0)
    );
  }

  return 0;
}

function topBy(
  users: UserRow[],
  sportFilter: SportFilter,
  getValue: (user: UserRow) => number
) {
  const activeUsers = users.filter((user) =>
    isActiveUser(getSportStats(user, sportFilter))
  );

  return [...activeUsers].sort(
    (a, b) =>
      getValue(getSportStats(b, sportFilter)) -
      getValue(getSportStats(a, sportFilter))
  )[0];
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<SportFilter>("all");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "users"), limit(300));
        const snap = await getDocs(q);

        setUsers(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<UserRow, "id">),
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const filteredUsers = useMemo(() => {
    if (sportFilter === "all") return users;

    return users.filter((user) => getUserSport(user) === sportFilter);
  }, [users, sportFilter]);

  const rankedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => compareUsers(a, b, sportFilter));
  }, [filteredUsers, sportFilter]);

  const activeRankedUsers = useMemo(() => {
    return rankedUsers.filter((user) =>
      isActiveUser(getSportStats(user, sportFilter))
    );
  }, [rankedUsers, sportFilter]);

  const topScorer = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => Number(user.goals || 0));
  }, [filteredUsers, sportFilter]);

  const topAssist = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => Number(user.assists || 0));
  }, [filteredUsers, sportFilter]);

  const topCleanSheet = useMemo(() => {
    return topBy(
      filteredUsers.filter(isGoalkeeper),
      sportFilter,
      (user) => Number(user.cleanSheets || 0)
    );
  }, [filteredUsers, sportFilter]);

  const topGoalkeeper = useMemo(() => {
    return topBy(
      filteredUsers.filter(isGoalkeeper),
      sportFilter,
      (user) => calculateGoalkeeperRankScore(user)
    );
  }, [filteredUsers, sportFilter]);

  const topMvp = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => Number(user.mvp || 0));
  }, [filteredUsers, sportFilter]);

  const topStreak = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => Number(user.winStreak || 0));
  }, [filteredUsers, sportFilter]);

  const topWins = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => Number(user.wins || 0));
  }, [filteredUsers, sportFilter]);

  const topWinRate = useMemo(() => {
    return topBy(filteredUsers, sportFilter, (user) => {
      const matches = Number(user.matchesPlayed || 0);
      const wins = Number(user.wins || 0);

      return matches > 0 ? Math.round((wins / matches) * 100) : 0;
    });
  }, [filteredUsers]);

  const topRankScore = useMemo(() => {
  return topBy(filteredUsers, sportFilter, (user) =>
    calculateSportRankScore(user, sportFilter)
  );
}, [filteredUsers, sportFilter]);

  const isCalcettoView = sportFilter === "calcetto" || sportFilter === "all";
  const isRacketView = sportFilter === "padel" || sportFilter === "tennis";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-4 py-6 text-white sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:mt-8 sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 p-4 sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative flex min-w-0 flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-yellow-300/30 bg-yellow-400/10 text-yellow-300 sm:h-16 sm:w-16 sm:rounded-3xl">
                  <Globe2 className="h-7 w-7 sm:h-[34px] sm:w-[34px]" />
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[.22em] text-cyan-300 sm:text-sm sm:tracking-[.3em]">
                    Rivalo Ranking Globale
                  </div>

                  <h1 className="mt-2 break-words text-[40px] font-black leading-[1.05] tracking-tight sm:text-5xl">
                    Classifica mondiale
                  </h1>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                    Ranking multi-sport con classifiche separate per calcetto,
                    padel e tennis. Gli utenti senza partite restano sotto agli
                    utenti attivi.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <StatPill label="Utenti totali" value={users.length} color="cyan" />
                <StatPill
                  label="Attivi"
                  value={activeRankedUsers.length}
                  color="yellow"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:flex sm:flex-wrap">
              <FilterButton
                active={sportFilter === "all"}
                onClick={() => setSportFilter("all")}
              >
                Tutti
              </FilterButton>

              <FilterButton
                active={sportFilter === "calcetto"}
                onClick={() => setSportFilter("calcetto")}
              >
                Calcetto
              </FilterButton>

              <FilterButton
                active={sportFilter === "padel"}
                onClick={() => setSportFilter("padel")}
              >
                Padel
              </FilterButton>

              <FilterButton
                active={sportFilter === "tennis"}
                onClick={() => setSportFilter("tennis")}
              >
                Tennis
              </FilterButton>
            </div>

            {isCalcettoView && (
              <div className="mb-6 rounded-2xl border border-lime-300/20 bg-lime-400/10 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">
                      Ranking portieri calcetto
                    </div>

                    <div className="mt-2 text-sm font-bold leading-6 text-lime-100/90">
                      Classifica separata per portieri con clean sheet, media gol subiti, rigori parati e RivalScore.
                    </div>
                  </div>

                  <Link
                    href="/goalkeepers"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-lime-300/30 bg-lime-400/15 px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-lime-100 transition hover:border-lime-200/70 hover:bg-lime-400/25"
                  >
                    <Shield size={18} />
                    Apri portieri
                  </Link>
                </div>
              </div>
            )}

            <div className="mb-6 rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4 text-sm leading-6 text-cyan-100">
              Vista attiva: <span className="font-black">{sportLabel(sportFilter)}</span>.
              {sportFilter === "all"
                ? " Classifica generale Rivalo con criteri separati per sport."
                : " Classifica filtrata solo per questo sport."}
              <span className="block pt-1 text-cyan-200/90">
                {rankingDescription(sportFilter)}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento classifica...
              </div>
            ) : rankedUsers.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessun utente trovato per questo sport.
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {isCalcettoView ? (
                    <>
                      <CategoryCard
                        title="Top Gol"
                        value={topScorer?.goals || 0}
                        user={topScorer}
                        icon={<Target className="text-yellow-300" />}
                      />

                      <CategoryCard
                        title="Top Assist"
                        value={topAssist?.assists || 0}
                        user={topAssist}
                        icon={<ShieldCheck className="text-cyan-300" />}
                      />
                    </>
                  ) : (
                    <>
                      <CategoryCard
                        title={sportFilter === "padel" ? "Padel Score" : "Tennis Score"}
                        value={topRankScore ? calculateSportRankScore(topRankScore, sportFilter) : 0}
                        user={topRankScore}
                        icon={<Medal className="text-yellow-300" />}
                      />

                      <CategoryCard
                        title="Percentuale vittorie"
                        value={
                          topWinRate
                            ? Math.round(
                                (Number(topWinRate.wins || 0) /
                                  Math.max(1, Number(topWinRate.matchesPlayed || 0))) *
                                  100
                              )
                            : 0
                        }
                        user={topWinRate}
                        icon={<ShieldCheck className="text-cyan-300" />}
                        suffix="%"
                      />
                    </>
                  )}

                  <CategoryCard
                    title={isRacketView ? "Top Vittorie" : "Top MVP"}
                    value={isRacketView ? topWins?.wins || 0 : topMvp?.mvp || 0}
                    user={isRacketView ? topWins : topMvp}
                    icon={isRacketView ? <Target className="text-lime-300" /> : <Crown className="text-yellow-200" />}
                  />

                  <CategoryCard
                    title="Miglior serie"
                    value={topStreak?.winStreak || 0}
                    user={topStreak}
                    icon={<Flame className="text-orange-300" />}
                  />
                </div>

                {isCalcettoView && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <CategoryCard
                      title="Top Portiere"
                      value={topGoalkeeper ? calculateGoalkeeperRankScore(topGoalkeeper) : 0}
                      user={topGoalkeeper}
                      icon={<ShieldCheck className="text-lime-300" />}
                    />

                    <CategoryCard
                      title="Clean Sheet"
                      value={topCleanSheet?.cleanSheets || 0}
                      user={topCleanSheet}
                      icon={<Crown className="text-lime-200" />}
                    />

                    <Link
                      href="/goalkeepers"
                      className="rounded-[1.35rem] border border-lime-300/20 bg-lime-400/10 p-4 transition hover:border-lime-300/40 hover:bg-lime-400/15 sm:rounded-[1.6rem]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="break-words text-[11px] font-black uppercase tracking-[0.16em] text-lime-100 sm:text-xs">
                          Classifica completa
                        </div>

                        <Shield className="shrink-0 text-lime-300" />
                      </div>

                      <div className="mt-3 text-3xl font-black leading-none text-white sm:text-4xl">
                        Portieri
                      </div>

                      <div className="mt-2 text-sm font-bold text-lime-200">
                        Apri ranking dedicato
                      </div>
                    </Link>
                  </div>
                )}

                <div className="mt-8 sm:mt-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-cyan-300" />

                    <h2 className="text-[30px] font-black leading-tight sm:text-3xl">
                      {sportFilter === "all"
                        ? "Top mondiale"
                        : `Top ${sportLabel(sportFilter)}`}
                    </h2>
                  </div>

                  <div className="grid gap-3">
                    {rankedUsers.slice(0, 3).map((user, index) => (
                      <LeaderboardPodiumCard
                        key={user.id}
                        user={user}
                        index={index}
                        sportFilter={sportFilter}
                      />
                    ))}

                    {rankedUsers.slice(3).map((user, index) => (
                      <CompactRow
                        key={user.id}
                        user={user}
                        index={index + 4}
                        sportFilter={sportFilter}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "cyan" | "yellow";
}) {
  return (
    <div
      className={`min-w-0 rounded-2xl border px-4 py-3 ${
        color === "cyan"
          ? "border-cyan-400/20 bg-cyan-400/10"
          : "border-yellow-400/20 bg-yellow-400/10"
      }`}
    >
      <div
        className={`break-words text-[10px] font-black uppercase tracking-[0.16em] sm:text-xs sm:tracking-[0.2em] ${
          color === "cyan" ? "text-cyan-300" : "text-yellow-300"
        }`}
      >
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`min-w-0 rounded-2xl border px-3 py-3 text-[12px] font-black uppercase tracking-[0.12em] transition sm:px-5 sm:text-sm sm:tracking-[0.16em] ${
        active
          ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
          : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-400/30 hover:text-cyan-200"
      }`}
    >
      {children}
    </button>
  );
}

function CategoryCard({
  title,
  value,
  user,
  icon,
  suffix = "",
}: {
  title: string;
  value: number;
  user?: UserRow;
  icon: React.ReactNode;
  suffix?: string;
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
        {value}{suffix}
      </div>

      <div className="mt-2 truncate text-sm text-cyan-300">
        {getDisplayName(user)}
      </div>
    </div>
  );
}

function LeaderboardPodiumCard({
  user,
  index,
  sportFilter,
}: {
  user: UserRow;
  index: number;
  sportFilter: SportFilter;
}) {
  const isRemoved = isRemovedUser(user);
  const photo = getDisplayPhoto(user);
  const displayName = getDisplayName(user);
  const statsUser = getSportStats(user, sportFilter);
  const matches = Number(statsUser.matchesPlayed || 0);
  const wins = Number(statsUser.wins || 0);
  const rankScore = calculateSportRankScore(user, sportFilter);
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const isActive = isActiveUser(user);

  const medal = index === 0 ? <Crown size={22} /> : <Medal size={22} />;

  const border =
    index === 0
      ? "border-yellow-300/30"
      : index === 1
      ? "border-slate-300/25"
      : "border-orange-300/25";

  const rankColor =
    index === 0
      ? "text-yellow-200"
      : index === 1
      ? "text-slate-200"
      : "text-orange-200";

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-[1.55rem] border ${border} bg-gradient-to-br from-[#0f172a] to-[#111827] p-4 shadow-xl sm:rounded-[1.8rem] sm:p-5`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.10),transparent_45%)]" />

      <div className="relative flex min-w-0 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-xl font-black text-cyan-200 ring-1 ring-cyan-300/20 sm:h-16 sm:w-16">
          #{index + 1}
        </div>

        <div className="h-[70px] w-[70px] shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-400/35 bg-black/30 shadow-lg shadow-cyan-950/40 sm:h-20 sm:w-20">
          {photo ? (
            <img src={photo} alt="Profilo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-9 w-9 text-cyan-200" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`shrink-0 ${rankColor}`}>{medal}</span>

            <span className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
              isRemoved
                ? "border-slate-400/20 bg-slate-400/10 text-slate-300"
                : "border-cyan-300/20 bg-cyan-400/10 text-cyan-200"
            }`}>
              {isRemoved ? "Profilo non attivo" : isActive ? `Top ${index + 1}` : "Non attivo"}
            </span>
          </div>

          {isRemoved ? (
            <div className="block max-w-full truncate text-[20px] font-black uppercase leading-tight tracking-wide text-slate-300 sm:text-2xl">
              {displayName}
            </div>
          ) : (
            <Link
              href={`/public/${user.id}`}
              className="block max-w-full truncate text-[20px] font-black uppercase leading-tight tracking-wide transition hover:text-cyan-300 sm:text-2xl"
            >
              {displayName}
            </Link>
          )}

          <div className="mt-0.5 truncate text-sm capitalize text-slate-400">
            {getUserSport(user)}
          </div>
        </div>
      </div>

      <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl border border-cyan-400/10 bg-black/15 px-4 py-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
            {rankScoreLabel(sportFilter)}
          </div>

          <div className="text-[11px] text-slate-500">
            RivalScore: {statsUser.rivalScore || 1000}
          </div>
        </div>

        <div className="text-4xl font-black leading-none text-cyan-300">
          {rankScore}
        </div>
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
        <MiniStat label="Vittorie" value={wins} color="text-lime-300" />
        <MiniStat label="MVP" value={statsUser.mvp || 0} color="text-yellow-200" />
        <MiniStat label="Partite" value={matches} color="text-cyan-200" />
        {sportFilter === "padel" || sportFilter === "tennis" ? (
          <>
            <MiniStat label="WR%" value={winRate} color="text-cyan-200" />
            <MiniStat label="Liv" value={statsUser.level || 1} color="text-cyan-300" />
            <MiniStat label="XP" value={statsUser.xp || 0} color="text-slate-200" />
          </>
        ) : (
          <>
            <MiniStat label="Gol" value={statsUser.goals || 0} color="text-yellow-300" />
            <MiniStat label="Assist" value={statsUser.assists || 0} color="text-cyan-300" />
            <MiniStat label="WR%" value={winRate} color="text-cyan-200" />
          </>
        )}
      </div>
    </div>
  );
}

function CompactRow({
  user,
  index,
  sportFilter,
}: {
  user: UserRow;
  index: number;
  sportFilter: SportFilter;
}) {
  const isRemoved = isRemovedUser(user);
  const photo = getDisplayPhoto(user);
  const displayName = getDisplayName(user);
  const statsUser = getSportStats(user, sportFilter);
  const rankScore = calculateSportRankScore(user, sportFilter);
  const isActive = isActiveUser(statsUser);
  const matches = Number(statsUser.matchesPlayed || 0);
  const wins = Number(statsUser.wins || 0);
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;
  const isRacketView = sportFilter === "padel" || sportFilter === "tennis";
  const goalkeeper = isGoalkeeper(user);

  return (
    <div
      className={`flex min-w-0 flex-col gap-3 rounded-2xl border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5 ${
        isActive
          ? "border-white/10 bg-black/20"
          : "border-white/5 bg-black/10 opacity-70"
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 font-black text-cyan-300">
          #{index}
        </div>

        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
          {photo ? (
            <img src={photo} alt="Profilo" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/30">
              <UserRound className="text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          {isRemoved ? (
            <div className="block truncate font-black text-slate-300">
              {displayName}
            </div>
          ) : (
            <Link
              href={`/public/${user.id}`}
              className="block truncate font-black hover:text-cyan-300"
            >
              {displayName}
            </Link>
          )}

          <div className="truncate text-sm capitalize text-slate-400">
            {getUserSport(user)}
            {isRemoved ? " · profilo non attivo" : !isActive ? " · 0 partite" : ""}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center md:flex md:items-center md:gap-6">
        <CompactStat label="Rank" value={rankScore} color="text-cyan-300" />
        <CompactStat label="Vittorie" value={wins} color="text-lime-300" />
        <CompactStat
          label={isRacketView ? "WR%" : goalkeeper ? "CS" : "MVP"}
          value={isRacketView ? winRate : goalkeeper ? statsUser.cleanSheets || 0 : statsUser.mvp || 0}
          color={isRacketView ? "text-cyan-200" : goalkeeper ? "text-lime-200" : "text-yellow-100"}
        />
        <CompactStat
          label={isRacketView ? "Serie" : goalkeeper ? "GS" : "Partite"}
          value={isRacketView ? statsUser.winStreak || 0 : goalkeeper ? statsUser.goalsConceded || 0 : matches}
          color="text-slate-200"
        />
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="min-w-0 rounded-xl bg-black/25 px-2 py-2">
      <div className="truncate text-[10px] text-slate-400">{label}</div>
      <div className={`truncate text-lg font-black ${color}`}>{value}</div>
    </div>
  );
}

function CompactStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xs text-slate-500">{label}</div>
      <div className={`truncate font-black ${color}`}>{value}</div>
    </div>
  );
}
