"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Crown,
  Home,
  LogOut,
  Medal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

type RivaloProfile = {
  name?: string;
  nickname?: string;
  email?: string;
  mainSport?: string;
  rivalScore?: number;
  level?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  mvp?: number;
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
      if (snap.exists()) {
        setProfile(snap.data() as RivaloProfile);
      }

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
        <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-8 py-6 text-xl font-black text-cyan-300">
          Caricamento Rivalo...
        </div>
      </main>
    );
  }

  const displayName = profile?.nickname || profile?.name || user?.displayName || "Player";
  const sport = profile?.mainSport || "calcetto";
  const rivalScore = profile?.rivalScore ?? 50;
  const level = profile?.level ?? 1;
  const wins = profile?.wins ?? 0;
  const mvp = profile?.mvp ?? 0;
  const xp = profile?.xp ?? 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] pb-28 text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-6 md:px-6">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-2xl font-black tracking-tight md:text-3xl">Rivalo</div>
              <div className="text-[11px] font-black tracking-[.32em] text-cyan-300">PLAYER HUB</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[.045] backdrop-blur">
              <Bell size={20} className="text-cyan-300" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,.9)]" />
            </button>

            <button
              onClick={logout}
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[.045] px-5 py-3 text-sm font-bold backdrop-blur md:flex"
            >
              <LogOut size={17} />
              Esci
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-7 xl:grid-cols-[430px_1fr]">
          <RivaloCollectorCard
            name={displayName}
            sport={sport}
            rivalScore={rivalScore}
            level={level}
            xp={xp}
            wins={wins}
            mvp={mvp}
          />

          <div className="grid gap-5">
            <WelcomePanel name={displayName} />
            <div className="grid gap-5 md:grid-cols-4">
              <MetricCard icon={<Zap />} label="RivalScore" value={String(rivalScore)} tone="cyan" />
              <MetricCard icon={<Trophy />} label="Vittorie" value={String(wins)} tone="lime" />
              <MetricCard icon={<Medal />} label="MVP" value={String(mvp)} tone="fuchsia" />
              <MetricCard icon={<ShieldCheck />} label="FairPlay" value="100%" tone="blue" />
            </div>
            <ActionGrid />
          </div>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_.9fr_.9fr]">
          <Panel title="Prossima partita" icon={<CalendarDays />}>
            <div className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[.10] to-blue-500/[.06] p-5">
              <div className="text-sm font-bold text-slate-300">Calcetto • Milano</div>
              <div className="mt-2 text-2xl font-black">Rival Team vs Black Sharks</div>
              <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-black">
                Apri match
              </button>
            </div>
          </Panel>

          <Panel title="Evento attivo" icon={<Trophy />}>
            <div className="rounded-3xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/[.12] to-cyan-400/[.06] p-5">
              <div className="text-sm font-black uppercase tracking-[.22em] text-fuchsia-300">Winter League</div>
              <div className="mt-3 text-2xl font-black">Campionato 3 mesi</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">Classifica evento, premio finale, badge season.</p>
            </div>
          </Panel>

          <Panel title="Notifiche" icon={<Bell />}>
            <div className="space-y-3">
              <Note color="cyan" title="Richiesta presenza" text="Manca 1 giocatore per stasera." />
              <Note color="fuchsia" title="Match da confermare" text="Risultato in attesa di validazione." />
              <Note color="lime" title="Evento in scadenza" text="Ultimi 3 giorni per salire." />
            </div>
          </Panel>
        </section>

        <section className="mt-7 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Panel title="Community Hub" icon={<Users />}>
            <div className="grid gap-3 sm:grid-cols-2">
              <CommunityTile title="Trova giocatore" text="Slot liberi vicino a te" />
              <CommunityTile title="Trova squadra" text="Siamo in 5? Cerca avversari" />
              <CommunityTile title="Avversario tennis" text="Sfide singolo o doppio" />
              <CommunityTile title="Compagno padel" text="Singolo / doppio e match aperti" />
            </div>
          </Panel>

          <Panel title="Classifica rapida" icon={<Trophy />}>
            <div className="space-y-3">
              {[
                ["1", "Antonio", "91"],
                ["2", "Marco", "86"],
                ["3", "Luca", "82"],
              ].map(([pos, name, score]) => (
                <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#061126]/70 p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-black text-cyan-300">{pos}</div>
                    <div className="font-black">{name}</div>
                  </div>
                  <div className="font-black text-lime-300">{score}</div>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </section>

      <BottomNav />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(34,211,238,.17),transparent_26%),radial-gradient(circle_at_82%_2%,rgba(217,70,239,.16),transparent_30%),radial-gradient(circle_at_50%_100%,rgba(59,130,246,.14),transparent_38%),linear-gradient(180deg,#020617_0%,#030712_48%,#020617_100%)]" />
      <div className="absolute left-[-140px] top-[130px] h-[360px] w-[360px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-[-230px] top-[90px] h-[720px] w-[720px] rounded-full border border-cyan-400/10" />
      <div className="absolute right-[-180px] top-[170px] h-[560px] w-[560px] rounded-full border border-fuchsia-500/10" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-14 w-14 shrink-0 md:h-16 md:w-16">
      <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />
      <svg viewBox="0 0 120 120" className="relative h-full w-full" aria-label="Rivalo logo">
        <defs>
          <linearGradient id="dash3LogoEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="52%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id="dash3SoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
            <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
          </filter>
        </defs>
        <path
          d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
          fill="white"
          filter="url(#dash3SoftGlow)"
        />
        <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
        <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#dash3LogoEdge)" />
        <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
      </svg>
    </div>
  );
}

function RivaloCollectorCard({
  name,
  sport,
  rivalScore,
  level,
  xp,
  wins,
  mvp,
}: {
  name: string;
  sport: string;
  rivalScore: number;
  level: number;
  xp: number;
  wins: number;
  mvp: number;
}) {
  const xpProgress = Math.min(100, Math.round((xp / 3000) * 100));

  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="absolute inset-0 rounded-[3rem] bg-cyan-400/20 blur-3xl" />
      <div className="absolute inset-0 translate-x-4 translate-y-8 rounded-[3rem] bg-fuchsia-500/20 blur-3xl" />

      <div className="relative rounded-[2.8rem] bg-gradient-to-br from-cyan-300 via-blue-500 to-fuchsia-500 p-[3px] shadow-[0_0_70px_rgba(34,211,238,.22)]">
        <div className="relative overflow-hidden rounded-[2.65rem] bg-[#071126] p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(255,255,255,.22),transparent_18%),radial-gradient(circle_at_50%_45%,rgba(34,211,238,.20),transparent_38%),linear-gradient(160deg,rgba(255,255,255,.08),transparent_35%,rgba(217,70,239,.12))]" />
          <div className="absolute left-[-70px] top-[180px] h-[220px] w-[220px] rounded-full border border-cyan-300/15" />
          <div className="absolute right-[-90px] top-[120px] h-[270px] w-[270px] rounded-full border border-fuchsia-300/15" />

          <div className="relative rounded-[2.25rem] border border-white/15 bg-black/25 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[76px] font-black leading-none tracking-tight text-white drop-shadow-[0_0_25px_rgba(34,211,238,.35)]">
                  {rivalScore}
                </div>
                <div className="mt-1 text-sm font-black uppercase tracking-[.24em] text-cyan-200">
                  OVR
                </div>
              </div>

              <div className="text-right">
                <div className="rounded-2xl border border-lime-300/35 bg-lime-300/10 px-3 py-2 text-sm font-black text-lime-300">
                  LVL {level}
                </div>
                <div className="mt-3 text-xs font-black uppercase tracking-[.22em] text-slate-300">
                  {sport}
                </div>
              </div>
            </div>

            <div className="relative mt-3 flex justify-center">
              <div className="absolute top-5 h-44 w-44 rounded-full bg-cyan-400/20 blur-3xl" />
              <div className="relative flex h-56 w-56 items-center justify-center">
                <ElitePlayerFigure />
              </div>
            </div>

            <div className="relative mt-2 text-center">
              <div className="text-[32px] font-black uppercase tracking-tight text-white">
                {name}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className="h-[1px] w-12 bg-gradient-to-r from-transparent to-cyan-300" />
                <span className="text-xs font-black uppercase tracking-[.25em] text-cyan-200">
                  Rival Icon
                </span>
                <span className="h-[1px] w-12 bg-gradient-to-l from-transparent to-fuchsia-300" />
              </div>
            </div>

            <div className="relative mt-6 grid grid-cols-3 gap-3 text-center">
              <Attribute value={String(wins)} label="WIN" />
              <Attribute value={String(mvp)} label="MVP" />
              <Attribute value="100" label="FAIR" />
              <Attribute value="84" label="ATK" />
              <Attribute value="91" label="IQ" />
              <Attribute value="88" label="CHE" />
            </div>

            <div className="relative mt-6 rounded-3xl border border-white/10 bg-white/[.06] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[.18em] text-slate-300">XP Evolution</span>
                <span className="text-xs font-black text-cyan-300">{xp}/3000</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500" style={{ width: `${xpProgress}%` }} />
              </div>
            </div>
          </div>

          <div className="relative mt-4 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
              <Crown size={16} className="text-yellow-300" />
              Elite Series
            </div>
            <div className="text-xs font-black uppercase tracking-[.18em] text-fuchsia-300">Season 01</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ElitePlayerFigure() {
  return (
    <svg viewBox="0 0 220 250" className="h-60 w-60 drop-shadow-[0_0_35px_rgba(34,211,238,.35)]">
      <defs>
        <linearGradient id="figureBody" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="48%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#d946ef" />
        </linearGradient>
        <linearGradient id="figureLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#67e8f9" />
        </linearGradient>
      </defs>

      <path d="M110 29 C137 29 156 49 156 77 C156 104 137 124 110 124 C83 124 64 104 64 77 C64 49 83 29 110 29Z" fill="url(#figureLight)" opacity=".95" />
      <path d="M53 230 C58 165 75 130 110 130 C145 130 162 165 167 230 Z" fill="url(#figureBody)" />
      <path d="M75 150 L32 190" stroke="#22d3ee" strokeWidth="16" strokeLinecap="round" />
      <path d="M145 150 L188 190" stroke="#d946ef" strokeWidth="16" strokeLinecap="round" />
      <path d="M92 226 L76 247" stroke="#60a5fa" strokeWidth="16" strokeLinecap="round" />
      <path d="M128 226 L145 247" stroke="#c084fc" strokeWidth="16" strokeLinecap="round" />
      <path d="M84 168 C103 182 122 182 142 168" stroke="white" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round" />
      <circle cx="160" cy="50" r="9" fill="#d9f99d" />
    </svg>
  );
}

function Attribute({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-[26px] font-black leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-black uppercase tracking-[.14em] text-slate-300">{label}</div>
    </div>
  );
}

function WelcomePanel({ name }: { name: string }) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
      <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
      <div className="relative">
        <div className="text-sm font-black uppercase tracking-[.32em] text-cyan-300">Dashboard</div>
        <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
          Benvenuto nella tua arena, {name}.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 md:text-lg">
          La tua card evolve con partite confermate, FairPlay, XP, tornei e RivalScore.
        </p>
      </div>
    </div>
  );
}

function ActionGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      <ActionButton icon={<Plus />} title="Crea partita" subtitle="Data, campo, partecipanti" tone="cyan" />
      <ActionButton icon={<Search />} title="Trova match" subtitle="Giocatori o squadre" tone="fuchsia" />
      <ActionButton icon={<Trophy />} title="Eventi" subtitle="Tornei e campionati" tone="lime" />
      <ActionButton icon={<Users />} title="Gruppi" subtitle="Amici e leghe" tone="blue" />
    </div>
  );
}

function ActionButton({ icon, title, subtitle, tone }: { icon: React.ReactNode; title: string; subtitle: string; tone: "cyan" | "fuchsia" | "lime" | "blue" }) {
  const colors = {
    cyan: "text-cyan-300 bg-cyan-400/10 border-cyan-300/20",
    fuchsia: "text-fuchsia-300 bg-fuchsia-400/10 border-fuchsia-300/20",
    lime: "text-lime-300 bg-lime-300/10 border-lime-300/20",
    blue: "text-blue-300 bg-blue-400/10 border-blue-300/20",
  };

  return (
    <button className="group rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 text-left shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border ${colors[tone]}`}>
        {icon}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-black">{title}</div>
          <div className="mt-1 text-sm leading-5 text-slate-400">{subtitle}</div>
        </div>
        <ChevronRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" size={20} />
      </div>
    </button>
  );
}

function MetricCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone: "cyan" | "lime" | "fuchsia" | "blue" }) {
  const colors = {
    cyan: "text-cyan-300",
    lime: "text-lime-300",
    fuchsia: "text-fuchsia-300",
    blue: "text-blue-300",
  };

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur">
      <div className={`mb-4 ${colors[tone]}`}>{icon}</div>
      <div className="text-xs font-black uppercase tracking-[.22em] text-slate-400">{label}</div>
      <div className={`mt-3 text-4xl font-black ${colors[tone]}`}>{value}</div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur">
      <div className="mb-5 flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Note({ color, title, text }: { color: "cyan" | "fuchsia" | "lime"; title: string; text: string }) {
  const colors = {
    cyan: "bg-cyan-400",
    fuchsia: "bg-fuchsia-400",
    lime: "bg-lime-300",
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#061126]/70 p-4">
      <span className={`mt-2 h-2.5 w-2.5 rounded-full ${colors[color]}`} />
      <div>
        <div className="font-black">{title}</div>
        <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function CommunityTile({ title, text }: { title: string; text: string }) {
  return (
    <button className="rounded-2xl border border-white/10 bg-[#061126]/70 p-4 text-left transition hover:border-cyan-400/30">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
    </button>
  );
}

function BottomNav() {
  const items = [
    { label: "Home", icon: <Home size={20} />, active: true },
    { label: "Match", icon: <CalendarDays size={20} /> },
    { label: "Community", icon: <Users size={20} /> },
    { label: "Eventi", icon: <Trophy size={20} /> },
    { label: "Profilo", icon: <Star size={20} /> },
  ];

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-white/10 bg-[#061126]/90 p-2 shadow-2xl backdrop-blur-xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => (
          <button
            key={item.label}
            className={`flex flex-col items-center justify-center gap-1 rounded-3xl px-2 py-3 text-[11px] font-bold ${
              item.active ? "bg-cyan-400/10 text-cyan-300" : "text-slate-400"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
