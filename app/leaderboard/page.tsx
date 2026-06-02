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
  ShieldCheck,
  Globe2,
} from "lucide-react";

type UserRow = {
  id: string;
  name?: string;
  nickname?: string;
  mainSport?: string;
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
};

type SportFilter = "all" | "calcetto" | "padel" | "tennis";

function normalizeSport(value?: string) {
  return (value || "").toLowerCase().trim();
}

function calculateGlobalRankScore(user: UserRow) {
  const matches = Number(user.matchesPlayed || 0);
  const wins = Number(user.wins || 0);
  const draws = Number(user.draws || 0);
  const losses = Number(user.losses || 0);
  const mvp = Number(user.mvp || 0);
  const goals = Number(user.goals || 0);
  const assists = Number(user.assists || 0);
  const winStreak = Number(user.winStreak || 0);

  const winRate = matches > 0 ? wins / matches : 0;

  const score =
    wins * 120 +
    draws * 35 +
    mvp * 90 +
    matches * 18 +
    Math.min(goals, 120) * 4 +
    Math.min(assists, 80) * 5 +
    Math.min(winStreak, 10) * 25 +
    Math.round(winRate * 120) -
    losses * 35;

  return Math.max(0, Math.round(score));
}

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sportFilter, setSportFilter] = useState<SportFilter>("all");

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "users"), limit(200));
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

    return users.filter(
      (user) => normalizeSport(user.mainSport) === sportFilter
    );
  }, [users, sportFilter]);

  const rankedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const scoreA = calculateGlobalRankScore(a);
      const scoreB = calculateGlobalRankScore(b);

      return (
        scoreB - scoreA ||
        Number(b.wins || 0) - Number(a.wins || 0) ||
        Number(b.mvp || 0) - Number(a.mvp || 0) ||
        Number(b.matchesPlayed || 0) - Number(a.matchesPlayed || 0) ||
        Number(b.goals || 0) - Number(a.goals || 0) ||
        Number(b.assists || 0) - Number(a.assists || 0)
      );
    });
  }, [filteredUsers]);

  const topScorer = useMemo(() => {
    return [...filteredUsers].sort(
      (a, b) => Number(b.goals || 0) - Number(a.goals || 0)
    )[0];
  }, [filteredUsers]);

  const topAssist = useMemo(() => {
    return [...filteredUsers].sort(
      (a, b) => Number(b.assists || 0) - Number(a.assists || 0)
    )[0];
  }, [filteredUsers]);

  const topMvp = useMemo(() => {
    return [...filteredUsers].sort(
      (a, b) => Number(b.mvp || 0) - Number(a.mvp || 0)
    )[0];
  }, [filteredUsers]);

  const topStreak = useMemo(() => {
    return [...filteredUsers].sort(
      (a, b) => Number(b.winStreak || 0) - Number(a.winStreak || 0)
    )[0];
  }, [filteredUsers]);

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
                    Rivalo Global Ranking
                  </div>

                  <h1 className="mt-2 break-words text-[40px] font-black leading-[1.05] tracking-tight sm:text-5xl">
                    Classifica mondiale
                  </h1>

                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg">
                    Ranking generale basato sulle statistiche reali: vittorie,
                    MVP, partite, rendimento, gol e assist.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
                <StatPill
                  label="Utenti totali"
                  value={users.length}
                  color="cyan"
                />

                <StatPill
                  label="In classifica"
                  value={rankedUsers.length}
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

                  <CategoryCard
                    title="MVP King"
                    value={topMvp?.mvp || 0}
                    user={topMvp}
                    icon={<Crown className="text-yellow-200" />}
                  />

                  <CategoryCard
                    title="Best Streak"
                    value={topStreak?.winStreak || 0}
                    user={topStreak}
                    icon={<Flame className="text-orange-300" />}
                  />
                </div>

                <div className="mt-8 sm:mt-10">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-cyan-300" />

                    <h2 className="text-[30px] font-black leading-tight sm:text-3xl">
                      Top mondiale
                    </h2>
                  </div>

                  <div className="grid gap-3">
                    {rankedUsers.slice(0, 3).map((user, index) => (
                      <LeaderboardPodiumCard
                        key={user.id}
                        user={user}
                        index={index}
                      />
                    ))}

                    {rankedUsers.slice(3).map((user, index) => (
                      <CompactRow
                        key={user.id}
                        user={user}
                        index={index + 4}
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
}: {
  title: string;
  value: number;
  user?: UserRow;
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

      <div className="mt-2 truncate text-sm text-cyan-300">
        {user?.name || user?.nickname || "Player"}
      </div>
    </div>
  );
}

function LeaderboardPodiumCard({
  user,
  index,
}: {
  user: UserRow;
  index: number;
}) {
  const photo = user.photoURL || user.photoUrl || "";
  const matches = Number(user.matchesPlayed || 0);
  const wins = Number(user.wins || 0);
  const rankScore = calculateGlobalRankScore(user);
  const winRate = matches > 0 ? Math.round((wins / matches) * 100) : 0;

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
      className={`relative min-w-0 overflow-hidden rounded-[1.5rem] border ${border} bg-gradient-to-br from-[#0f172a] to-[#111827] p-4 shadow-xl sm:rounded-[1.8rem] sm:p-5`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.12),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.10),transparent_45%)]" />

      <div className="relative flex min-w-0 items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 font-black text-cyan-200 sm:h-16 sm:w-16">
          #{index + 1}
        </div>

        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border-2 border-cyan-400/30 bg-black/30 sm:h-16 sm:w-16">
          {photo ? (
            <img src={photo} alt="profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="h-8 w-8 text-cyan-200" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className={`shrink-0 ${rankColor}`}>{medal}</span>

            <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-black text-cyan-200">
              Top {index + 1}
            </span>
          </div>

          <Link
            href={`/public/${user.id}`}
            className="block truncate text-xl font-black uppercase leading-tight tracking-wide transition hover:text-cyan-300 sm:text-2xl"
          >
            {user.name || user.nickname || "Player"}
          </Link>

          <div className="truncate text-xs capitalize text-slate-400">
            {user.mainSport || "sport"}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300">
            Rank
          </div>

          <div className="text-2xl font-black leading-none text-cyan-300 sm:text-3xl">
            {rankScore}
          </div>
        </div>
      </div>

      <div className="relative mt-4 grid grid-cols-4 gap-2 text-center sm:grid-cols-6">
        <MiniStat label="Win" value={wins} color="text-lime-300" />
        <MiniStat label="MVP" value={user.mvp || 0} color="text-yellow-200" />
        <MiniStat label="Partite" value={matches} color="text-cyan-200" />
        <MiniStat label="Gol" value={user.goals || 0} color="text-yellow-300" />
        <MiniStat label="Assist" value={user.assists || 0} color="text-cyan-300" />
        <MiniStat label="WR%" value={winRate} color="text-cyan-200" />
      </div>
    </div>
  );
}

function CompactRow({
  user,
  index,
}: {
  user: UserRow;
  index: number;
}) {
  const photo = user.photoURL || user.photoUrl || "";
  const rankScore = calculateGlobalRankScore(user);

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 font-black text-cyan-300">
          #{index}
        </div>

        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
          {photo ? (
            <img src={photo} alt="profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/30">
              <UserRound className="text-slate-400" />
            </div>
          )}
        </div>

        <div className="min-w-0">
          <Link
            href={`/public/${user.id}`}
            className="block truncate font-black hover:text-cyan-300"
          >
            {user.name || user.nickname || "Player"}
          </Link>

          <div className="truncate text-sm capitalize text-slate-400">
            {user.mainSport || "sport"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3 text-center md:flex md:items-center md:gap-6">
        <CompactStat label="Rank" value={rankScore} color="text-cyan-300" />
        <CompactStat label="Win" value={user.wins || 0} color="text-lime-300" />
        <CompactStat label="MVP" value={user.mvp || 0} color="text-yellow-100" />
        <CompactStat
          label="Partite"
          value={user.matchesPlayed || 0}
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
      <div className={`truncate text-base font-black ${color}`}>{value}</div>
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
