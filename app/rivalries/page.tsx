"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";

import { onAuthStateChanged} from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import {
  ArrowLeft,
  Swords,
  Flame,
  Trophy,
  UserRound,
  Crown,
  Shield,
} from "lucide-react";

type Rivalry = {
  id: string;
  users?: string[];
  sport?: string;
  matchesPlayed?: number;
  officialMatches?: number;
  updatedAt?: any;
  [key: string]: any;
};

type UserMini = {
  id: string;
  name?: string;
  nickname?: string;
  photoURL?: string;
  photoUrl?: string;
  rivalScore?: number;
  mainSport?: string;
  sport?: string;
  role?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

type RivalryCandidate = {
  opponentUid: string;
  opponentName: string;
  opponentPhoto: string;
  matchesPlayed: number;
  currentWins: number;
  opponentWins: number;
  sport: string;
  roleLabel?: string;
};


function normalizeSport(value?: string) {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function sportLabel(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "Padel";
  if (sport === "tennis") return "Tennis";

  return "Calcetto";
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

function isGoalkeeperRole(value?: string) {
  return normalizeCalcettoRole(value) === "portiere";
}

function isRemovedUser(user?: UserMini) {
  return Boolean(
    user?.accountStatus === "deletion_requested" ||
      user?.accountStatus === "deleted" ||
      user?.deletionRequested
  );
}

function getDisplayName(user?: UserMini, fallback = "Player") {
  if (!user) return fallback;
  if (isRemovedUser(user)) return "Utente rimosso";

  return user.nickname || user.name || fallback;
}

function getDisplayPhoto(user?: UserMini) {
  if (!user || isRemovedUser(user)) return "";

  return user.photoURL || user.photoUrl || "";
}

function getOfficialMatches(rivalry: Rivalry) {
  return Number(rivalry.officialMatches || rivalry.matchesPlayed || 0);
}

function getRivalryId(sport: string, firstUid: string, secondUid: string) {
  const [a, b] = [firstUid, secondUid].sort();

  return `${normalizeSport(sport)}_${a}_${b}`;
}

function isOfficialMatch(match: any) {
  return match?.status === "ufficiale" || match?.resultStatus === "confermato";
}

function getPlayerTeam(match: any, uid: string) {
  const players = Array.isArray(match?.players) ? match.players : [];
  const player = players.find((item: any) => item?.uid === uid);

  return player?.team || "";
}

function getOpponentTeam(team?: string) {
  if (team === "home") return "away";
  if (team === "away") return "home";

  return "";
}

function getTeamWon(match: any, team?: string) {
  const homeScore = Number(match?.homeScore || 0);
  const awayScore = Number(match?.awayScore || 0);

  if (homeScore === awayScore) return false;
  if (team === "home") return homeScore > awayScore;
  if (team === "away") return awayScore > homeScore;

  return false;
}

function isValidRivalryForUser(
  rivalry: Rivalry,
  currentUserId: string,
  currentUserSport: string
) {
  const users = Array.isArray(rivalry.users) ? rivalry.users : [];
  const officialMatches = getOfficialMatches(rivalry);
  const rivalrySport = rivalry.sport ? normalizeSport(rivalry.sport) : "";

  if (users.length !== 2) return false;
  if (!users.includes(currentUserId)) return false;
  if (officialMatches <= 0) return false;
  if (rivalrySport && rivalrySport !== normalizeSport(currentUserSport)) return false;

  return true;
}

export default function RivalriesPage() {
  const [currentUserId, setCurrentUserId] = useState("");
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserMini>>({});
  const [userSport, setUserSport] = useState("calcetto");
  const [rivalryCandidates, setRivalryCandidates] = useState<RivalryCandidate[]>([]);
  const [creatingRivalryId, setCreatingRivalryId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setCurrentUserId(currentUser.uid);
      await load(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function load(currentUserId: string) {
    try {
      setLoading(true);

      const profileSnap = await getDoc(doc(db, "users", currentUserId));
      const profileData: any = profileSnap.exists() ? profileSnap.data() : {};
      const currentUserSport = normalizeSport(
        profileData.mainSport || profileData.sport || "calcetto"
      );
      const currentUserIsGoalkeeper =
        currentUserSport === "calcetto" && isGoalkeeperRole(profileData.role);

      setUserSport(currentUserSport);

      const q = query(
        collection(db, "rivalries"),
        where("users", "array-contains", currentUserId),
        orderBy("updatedAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(q);

      const allRivalriesData = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Rivalry, "id">),
      }));

      const rivalriesData = allRivalriesData.filter((rivalry) =>
        isValidRivalryForUser(rivalry, currentUserId, currentUserSport)
      );

      setRivalries(rivalriesData);

      const allUserIds = Array.from(
        new Set(
          rivalriesData.flatMap((rivalry) => {
            const rivalrySafe = rivalry as any;

            return Array.isArray(rivalrySafe.users)
              ? rivalrySafe.users
              : [];
          })
        )
      );

      const usersResult: Record<string, UserMini> = {};

      await Promise.all(
        allUserIds.map(async (uid) => {
          const userSnap = await getDoc(doc(db, "users", uid));

          if (userSnap.exists()) {
            usersResult[uid] = {
              id: uid,
              ...(userSnap.data() as Omit<UserMini, "id">),
            };
          } else {
            usersResult[uid] = {
              id: uid,
              name: "Player",
              nickname: "Rivalo Player",
            };
          }
        })
      );

      const matchesQuery = query(
        collection(db, "matches"),
        where("participants", "array-contains", currentUserId),
        orderBy("updatedAt", "desc"),
        limit(300)
      );

      const matchesSnap = await getDocs(matchesQuery);
      const candidatesMap = new Map<string, RivalryCandidate>();

      for (const matchDoc of matchesSnap.docs) {
        const matchData: any = {
          id: matchDoc.id,
          ...matchDoc.data(),
        };

        if (!isOfficialMatch(matchData)) continue;
        if (normalizeSport(matchData.sport) !== currentUserSport) continue;

        const players = Array.isArray(matchData.players)
          ? matchData.players
          : [];

        if (!players.some((player: any) => player?.uid === currentUserId)) continue;

        const currentTeam = getPlayerTeam(matchData, currentUserId);
        const opponentTeam = getOpponentTeam(currentTeam);

        if (!currentTeam || !opponentTeam) continue;

        const opponents = players.filter(
          (player: any) =>
            player?.uid &&
            player.uid !== currentUserId &&
            player.team === opponentTeam
        );

        for (const opponent of opponents) {
          if (!opponent.uid) continue;

          if (currentUserIsGoalkeeper && !isGoalkeeperRole(opponent.role)) {
            continue;
          }

          const opponentUser = usersResult[opponent.uid];
          const opponentName = getDisplayName(opponentUser, opponent.name || "Player");
          const opponentPhoto = getDisplayPhoto(opponentUser);
          const currentWon = getTeamWon(matchData, currentTeam);
          const opponentWon = getTeamWon(matchData, opponentTeam);

          const existing =
            candidatesMap.get(opponent.uid) ||
            {
              opponentUid: opponent.uid,
              opponentName,
              opponentPhoto,
              matchesPlayed: 0,
              currentWins: 0,
              opponentWins: 0,
              sport: currentUserSport,
              roleLabel: isGoalkeeperRole(opponent.role) ? "Portiere" : "",
            };

          existing.matchesPlayed += 1;
          existing.currentWins += currentWon ? 1 : 0;
          existing.opponentWins += opponentWon ? 1 : 0;

          candidatesMap.set(opponent.uid, existing);
        }
      }

      setRivalryCandidates(
        Array.from(candidatesMap.values()).sort(
          (a, b) =>
            b.matchesPlayed - a.matchesPlayed ||
            b.currentWins + b.opponentWins - (a.currentWins + a.opponentWins)
        )
      );

      setUsersMap(usersResult);
    } finally {
      setLoading(false);
    }
  }

  async function openRivalry(candidate: RivalryCandidate) {
    if (!currentUserId) return;

    const rivalryId = getRivalryId(candidate.sport, currentUserId, candidate.opponentUid);
    const users = [currentUserId, candidate.opponentUid].sort();

    try {
      setCreatingRivalryId(rivalryId);

      await setDoc(
        doc(db, "rivalries", rivalryId),
        {
          id: rivalryId,
          users,
          sport: normalizeSport(candidate.sport),
          officialMatches: candidate.matchesPlayed,
          matchesPlayed: candidate.matchesPlayed,
          [currentUserId]: candidate.currentWins,
          [candidate.opponentUid]: candidate.opponentWins,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      window.location.href = `/rivalries/${rivalryId}`;
    } finally {
      setCreatingRivalryId("");
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] px-4 py-7 text-white sm:px-5 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-[15px] font-black text-cyan-300 transition hover:text-cyan-200"
        >
          <ArrowLeft size={18} />
          Torna alla dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 px-6 py-9 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.20),transparent_58%)]" />
            <div className="absolute -right-24 top-4 h-56 w-56 rounded-full bg-red-500/10 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-52 w-52 rounded-full bg-pink-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl border border-red-400/30 bg-red-500/10 text-red-300 shadow-[0_0_35px_rgba(248,113,113,0.16)] sm:h-16 sm:w-16">
                  <Swords size={31} />
                </div>

                <div className="min-w-0">
                  <div className="text-[13px] font-black uppercase tracking-[0.32em] text-red-300 sm:text-sm">
                    Rivalo Rivalries
                  </div>

                  <h1 className="mt-3 text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl">
                    Rivalità
                  </h1>

                  <p className="mt-4 max-w-2xl text-[1.35rem] leading-relaxed text-slate-300 sm:text-2xl">
                    Le sfide più calde tra player Rivalo, filtrate sul tuo sport attivo. Contano solo rivalità con match reali.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 px-6 py-5 shadow-[0_0_35px_rgba(248,113,113,0.10)]">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                  Rivalità {sportLabel(userSport)}
                </div>

                <div className="mt-2 text-5xl font-black text-red-100">
                  {rivalries.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {!loading && (
              <section className="mb-7 rounded-[2rem] border border-cyan-400/15 bg-cyan-400/[0.06] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.26em] text-cyan-300">
                      Apri rivalità
                    </div>

                    <h2 className="mt-2 text-2xl font-black">
                      Scegli un avversario {sportLabel(userSport)}
                    </h2>

                    <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-slate-300">
                      Puoi aprire rivalità solo con utenti affrontati in match confermati.
                      Se sei portiere, vengono mostrati solo portieri avversari.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm font-black text-cyan-100">
                    {rivalryCandidates.length} disponibili
                  </div>
                </div>

                {rivalryCandidates.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold leading-6 text-slate-300">
                    Nessun avversario selezionabile per ora. Servono match confermati contro utenti compatibili.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {rivalryCandidates.map((candidate) => {
                      const rivalryId = getRivalryId(
                        candidate.sport,
                        currentUserId,
                        candidate.opponentUid
                      );

                      return (
                        <button
                          key={candidate.opponentUid}
                          type="button"
                          onClick={() => openRivalry(candidate)}
                          disabled={creatingRivalryId === rivalryId}
                          className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-black/25 p-4 text-left transition hover:border-cyan-300/30 hover:bg-cyan-400/10 disabled:opacity-60"
                        >
                          <Avatar photo={candidate.opponentPhoto} />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-lg font-black">
                              {candidate.opponentName}
                            </span>

                            <span className="mt-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                              {candidate.matchesPlayed} match · {candidate.currentWins}-{candidate.opponentWins}
                              {candidate.roleLabel ? ` · ${candidate.roleLabel}` : ""}
                            </span>
                          </span>

                          <span className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-100">
                            {creatingRivalryId === rivalryId ? "Apro..." : "Apri"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento rivalità...
              </div>
            ) : rivalries.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessuna rivalità personale ancora per il tuo sport attivo. Compariranno qui solo rivalità basate su match confermati contro gli stessi player.
              </div>
            ) : (
              <div className="grid gap-5">
                {rivalries.map((rivalry) => (
                  <RivalryCard
                    key={rivalry.id}
                    rivalry={rivalry}
                    usersMap={usersMap}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function RivalryCard({
  rivalry,
  usersMap,
}: {
  rivalry: Rivalry;
  usersMap: Record<string, UserMini>;
}) {
  const rivalrySafe = rivalry as any;

  const userIds: string[] = Array.isArray(rivalrySafe.users)
    ? rivalrySafe.users
    : [];

  const firstUid = userIds[0] || "";
  const secondUid = userIds[1] || "";

  const firstUser = usersMap[firstUid];
  const secondUser = usersMap[secondUid];

  const firstName = getDisplayName(firstUser, "Player 1");
  const secondName = getDisplayName(secondUser, "Player 2");

  const firstPhoto = getDisplayPhoto(firstUser);
  const secondPhoto = getDisplayPhoto(secondUser);

  const firstWins = Number(rivalry[firstUid] || 0);
  const secondWins = Number(rivalry[secondUid] || 0);
  const matchesPlayed = getOfficialMatches(rivalry);
  const rivalrySport = normalizeSport(rivalry.sport || "calcetto");

  const leader =
    firstWins > secondWins
      ? firstName
      : secondWins > firstWins
      ? secondName
      : "Parità";

  const intensity =
    matchesPlayed >= 10
      ? "Leggendaria"
      : matchesPlayed >= 5
      ? "Calda"
      : "Nuova";

  const scoreLabel = `${firstWins} - ${secondWins}`;

  return (
    <Link
      href={`/rivalries/${rivalry.id}`}
      className="group relative block overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] via-[#08111f] to-[#020617] p-5 shadow-2xl transition hover:border-red-400/40 hover:bg-red-500/10 sm:p-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(248,113,113,0.14),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12),transparent_42%)] opacity-90" />

      <div className="relative">
        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-4">
          <Avatar photo={firstPhoto} />

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <Swords className="shrink-0 text-red-300" size={20} />

              <h2 className="min-w-0 truncate text-[1.65rem] font-black uppercase leading-none tracking-tight sm:text-4xl">
                {firstName} vs {secondName}
              </h2>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-sm">
              <span className="text-red-200">{scoreLabel}</span>
              <span>vittorie</span>
              <span className="rounded-full border border-lime-300/20 bg-lime-400/10 px-2 py-1 text-[10px] text-lime-200">
                match confermati
              </span>
            </div>
          </div>

          <Avatar photo={secondPhoto} />
        </div>

        <div className="mt-5 rounded-[1.6rem] border border-red-400/20 bg-red-500/10 px-5 py-4 text-center shadow-[0_0_30px_rgba(248,113,113,0.08)]">
          <div className="text-xs font-black uppercase tracking-[0.3em] text-red-300">
            Score
          </div>

          <div className="mt-1 text-5xl font-black leading-none text-white">
            {scoreLabel}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CompactInfoBox
            label="Match"
            value={matchesPlayed}
            icon={<Trophy size={18} />}
            color="text-cyan-300"
          />

          <CompactInfoBox
            label="Intensità"
            value={intensity}
            icon={<Flame size={18} />}
            color="text-orange-300"
          />

          <CompactInfoBox
            label="Dominio"
            value={leader}
            icon={<Crown size={18} />}
            color="text-red-200"
          />

          <CompactInfoBox
            label="Sport"
            value={sportLabel(rivalrySport)}
            icon={<Shield size={18} />}
            color="text-pink-300"
          />
        </div>

        <div className="mt-5 flex justify-end">
          <div className="text-sm font-black uppercase tracking-[0.2em] text-red-300 transition group-hover:translate-x-1">
            Apri rivalità →
          </div>
        </div>
      </div>
    </Link>
  );
}

function Avatar({ photo }: { photo: string }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-[0_0_22px_rgba(34,211,238,0.08)] sm:h-[4.5rem] sm:w-[4.5rem]">
      {photo ? (
        <img
          src={photo}
          alt="player"
          className="h-full w-full object-cover"
        />
      ) : (
        <UserRound className="text-cyan-200" size={30} />
      )}
    </div>
  );
}

function CompactInfoBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string;
}) {
  const displayValue = useMemo(() => String(value), [value]);

  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/25 px-3 py-4 text-center">
      <div className={`flex justify-center ${color}`}>
        {icon}
      </div>

      <div className="mt-2 truncate text-lg font-black leading-none text-white sm:text-xl">
        {displayValue}
      </div>

      <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 sm:text-xs">
        {label}
      </div>
    </div>
  );
}