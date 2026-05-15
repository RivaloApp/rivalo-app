"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  Crown,
  Flame,
  Medal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users,
  Zap,
} from "lucide-react";

type UserProfile = {
  name?: string;
  nickname?: string;
  email?: string;
  mainSport?: string;
  role?: string;
  rivalScore?: number;
  level?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  mvp?: number;
  photoURL?: string;
  photoUrl?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile({
            name: currentUser.displayName || "Player",
            nickname: "Rivalo Player",
            email: currentUser.email || "",
            mainSport: "calcetto",
            role: "Player",
            rivalScore: 50,
            level: 1,
            xp: 0,
            wins: 0,
            losses: 0,
            mvp: 0,
          });
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName = profile?.name || user?.displayName || "Player";
  const nickname = profile?.nickname || "Rivalo Player";
  const rivalScore = profile?.rivalScore ?? 50;
  const level = profile?.level ?? 1;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const mvp = profile?.mvp ?? 0;
  const mainSport = profile?.mainSport || "calcetto";
  const photo = profile?.photoURL || profile?.photoUrl || "";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 px-8 py-5 font-black text-cyan-200">
          Caricamento Rivalo...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-6">
        <TopBar displayName={displayName} />

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="rounded-[2.4rem] border border-white/10 bg-white/[.045] p-7 shadow-2xl backdrop-blur">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                    {mainSport}
                  </div>

                  <h1 className="mt-5 text-5xl font-black leading-tight tracking-tight md:text-6xl">
                    Bentornato,
                    <br />
                    <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-400 bg-clip-text text-transparent">
                      {displayName}
                    </span>
                  </h1>

                  <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
                    Gestisci gruppi, match, eventi, profilo e ranking. Ogni partita può diventare ufficiale solo tramite FairPlay.
                  </p>
                </div>

                <PlayerCard
                  name={displayName}
                  nickname={nickname}
                  rivalScore={rivalScore}
                  level={level}
                  wins={wins}
                  mvp={mvp}
                  photo={photo}
                />
              </div>
            </div>

            <ActionGrid />

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              <MetricCard icon={<Trophy />} label="Vittorie" value={String(wins)} tone="lime" />
              <MetricCard icon={<Medal />} label="MVP" value={String(mvp)} tone="fuchsia" />
              <MetricCard icon={<BarChart3 />} label="Sconfitte" value={String(losses)} tone="cyan" />
            </section>
          </div>

          <aside className="space-y-6">
            <Panel title="Centro attività" icon={<Bell />}>
              <ActivityItem color="bg-cyan-300" title="Match programmati" text="Crea o apri una partita dal Match Center." href="/match" />
              <ActivityItem color="bg-fuchsia-300" title="Risultati da confermare" text="FairPlay pronto per validare i match." href="/match" />
              <ActivityItem color="bg-lime-300" title="Eventi in scadenza" text="Tornei e campionati saranno gestiti da Eventi." href="/events" />
            </Panel>

            <Panel title="Classifica rapida" icon={<Trophy />}>
              <div className="space-y-3">
                <RankRow n="1" name={displayName} score={rivalScore} active />
                <RankRow n="2" name="Marco" score={46} />
                <RankRow n="3" name="Luca" score={42} />
              </div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 text-sm leading-6 text-slate-300">
                Ranking demo temporaneo. Verrà sostituito dalla leaderboard reale ordinata da Firebase.
              </div>
            </Panel>

            <Panel title="Prossimi upgrade" icon={<Sparkles />}>
              <Upgrade text="Upload foto reale dalla galleria" />
              <Upgrade text="Card giocatore premium evolutiva" />
              <Upgrade text="RivalScore automatico" />
              <Upgrade text="Leaderboard reale" />
            </Panel>
          </aside>
        </section>
      </section>
    </main>
  );
}

function TopBar({ displayName }: { displayName: string }) {
  return (
    <nav className="flex items-center justify-between gap-5">
      <Link href="/" className="flex items-center gap-4">
        <LogoMark />
        <div>
          <div className="text-3xl font-black leading-none">Rivalo</div>
          <div className="mt-2 text-[11px] font-black tracking-[.34em] text-cyan-300">
            OWN THE GAME
          </div>
        </div>
      </Link>

      <div className="hidden items-center gap-3 lg:flex">
        <NavLink href="/dashboard" text="Dashboard" active />
        <NavLink href="/groups" text="Gruppi" />
        <NavLink href="/match" text="Match" />
        <NavLink href="/community" text="Community" />
        <NavLink href="/events" text="Eventi" />
        <NavLink href="/profile" text="Profilo" />
      </div>

      <Link
        href="/profile"
        className="hidden rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-black text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/[.08] sm:block"
      >
        {displayName}
      </Link>
    </nav>
  );
}

