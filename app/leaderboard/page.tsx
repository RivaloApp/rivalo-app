"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { ArrowLeft, Crown, Medal, Trophy, UserRound } from "lucide-react";

type UserRow = {
  id: string;
  name?: string;
  nickname?: string;
  mainSport?: string;
  rivalScore?: number;
  level?: number;
  wins?: number;
  mvp?: number;
  photoURL?: string;
  photoUrl?: string;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "users"), orderBy("rivalScore", "desc"), limit(50));
        const snap = await getDocs(q);
        setUsers(snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<UserRow, "id">) })));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 rounded-[2.5rem] border border-white/10 bg-white/[.04] p-8 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-yellow-300/30 bg-yellow-400/10 text-yellow-300">
              <Trophy size={34} />
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">Rivalo Ranking</div>
              <h1 className="mt-2 text-5xl font-black">Leaderboard reale</h1>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">Caricamento classifica...</div>
            ) : users.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">Nessun utente in classifica.</div>
            ) : (
              users.map((u, index) => <LeaderboardRow key={u.id} user={u} index={index} />)
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function LeaderboardRow({ user, index }: { user: UserRow; index: number }) {
  const photo = user.photoURL || user.photoUrl || "";
  const medal = index === 0 ? <Crown /> : index < 3 ? <Medal /> : <span className="font-black">{index + 1}</span>;

  return (
    <div className="grid grid-cols-[48px_1fr_90px_80px] items-center gap-4 rounded-2xl border border-white/10 bg-[#071126] p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-300">{medal}</div>
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/10">
          {photo ? <img src={photo} alt="profile" className="h-full w-full object-cover" /> : <UserRound className="text-cyan-200" />}
        </div>
        <div className="min-w-0">
          <div className="truncate text-xl font-black">{user.name || user.nickname || "Player"}</div>
          <div className="text-sm text-slate-400">{user.mainSport || "sport"} • Livello {user.level || 1}</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500">Score</div>
        <div className="text-xl font-black text-cyan-300">{user.rivalScore || 1000}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-500">MVP</div>
        <div className="font-black">{user.mvp || 0}</div>
      </div>
    </div>
  );
}
