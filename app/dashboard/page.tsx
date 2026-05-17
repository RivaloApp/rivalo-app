"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, doc, getDoc, getDocs, limit, orderBy, query } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { Bell, CalendarDays, Crown, Grid2X2, LogOut, MessageCircle, Settings, Shield, ShieldCheck, Star, Trophy, UserRound, Users, CircleDot, ArrowRight } from "lucide-react";

type UserProfile = {
  uid?: string;
  name?: string;
  nickname?: string;
  mainSport?: string;
  rivalScore?: number;
  level?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  mvp?: number;
  photoURL?: string;
  photoUrl?: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
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
          setProfile({ uid: currentUser.uid, ...(snap.data() as UserProfile) });
        } else {
          setProfile({
            uid: currentUser.uid,
            name: currentUser.displayName || "Player",
            nickname: "Rivalo Player",
            mainSport: "calcetto",
            rivalScore: 1000,
            level: 1,
            xp: 100,
            wins: 0,
            losses: 0,
            draws: 0,
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            mvp: 0,
          });
        }

        const q = query(collection(db, "users"), orderBy("rivalScore", "desc"), limit(5));
        const qs = await getDocs(q);
        setLeaders(qs.docs.map((d) => ({ uid: d.id, ...(d.data() as UserProfile) })));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName = profile?.name || user?.displayName || "Player";
  const nickname = profile?.nickname || "Rivalo Player";
  const rivalScore = profile?.rivalScore ?? 1000;
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 100;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const mvp = profile?.mvp ?? 0;
  const matchesPlayed = profile?.matchesPlayed ?? 0;
  const goals = profile?.goals ?? 0;
  const assists = profile?.assists ?? 0;
  const mainSport = profile?.mainSport || "calcetto";
  const photo = profile?.photoURL || profile?.photoUrl || "";

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">Caricamento Rivalo...</main>;
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />
      <section className="relative z-10 flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1 px-6 py-6 lg:px-8 xl:px-10">
          <TopIcons />

          <section className="grid gap-7 xl:grid-cols-[1fr_330px] 2xl:grid-cols-[1fr_360px]">
            <div className="grid items-start gap-8 xl:grid-cols-[310px_1fr] 2xl:grid-cols-[330px_1fr]">
              <PlayerCard name={displayName} nickname={nickname} rivalScore={rivalScore} mainSport={mainSport} photo={photo} />

              <div className="pt-5">
                <div className="text-2xl font-medium text-white/90">Bentornato,</div>
                <h1 className="mt-2 text-5xl font-black uppercase leading-none tracking-tight text-white md:text-6xl">{displayName}</h1>
                <div className="mt-3 text-3xl font-black uppercase text-cyan-300">{nickname}</div>

                <div className="mt-9 grid max-w-[520px] grid-cols-3 gap-5">
                  <StatShield tone="purple" value={String(level)} label="Livello" icon={<Star />} />
                  <StatShield tone="cyan" value={String(wins)} label="Vittorie" icon={<Trophy />} />
                  <StatShield tone="orange" value={String(mvp)} label="MVP" icon={<Crown />} />
                </div>

                <div className="mt-6 grid max-w-[680px] grid-cols-2 gap-4 md:grid-cols-4">
                  <SmallMetric label="Partite" value={String(matchesPlayed)} />
                  <SmallMetric label="Sconfitte" value={String(losses)} />
                  <SmallMetric label="Gol" value={String(goals)} />
                  <SmallMetric label="Assist" value={String(assists)} />
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <ScorePanel rivalScore={rivalScore} />
              <LevelPanel level={level} xp={xp} />
            </aside>
          </section>

          <section className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">Azioni rapide</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <QuickAction href="/groups" tone="green" icon={<Users />} title="I miei gruppi" text="Gestisci i tuoi gruppi" />
              <QuickAction href="/match" tone="cyan" icon={<CircleDot />} title="I miei match" text="Vedi e gestisci match" />
              <QuickAction href="/community" tone="purple" icon={<MessageCircle />} title="Community" text="Chat, post e sfide" />
              <QuickAction href="/events" tone="orange" icon={<CalendarDays />} title="Eventi" text="Tornei e competizioni" />
              <QuickAction href="/profile" tone="blue" icon={<UserRound />} title="Profilo" text="Foto, card e statistiche" />
            </div>
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_390px]">
            <Leaderboard leaders={leaders} currentUid={user?.uid || ""} fallbackName={displayName} fallbackScore={rivalScore} fallbackWins={wins} fallbackMvp={mvp} />
            <UpgradePanel />
          </section>
        </div>
      </section>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden w-[205px] shrink-0 border-r border-white/10 bg-[#020617]/82 px-4 py-7 backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/" className="mb-9 flex items-center gap-4 px-2">
  <LogoMark />

  <div>
    <div className="text-2xl font-black leading-none text-white">
      Rivalo
    </div>
    <div className="mt-1 text-[9px] font-black tracking-[.28em] text-cyan-300">
      OWN THE GAME
    </div>
  </div>
</Link>
      <div className="space-y-2">
        <SideLink href="/dashboard" icon={<Grid2X2 />} text="Dashboard" active />
        <SideLink href="/groups" icon={<Users />} text="Gruppi" />
        <SideLink href="/match" icon={<CircleDot />} text="Match" />
        <SideLink href="/leaderboard" icon={<Trophy />} text="Classifica" />
        <SideLink href="/community" icon={<MessageCircle />} text="Community" />
        <SideLink href="/events" icon={<CalendarDays />} text="Eventi" />
        <SideLink href="/profile" icon={<UserRound />} text="Profilo" />
      </div>
      <button className="mt-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white">
        <LogOut size={20} /> Esci
      </button>
    </aside>
  );
}

