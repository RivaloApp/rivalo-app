"use client";

import FullScreenLoader from "../../../components/FullScreenLoader";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  ArrowLeft,
  Flame,
  Shield,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";

type Rivalry = {
  id: string;
  users?: string[];
  matchesPlayed?: number;
  updatedAt?: unknown;
  [key: string]: unknown;
};

type UserMini = {
  id: string;
  name?: string;
  nickname?: string;
  photoURL?: string;
  photoUrl?: string;
  rivalScore?: number;
  wins?: number;
  mvp?: number;
};

export default function RivalryDetailPage() {
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [users, setUsers] = useState<UserMini[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRivalry() {
      try {
        const rivalrySnap = await getDoc(doc(db, "rivalries", id));

        if (!rivalrySnap.exists()) {
          setRivalry(null);
          return;
        }

        const rivalryData = {
          id: rivalrySnap.id,
          ...(rivalrySnap.data() as Record<string, unknown>),
        } as Rivalry;

        setRivalry(rivalryData);

        const userIds = Array.isArray(rivalryData.users)
          ? rivalryData.users.filter(
              (userId): userId is string =>
                typeof userId === "string" && userId.length > 0
            )
          : [];

        const loadedUsers: UserMini[] = [];

        for (const uid of userIds) {
          const userSnap = await getDoc(doc(db, "users", uid));

          if (userSnap.exists()) {
            loadedUsers.push({
              id: uid,
              ...(userSnap.data() as Omit<UserMini, "id">),
            });
          } else {
            loadedUsers.push({
              id: uid,
              name: "Player",
              nickname: "Rivalo Player",
            });
          }
        }

        setUsers(loadedUsers);
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadRivalry();
    }
  }, [id]);

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!rivalry) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-8 text-center">
          <div className="text-3xl font-black">Rivalità non trovata</div>

          <Link
            href="/rivalries"
            className="mt-6 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-300"
          >
            Torna alle rivalità
          </Link>
        </div>
      </main>
    );
  }

  const firstUser = users[0];
  const secondUser = users[1];

  const firstUid = firstUser?.id || "";
  const secondUid = secondUser?.id || "";

  const firstWins = Number(rivalry[firstUid] || 0);
  const secondWins = Number(rivalry[secondUid] || 0);
  const matchesPlayed = Number(rivalry.matchesPlayed || 0);

  const firstName = firstUser?.name || firstUser?.nickname || "Player 1";
  const secondName = secondUser?.name || secondUser?.nickname || "Player 2";

  const leader =
    firstWins > secondWins
      ? firstName
      : secondWins > firstWins
        ? secondName
        : "Parità";

  const intensity =
    matchesPlayed >= 10 ? "Leggendaria" : matchesPlayed >= 5 ? "Calda" : "Nuova";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-8 text-white sm:px-4">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_34%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.16),transparent_34%),linear-gradient(180deg,#020617_0%,#050816_55%,#020617_100%)]" />

      <div className="relative mx-auto w-full max-w-5xl min-w-0 overflow-hidden">
        <Link
          href="/rivalries"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alle rivalità
        </Link>

        <section className="mt-8 min-w-0 overflow-hidden rounded-[2.2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:rounded-[2.5rem]">
          <div className="relative border-b border-white/10 px-4 py-7 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(248,113,113,0.24),transparent_62%)]" />

            <div className="relative mx-auto max-w-3xl text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-red-300/30 bg-red-500/10 text-red-300 shadow-[0_0_40px_rgba(248,113,113,0.16)] sm:h-20 sm:w-20 sm:rounded-[2rem]">
                <Swords size={34} />
              </div>

              <div className="mt-5 text-[0.68rem] font-black uppercase tracking-[0.32em] text-red-300 sm:text-sm">
                Rivalo Rivalry
              </div>

              <h1 className="mx-auto mt-4 max-w-2xl min-w-0 text-center text-[1.85rem] font-black uppercase leading-[1.02] sm:text-6xl">
                <span className="block break-words">{firstName}</span>
                <span className="block text-red-200">VS</span>
                <span className="block break-words">{secondName}</span>
              </h1>

              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
                Storico competitivo tra questi player. Ogni match sposta il
                dominio.
              </p>
            </div>
          </div>

          <div className="px-4 py-7 sm:px-8">
            <div className="mx-auto max-w-3xl rounded-[2rem] border border-red-300/25 bg-red-500/10 px-6 py-5 text-center shadow-[0_0_45px_rgba(248,113,113,0.10)]">
              <div className="text-xs font-black uppercase tracking-[0.32em] text-red-300">
                Score
              </div>

              <div className="mt-3 text-6xl font-black leading-none sm:text-7xl">
                {firstWins} - {secondWins}
              </div>
            </div>

            <div className="mt-7 grid min-w-0 gap-4 md:grid-cols-2">
              <PlayerPanel
                user={firstUser}
                name={firstName}
                wins={firstWins}
                rivalryId={id}
              />

              <PlayerPanel
                user={secondUser}
                name={secondName}
                wins={secondWins}
                rivalryId={id}
              />
            </div>

            <div className="mt-7 grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
              <InfoBox
                icon={<Trophy size={25} />}
                label="Match"
                value={matchesPlayed}
                color="text-cyan-300"
              />

              <InfoBox
                icon={<Flame size={25} />}
                label="Intensità"
                value={intensity}
                color="text-orange-300"
              />

              <InfoBox
                icon={<Shield size={25} />}
                label="Status"
                value="Attiva"
                color="text-pink-300"
              />

              <InfoBox
                icon={<Swords size={25} />}
                label="Dominio"
                value={leader}
                color="text-red-300"
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function PlayerPanel({
  user,
  name,
  wins,
  rivalryId,
}: {
  user?: UserMini;
  name: string;
  wins: number;
  rivalryId: string;
}) {
  const photo = user?.photoURL || user?.photoUrl || "";

  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 p-4 sm:p-5">
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[1.3rem] border border-white/10 bg-black/30 sm:h-20 sm:w-20 sm:rounded-[1.5rem]">
          {photo ? (
            <img
              src={photo}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <UserRound className="text-cyan-200" size={34} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="truncate text-[1.25rem] font-black uppercase leading-none sm:text-3xl">
            {name}
          </div>

          <div className="mt-2 text-xs font-black uppercase tracking-[0.24em] text-slate-400">
            {wins} vittorie
          </div>
        </div>
      </div>

      <Link
        href={
          user?.id
            ? `/public/${user.id}?from=rivalry&rivalryId=${rivalryId}`
            : "/rivalries"
        }
        className="mt-5 flex w-full min-w-0 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-cyan-200 transition hover:border-cyan-300/70 hover:bg-cyan-400/20 sm:px-5 sm:text-sm sm:tracking-[0.18em]"
      >
        Apri profilo
      </Link>
    </div>
  );
}

function InfoBox({
  icon,
  label,
  value,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-3 text-center sm:min-h-[8.5rem] sm:rounded-[1.75rem] sm:p-4">
      <div className={`flex justify-center ${color}`}>{icon}</div>

      <div className="mx-auto mt-3 max-w-full break-words text-lg font-black leading-tight sm:text-3xl">
        {value}
      </div>

      <div className="mt-2 text-[0.62rem] font-black uppercase tracking-[0.2em] text-slate-400 sm:text-[0.68rem]">
        {label}
      </div>
    </div>
  );
}