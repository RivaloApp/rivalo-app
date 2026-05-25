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

  const topWins = useMemo(() => {
    return [...rows].sort((a, b) => (b.wins || 0) - (a.wins || 0))[0];
  }, [rows]);

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

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.16),transparent_60%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">
                  Rivalo Seasons
                </div>

                <h1 className="mt-3 text-5xl font-black">
                  {CURRENT_SEASON_NAME}
                </h1>

                <p className="mt-4 max-w-2xl text-slate-300">
                  La competizione attiva di Rivalo: scala la classifica, domina la stagione e lascia il segno.
                </p>
              </div>

              <div className="rounded-[2rem] border border-lime-300/20 bg-lime-400/10 px-6 py-4">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-lime-300">
                  Stato
                </div>

                <div className="mt-1 text-2xl font-black text-lime-200">
                  Attiva
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
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
                <div className="grid gap-4 md:grid-cols-3">
                  <SeasonHighlight
                    title="Leader stagione"
                    value={rows[0]?.points || 0}
                    label={rows[0]?.playerName || "Player"}
                    icon={<Crown className="text-yellow-300" />}
                  />

                  <SeasonHighlight
                    title="Top scorer"
                    value={topScorer?.goals || 0}
                    label={topScorer?.playerName || "Player"}
                    icon={<Target className="text-cyan-300" />}
                  />

                  <SeasonHighlight
                    title="MVP King"
                    value={topMvp?.mvp || 0}
                    label={topMvp?.playerName || "Player"}
                    icon={<Star className="text-orange-300" />}
                  />
                </div>

                <div className="mt-10">
                  <div className="mb-5 flex items-center gap-3">
                    <Trophy className="text-cyan-300" />
                    <h2 className="text-3xl font-black">
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

      <div className="mt-3 text-sm font-black uppercase text-cyan-300">
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
      <Crown className="text-yellow-300" />
    ) : index === 1 ? (
      <Medal className="text-slate-300" />
    ) : index === 2 ? (
      <Trophy className="text-orange-300" />
    ) : (
      <span className="font-black text-cyan-300">#{index + 1}</span>
    );

  return (
    <Link
      href={row.uid ? `/public/${row.uid}` : "/leaderboard"}
      className="grid gap-4 rounded-[2rem] border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.03] md:grid-cols-[70px_1fr_120px_120px_120px_120px]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-xl">
        {medal}
      </div>

      <div className="min-w-0">
        <div className="truncate text-2xl font-black uppercase">
          {row.playerName || "Player"}
        </div>

        <div className="mt-1 text-sm text-slate-400">
          {row.matchesPlayed || 0} match giocati
        </div>
      </div>

      <MiniStat label="Punti" value={row.points || 0} color="text-cyan-300" />
      <MiniStat label="Vittorie" value={row.wins || 0} color="text-lime-300" />
      <MiniStat label="Gol" value={row.goals || 0} color="text-yellow-300" />
      <MiniStat label="MVP" value={row.mvp || 0} color="text-orange-300" />
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
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center">
      <div className={`text-2xl font-black ${color}`}>
        {value}
      </div>

      <div className="mt-1 text-xs font-black uppercase tracking-[0.15em] text-slate-400">
        {label}
      </div>
    </div>
  );
}