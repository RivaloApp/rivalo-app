"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { useParams, useSearchParams } from "next/navigation";
import PlayerCard from "../../../components/cards/PlayerCard";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
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
  sport?: string;
  role?: string;
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
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
  accountStatus?: string;
  deletionRequested?: boolean;
};

function isRemovedProfile(user?: UserProfile | null) {
  return Boolean(
    user?.accountStatus === "deletion_requested" ||
      user?.accountStatus === "deleted" ||
      user?.deletionRequested
  );
}

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

function isGoalkeeperProfile(user?: UserProfile | null) {
  return normalizeSport(user?.mainSport || user?.sport) === "calcetto" &&
    normalizeCalcettoRole(user?.role) === "portiere";
}

function getPublicStats(user: UserProfile, isGoalkeeper: boolean) {
  if (isGoalkeeper) {
    const matchesPlayed = Number(user.matchesPlayed || 0);
    const goalsConceded = Number(user.goalsConceded || 0);
    const averageConceded =
      matchesPlayed > 0 ? (goalsConceded / matchesPlayed).toFixed(1) : "0.0";

    return [
      { label: "Partite", value: matchesPlayed },
      { label: "Vittorie", value: Number(user.wins || 0), color: "text-lime-300" },
      { label: "Gol subiti", value: goalsConceded, color: "text-rose-200" },
      { label: "Media GS", value: averageConceded, color: "text-orange-200" },
      { label: "Clean Sheet", value: Number(user.cleanSheets || 0), color: "text-lime-200" },
      { label: "Rigori parati", value: Number(user.penaltiesSaved || 0), color: "text-cyan-200" },
      { label: "MVP", value: Number(user.mvp || 0), color: "text-yellow-100" },
      { label: "Best Streak", value: Number(user.bestStreak || 0), color: "text-orange-200" },
      { label: "RivalScore", value: Number(user.rivalScore || 1000), color: "text-cyan-300" },
    ];
  }

  return [
    { label: "Partite", value: Number(user.matchesPlayed || 0) },
    { label: "Vittorie", value: Number(user.wins || 0), color: "text-lime-300" },
    { label: "Sconfitte", value: Number(user.losses || 0), color: "text-rose-300" },
    { label: "Gol", value: Number(user.goals || 0), color: "text-yellow-300" },
    { label: "Assist", value: Number(user.assists || 0), color: "text-cyan-300" },
    { label: "MVP", value: Number(user.mvp || 0), color: "text-yellow-100" },
    { label: "Win Streak", value: Number(user.winStreak || 0), color: "text-orange-300" },
    { label: "Best Streak", value: Number(user.bestStreak || 0), color: "text-orange-200" },
    { label: "RivalScore", value: Number(user.rivalScore || 1000), color: "text-cyan-300" },
  ];
}

