"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { ArrowLeft, Flame, Swords, Trophy, UserRound } from "lucide-react";

type Rivalry = {
  id: string;
  users?: string[];
  matchesPlayed?: number;
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
  wins?: number;
  mvp?: number;
};

export default function RivalryDetailPage() {
  const params = useParams();
  const id = params?.id as string;

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
          ...(rivalrySnap.data() as Omit<Rivalry, "id">),
        };

        setRivalry(rivalryData);

        const userIds = Array.isArray(rivalryData.users)
          ? rivalryData.users
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
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento rivalità...
      </main>
    );
  }

  if (!rivalry) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-8 text-center">
          <div className="text-3xl font-black">Rivalità non trovata</div>

          <Link
            href="/rivalries"
            className="mt-6 inline-block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-300"
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
    matchesPlayed >= 10
      ? "Leggendaria"
      : matchesPlayed >= 5
      ? "Calda"
      : "Nuova";

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/rivalries"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alle rivalità
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.2),transparent_60%)]" />

            <div className="relative text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2rem] border border-red-400/30 bg-red-500/10 text-red-300">
                <Swords size={42} />
              </div>

              <div className="mt-5 text-sm font-black uppercase tracking-[0.35em] text-red-300">
                Rivalo Rivalry
              </div>

              <h1 className="mt-3 text-4xl font-black uppercase md:text-5xl">
                {firstName} VS {secondName}
              </h1>

              <p className="mt-4 text-slate-300">
                Storico competitivo tra questi player.
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <PlayerPanel user={firstUser} name={firstName} wins={firstWins} />

              <div className="flex justify-center">
                <div className="rounded-[2rem] border border-red-400/30 bg-red-500/10 px-8 py-6 text-center">
                  <div className="text-sm font-black uppercase tracking-[0.25em] text-red-300">
                    Score
                  </div>

                  <div className="mt-3 text-5xl font-black">
                    {firstWins} - {secondWins}
                  </div>
                </div>
              </div>

              <PlayerPanel user={secondUser} name={secondName} wins={secondWins} />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <InfoBox
                icon={<Trophy />}
                label="Match giocati"
                value={matchesPlayed}
                color="text-cyan-300"
              />

              <InfoBox
                icon={<Flame />}
                label="Intensità"
                value={intensity}
                color="text-orange-300"
              />

              <InfoBox
                icon={<Swords />}
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
}: {
  user?: UserMini;
  name: string;
  wins: number;
}) {
  const photo = user?.photoURL || user?.photoUrl || "";

  return (
    <Link
      href={user?.id ? `/public/${user.id}` : "/leaderboard"}
      className="block rounded-[2rem] border border-white/10 bg-black/20 p-6 text-center transition hover:border-cyan-400/30"
    >
      <div className="mx-auto h-24 w-24 overflow-hidden rounded-[2rem] border border-white/10 bg-black/30">
        {photo ? (
          <img
            src={photo}
            alt="player"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <UserRound className="text-cyan-200" size={42} />
          </div>
        )}
      </div>

      <div className="mt-5 truncate text-3xl font-black uppercase">
        {name}
      </div>

      <div className="mt-2 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
        {wins} vittorie
      </div>

      <div className="mt-5 text-sm font-black text-cyan-300">
        Apri profilo
      </div>
    </Link>
  );
}

function InfoBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5 text-center">
      <div className={`flex justify-center ${color}`}>
        {icon}
      </div>

      <div className="mt-3 break-words text-2xl font-black">
        {value}
      </div>

      <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}