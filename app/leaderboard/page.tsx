"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  getDocs,
  limit,
  query,
} from "firebase/firestore";

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
        const q = query(
          collection(db, "users"),
          limit(200)
        );

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
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-yellow-300/30 bg-yellow-400/10 text-yellow-300">
                  <Globe2 size={34} />
                </div>

                <div>
                  <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">
                    Rivalo Global Ranking
                  </div>

                  <h1 className="mt-2 text-5xl font-black">
                    Classifica mondiale
                  </h1>

                  <p className="mt-3 max-w-3xl text-slate-300">
                    Ranking generale basato sulle statistiche reali: vittorie,
                    MVP, partite, rendimento, gol e assist.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
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

          <div className="p-8">
            <div className="mb-8 flex flex-wrap gap-3">
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
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

                <div className="mt-12">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-cyan-300" />

                    <h2 className="text-3xl font-black">
                      Top mondiale
                    </h2>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {rankedUsers.slice(0, 3).map((user, index) => (
                      <LeaderboardPodiumCard
                        key={user.id}
                        user={user}
                        index={index}
                      />
                    ))}
                  </div>

                  <div className="mt-10 space-y-4">
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
      className={`rounded-2xl border px-4 py-3 ${
        color === "cyan"
          ? "border-cyan-400/20 bg-cyan-400/10"
          : "border-yellow-400/20 bg-yellow-400/10"
      }`}
    >
      <div
        className={`text-xs uppercase tracking-[0.2em] ${
          color === "cyan" ? "text-cyan-300" : "text-yellow-300"
        }`}
      >
        {label}
      </div>

      <div className="mt-1 text-2xl font-black">
        {value}
      </div>
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
      className={`rounded-2xl border px-5 py-3 text-sm font-black uppercase tracking-[0.16em] transition ${
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
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
      <div className="flex items-center justify-between">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-300">
          {title}
        </div>

        {icon}
      </div>

      <div className="mt-5 text-5xl font-black text-white">
        {value}
      </div>

      <div className="mt-3 truncate text-sm text-cyan-300">
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

  const winRate =
    matches > 0 ? Math.round((wins / matches) * 100) : 0;

  const medal =
    index === 0 ? (
      <Crown />
    ) : (
      <Medal />
    );

  const border =
    index === 0
      ? "border-yellow-300/30"
      : index === 1
      ? "border-slate-300/25"
      : "border-orange-300/25";

  const glow =
    index === 0
      ? "rgba(250,204,21,0.18)"
      : index === 1
      ? "rgba(148,163,184,0.16)"
      : "rgba(251,146,60,0.14)";

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border ${border} bg-gradient-to-br from-[#0f172a] to-[#111827] p-6 shadow-2xl transition hover:scale-[1.02] hover:border-cyan-400/30`}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top, ${glow}, transparent 58%)`,
        }}
      />

      <div className="absolute right-4 top-4 text-yellow-300">
        {medal}
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="mb-4 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-200">
          #{index + 1} Globale
        </div>

        <div className="h-24 w-24 overflow-hidden rounded-full border-4 border-cyan-400/30 shadow-xl">
          {photo ? (
            <img
              src={photo}
              alt="profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/30">
              <UserRound className="h-10 w-10 text-cyan-200" />
            </div>
          )}
        </div>

        <div className="mt-4 w-full">
          <Link
            href={`/public/${user.id}`}
            className="block truncate text-2xl font-black uppercase tracking-wide transition hover:text-cyan-300"
          >
            {user.name || user.nickname || "Player"}
          </Link>

          <div className="mt-1 text-sm capitalize text-slate-400">
            {user.mainSport || "sport"}
          </div>
        </div>

        <div className="mt-5">
          <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
            Rank Score
          </div>

          <div className="text-5xl font-black text-cyan-300">
            {rankScore}
          </div>

          <div className="mt-2 text-xs text-slate-400">
            RivalScore salvato: {user.rivalScore || 1000}
          </div>
        </div>

        <div className="mt-6 grid w-full grid-cols-2 gap-3 sm:grid-cols-3">
          <MiniStat
            label="Win"
            value={wins}
            color="text-lime-300"
          />

          <MiniStat
            label="MVP"
            value={user.mvp || 0}
            color="text-yellow-200"
          />

          <MiniStat
            label="Partite"
            value={matches}
            color="text-cyan-200"
          />

          <MiniStat
            label="Gol"
            value={user.goals || 0}
            color="text-yellow-300"
          />

          <MiniStat
            label="Assist"
            value={user.assists || 0}
            color="text-cyan-300"
          />

          <MiniStat
            label="WR%"
            value={winRate}
            color="text-cyan-200"
          />
        </div>
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
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/20 px-5 py-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 font-black text-cyan-300">
          #{index}
        </div>

        <div className="h-12 w-12 overflow-hidden rounded-xl border border-white/10">
          {photo ? (
            <img
              src={photo}
              alt="profile"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-black/30">
              <UserRound className="text-slate-400" />
            </div>
          )}
        </div>

        <div>
          <Link
            href={`/public/${user.id}`}
            className="font-black hover:text-cyan-300"
          >
            {user.name || user.nickname || "Player"}
          </Link>

          <div className="text-sm capitalize text-slate-400">
            {user.mainSport || "sport"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 text-center md:flex md:items-center md:gap-6">
        <CompactStat
          label="Rank"
          value={rankScore}
          color="text-cyan-300"
        />

        <CompactStat
          label="Win"
          value={user.wins || 0}
          color="text-lime-300"
        />

        <CompactStat
          label="MVP"
          value={user.mvp || 0}
          color="text-yellow-100"
        />

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
    <div className="rounded-2xl bg-black/25 p-3">
      <div className="text-xs text-slate-400">
        {label}
      </div>

      <div className={`text-xl font-black ${color}`}>
        {value}
      </div>
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
    <div>
      <div className="text-xs text-slate-500">
        {label}
      </div>

      <div className={`font-black ${color}`}>
        {value}
      </div>
    </div>
  );
}