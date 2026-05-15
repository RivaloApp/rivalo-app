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
  Home,
  LogOut,
  MapPin,
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
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative rounded-3xl border border-white/10 bg-white/[.04] px-8 py-6 text-xl font-black text-cyan-300">
            Caricamento Rivalo...
          </div>
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
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <LogoMark />
            <div>
              <div className="text-2xl font-black tracking-tight md:text-3xl">Rivalo</div>
              <div className="text-[11px] font-black tracking-[.32em] text-cyan-300">
                OWN THE GAME
              </div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] backdrop-blur">
              <Bell size={20} className="text-cyan-300" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,.9)]" />
            </button>

            <button
              onClick={logout}
              className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-bold backdrop-blur md:flex"
            >
              <LogOut size={17} />
              Esci
            </button>
          </div>
        </header>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
          <PlayerHeroCard name={displayName} sport={sport} rivalScore={rivalScore} level={level} xp={xp} />
          <ActionHub />
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-4">
          <MetricCard icon={<Zap />} label="RivalScore" value={String(rivalScore)} accent="cyan" />
          <MetricCard icon={<Trophy />} label="Vittorie" value={String(wins)} accent="lime" />
          <MetricCard icon={<Medal />} label="MVP" value={String(mvp)} accent="fuchsia" />
          <MetricCard icon={<ShieldCheck />} label="FairPlay" value="100%" accent="blue" />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr_.9fr]">
          <NextMatchCard />
          <EventCard />
          <NotificationsCard />
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <CommunityCard />
          <RankingPreview />
        </section>
      </section>

      <BottomNav />
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_2%,rgba(34,211,238,.18),transparent_26%),radial-gradient(circle_at_90%_8%,rgba(217,70,239,.16),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_45%,#020617_100%)]" />
      <div className="absolute right-[-320px] top-[140px] h-[720px] w-[720px] rounded-full border border-cyan-400/10" />
      <div className="absolute right-[-250px] top-[220px] h-[590px] w-[590px] rounded-full border border-fuchsia-500/10" />
      <div className="absolute left-[-180px] bottom-[-180px] h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-14 w-14 shrink-0 md:h-16 md:w-16">
      <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />
      <svg viewBox="0 0 120 120" className="relative h-full w-full" aria-label="Rivalo logo">
        <defs>
          <linearGradient id="dashLogoEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id="dashSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
            <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
          </filter>
        </defs>

        <path
          d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
          fill="white"
          filter="url(#dashSoftGlow)"
        />
        <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
        <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#dashLogoEdge)" />
        <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
      </svg>
    </div>
  );
}

function PlayerHeroCard({ name, sport, rivalScore, level, xp }: { name: string; sport: string; rivalScore: number; level: number; xp: number }) {
  const xpProgress = Math.min(100, Math.round((xp / 3000) * 100));

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#08152f] via-[#071126] to-[#020617] p-6 shadow-2xl">
      <div className="absolute right-[-80px] top-[-80px] h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute bottom-[-90px] left-[-70px] h-60 w-60 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative grid gap-6 md:grid-cols-[.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-cyan-300/20 bg-gradient-to-br from-cyan-400/15 via-blue-600/10 to-fuchsia-500/15 p-5">
          <div className="flex items-center justify-between">
            <div className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
              RIVALO CARD
            </div>
            <div className="rounded-2xl border border-lime-300/40 bg-lime-300/10 px-3 py-2 text-sm font-black text-lime-300">
              LVL {level}
            </div>
          </div>

          <div className="mt-8 flex items-end justify-between">
            <div>
              <div className="text-sm font-bold uppercase tracking-[.22em] text-slate-400">RivalScore</div>
              <div className="mt-2 text-7xl font-black leading-none text-cyan-300">{rivalScore}</div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-slate-300">Status</div>
              <div className="mt-1 text-xl font-black text-lime-300">ON FIRE</div>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-3xl font-black">{name}</div>
            <div className="mt-1 text-sm font-bold uppercase tracking-[.18em] text-slate-400">
              {sport} • Player
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <MiniStat value="84" label="Win" />
            <MiniStat value="95" label="MVP" />
            <MiniStat value="88" label="Chem" />
          </div>
        </div>

        <div className="flex flex-col justify-between">
          <div>
            <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">Dashboard</div>
            <h1 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              Benvenuto nella tua arena, {name}.
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Qui gestisci partite, gruppi, eventi, ranking, richieste e notifiche.
              Tutto ordinato, senza caos.
            </p>
          </div>

          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[.04] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-300">Progressione XP</span>
              <span className="text-sm font-black text-cyan-300">{xp} / 3000</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionHub() {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black">Azioni rapide</h2>
          <p className="mt-1 text-sm text-slate-400">Apri solo quello che ti serve.</p>
        </div>
        <Sparkles className="text-cyan-300" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <QuickAction icon={<Plus />} title="Crea partita" text="Calendario, luogo e partecipanti" />
        <QuickAction icon={<Search />} title="Trova match" text="Giocatori, squadre, avversari" />
        <QuickAction icon={<Trophy />} title="Crea evento" text="Tornei, premi, classifiche" />
        <QuickAction icon={<Users />} title="Crea gruppo" text="Squadre, amici, campionati" />
      </div>
    </div>
  );
}

