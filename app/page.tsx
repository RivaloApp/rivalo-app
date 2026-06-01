import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-[1240px] px-5 py-7">
        <nav className="flex items-center justify-between gap-5">
         <Link href="/" className="inline-flex">
  <LogoMark />
</Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="rounded-2xl border border-white/20 bg-white/[.03] px-7 py-4 font-bold">
              Accedi
            </Link>
            <Link href="/signup" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 font-black">
              Prova la Beta
            </Link>
          </div>
        </nav>

        <section className="mt-[72px] grid items-center gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-7 inline-flex rounded-full border border-cyan-400/60 bg-cyan-400/[.055] px-6 py-3 text-[15px] font-black uppercase">
              <span className="text-lime-300">Calcetto</span>
              <span className="mx-3 text-cyan-400">•</span>
              <span className="text-cyan-300">Padel</span>
              <span className="mx-3 text-fuchsia-400">•</span>
              <span className="text-fuchsia-300">Tennis</span>
            </div>

            <h1 className="max-w-[665px] text-[54px] font-black leading-[1.07] tracking-[-.045em] md:text-[72px]">
              Competizione.
              <br />
              Statistiche.
              <br />
              Rivalità.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                Tutto in un’unica app.
              </span>
            </h1>

            <p className="mt-7 max-w-[565px] text-[18px] leading-[1.75] text-slate-300">
              Crea il tuo gruppo, organizza le partite, sfida i tuoi amici e scala le classifiche.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <Link href="/login" className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-10 py-5 text-lg font-black">
                Entra in Rivalo
                <ChevronRight className="transition group-hover:translate-x-1" size={22} />
              </Link>

              <Link href="/login" className="flex items-center gap-4 rounded-2xl border border-white/20 bg-white/[.03] px-8 py-5 text-lg font-black">
                Accedi
                <UserRound size={25} />
              </Link>
            </div>

            <div className="mt-12 grid max-w-[530px] grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/80 p-2">
              <HeroStat icon={<Trophy size={34} />} value="24.7K" label="Partite" color="text-lime-300" />
              <HeroStat icon={<Users size={34} />} value="5.892" label="Giocatori" color="text-fuchsia-400" border />
              <HeroStat icon={<BarChart3 size={34} />} value="92%" label="Attività" color="text-cyan-300" border />
            </div>
          </div>

          <PhoneMockup />
        </section>

        <section className="mt-[76px] grid gap-4 md:grid-cols-5">
          <Feature href="/login" icon={<Users size={44} />} title="Crea il tuo gruppo" text="Invita amici e costruisci la tua squadra." color="text-lime-300" />
          <Feature href="/login" icon={<CalendarDays size={44} />} title="Organizza partite" text="Crea match, risultati e MVP." color="text-fuchsia-400" />
          <Feature href="/login" icon={<BarChart3 size={44} />} title="Statistiche reali" text="RivalScore, XP e progressione." color="text-cyan-300" />
          <Feature href="/login" icon={<Trophy size={44} />} title="Classifiche live" text="Scala la classifica Rivalo." color="text-orange-400" />
          <Feature href="/login" icon={<Star size={44} />} title="Badge & XP" text="Gioca, vinci, sali di livello." color="text-yellow-300" />
        </section>

        <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_1fr_.76fr]">
          <Card>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">Classifica generale</h2>
              <Link href="/login" className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-2 text-sm font-semibold text-slate-300">
                Vedi tutte
              </Link>
            </div>

            {["The Warriors", "Rival Team", "Black Sharks", "I Magnifici", "Dream Team"].map((name, i) => (
              <div key={name} className="flex items-center justify-between border-b border-white/[.06] py-[15px] last:border-none">
                <div className="flex items-center gap-4">
                  <div className="w-5 font-black text-cyan-300">{i + 1}</div>
                  <div className="font-semibold text-slate-100">{name}</div>
                </div>
                <div className={i === 0 ? "font-black text-lime-300" : "font-black text-slate-200"}>
                  {2450 - i * 220} pt
                </div>
              </div>
            ))}
          </Card>

          <Card>
            <h2 className="mb-6 text-2xl font-black">Percorsi rapidi</h2>
            <div className="grid gap-3">
              <QuickLink href="/login" icon={<BarChart3 />} title="Dashboard" />
              <QuickLink href="/login" icon={<CalendarDays />} title="Match" />
              <QuickLink href="/login" icon={<MessageCircle />} title="Community" />
              <QuickLink href="/login" icon={<UserRound />} title="Profilo" />
            </div>
          </Card>

          <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/50 bg-gradient-to-br from-[#071126] to-fuchsia-950/20 p-8">
            <div className="absolute bottom-[-42px] right-[-18px] text-[190px] font-black italic text-white/[.035]">R</div>
            <div className="relative text-[31px] font-black leading-tight">
              La tua <span className="text-fuchsia-300">rivalità.</span>
              <br />
              La tua storia.
              <br />
              Lascia il segno.
            </div>
            <p className="relative mt-8 text-lg leading-8 text-slate-300">
              Ogni partita è un passo verso la leggenda.
            </p>
            <Link href="/signup" className="relative mt-9 inline-block rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-4 font-black">
              Unisciti alla Beta
            </Link>
          </div>
        </section>

        <footer className="mt-8 grid gap-6 pb-10 text-sm font-semibold text-slate-400 md:grid-cols-4">
          <FooterItem icon={<ShieldCheck size={26} />} text="Sicuro e protetto" />
          <FooterItem icon={<LockKeyhole size={26} />} text="Dati sempre tuoi" />
          <FooterItem icon={<Sparkles size={26} />} text="Nato per competere" />
          <FooterItem icon={<RefreshCw size={26} />} text="Sempre in evoluzione" />
        </footer>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_27%),radial-gradient(circle_at_88%_5%,rgba(168,85,247,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_45%,#020617_100%)]" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />

        <svg viewBox="0 0 120 120" className="relative h-full w-full">
          <defs>
            <linearGradient id="homeLogoEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter id="homeSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
              <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
            </filter>
          </defs>

          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
            filter="url(#homeSoftGlow)"
          />

          <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
          <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#homeLogoEdge)" />
          <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
        </svg>
      </div>

      <div>
        <div className="text-3xl font-black tracking-tight text-white">
          Rivalo
        </div>

        <div className="mt-1 text-xs font-black tracking-[.32em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label, color, border }: { icon: React.ReactNode; value: string; label: string; color: string; border?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center px-4 py-6 text-center ${border ? "border-l border-white/10" : ""}`}>
      <div className={color}>{icon}</div>
      <div className="mt-3 text-2xl font-black text-white">{value}</div>
      <div className="mt-1 text-sm font-semibold text-slate-400">{label}</div>
    </div>
  );
}

