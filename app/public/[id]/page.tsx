"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import PlayerCard from "../../../components/PlayerCard";

import {
  doc,
  getDoc,
  collection,
  getDocs,
} from "firebase/firestore";

import { db } from "../../../lib/firebase";

import {
  ArrowLeft,
} from "lucide-react";

import { getPlayerBadges } from "../../../lib/badges";

type UserProfile = {
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
  bestStreak?: number;
};

export default function PublicProfilePage() {
  const params = useParams();
  const id = params?.id as string;

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [matches, setMatches] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const snap = await getDoc(
          doc(db, "users", id)
        );

        if (snap.exists()) {
          setUser(
            snap.data() as UserProfile
          );
        }

        const matchesSnap =
          await getDocs(
            collection(db, "matches")
          );

        const userMatches =
          matchesSnap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .filter(
              (m: any) =>
                Array.isArray(m.players) &&
                m.players.some(
                  (p: any) => p.uid === id
                )
            );

        setMatches(userMatches);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadUser();
    }
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        Loading...
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        User not found
      </main>
    );
  }

  const photo =
    user.photoURL ||
    user.photoUrl ||
    "";

  const xp = user.xp || 0;

  const level =
    Math.floor(xp / 100) + 1;

  const currentLevelXp =
    xp % 100;

  const progress =
    currentLevelXp;

  const rank =
    xp >= 1000
      ? "LEGEND"
      : xp >= 600
      ? "ELITE"
      : xp >= 300
      ? "GOLD"
      : xp >= 100
      ? "SILVER"
      : "BRONZE";

  const badges =
    getPlayerBadges(user);

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">

      <div className="mx-auto max-w-5xl">

        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla leaderboard
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04]">

          <div className="relative bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_60%)] px-8 py-14">

            <div className="flex flex-col items-center text-center">

              <PlayerCard
                name={user.name || "Player"}
                nickname={user.nickname || ""}
                rivalScore={user.rivalScore || 0}
                mainSport={user.mainSport || "Sport"}
                photo={photo}
              />

              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">

                {badges.map((badge) => (
                  <div
                    key={badge.id}
                    title={badge.description}
                    className="rounded-full border border-yellow-300/30 bg-yellow-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-yellow-200"
                  >
                    {badge.name}
                  </div>
                ))}

              </div>

              <div
                className={`
                  mt-5 rounded-full border px-6 py-2 text-sm font-black tracking-[0.2em]
                  ${
                    rank === "BRONZE"
                      ? "border-orange-400/30 bg-orange-500/10 text-orange-300"
                      : rank === "SILVER"
                      ? "border-slate-300/30 bg-slate-400/10 text-slate-200"
                      : rank === "GOLD"
                      ? "border-yellow-300/30 bg-yellow-400/10 text-yellow-300"
                      : rank === "ELITE"
                      ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-300"
                      : "border-purple-400/30 bg-purple-500/10 text-purple-300"
                  }
                `}
              >
                {rank}
              </div>

            </div>

          </div>

          <div className="p-8">

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6">

              <div className="flex items-center justify-between">

                <div>

                  <div className="text-sm font-black uppercase tracking-[0.3em] text-cyan-300">
                    Level Progress
                  </div>

                  <div className="mt-2 text-5xl font-black">
                    Livello {level}
                  </div>

                </div>

                <div className="text-right">

                  <div className="text-3xl font-black text-cyan-300">
                    {xp} XP
                  </div>

                  <div className="text-sm text-slate-300">
                    {100 - currentLevelXp} XP al prossimo livello
                  </div>

                </div>

              </div>

              <div className="mt-6 h-5 overflow-hidden rounded-full bg-black/30">

                <div
                  className="h-full rounded-full bg-cyan-300 transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">

              <StatCard
                label="Partite"
                value={
                  user.matchesPlayed || 0
                }
              />

              <StatCard
                label="Vittorie"
                value={user.wins || 0}
                color="text-lime-300"
              />

              <StatCard
                label="Sconfitte"
                value={
                  user.losses || 0
                }
                color="text-rose-300"
              />

              <StatCard
                label="Gol"
                value={user.goals || 0}
                color="text-yellow-300"
              />

              <StatCard
                label="Assist"
                value={
                  user.assists || 0
                }
                color="text-cyan-300"
              />

              <StatCard
                label="MVP"
                value={user.mvp || 0}
                color="text-yellow-100"
              />

              <StatCard
                label="Win Streak"
                value={
                  user.winStreak || 0
                }
                color="text-orange-300"
              />

              <StatCard
                label="Best Streak"
                value={
                  user.bestStreak || 0
                }
                color="text-orange-200"
              />

              <StatCard
                label="RivalScore"
                value={
                  user.rivalScore || 1000
                }
                color="text-cyan-300"
              />

            </div>

            <div className="mt-10">

              <h2 className="text-3xl font-black">
                Match History
              </h2>

              <div className="mt-5 space-y-4">

                {matches.map((match) => (

                  <div
                    key={match.id}
                    className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#111827] p-6 transition hover:border-cyan-400/30"
                  >

                    <div className="flex items-center justify-between">

                      <div>

                        <div className="text-2xl font-black uppercase">

                          {match.homeTeam || "HOME"}

                          <span className="mx-3 text-cyan-300">
                            {match.homeScore ?? 0}
                          </span>

                          -

                          <span className="mx-3 text-cyan-300">
                            {match.awayScore ?? 0}
                          </span>

                          {match.awayTeam || "AWAY"}

                        </div>

                        <div className="mt-2 text-sm text-slate-400">
                          {match.sport || "sport"} • {match.date || "date"}
                        </div>

                      </div>

                      <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
                        {match.resultStatus || "confirmed"}
                      </div>

                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">

                      {match.players
                        ?.filter((p: any) => p.uid === id)
                        .map((p: any, i: number) => (

                          <div
                            key={i}
                            className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3"
                          >

                            <div className="text-xs uppercase text-slate-400">
                              Performance
                            </div>

                            <div className="mt-2 flex gap-4 text-sm font-black">

                              <span className="text-yellow-300">
                                ⚽ {p.goals || 0}
                              </span>

                              <span className="text-cyan-300">
                                🎯 {p.assists || 0}
                              </span>

                              {p.isMvp && (
                                <span className="text-yellow-200">
                                  👑 MVP
                                </span>
                              )}

                            </div>

                          </div>

                        ))}

                    </div>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-center">

      <div className="text-sm text-slate-400">
        {label}
      </div>

      <div
        className={`mt-2 text-4xl font-black ${
          color || "text-white"
        }`}
      >
        {value}
      </div>

    </div>
  );
}