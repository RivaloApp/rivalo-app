"use client";

import { useEffect, useState } from "react";
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

import { db } from "../../lib/firebase";

import {
  ArrowLeft,
  Swords,
  Flame,
  Trophy,
  UserRound,
} from "lucide-react";

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
};

export default function RivalriesPage() {
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, UserMini>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "rivalries"),
          orderBy("updatedAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);

        const rivalriesData = snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Rivalry, "id">),
        }));

        setRivalries(rivalriesData);

        const allUserIds = Array.from(
          new Set(
            rivalriesData.flatMap((rivalry) =>
              Array.isArray(rivalry.users) ? rivalry.users : []
            )
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

        setUsersMap(usersResult);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_60%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-400/30 bg-red-500/10 text-red-300">
                  <Swords size={34} />
                </div>

                <div>
                  <div className="text-sm font-black uppercase tracking-[0.3em] text-red-300">
                    Rivalo Rivalries
                  </div>

                  <h1 className="mt-2 text-5xl font-black">
                    Rivalità
                  </h1>

                  <p className="mt-3 max-w-2xl text-slate-300">
                    Le sfide più calde tra player Rivalo. Ogni match conta.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 px-6 py-4">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                  Rivalità attive
                </div>

                <div className="mt-1 text-3xl font-black text-red-100">
                  {rivalries.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento rivalità...
              </div>
            ) : rivalries.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessuna rivalità ancora. Conferma match tra squadre diverse per generarle.
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
  const userIds = Array.isArray((rivalryData as any).users)
  ? (rivalryData as any).users
  : [];

  const firstUid = userIds[0] || "";
  const secondUid = userIds[1] || "";

  const firstUser = usersMap[firstUid];
  const secondUser = usersMap[secondUid];

  const firstName =
    firstUser?.nickname ||
    "Player 1";

  const secondName =
    secondUser?.name ||
    secondUser?.nickname ||
    "Player 2";

  const firstPhoto =
    firstUser?.photoURL ||
    firstUser?.photoUrl ||
    "";

  const secondPhoto =
    secondUser?.photoURL ||
    secondUser?.photoUrl ||
    "";

  const firstWins = Number(rivalry[firstUid] || 0);
  const secondWins = Number(rivalry[secondUid] || 0);

  const matchesPlayed = Number(rivalry.matchesPlayed || 0);

  const leader =
    firstWins > secondWins
      ? firstName
      : secondWins > firstWins
      ? secondName
      : "Parità";

  const intensity =
    matchesPlayed >= 10
      ? "LEGENDARIA"
      : matchesPlayed >= 5
      ? "CALDA"
      : "NUOVA";

  return (
    <Link
      href={`/rivalries/${rivalry.id}`}
      className="group block overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#111827] to-[#020617] p-6 shadow-2xl transition hover:border-red-400/40 hover:bg-red-500/10"
    >
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="grid flex-1 grid-cols-[1fr_auto_1fr] items-center gap-4">
          <PlayerSide
            name={firstName}
            photo={firstPhoto}
            score={firstWins}
            align="left"
          />

          <div className="flex flex-col items-center">
            <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-red-300">
              <Swords size={26} />
            </div>

            <div className="mt-3 text-sm font-black uppercase tracking-[0.25em] text-red-300">
              VS
            </div>
          </div>

          <PlayerSide
            name={secondName}
            photo={secondPhoto}
            score={secondWins}
            align="right"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[460px]">
          <InfoBox
            label="Match"
            value={matchesPlayed}
            icon={<Trophy size={18} />}
            color="text-cyan-300"
          />

          <InfoBox
            label="Intensità"
            value={intensity}
            icon={<Flame size={18} />}
            color="text-orange-300"
          />

          <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Dominio
            </div>

            <div className="mt-1 break-words text-lg font-black text-red-200">
              {leader}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <div className="text-sm font-black uppercase tracking-[0.2em] text-red-300 transition group-hover:translate-x-1">
          Apri rivalità →
        </div>
      </div>
    </Link>
  );
}

function PlayerSide({
  name,
  photo,
  score,
  align,
}: {
  name: string;
  photo: string;
  score: number;
  align: "left" | "right";
}) {
  return (
    <div
      className={`flex items-center gap-4 ${
        align === "right" ? "justify-end text-right" : ""
      }`}
    >
      {align === "left" && (
        <Avatar photo={photo} />
      )}

      <div className="min-w-0">
        <div className="truncate text-2xl font-black uppercase">
          {name}
        </div>

        <div className="mt-1 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
          {score} vittorie
        </div>
      </div>

      {align === "right" && (
        <Avatar photo={photo} />
      )}
    </div>
  );
}

function Avatar({ photo }: { photo: string }) {
  return (
    <div className="h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
      {photo ? (
        <img
          src={photo}
          alt="player"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <UserRound className="text-cyan-200" />
        </div>
      )}
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-center">
      <div className={`flex justify-center ${color}`}>
        {icon}
      </div>

      <div className="mt-1 text-lg font-black">
        {value}
      </div>

      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}