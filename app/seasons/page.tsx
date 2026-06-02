"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
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

export default function SeasonsPage() {
  const [rows, setRows] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSeason() {
      try {
        const q = query(
          collection(db, "seasonStats"),
          orderBy("points", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);

        const data = snap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SeasonRow, "id">),
          }))
          .filter((row) => row.seasonId === CURRENT_SEASON_ID);

        setRows(data);
      } finally {
        setLoading(false);
      }
    }

    loadSeason();
  }, []);

  const topScorer = useMemo(() => {
    return [...rows].sort((a, b) => (b.goals || 0) - (a.goals || 0))[0];
  }, [rows]);

  const topMvp = useMemo(() => {
    return [...rows].sort((a, b) => (b.mvp || 0) - (a.mvp || 0))[0];
  }, [rows]);

  return (
    <main className="min-h-screen bg-[#020617] px-4 py-7 text-white sm:px-5 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-7 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 px-6 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_60%)]" />

            <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300 sm:text-sm sm:tracking-[0.35em]">
                  Rivalo Seasons
                </div>

                <h1 className="mt-3 text-[48px] font-black leading-[0.95] sm:text-5xl md:text-6xl">
                  {CURRENT_SEASON_NAME}
                </h1>

                <p className="mt-4 max-w-2xl text-[18px] leading-relaxed text-slate-300 sm:text-xl">
                  La competizione attiva di Rivalo: scala la classifica, domina la stagione e lascia il segno.
                </p>
              </div>

              <div className="w-full rounded-[1.75rem] border border-lime-300/20 bg-lime-400/10 px-6 py-4 sm:w-auto sm:rounded-[2rem]">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                  Stato
                </div>

                <div className="mt-1 text-2xl font-black text-lime-200">
                  Attiva
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento stagione...
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessun dato stagionale ancora. Conferma un match per iniziare la stagione.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <SeasonHighlight
                    title="Leader"
                    value={rows[0]?.points || 0}
                    label={rows[0]?.playerName || "Player"}
                    icon={<Crown size={18} className="text-yellow-300" />}
                  />

                  <SeasonHighlight
                    title="Top gol"
                    value={topScorer?.goals || 0}
                    label={topScorer?.playerName || "Player"}
                    icon={<Target size={18} className="text-cyan-300" />}
                  />

                  <SeasonHighlight
                    title="MVP"
                    value={topMvp?.mvp || 0}
                    label={topMvp?.playerName || "Player"}
                    icon={<Star size={18} className="text-orange-300" />}
                  />
                </div>

                <div className="mt-9">
                  <div className="mb-5 flex items-center gap-3">
                    <Trophy size={24} className="shrink-0 text-cyan-300" />
                    <h2 className="text-[34px] font-black leading-none sm:text-4xl">
                      Classifica Stagionale
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

      <div className="mt-2 whitespace-nowrap text-[10px] font-black uppercase leading-none text-cyan-300 sm:text-sm">
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
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">
          {medal}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[22px] font-black uppercase leading-tight sm:text-3xl">
            {row.playerName || "Player"}
          </div>

          <div className="mt-1 text-sm text-slate-400">
            {row.matchesPlayed || 0} match giocati
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-center">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-cyan-200">
            Pos
          </div>
          <div className="text-xl font-black text-cyan-200">
            #{index + 1}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniStat label="Punti" value={row.points || 0} color="text-cyan-300" />
        <MiniStat label="Win" value={row.wins || 0} color="text-lime-300" />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3 text-center">
      <div className={`text-[24px] font-black leading-none ${color}`}>
        {value}
      </div>

      <div className="mt-2 truncate text-[10px] font-black uppercase tracking-[0.12em] text-slate-400 sm:text-xs">
        {label}
      </div>
    </div>
  );
}