function Feature({ href, icon, title, text, color }: { href: string; icon: React.ReactNode; title: string; text: string; color: string }) {
  return (
    <Link href={href} className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-7 shadow-2xl backdrop-blur transition hover:scale-[1.02]">
      <div className={color}>{icon}</div>
      <h3 className="mt-6 text-2xl font-black text-white">{title}</h3>
      <p className="mt-3 text-[15px] leading-7 text-slate-300">{text}</p>
    </Link>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
      {children}
    </div>
  );
}

function QuickLink({ href, icon, title }: { href: string; icon: React.ReactNode; title: string }) {
  return (
    <Link href={href} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4 transition hover:bg-white/[.08]">
      <div className="flex items-center gap-4">
        <div className="text-cyan-300">{icon}</div>
        <span className="font-bold text-white">{title}</span>
      </div>
      <ChevronRight className="text-slate-400" size={20} />
    </Link>
  );
}

function FooterItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] px-5 py-4">
      <div className="text-cyan-300">{icon}</div>
      <div>{text}</div>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto flex w-full max-w-[520px] items-center justify-center py-8">
      <div className="absolute h-[430px] w-[430px] rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="absolute right-8 top-6 h-48 w-48 rounded-full bg-fuchsia-500/10 blur-3xl" />
      <div className="absolute left-6 bottom-3 h-44 w-44 rounded-full bg-lime-400/10 blur-3xl" />

      <div className="relative w-full max-w-[360px] rotate-[2deg]">
        <div className="absolute inset-0 translate-y-8 rounded-[3rem] bg-cyan-400/20 blur-3xl" />

        <div className="relative overflow-hidden rounded-[2.6rem] border border-cyan-300/30 bg-gradient-to-br from-cyan-300/30 via-blue-600/20 to-fuchsia-500/30 p-[2px] shadow-[0_0_80px_rgba(34,211,238,.22)]">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-[#071126] p-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_12%,rgba(34,211,238,.28),transparent_34%),radial-gradient(circle_at_80%_18%,rgba(217,70,239,.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,.08),transparent_32%,rgba(34,211,238,.08))]" />
            <div className="absolute left-[-90px] top-[-70px] h-56 w-56 rounded-full border border-cyan-300/20" />
            <div className="absolute bottom-[-85px] right-[-70px] h-60 w-60 rounded-full border border-fuchsia-300/20" />
            <div className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/[.05] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">
              Rare card
            </div>

            <div className="relative rounded-[2rem] border border-white/10 bg-black/25 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                    RivalScore
                  </div>

                  <div className="mt-2 text-6xl font-black leading-none text-white drop-shadow-[0_0_18px_rgba(34,211,238,.4)]">
                    91
                  </div>
                </div>

                <div className="rounded-2xl border border-yellow-300/30 bg-yellow-300/10 px-4 py-3 text-center">
                  <Trophy className="mx-auto text-yellow-300" size={24} />
                  <div className="mt-1 text-xs font-black text-yellow-100">
                    MVP
                  </div>
                </div>
              </div>

              <div className="mt-7 overflow-hidden rounded-[1.6rem] border border-cyan-300/20 bg-cyan-400/10 p-4">
                <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">
                  Rivalo Player
                </div>

                <div className="mt-2 text-3xl font-black uppercase text-white">
                  Elite card
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-lime-300/30 bg-lime-400/10 px-3 py-1 text-xs font-black text-lime-200">
                    Calcetto
                  </span>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-1 text-xs font-black text-cyan-200">
                    Livello 12
                  </span>
                  <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-400/10 px-3 py-1 text-xs font-black text-fuchsia-200">
                    Streak x5
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                <Mini value="24" label="Vittorie" />
                <Mini value="11" label="MVP" />
                <Mini value="+320" label="XP" />
              </div>
            </div>

            <div className="relative mt-4 grid grid-cols-3 gap-2">
              <div className="h-2 rounded-full bg-cyan-300/60" />
              <div className="h-2 rounded-full bg-fuchsia-300/60" />
              <div className="h-2 rounded-full bg-lime-300/60" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.04] p-4 text-center">
      <div className="text-2xl font-black text-cyan-300">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  );
}


