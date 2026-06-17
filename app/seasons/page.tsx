"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import {
  CURRENT_SEASON_ID,
  CURRENT_SEASON_NAME,
} from "../../lib/seasons";

import {
  ArrowLeft,
  Crown,
  Medal,
  Trophy,
  Target,
  Star,
} from "lucide-react";

type SeasonRow = {
  id: string;
  uid?: string;
  playerName?: string;
  seasonId?: string;
  seasonName?: string;
  sport?: string;
  mainSport?: string;
  points?: number;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  goals?: number;
  assists?: number;
  mvp?: number;
  rivalScoreChange?: number;
};

type UserProfile = {
  mainSport?: string;
};

function normalizeSport(value?: string) {
  return (value || "").toLowerCase().trim();
}

function sportLabel(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "Padel";
  if (sport === "tennis") return "Tennis";
  return "Calcetto";
}

function isRowCompatibleWithUserSport(row: SeasonRow, userSport: string) {
  const normalizedUserSport = normalizeSport(userSport);
  const rowSport = normalizeSport(row.sport || row.mainSport);

  if (!rowSport) {
    return normalizedUserSport === "calcetto";
  }

  return rowSport === normalizedUserSport;
}

export default function SeasonsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        setLoading(true);

        const userSnap = await getDoc(doc(db, "users", currentUser.uid));
        const profile = userSnap.exists()
          ? (userSnap.data() as UserProfile)
          : null;

        const currentSport = normalizeSport(profile?.mainSport || "calcetto");
        setUserSport(currentSport || "calcetto");

        const q = query(
          collection(db, "seasonStats"),
          orderBy("points", "desc"),
          limit(80)
        );

        const snap = await getDocs(q);

        const data = snap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SeasonRow, "id">),
          }))
          .filter((row) => row.seasonId === CURRENT_SEASON_ID)
          .filter((row) => isRowCompatibleWithUserSport(row, currentSport));

        setRows(data);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const topScorer = useMemo(() => {
    return [...rows].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
  }, [rows]);

  const topMvp = useMemo(() => {
    return [...rows].sort((a, b) => (b.mvp || 0) - (a.mvp || 0))[0];
  }, [rows]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-7 text-white sm:px-5 sm:py-8">
      <div className="mx-auto w-full max-w-7xl min-w-0 overflow-hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 px-4 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_60%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300 sm:text-sm sm:tracking-[0.35em]">
                  Stagioni Rivalo · {sportLabel(userSport)}
                </div>

                <h1 className="mt-3 text-[48px] font-black leading-[0.95] sm:text-5xl md:text-6xl">
                  {CURRENT_SEASON_NAME}
                </h1>

                <p className="mt-4 max-w-2xl text-[18px] leading-relaxed text-slate-300 sm:text-xl">
                  La classifica della stagione attiva, filtrata sul tuo sport principale.
                </p>
              </div>

              <div className="w-full rounded-[1.75rem] border border-lime-300/20 bg-lime-400/10 px-6 py-4 sm:w-auto sm:rounded-[2rem]">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                  Sport attivo
                </div>

                <div className="mt-1 text-2xl font-black text-lime-200">
                  {sportLabel(userSport)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-8">
            <div className="mb-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-slate-300 sm:p-5 sm:text-base">
              Le stagioni Rivalo sono separate per sport e raccolgono i match confermati nella stagione attiva.
              Le amichevoli restano match singoli: non creano automaticamente una stagione privata o una rivalità.
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento stagione…
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessun dato stagionale per {sportLabel(userSport)}. Conferma un match di {sportLabel(userSport)} per entrare in classifica.
              </div>
            ) : (
              <>
                <div className="grid min-w-0 grid-cols-3 gap-2 sm:gap-4">
                  <SeasonHighlight
                    title="Leader"
                    value={rows[0]?.points || 0}
                    label={rows[0]?.playerName || "Rivalo Player"}
                    icon={<Crown size={18} className="text-yellow-300" />}
                  />

                  <SeasonHighlight
                    title="Top gol"
                    value={topScorer?.goals || 0}
                    label={topScorer?.playerName || "Rivalo Player"}
                    icon={<Target size={18} className="text-cyan-300" />}
                  />

                  <SeasonHighlight
                    title="MVP"
                    value={topMvp?.mvp || 0}
                    label={topMvp?.playerName || "Rivalo Player"}
                    icon={<Star size={18} className="text-orange-300" />}
                  />
                </div>

                <div className="mt-9">
                  <div className="mb-5 flex items-center gap-3">
                    <Trophy size={24} className="shrink-0 text-cyan-300" />
                    <h2 className="min-w-0 break-words text-[30px] font-black leading-none sm:text-4xl">
                      Classifica stagionale
                    </h2>
                  </div>

                  <div className="space-y-4">
                    {rows.map((row, index) => (
                      <SeasonRankRow
                        key={row.id}
                        row={row}
                        index={index}
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

function SeasonHighlight({
  title,
  value,
  label,
  icon,
}: {
  title: string;
  value: number;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="relative min-w-0 rounded-[1.35rem] border border-white/10 bg-black/20 p-3 sm:rounded-[2rem] sm:p-5">
      <div className="flex min-w-0 items-start justify-between gap-1">
        <div className="min-w-0 text-[9px] font-black uppercase leading-none tracking-[0.08em] text-slate-300 sm:text-xs sm:tracking-[0.18em]">
          {title}
        </div>

        <div className="shrink-0 translate-y-[-1px]">
          {icon}
        </div>
      </div>

      <div className="mt-4 text-[34px] font-black leading-none text-white sm:text-5xl">
        {value}
      </div>

      <div className="mt-2 min-w-0 truncate text-[9px] font-black uppercase leading-none text-cyan-300 sm:text-sm">
        {label}
      </div>
    </div>
  );
}

function SeasonRankRow({
  row,
  index,
}: {
  row: SeasonRow;
  index: number;
}) {
  const medal =
    index === 0 ? (
      <Crown size={24} className="text-yellow-300" />
    ) : index === 1 ? (
      <Medal size={24} className="text-slate-300" />
    ) : index === 2 ? (
      <Trophy size={24} className="text-orange-300" />
    ) : (
      <span className="text-lg font-black text-cyan-300">#{index + 1}</span>
    );

  return (
    <Link
      href={row.uid ? `/public/${row.uid}` : "/leaderboard"}
      className="block rounded-[1.8rem] border border-white/10 bg-black/20 p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.03] sm:p-5"
    >
      <div className="flex min-w-0 items-start gap-3 sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">
          {medal}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="truncate text-[19px] font-black uppercase leading-tight sm:text-3xl">
            {row.playerName || "Rivalo Player"}
          </div>

          <div className="mt-1 text-sm text-slate-400">
            {row.matchesPlayed || 0} match disputati
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-2 py-2 text-center sm:px-3">
          <div className="text-[9px] font-black uppercase tracking-[0.1em] text-cyan-200 sm:text-[10px] sm:tracking-[0.14em]">
            Pos.
          </div>
          <div className="text-lg font-black text-cyan-200 sm:text-xl">
            #{index + 1}
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-4 gap-2">
        <MiniStat label="Punti" value={row.points || 0} color="text-cyan-300" />
        <MiniStat label="Vittorie" value={row.wins || 0} color="text-lime-300" />
        <MiniStat label="Gol" value={row.goals || 0} color="text-yellow-300" />
        <MiniStat label="MVP" value={row.mvp || 0} color="text-orange-300" />
      </div>
    </Link>
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
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-3 text-center sm:px-2">
      <div className={`truncate text-[21px] font-black leading-none sm:text-[24px] ${color}`}>
        {value}
      </div>

      <div className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
        {label}
      </div>
    </div>
  );
}