function QuickAction({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <button className="group rounded-3xl border border-white/10 bg-[#061126]/70 p-5 text-left transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-black">{title}</div>
          <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
        </div>
        <ChevronRight className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
      </div>
    </button>
  );
}

function MetricCard({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: "cyan" | "lime" | "fuchsia" | "blue" }) {
  const colors = {
    cyan: "text-cyan-300",
    lime: "text-lime-300",
    fuchsia: "text-fuchsia-300",
    blue: "text-blue-300",
  };

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 backdrop-blur">
      <div className={`mb-4 ${colors[accent]}`}>{icon}</div>
      <div className="text-xs font-black uppercase tracking-[.22em] text-slate-400">{label}</div>
      <div className={`mt-3 text-4xl font-black ${colors[accent]}`}>{value}</div>
    </div>
  );
}

function NextMatchCard() {
  return (
    <Panel title="Prossima partita" icon={<CalendarDays />}>
      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/[.06] p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-slate-300">Calcetto • Milano</div>
            <div className="mt-2 text-2xl font-black">Rival Team vs Black Sharks</div>
          </div>
          <div className="rounded-2xl bg-lime-300/10 px-3 py-2 text-sm font-black text-lime-300">
            21:00
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-slate-300">
          <MapPin size={16} className="text-cyan-300" />
          Centro Sportivo Aurora
        </div>

        <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-black">
          Apri match
        </button>
      </div>
    </Panel>
  );
}

function EventCard() {
  return (
    <Panel title="Evento attivo" icon={<Trophy />}>
      <div className="rounded-3xl border border-fuchsia-400/25 bg-fuchsia-500/[.06] p-5">
        <div className="text-sm font-black uppercase tracking-[.2em] text-fuchsia-300">Winter League</div>
        <div className="mt-3 text-2xl font-black">Campionato 3 mesi</div>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Classifica evento, premio finale, badge season e ranking dedicato.
        </p>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <MiniStat value="12" label="Team" />
          <MiniStat value="31g" label="Fine" />
          <MiniStat value="Cup" label="Premio" />
        </div>
      </div>
    </Panel>
  );
}

function NotificationsCard() {
  return (
    <Panel title="Notifiche" icon={<Bell />}>
      <div className="space-y-3">
        <NotificationItem accent="cyan" title="Richiesta presenza" text="Manca 1 giocatore per stasera." />
        <NotificationItem accent="fuchsia" title="Match da confermare" text="Risultato in attesa di validazione." />
        <NotificationItem accent="lime" title="Evento in scadenza" text="Ultimi 3 giorni per salire in classifica." />
      </div>
    </Panel>
  );
}

function CommunityCard() {
  return (
    <Panel title="Community" icon={<Users />}>
      <div className="grid gap-3 sm:grid-cols-2">
        <CommunityButton title="Trova giocatore" text="Slot liberi vicino a te" />
        <CommunityButton title="Trova squadra" text="Siamo in 5? Cerca avversari" />
        <CommunityButton title="Avversario tennis" text="Sfide singolo o doppio" />
        <CommunityButton title="Compagno padel" text="Coppie e match aperti" />
      </div>
    </Panel>
  );
}

function RankingPreview() {
  const players = [
    ["1", "Antonio", "91"],
    ["2", "Marco", "86"],
    ["3", "Luca", "82"],
  ];

  return (
    <Panel title="Classifica rapida" icon={<Trophy />}>
      <div className="space-y-3">
        {players.map(([pos, name, score]) => (
          <div key={name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#061126]/70 p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-black text-cyan-300">
                {pos}
              </div>
              <div className="font-black">{name}</div>
            </div>
            <div className="font-black text-lime-300">{score}</div>
          </div>
        ))}
      </div>
    </Panel>
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

function NotificationItem({ accent, title, text }: { accent: "cyan" | "fuchsia" | "lime"; title: string; text: string }) {
  const colors = {
    cyan: "bg-cyan-400",
    fuchsia: "bg-fuchsia-400",
    lime: "bg-lime-300",
  };

  return (
    <div className="flex gap-3 rounded-2xl border border-white/10 bg-[#061126]/70 p-4">
      <span className={`mt-2 h-2.5 w-2.5 rounded-full ${colors[accent]}`} />
      <div>
        <div className="font-black">{title}</div>
        <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
      </div>
    </div>
  );
}

function CommunityButton({ title, text }: { title: string; text: string }) {
  return (
    <button className="rounded-2xl border border-white/10 bg-[#061126]/70 p-4 text-left transition hover:border-cyan-400/30">
      <div className="font-black">{title}</div>
      <div className="mt-1 text-sm leading-5 text-slate-400">{text}</div>
    </button>
  );
}

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-2xl font-black">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase text-slate-400">{label}</div>
    </div>
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