export default function PublicProfilePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id = params?.id as string;

  const from = searchParams.get("from");
  const rivalryId = searchParams.get("rivalryId");
  const requestId = searchParams.get("requestId") || "";
  const tab = searchParams.get("tab") || "matches";

  const backHref =
    from === "rivalry" && rivalryId
      ? `/rivalries/${rivalryId}`
      : from === "matchmaking"
      ? `/opponents?tab=${tab}${requestId ? `&requestId=${requestId}` : ""}`
      : "/leaderboard";

  const backLabel =
    from === "rivalry" && rivalryId
      ? "Torna alla rivalità"
      : from === "matchmaking"
      ? "Torna al matchmaking"
      : "Torna alla leaderboard";

  const [currentUser, setCurrentUser] =
    useState<User | null>(null);

  const [currentUserLocked, setCurrentUserLocked] =
    useState(false);

  const [user, setUser] =
    useState<UserProfile | null>(null);

  const [matches, setMatches] =
    useState<any[]>([]);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setCurrentUser(authUser);

      if (!authUser) {
        setCurrentUserLocked(false);
        return;
      }

      try {
        const currentProfileSnap = await getDoc(doc(db, "users", authUser.uid));
        const currentProfile = currentProfileSnap.exists()
          ? (currentProfileSnap.data() as UserProfile)
          : null;

        setCurrentUserLocked(isRemovedProfile(currentProfile));
      } catch {
        setCurrentUserLocked(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

        const currentUid = auth.currentUser?.uid || currentUser?.uid || "";

        if (currentUid === id) {
          const matchesQuery = query(
            collection(db, "matches"),
            where("participants", "array-contains", id)
          );

          const matchesSnap = await getDocs(matchesQuery);

          const userMatches = matchesSnap.docs
            .map((d) => ({
              id: d.id,
              ...d.data(),
            }))
            .filter(
              (m: any) =>
                Array.isArray(m.players) &&
                m.players.some((p: any) => p.uid === id)
            );

          setMatches(userMatches);
        } else {
          setMatches([]);
        }
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadUser();
    }
  }, [id, currentUser?.uid]);

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

  const isRemoved = isRemovedProfile(user);

  const photo = isRemoved
    ? ""
    : user.photoURL ||
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

  const badges = isRemoved ? [] : getPlayerBadges(user);

  const publicDisplayName = isRemoved
    ? "Utente rimosso"
    : user.name || user.nickname || "Player";

  const publicNickname = isRemoved
    ? "Profilo non attivo"
    : user.nickname || "";

  const mainSport = user.mainSport || user.sport || "calcetto";
  const goalkeeperProfile = isGoalkeeperProfile(user);
  const publicStats = getPublicStats(user, goalkeeperProfile);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-7 text-white sm:px-5 sm:py-8">

      <div className="mx-auto w-full max-w-5xl min-w-0 overflow-hidden">

        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-[13px] font-black text-cyan-300 sm:text-sm"
        >
          <ArrowLeft size={17} />
          {backLabel}
        </Link>

        <div className="mt-7 min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] sm:mt-8 sm:rounded-[2.5rem]">

          <div className="relative bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.25),transparent_60%)] px-4 py-8 sm:px-8 sm:py-14">

            <div className="flex flex-col items-center text-center">

              <div className="relative flex w-full justify-center overflow-visible">
                <div className="w-full max-w-[258px] sm:max-w-[330px]">
                  <PlayerCard
                    name={publicDisplayName}
                    nickname={publicNickname}
                    rivalScore={user.rivalScore || 1000}
                    mainSport={mainSport}
                    photo={photo}
                    level={user.level || level}
                    xp={xp}
                    wins={user.wins || 0}
                    mvp={user.mvp || 0}
                    matchesPlayed={user.matchesPlayed || 0}
                    goals={user.goals || 0}
                    assists={user.assists || 0}
                    winStreak={user.winStreak || 0}
                    role={user.role || ""}
                    goalsConceded={user.goalsConceded || 0}
                    cleanSheets={user.cleanSheets || 0}
                    penaltiesSaved={user.penaltiesSaved || 0}
                  />
                </div>
              </div>

              {!isRemoved && badges.length > 0 && (
                <div className="mt-6 flex max-w-[340px] flex-wrap items-center justify-center gap-2 sm:mt-8 sm:max-w-none sm:gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      title={badge.description}
                      className="rounded-full border border-yellow-300/30 bg-yellow-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-yellow-200 sm:px-4 sm:text-xs sm:tracking-[0.15em]"
                    >
                      {badge.name}
                    </div>
                  ))}
                </div>
              )}

              {isRemoved && (
                <div className="mt-4 rounded-2xl border border-slate-400/20 bg-slate-400/10 px-5 py-3 text-sm font-bold text-slate-200">
                  Profilo non attivo. Lo storico sportivo resta consultabile.
                </div>
              )}

              {!isRemoved && currentUser && currentUser.uid !== id && !currentUserLocked && (
                <Link
                  href={`/messages?with=${id}${requestId ? `&requestId=${requestId}` : ""}`}
                  className="mt-5 inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 text-sm font-black uppercase text-white"
                >
                  Scrivi in chat
                </Link>
              )}

              {!isRemoved && currentUser && currentUser.uid !== id && currentUserLocked && (
                <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-5 py-3 text-sm font-bold text-yellow-100">
                  Profilo non attivo: chat bloccata.
                </div>
              )}

              <div
                className={`
                  mt-4 rounded-full border px-5 py-2 text-xs font-black tracking-[0.2em] sm:mt-5 sm:px-6 sm:text-sm
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

          <div className="p-4 sm:p-8">

            <div className="min-w-0 overflow-hidden rounded-[1.6rem] border border-cyan-400/20 bg-cyan-400/10 p-5 sm:rounded-[2rem] sm:p-6">

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300 sm:text-sm sm:tracking-[0.3em]">
                    Level Progress
                  </div>

                  <div className="mt-2 text-4xl font-black leading-none sm:text-5xl">
                    Livello {level}
                  </div>

                </div>

                <div className="text-left sm:text-right">

                  <div className="break-words text-3xl font-black text-cyan-300 sm:text-4xl">
                    {xp} XP
                  </div>

                  <div className="mt-1 max-w-[180px] text-sm leading-snug text-slate-300 sm:ml-auto">
                    {100 - currentLevelXp} XP al prossimo livello
                  </div>

                </div>

              </div>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-black/30 sm:h-5">

                <div
                  className="h-full rounded-full bg-cyan-300 transition-all duration-700"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>

            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">

              {publicStats.map((stat) => (
                <StatCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                  color={stat.color}
                />
              ))}

            </div>

            <div className="mt-10">

              <h2 className="text-4xl font-black leading-none sm:text-5xl">
                Match History
              </h2>

              <div className="mt-5 space-y-4">

                {matches.length === 0 && (
                  <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 text-slate-300">
                    Nessun match trovato per questo profilo.
                  </div>
                )}

                {matches.map((match) => (

                  <div
                    key={match.id}
                    className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#111827] p-5 transition hover:border-cyan-400/30 sm:rounded-[2rem] sm:p-6"
                  >

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-2xl font-black uppercase leading-tight sm:text-3xl">

                          <span className="max-w-full break-words">
                            {match.homeTeam || "HOME"}
                          </span>

                          <span className="text-cyan-300">
                            {match.homeScore ?? 0}
                          </span>

                          <span>
                            -
                          </span>

                          <span className="text-cyan-300">
                            {match.awayScore ?? 0}
                          </span>

                          <span className="max-w-full break-words">
                            {match.awayTeam || "AWAY"}
                          </span>

                        </div>

                        <div className="mt-2 text-sm text-slate-400">
                          {match.sport || "sport"} · {match.date || "date"}
                        </div>

                      </div>

                      <div className="w-fit rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-300 sm:text-sm">
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

                            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                              Performance
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-sm font-black">

                              {goalkeeperProfile ? (
                                <>
                                  <span className="rounded-full bg-rose-400/10 px-3 py-1 text-rose-200">
                                    GS {p.goalsConceded || 0}
                                  </span>

                                  <span className="rounded-full bg-lime-400/10 px-3 py-1 text-lime-200">
                                    CS {p.cleanSheet ? "Sì" : "No"}
                                  </span>

                                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-200">
                                    RP {p.penaltiesSaved || 0}
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="rounded-full bg-yellow-400/10 px-3 py-1 text-yellow-300">
                                    Gol {p.goals || 0}
                                  </span>

                                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-300">
                                    Assist {p.assists || 0}
                                  </span>
                                </>
                              )}

                              {p.isMvp && (
                                <span className="rounded-full bg-yellow-300/10 px-3 py-1 text-yellow-200">
                                  MVP
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
  value: string | number;
  color?: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20 p-4 text-center sm:p-5">

      <div className="break-words text-xs uppercase tracking-[0.14em] text-slate-400 sm:text-sm sm:normal-case sm:tracking-normal">
        {label}
      </div>

      <div
        className={`mt-2 break-words text-3xl font-black sm:text-4xl ${
          color || "text-white"
        }`}
      >
        {value}
      </div>

    </div>
  );
}