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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      await load(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function load(currentUserId: string) {
    try {
      setLoading(true);

      const q = query(
        collection(db, "rivalries"),
        orderBy("updatedAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(q);

      const allRivalriesData = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Rivalry, "id">),
      }));

      const rivalriesData = allRivalriesData.filter((rivalry) => {
  const rivalrySafe = rivalry as any;

  const users: string[] = Array.isArray(rivalrySafe.users)
    ? rivalrySafe.users
    : [];

  return users.includes(currentUserId);
});

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

      setUsersMap(usersResult);
    } finally {
      setLoading(false);
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
                    Le sfide più calde tra player Rivalo. Ogni match conta.
                  </p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-red-400/20 bg-red-500/10 px-6 py-5 shadow-[0_0_35px_rgba(248,113,113,0.10)]">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-red-300">
                  Rivalità attive
                </div>

                <div className="mt-2 text-5xl font-black text-red-100">
                  {rivalries.length}
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            {loading ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento rivalità...
              </div>
            ) : rivalries.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessuna rivalità personale ancora. Le rivalità compariranno qui quando giocherai più match contro gli stessi player.
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

  const firstName =
    firstUser?.nickname ||
    firstUser?.name ||
    "Player 1";

  const secondName =
    secondUser?.nickname ||
    secondUser?.name ||
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
            label="Status"
            value="Attiva"
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