function NavLink({ href, text, active }: { href: string; text: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
        active
          ? "bg-cyan-400/10 text-cyan-300"
          : "text-slate-300 hover:bg-white/[.05] hover:text-white"
      }`}
    >
      {text}
    </Link>
  );
}

function ActionGrid() {
  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      <ActionCard href="/groups" icon={<Users />} title="Crea gruppo" text="Community, leghe e squadre." tone="cyan" />
      <ActionCard href="/match" icon={<Plus />} title="Organizza partite" text="Match, calendario e risultati." tone="fuchsia" />
      <ActionCard href="/community" icon={<Search />} title="Cerca giocatori" text="Trova singoli o squadre." tone="lime" />
      <ActionCard href="/events" icon={<CalendarDays />} title="Eventi" text="Tornei, premi, campionati." tone="blue" />
      <ActionCard href="/profile" icon={<UserRound />} title="Profilo" text="Foto, card e statistiche." tone="orange" />
    </section>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
  tone,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  text: string;
  tone: "cyan" | "fuchsia" | "lime" | "blue" | "orange";
}) {
  const colors = {
    cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-300/20",
    fuchsia: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-300/20",
    lime: "text-lime-300 bg-lime-300/10 border-lime-300/20",
    blue: "text-blue-300 bg-blue-400/10 border-blue-300/20",
    orange: "text-orange-300 bg-orange-400/10 border-orange-300/20",
  };

  return (
    <Link
      href={href}
      className="group rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-400/30 hover:bg-white/[.07]"
    >
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${colors[tone]}`}>
        {icon}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-black">{title}</div>
          <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
        </div>

        <ChevronRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" size={20} />
      </div>
    </Link>
  );
}

function PlayerCard({
  name,
  nickname,
  rivalScore,
  level,
  wins,
  mvp,
  photo,
}: {
  name: string;
  nickname: string;
  rivalScore: number;
  level: number;
  wins: number;
  mvp: number;
  photo: string;
}) {
  return (
    <div className="relative w-full max-w-[340px] overflow-hidden rounded-[2rem] border border-cyan-300/25 bg-gradient-to-br from-[#12356c] via-[#071a3d] to-[#130927] p-5 shadow-[0_0_40px_rgba(34,211,238,.16)]">
      <div className="absolute right-[-50px] top-[-50px] h-40 w-40 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="absolute bottom-[-60px] left-[-40px] h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs font-black uppercase tracking-[.25em] text-cyan-200">
            Rivalo Card
          </div>
          <div className="mt-3 text-4xl font-black text-lime-300">{rivalScore}</div>
          <div className="text-xs font-black uppercase tracking-[.18em] text-slate-300">
            RivalScore
          </div>
        </div>

        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/30 bg-white/10">
          {photo ? (
            <img src={photo} alt="Foto profilo" className="h-full w-full object-cover" />
          ) : (
            <UserRound className="text-cyan-200" size={38} />
          )}
        </div>
      </div>

      <div className="relative mt-8">
        <div className="text-3xl font-black">{name}</div>
        <div className="mt-1 text-sm font-bold text-cyan-200">{nickname}</div>
      </div>

      <div className="relative mt-6 grid grid-cols-3 gap-3 text-center">
        <Mini value={String(level)} label="Livello" />
        <Mini value={String(wins)} label="Vittorie" />
        <Mini value={String(mvp)} label="MVP" />
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[.14em] text-slate-300">{label}</div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "cyan" | "fuchsia" | "lime";
}) {
  const colors = {
    cyan: "text-cyan-300",
    fuchsia: "text-fuchsia-300",
    lime: "text-lime-300",
  };

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur">
      <div className={colors[tone]}>{icon}</div>
      <div className={`mt-4 text-4xl font-black ${colors[tone]}`}>{value}</div>
      <div className="mt-2 text-sm font-black uppercase tracking-[.18em] text-slate-400">{label}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>
        <h2 className="text-2xl font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ActivityItem({
  color,
  title,
  text,
  href,
}: {
  color: string;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link href={href} className="mb-3 block rounded-2xl border border-white/10 bg-[#071126]/80 p-4 transition hover:border-cyan-300/30">
      <div className="flex gap-3">
        <span className={`mt-1 h-3 w-3 rounded-full ${color}`} />
        <div>
          <div className="font-black">{title}</div>
          <div className="mt-1 text-sm leading-6 text-slate-400">{text}</div>
        </div>
      </div>
    </Link>
  );
}

function RankRow({ n, name, score, active }: { n: string; name: string; score: number; active?: boolean }) {
  return (
    <div className={`flex items-center justify-between rounded-2xl border p-4 ${active ? "border-cyan-300/25 bg-cyan-400/10" : "border-white/10 bg-white/[.035]"}`}>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/15 text-sm font-black text-cyan-200">
          {n}
        </div>
        <div className="font-black">{name}</div>
      </div>

      <div className="font-black text-lime-300">{score}</div>
    </div>
  );
}

function Upgrade({ text }: { text: string }) {
  return (
    <div className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4">
      <Zap className="text-fuchsia-300" size={18} />
      <span className="text-sm font-bold text-slate-300">{text}</span>
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-14 w-14 shrink-0">
      <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />
      <svg viewBox="0 0 120 120" className="relative h-14 w-14" aria-label="Rivalo logo">
        <defs>
          <linearGradient id="dashLogoEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="52%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id="dashSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
            <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
          </filter>
        </defs>
        <path d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z" fill="white" filter="url(#dashSoftGlow)" />
        <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
        <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#dashLogoEdge)" />
        <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
      <div className="absolute right-[-260px] top-[120px] h-[650px] w-[650px] rounded-full border border-cyan-400/10" />
      <div className="absolute left-[-180px] bottom-[-180px] h-[400px] w-[400px] rounded-full bg-fuchsia-500/10 blur-3xl" />
    </div>
  );
}
