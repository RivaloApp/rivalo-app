import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

export default function Home() {
  const ranking = [
    { n: "1", name: "The Warriors", pts: "2.450 pt", badge: "W" },
    { n: "2", name: "Rival Team", pts: "2.210 pt", badge: "R" },
    { n: "3", name: "Black Sharks", pts: "1.980 pt", badge: "B" },
    { n: "4", name: "I Magnifici", pts: "1.760 pt", badge: "M" },
    { n: "5", name: "Dream Team", pts: "1.520 pt", badge: "D" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-[1240px] px-5 py-7">
        <nav className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <LogoMark />
            <div>
              <div className="text-[35px] font-black leading-none tracking-tight text-white">
                Rivalo
              </div>
              <div className="mt-2 text-[13px] font-black tracking-[.34em] text-cyan-300">
                OWN THE GAME
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-9 text-[15px] font-semibold text-slate-200 lg:flex">
            <a className="relative text-white" href="#">
              Home
              <span className="absolute -bottom-[18px] left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </a>
            <a href="#features" className="hover:text-white">Funzionalità</a>
            <a href="#ranking" className="hover:text-white">Classifiche</a>
            <a href="#sports" className="hover:text-white">Sport</a>
            <a href="#" className="hover:text-white">Beta</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden rounded-2xl border border-white/20 bg-white/[.03] px-8 py-4 text-[15px] font-bold backdrop-blur transition hover:bg-white/[.08] sm:block">
  Accedi
</Link>

<Link href="/signup" className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 text-[15px] font-black shadow-[0_0_35px_rgba(168,85,247,.25)] transition hover:scale-105">
  Prova la Beta
</Link>
          </div>
        </nav>

        <section className="mt-[72px] grid items-start gap-12 lg:grid-cols-[1fr_1fr]">
          <div>
            <div className="mb-7 inline-flex rounded-full border border-cyan-400/60 bg-cyan-400/[.055] px-6 py-3 text-[15px] font-black uppercase tracking-wide shadow-[0_0_25px_rgba(34,211,238,.14)]">
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

            <p className="mt-7 max-w-[565px] text-[18.5px] leading-[1.75] text-slate-300">
              Crea il tuo gruppo, organizza le partite, sfida i tuoi amici
              e scala le classifiche. Ogni partita conta.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
             <Link href="/signup" className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-10 py-5 text-lg font-black shadow-[0_0_34px_rgba(168,85,247,.25)] transition hover:scale-105">
  Inizia ora
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
    <ChevronRight className="transition group-hover:translate-x-1" size={22} />
  </span>
</Link>

              <button className="flex items-center gap-4 rounded-2xl border border-white/16 bg-white/[.025] px-8 py-5 text-lg font-black backdrop-blur transition hover:bg-white/[.075]">
                Scopri come funziona
                <PlayCircle size={25} />
              </button>
            </div>

            <div className="mt-12 grid max-w-[530px] grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/80 p-2 backdrop-blur">
              <HeroStat icon={<Trophy size={34} />} value="24.7K" label="Partite giocate" color="text-lime-300" />
              <HeroStat icon={<Users size={34} />} value="5.892" label="Giocatori attivi" color="text-fuchsia-400" border />
              <HeroStat icon={<BarChart3 size={34} />} value="92%" label="Attività settimanale" color="text-cyan-300" border />
            </div>
          </div>

          <PhoneMockup />
        </section>

        <section id="features" className="mt-[76px] grid gap-4 md:grid-cols-5">
          <Feature href="/community"icon={<Users size={44} />} title="Crea il tuo gruppo" text="Invita i tuoi amici e costruisci la tua squadra." color="text-lime-300" />
          <Feature href="/match"icon={<CalendarDays size={44} />} title="Organizza partite" text="Scegli data, ora e campo. Noi pensiamo al resto." color="text-fuchsia-400" />
          <Feature href=/dashboard"icon={<BarChart3 size={44} />} title="Statistiche reali" text="Ogni partita, ogni voto, ogni dettaglio conta." color="text-cyan-300" />
          <Feature href="/leaderboard"icon={<Trophy size={44} />} title="Classifiche live" text="Scala la classifica e diventa il numero uno." color="text-orange-400" />
          <Feature href="/dashboard"icon={<Star size={44} />} title="Badge & XP" text="Gioca, vinci, sali di livello e sblocca badge unici." color="text-yellow-300" />
        </section>

        <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_1fr_.76fr]">
          <div id="ranking" className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">Classifica generale</h2>
              <button className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-2 text-sm font-semibold text-slate-300">
                Vedi tutte
              </button>
            </div>

            <div>
              {ranking.map((r, i) => (
                <div key={r.name} className="flex items-center justify-between border-b border-white/[.06] py-[15px] last:border-none">
                  <div className="flex items-center gap-4">
                    <div className="w-5 font-black text-cyan-300">{r.n}</div>
                    <TeamBadge label={r.badge} rank={i + 1} />
                    <div className="font-semibold text-slate-100">{r.name}</div>
                  </div>
                  <div className={i === 0 ? "font-black text-lime-300" : "font-black text-slate-200"}>
                    {r.pts}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div id="sports" className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-2xl font-black">Sport disponibili</h2>
            <div className="grid grid-cols-3 gap-3">
              <SportCard title="Calcetto" sub="5v5" variant="football" />
              <SportCard title="Padel" sub="Singolo / Doppio" variant="padel" />
              <SportCard title="Tennis" sub="Singolare / Doppio" variant="tennis" />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/50 bg-gradient-to-br from-[#071126] to-fuchsia-950/20 p-8 shadow-[0_0_35px_rgba(217,70,239,.16)]">
            <div className="absolute bottom-[-42px] right-[-18px] text-[190px] font-black italic text-white/[.035]">R</div>
            <div className="relative text-[31px] font-black leading-tight">
              La tua <span className="text-fuchsia-300">rivalità.</span>
              <br />
              La tua storia.
              <br />
              Lascia il segno.
            </div>
            <p className="relative mt-8 max-w-[230px] text-lg leading-8 text-slate-300">
              Ogni partita è un passo verso la leggenda.
            </p>
            <Link href="/signup" className="relative mt-9 inline-block rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-4 font-black shadow-[0_0_26px_rgba(34,211,238,.18)]">
  Unisciti alla Beta
</Link>
          </div>
        </section>

        <div className="mt-14 text-center text-xl font-semibold text-slate-200">
          Già scelto da migliaia di giocatori
        </div>

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
      <div className="absolute right-[-320px] top-[125px] h-[780px] w-[780px] rounded-full border border-cyan-400/10" />
      <div className="absolute right-[-260px] top-[190px] h-[660px] w-[660px] rounded-full border border-blue-500/12" />
      <div className="absolute right-[-205px] top-[255px] h-[540px] w-[540px] rounded-full border border-fuchsia-500/12" />
      <div className="absolute right-[-155px] top-[390px] h-[2px] w-[650px] -rotate-[31deg] bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent blur-[.7px]" />
      <div className="absolute right-[-125px] top-[442px] h-[2px] w-[650px] -rotate-[31deg] bg-gradient-to-r from-transparent via-blue-500/90 to-transparent blur-[.7px]" />
      <div className="absolute right-[-100px] top-[496px] h-[2px] w-[650px] -rotate-[31deg] bg-gradient-to-r from-transparent via-fuchsia-500/90 to-transparent blur-[.7px]" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl" />
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-fuchsia-500/20 blur-2xl" />

      <svg viewBox="0 0 120 120" className="relative h-[84px] w-[84px]" aria-label="Rivalo logo">
        <defs>
          <linearGradient id="logoEdge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#d946ef" />
          </linearGradient>
          <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="-4" dy="2" stdDeviation="5" floodColor="#22d3ee" floodOpacity=".65" />
            <feDropShadow dx="5" dy="5" stdDeviation="6" floodColor="#d946ef" floodOpacity=".55" />
          </filter>
        </defs>

        <path
          d="M20 103 L20 16 H72 C92 16 105 29 105 47 C105 61 96 72 82 77 L104 103 H75 L57 79 H49 L49 103 Z"
          fill="url(#logoEdge)"
          opacity=".95"
          transform="translate(-5 5)"
        />

        <path
          d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
          fill="white"
          filter="url(#softGlow)"
        />

        <path
          d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
          fill="#020617"
        />

        <path
          d="M21 100 L49 76 H61 L29 114 Z"
          fill="url(#logoEdge)"
        />

        <path
          d="M73 78 L105 100 H76 L58 78 Z"
          fill="#d946ef"
          opacity=".55"
        />
      </svg>
    </div>
  );
}

function HeroStat({ icon, value, label, color, border }: { icon: React.ReactNode; value: string; label: string; color: string; border?: boolean }) {
  return (
    <div className={`px-5 py-5 ${border ? "border-l border-white/10" : ""}`}>
      <div className={`mb-4 ${color}`}>{icon}</div>
      <div className={`text-[30px] font-black leading-none ${color}`}>{value}</div>
      <div className="mt-3 text-[15px] leading-tight text-slate-300">{label}</div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
  color,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  color?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#061126]/80 p-7 text-center shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,.18)]"
    >
      <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,rgba(34,211,238,.12),transparent_60%)]" />

      <div
        className={`relative mx-auto mb-5 flex h-16 w-16 items-center justify-center transition duration-300 group-hover:scale-110 ${color}`}
      >
        {icon}
      </div>

      <h3 className="relative text-xl font-black transition group-hover:text-cyan-300">
        {title}
      </h3>

      <p className="relative mt-4 text-[15px] leading-7 text-slate-300">
        {text}
      </p>

      <div className="relative mt-5 flex items-center justify-center gap-2 text-sm font-black text-cyan-300 opacity-0 transition duration-300 group-hover:opacity-100">
        Apri
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}
function TeamBadge({ label, rank }: { label: string; rank: number }) {
  const colors = rank === 1 ? "from-lime-300 to-cyan-400" : rank === 2 ? "from-cyan-400 to-blue-500" : "from-fuchsia-500 to-blue-500";
  return (
    <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${colors} p-[2px]`}>
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#071126] text-sm font-black text-white">
        {label}
      </div>
    </div>
  );
}

function SportCard({ title, sub, variant }: { title: string; sub: string; variant: "football" | "padel" | "tennis" }) {
  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#08152f] via-[#071126] to-[#020617] p-4 shadow-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(34,211,238,.18),transparent_35%)]" />
      <div className="relative mx-auto mt-8 flex h-32 w-32 items-center justify-center">
        {variant === "football" && <FootballIcon />}
        {variant === "padel" && <PadelIcon />}
        {variant === "tennis" && <TennisIcon />}
      </div>
      <div className="absolute bottom-5 left-4">
        <div className="text-2xl font-black">{title}</div>
        <div className="mt-1 text-sm text-slate-300">{sub}</div>
      </div>
    </div>
  );
}

function FootballIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 drop-shadow-[0_18px_25px_rgba(0,0,0,.45)]">
      <defs>
        <radialGradient id="ball" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="65%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#64748b" />
        </radialGradient>
      </defs>
      <circle cx="60" cy="60" r="42" fill="url(#ball)" />
      <path d="M60 34 75 45 70 63H50L45 45Z" fill="#020617" />
      <path d="M35 52 45 45 50 63 38 72Z" fill="#020617" opacity=".9" />
      <path d="M85 52 75 45 70 63 82 72Z" fill="#020617" opacity=".9" />
      <path d="M50 63H70L76 82 60 92 44 82Z" fill="#020617" opacity=".9" />
      <circle cx="60" cy="60" r="42" fill="none" stroke="#22d3ee" strokeOpacity=".45" strokeWidth="2" />
    </svg>
  );
}

function PadelIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 drop-shadow-[0_18px_25px_rgba(0,0,0,.45)]">
      <defs>
        <linearGradient id="padelGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#d946ef" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      <ellipse cx="55" cy="48" rx="28" ry="38" fill="url(#padelGrad)" stroke="#f0abfc" strokeWidth="2" transform="rotate(-22 55 48)" />
      <g fill="#020617" opacity=".85">
        {Array.from({ length: 18 }).map((_, i) => (
          <circle key={i} cx={42 + (i % 6) * 7} cy={34 + Math.floor(i / 6) * 10} r="2.2" />
        ))}
      </g>
      <rect x="64" y="75" width="13" height="38" rx="6" fill="#111827" stroke="#d946ef" strokeWidth="2" transform="rotate(-32 64 75)" />
      <circle cx="85" cy="88" r="14" fill="#d9f99d" stroke="#bef264" strokeWidth="2" />
    </svg>
  );
}

function TennisIcon() {
  return (
    <svg viewBox="0 0 120 120" className="h-32 w-32 drop-shadow-[0_18px_25px_rgba(0,0,0,.45)]">
      <defs>
        <linearGradient id="tennisGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
      </defs>
      <ellipse cx="57" cy="45" rx="27" ry="39" fill="none" stroke="url(#tennisGrad)" strokeWidth="5" transform="rotate(20 57 45)" />
      <path d="M43 25 C56 38 65 55 72 75" stroke="#94a3b8" strokeWidth="1" opacity=".55" />
      <path d="M33 47 C48 48 64 44 82 35" stroke="#94a3b8" strokeWidth="1" opacity=".55" />
      <path d="M49 22 C60 39 68 57 75 78" stroke="#94a3b8" strokeWidth="1" opacity=".55" />
      <rect x="63" y="76" width="13" height="39" rx="6" fill="#111827" stroke="#22d3ee" strokeWidth="2" transform="rotate(31 63 76)" />
      <circle cx="88" cy="86" r="14" fill="#d9f99d" stroke="#bef264" strokeWidth="2" />
    </svg>
  );
}

function FooterItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <span className="text-cyan-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[480px] lg:-mt-8 lg:translate-x-2">
      <div className="absolute inset-0 rounded-[4rem] bg-cyan-400/20 blur-3xl" />
      <div className="relative rotate-[3.5deg] rounded-[4.1rem] border border-white/25 bg-gradient-to-br from-slate-700 to-black p-3 shadow-[0_0_65px_rgba(34,211,238,.18)]">
        <div className="rounded-[3.62rem] border border-white/10 bg-[#050b1f] p-5">
          <div className="mb-5 flex items-center justify-between px-2 text-sm font-black">
            <span>9:41</span>
            <span>▮▮▮  ▰</span>
          </div>

          <div className="grid grid-cols-[1.25fr_.8fr] gap-4">
            <div className="rounded-2xl border border-blue-400/20 bg-[#071333] p-4">
              <div className="text-sm font-semibold text-slate-300">Il tuo RivalScore</div>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-5xl font-black text-lime-300">91</span>
                <span className="rounded-full bg-lime-400/15 px-3 py-1 text-sm font-black text-lime-300">+7</span>
              </div>
              <div className="mt-4 text-sm text-slate-300">Livello 18</div>
              <div className="mt-2 h-2 rounded-full bg-white/10">
                <div className="h-2 w-[78%] rounded-full bg-lime-300" />
              </div>
            </div>

            <div className="rounded-2xl border border-fuchsia-400/10 bg-[#080d24] p-4">
              <div className="text-sm font-semibold text-slate-300">Stato attuale</div>
              <div className="mt-6 text-xl font-black text-lime-300">ON FIRE</div>
              <div className="mt-7 text-xs text-slate-400">2.350 / 3.000 XP</div>
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-[1.7rem] border border-blue-400/25 bg-gradient-to-br from-blue-700/30 to-blue-950/80 p-5">
            <div className="absolute right-5 top-9 h-24 w-16 rounded-full bg-cyan-300/10 blur-xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="text-sm text-slate-300">La tua card</div>
                <div className="mt-2 text-[30px] font-black">Antonio</div>
                <div className="text-sm text-slate-300">Fondatore • Playmaker</div>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-cyan-300 bg-fuchsia-600/40 text-3xl font-black">
                18
              </div>
            </div>

            <div className="relative mt-7 grid grid-cols-3 gap-3 text-center">
              <Mini value="84" label="Vittorie" />
              <Mini value="95" label="MVP" />
              <Mini value="88" label="Intesa" />
            </div>
          </div>

          <div className="mt-5 rounded-[1.7rem] border border-white/5 bg-white/[.035] p-5">
            <div className="text-sm font-bold text-slate-200">Prossima partita</div>
            <div className="mt-5 flex items-center justify-between">
              <div className="font-black">Rival Team</div>
              <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-cyan-300">VS</span>
              <div className="font-black">Black Sharks</div>
            </div>
            <div className="mt-4 text-center text-sm text-slate-300">
              Sab 17 Mag • 21:00
              <br />
              Centro Sportivo Aurora
            </div>
            <div className="mt-5 text-center text-xl font-black">
              1g <span className="text-slate-400">03h</span> 42m
            </div>
          </div>

          <div className="mt-5 grid grid-cols-5 items-center text-center text-xs text-slate-500">
            <span className="text-cyan-300">Home</span>
            <span>Gruppi</span>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 text-4xl text-white shadow-2xl">+</span>
            <span>Classifiche</span>
            <span>Profilo</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase text-slate-300">{label}</div>
    </div>
  );
}
