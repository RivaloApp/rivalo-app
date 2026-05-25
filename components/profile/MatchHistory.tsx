"use client";

import Link from "next/link";
import React from "react";

import {
  Crown,
  Trophy,
  ShieldX,
  CalendarDays,
} from "lucide-react";

type MatchItem = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date?: string;

  playerStats?: {
    goals?: number;
    assists?: number;
    isMvp?: boolean;
    rivalScoreChange?: number;
    result?: "win" | "loss" | "draw";
  };
};

export default function MatchHistory({
  matches,
}: {
  matches: MatchItem[];
}) {
  if (!matches.length) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-black/20 p-6 text-slate-400">
        Nessun match giocato.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const stats = match.playerStats;

        const resultColor =
          stats?.result === "win"
            ? "text-lime-300"
            : stats?.result === "loss"
            ? "text-red-300"
            : "text-yellow-300";

        return (
          <Link
            key={match.id}
            href={`/match/${match.id}`}
            className="block rounded-[2rem] border border-white/10 bg-black/20 p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.03]"
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <div className="flex items-center gap-3">

                  <div className="rounded-xl bg-cyan-400/10 p-2 text-cyan-300">
                    <Trophy size={18} />
                  </div>

                  <div className="text-xl font-black uppercase text-white">
                    {match.homeTeam}{" "}
                    <span className="text-cyan-300">
                      {match.homeScore}
                    </span>

                    {" - "}

                    <span className="text-cyan-300">
                      {match.awayScore}
                    </span>{" "}

                    {match.awayTeam}
                  </div>

                </div>

                <div className="mt-3 flex flex-wrap gap-3">

                  <Badge
                    label={
                      stats?.result === "win"
                        ? "VITTORIA"
                        : stats?.result === "loss"
                        ? "SCONFITTA"
                        : "PAREGGIO"
                    }
                    color={resultColor}
                  />

                  <Badge
                    label={`${stats?.goals || 0} GOL`}
                    color="text-yellow-300"
                  />

                  <Badge
                    label={`${stats?.assists || 0} ASSIST`}
                    color="text-cyan-300"
                  />

                  {stats?.isMvp && (
                    <Badge
                      label="MVP"
                      color="text-orange-300"
                      icon={<Crown size={14} />}
                    />
                  )}

                </div>

              </div>

              <div className="flex items-center gap-6">

                <div className="text-right">

                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    RivalScore
                  </div>

                  <div
                    className={`text-2xl font-black ${
                      (stats?.rivalScoreChange || 0) >= 0
                        ? "text-lime-300"
                        : "text-red-300"
                    }`}
                  >
                    {(stats?.rivalScoreChange || 0) >= 0
                      ? "+"
                      : ""}
                    {stats?.rivalScoreChange || 0}
                  </div>

                </div>

                <div className="flex items-center gap-2 text-slate-400">

                  <CalendarDays size={16} />

                  <span className="text-sm">
                    {match.date || "match"}
                  </span>

                </div>

              </div>

            </div>
          </Link>
        );
      })}
    </div>
  );
}

function Badge({
  label,
  color,
  icon,
}: {
  label: string;
  color: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-black tracking-[0.15em] ${color}`}
    >
      {icon}
      {label}
    </div>
  );
}