function SideLink({ href, icon, text, active }: { href: string; icon: React.ReactNode; text: string; active?: boolean }) {
  return <Link href={href} className={`flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-semibold transition ${active ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-[0_0_25px_rgba(79,70,229,.35)]" : "text-slate-300 hover:bg-white/[.05] hover:text-white"}`}>{icon}{text}</Link>;
}

function TopIcons() {
  return (
    <div className="mb-3 flex items-center justify-end gap-4">
      <button className="relative rounded-2xl border border-white/10 bg-white/[.04] p-3 text-slate-200"><Bell size={22} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-fuchsia-400" /></button>
      <button className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-slate-200"><Settings size={22} /></button>
    </div>
  );
}

function PlayerCard({ name, nickname, rivalScore, mainSport, photo }: { name: string; nickname: string; rivalScore: number; mainSport: string; photo: string }) {
  const rating = Math.max(70, Math.min(99, Math.round(rivalScore / 12)));
  return (
    <div className="relative mx-auto w-full max-w-[330px] rivalo-card-glow">
      <div className="absolute -inset-4 rounded-[2.5rem] bg-[radial-gradient(circle_at_10%_50%,rgba(249,115,22,.62),transparent_34%),radial-gradient(circle_at_88%_43%,rgba(124,58,237,.58),transparent_38%)] blur-2xl" />
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-orange-500 to-purple-500 shadow-[0_0_38px_rgba(249,115,22,.32),0_0_48px_rgba(124,58,237,.28)]" style={{ clipPath: "polygon(9% 0%, 91% 0%, 100% 9%, 100% 81%, 50% 100%, 0% 81%, 0% 9%)" }} />
        <div className="rivalo-energy-sweep relative m-[2px] overflow-hidden bg-[#050814]" style={{ clipPath: "polygon(10% 1%, 90% 1%, 98.5% 10%, 98.5% 79.5%, 50% 98.5%, 1.5% 79.5%, 1.5% 10%)" }}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_48%,rgba(249,115,22,.48),transparent_33%),radial-gradient(circle_at_84%_42%,rgba(37,99,235,.48),transparent_34%),linear-gradient(135deg,#050814_0%,#070a16_44%,#12051c_100%)]" />
          <div className="relative z-10 flex h-[455px] flex-col px-5 pb-7 pt-5">
            <div className="flex items-start justify-between">
              <div><div className="text-5xl font-black leading-none text-yellow-300">{rating}</div><div className="mt-1 text-lg font-black uppercase text-yellow-200">RIV</div></div>
              <div className="rounded-2xl border border-cyan-300/35 bg-cyan-400/10 px-3 py-2 text-center text-[11px] font-black uppercase tracking-[.14em] text-cyan-100">{mainSport}</div>
            </div>
            <div className="relative mt-3 flex h-[140px] items-center justify-center">
              {photo ? <img src={photo} alt="Foto profilo" className="relative z-10 h-[132px] w-[132px] rounded-[1.25rem] object-cover shadow-[0_0_22px_rgba(255,255,255,.12)]" /> : <div className="relative z-10 flex h-[132px] w-[132px] items-center justify-center rounded-[1.25rem] border border-cyan-300/20 bg-black/25"><UserRound size={70} className="text-cyan-200" /></div>}
            </div>
            <div className="mt-1 text-center"><div className="truncate px-3 text-3xl font-black uppercase text-yellow-300">{name}</div><div className="mt-1 truncate px-3 text-lg font-black uppercase text-yellow-200">{nickname}</div><div className="mt-2 text-lg text-yellow-300">★</div></div>
            <div className="mt-auto pt-3"><div className="grid grid-cols-6 gap-1 text-center">{["PAC","SHO","PAS","DRI","DEF","PHY"].map((l,i)=><CardStat key={l} label={l} value={Math.max(60, Math.min(99, rating + [0,-4,-2,1,-6,-1][i]))} />)}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CardStat({ value, label }: { value: number; label: string }) { return <div className="min-w-0 rounded-md bg-black/20 px-0.5 py-1"><div className="text-[15px] font-black leading-none text-yellow-300">{value}</div><div className="mt-1 text-[8px] font-black uppercase text-yellow-200">{label}</div></div>; }

function StatShield({ tone, value, label, icon }: { tone: "purple" | "cyan" | "orange"; value: string; label: string; icon: React.ReactNode }) {
  const styles = { purple: "from-purple-500 to-purple-950", cyan: "from-cyan-400 to-blue-950", orange: "from-orange-400 to-orange-950" }[tone];
  return <div className={`rounded-[1.7rem] bg-gradient-to-b ${styles} p-[2px] shadow-2xl`}><div className="rounded-[1.6rem] bg-black/40 p-5 text-center"><div className="text-5xl font-black">{value}</div><div className="mt-3 whitespace-nowrap text-sm font-black uppercase">{label}</div><div className="mt-3 flex justify-center text-cyan-200">{icon}</div></div></div>;
}

function SmallMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><div className="text-3xl font-black text-cyan-200">{value}</div><div className="mt-1 text-xs font-black uppercase tracking-[.14em] text-slate-400">{label}</div></div>; }
function ScorePanel({ rivalScore }: { rivalScore: number }) { return <div className="rounded-[1.7rem] border border-cyan-300/20 bg-[#071126]/80 p-6 shadow-2xl"><div className="text-sm font-black uppercase">Rival Score</div><div className="mt-2 text-5xl font-black text-blue-400">{rivalScore}</div><div className="mt-4 flex items-center gap-3 text-slate-300"><Shield className="text-cyan-300" /> Posizione N/D</div></div>; }
function LevelPanel({ level, xp }: { level: number; xp: number }) { const maxXp = 500; const pct = Math.min(100, Math.round((xp / maxXp) * 100)); return <div className="rounded-[1.7rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl"><div className="text-xl font-black uppercase">Livello {level}</div><div className="mt-6 h-4 overflow-hidden rounded-full bg-blue-950"><div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500" style={{ width: `${pct}%` }} /></div><div className="mt-5 text-lg font-medium text-white">{xp} / {maxXp} XP</div></div>; }

function QuickAction({ href, tone, icon, title, text }: { href: string; tone: "green" | "cyan" | "purple" | "orange" | "blue"; icon: React.ReactNode; title: string; text: string }) {
  const colors = { green: "border-green-400/50 from-green-500/20 text-green-300", cyan: "border-cyan-400/50 from-cyan-500/20 text-cyan-300", purple: "border-purple-400/50 from-purple-500/20 text-purple-300", orange: "border-orange-400/50 from-orange-500/20 text-orange-300", blue: "border-blue-400/50 from-blue-500/20 text-cyan-300" }[tone];
  return <Link href={href} className={`group relative min-h-[190px] overflow-hidden rounded-[1.6rem] border bg-gradient-to-br ${colors} to-transparent p-5 transition hover:-translate-y-1`}><div className="relative flex h-15 w-15 items-center justify-center rounded-3xl border border-current/35 bg-black/20 p-4">{icon}</div><div className="relative mt-7 text-xl font-black uppercase">{title}</div><div className="relative mt-3 text-sm font-medium text-white">{text}</div><div className="relative mt-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-current/35 bg-black/20 transition group-hover:translate-x-1"><ArrowRight size={22} /></div></Link>;
}

function Leaderboard({ leaders, currentUid, fallbackName, fallbackScore, fallbackWins, fallbackMvp }: { leaders: UserProfile[]; currentUid: string; fallbackName: string; fallbackScore: number; fallbackWins: number; fallbackMvp: number }) {
  const rows = leaders.length > 0 ? leaders : [{ uid: currentUid, name: fallbackName, rivalScore: fallbackScore, wins: fallbackWins, mvp: fallbackMvp }];
  return <div className="rounded-[1.8rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between gap-4"><h2 className="text-2xl font-black uppercase">Classifica generale</h2><Link href="/leaderboard" className="rounded-xl bg-purple-500/20 px-4 py-2 text-sm font-bold text-purple-200">Vedi completa</Link></div><div className="space-y-2">{rows.map((row, i) => <div key={row.uid || row.name || i} className={`grid grid-cols-[44px_1fr_70px_56px] items-center gap-3 rounded-2xl border px-4 py-3 ${row.uid === currentUid ? "border-blue-500 bg-blue-600/15" : "border-white/5 bg-white/[.025]"}`}><div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/10 text-lg font-black text-yellow-300">{i + 1}</div><div className="min-w-0"><div className="truncate text-lg font-bold">{row.name || row.nickname || "Player"}</div><div className="text-sm text-slate-400">Rival Score: {row.rivalScore || 1000}</div></div><div className="text-center"><div className="text-xs text-slate-400">Vittorie</div><div className="font-black">{row.wins || 0}</div></div><div className="text-center"><div className="text-xs text-slate-400">MVP</div><div className="font-black">{row.mvp || 0}</div></div></div>)}</div></div>;
}

function UpgradePanel() { return <div className="rounded-[1.8rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl"><h2 className="text-2xl font-black uppercase">Prossimi upgrade</h2><div className="mt-5 rounded-2xl border border-purple-500 bg-purple-700/20 p-5"><div className="text-xl font-black">Completa il tuo profilo</div><div className="mt-2 leading-6 text-slate-300">Aggiungi foto e personalizza la tua card.</div></div><div className="mt-4 space-y-3"><Goal icon={<ShieldCheck />} text="Gioca 5 match" value="0/5" /><Goal icon={<Trophy />} text="Vinci 3 match" value="0/3" /><Goal icon={<Star />} text="Ottieni 1 MVP" value="0/1" /></div></div>; }
function Goal({ icon, text, value }: { icon: React.ReactNode; text: string; value: string }) { return <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] p-4"><div className="flex items-center gap-3"><span className="text-yellow-300">{icon}</span><span>{text}</span></div><span className="font-bold">{value}</span></div>; }

function LogoMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />

        <svg viewBox="0 0 120 120" className="relative h-full w-full">
          <defs>
            <linearGradient id="dashboardLogoEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter id="dashboardSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
              <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
            </filter>
          </defs>

          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
            filter="url(#dashboardSoftGlow)"
          />

          <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
          <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#dashboardLogoEdge)" />
          <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
        </svg>
      </div>

      <div>
        <div className="text-2xl font-black tracking-tight text-white">
          Rivalo
        </div>

        <div className="mt-1 text-[10px] font-black tracking-[.32em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}
function Background() { return <div className="pointer-events-none fixed inset-0"><div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(59,130,246,.13),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(124,58,237,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_48%,#020617_100%)]" /></div>; }
