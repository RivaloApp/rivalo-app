"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { BarChart3, CalendarDays, LogOut, Trophy, Users, Zap } from "lucide-react";

type RivaloProfile = {
  name: string;
  nickname: string;
  email: string;
  mainSport: string;
  rivalScore: number;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  mvp: number;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<RivaloProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const snap = await getDoc(doc(db, "users", currentUser.uid));
      if (snap.exists()) setProfile(snap.data() as RivaloProfile);

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function logout() {
    await signOut(auth);
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="text-xl font-black text-cyan-300">Caricamento Rivalo...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.16),transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/40 bg-white/10 text-4xl font-black italic">R</div>
            <div>
              <div className="text-3xl font-black">Rivalo</div>
              <div className="text-xs font-black tracking-[.32em] text-cyan-300">DASHBOARD</div>
            </div>
          </Link>

          <button onClick={logout} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 font-bold">
            <LogOut size={18} />
            Esci
          </button>
        </nav>

        <div className="mt-12">
          <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">Profilo giocatore</div>
          <h1 className="mt-3 text-5xl font-black">Ciao, {profile?.name || user?.displayName || "Player"}.</h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Questa è la tua base Rivalo. Da qui partiranno gruppi, partite, ranking, eventi e tornei.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-4">
          <Card icon={<Zap />} title="RivalScore" value={String(profile?.rivalScore ?? 50)} />
          <Card icon={<Trophy />} title="Vittorie" value={String(profile?.wins ?? 0)} />
          <Card icon={<BarChart3 />} title="MVP" value={String(profile?.mvp ?? 0)} />
          <Card icon={<Users />} title="Sport" value={profile?.mainSport ?? "calcetto"} />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          <Panel title="Prossima partita" icon={<CalendarDays />}>
            <p className="text-slate-300">Nessuna partita programmata.</p>
            <button className="mt-6 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black">Crea partita</button>
          </Panel>

          <Panel title="Gruppi" icon={<Users />}>
            <p className="text-slate-300">Non hai ancora gruppi attivi.</p>
            <button className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 font-black">Crea gruppo</button>
          </Panel>

          <Panel title="Eventi e tornei" icon={<Trophy />}>
            <p className="text-slate-300">Qui arriveranno tornei, premi, tabelloni e inviti.</p>
            <button className="mt-6 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 font-black">Crea evento</button>
          </Panel>
        </div>
      </section>
    </main>
  );
}

function Card({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 backdrop-blur">
      <div className="mb-5 text-cyan-300">{icon}</div>
      <div className="text-sm font-bold uppercase tracking-[.2em] text-slate-400">{title}</div>
      <div className="mt-3 text-4xl font-black">{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-7 backdrop-blur">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}
