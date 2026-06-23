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
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-[1240px] px-4 py-6 sm:px-5 sm:py-7">
        <nav className="flex items-center justify-between gap-3">
          <Link href="/" className="min-w-0 shrink">
            <LogoMark />
          </Link>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/login"
              className="rounded-2xl border border-white/20 bg-white/[.03] px-5 py-3 text-sm font-bold sm:px-7 sm:py-4 sm:text-base"
            >
              Accedi
            </Link>

            <Link
              href="/signup"
              className="hidden rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 font-black sm:inline-flex"
            >
              Registrati
            </Link>
          </div>
        </nav>

        <section className="mt-12 grid items-center gap-10 lg:mt-[72px] lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div className="min-w-0">
            <div className="mb-6 inline-flex max-w-full rounded-full border border-cyan-400/60 bg-cyan-400/[.055] px-5 py-3 text-[13px] font-black uppercase sm:mb-7 sm:px-6 sm:text-[15px]">
              <span className="text-lime-300">Calcetto</span>
              <span className="mx-2 text-cyan-400 sm:mx-3">•</span>
              <span className="text-cyan-300">Padel</span>
              <span className="mx-2 text-fuchsia-400 sm:mx-3">•</span>
              <span className="text-fuchsia-300">Tennis</span>
            </div>

            <h1 className="max-w-full text-[44px] font-black leading-[1.08] tracking-[-.045em] sm:text-[54px] md:text-[72px]">
              Competizione.
              <br />
              Statistiche.
              <br />
              Rivalità.
              <br />
              <span className="block bg-gradient-to-r from-cyan-300 via-blue-500 to-fuchsia-500 bg-clip-text text-transparent">
                Tutto in un’unica app.
              </span>
            </h1>

            <p className="mt-6 max-w-full text-[16px] leading-[1.7] text-slate-300 sm:mt-7 sm:max-w-[565px] sm:text-[18px]">
              Crea il tuo gruppo, organizza le partite, sfida i tuoi amici e scala le classifiche.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:gap-5">
              <Link
                href="/login"
                className="group flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/[.03] px-7 py-4 text-base font-black transition hover:border-cyan-300/40 hover:bg-cyan-400/10 sm:gap-4 sm:px-8 sm:py-5 sm:text-lg"
              >
                Accedi
                <UserRound size={23} />
              </Link>

              <Link
                href="/signup"
                className="group flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 text-base font-black text-white shadow-[0_0_28px_rgba(34,211,238,.18)] transition hover:scale-[1.01] sm:gap-4 sm:px-10 sm:py-5 sm:text-lg"
              >
                Registrati
                <ChevronRight className="transition group-hover:translate-x-1" size={22} />
              </Link>
            </div>

            <div className="mt-10 grid max-w-full grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/80 p-2 sm:mt-12 sm:max-w-[530px]">
              <HeroStat icon={<Trophy size={30} />} value="24.7K" label="Partite" color="text-lime-300" />
              <HeroStat icon={<Users size={30} />} value="5.892" label="Giocatori" color="text-fuchsia-400" border />
              <HeroStat icon={<BarChart3 size={30} />} value="92%" label="Attività" color="text-cyan-300" border />
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
              Registrati
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
    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
      <div className="relative h-14 w-14 shrink-0 sm:h-16 sm:w-16">
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

      <div className="min-w-0">
        <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
          Rivalo
        </div>

        <div className="mt-1 text-[9px] font-black tracking-[.24em] text-cyan-300 sm:text-xs sm:tracking-[.32em]">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}

function HeroStat({ icon, value, label, color, border }: { icon: React.ReactNode; value: string; label: string; color: string; border?: boolean }) {
  return (
    <div className={`flex flex-col items-center justify-center px-2 py-5 text-center sm:px-4 sm:py-6 ${border ? "border-l border-white/10" : ""}`}>
      <div className={color}>{icon}</div>
      <div className="mt-3 text-xl font-black text-white sm:text-2xl">{value}</div>
      <div className="mt-1 text-xs font-semibold text-slate-400 sm:text-sm">{label}</div>
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
    <div className="relative mx-auto w-full max-w-[480px]">
      <div className="absolute inset-0 rounded-[3rem] bg-cyan-400/20 blur-3xl" />
      <div className="absolute -left-10 top-12 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute -right-8 bottom-8 h-44 w-44 rounded-full bg-lime-300/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#071126] p-4 shadow-[0_0_60px_rgba(34,211,238,.12)] sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_82%_5%,rgba(217,70,239,.14),transparent_32%)]" />

        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-300/15 bg-[#050b1d] p-4 sm:p-5">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
          <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-fuchsia-500/15 blur-2xl" />
          <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-cyan-400/14 blur-2xl" />

          <div className="relative rounded-[1.7rem] border border-white/10 bg-gradient-to-br from-slate-950 via-[#101a36] to-slate-950 p-4 shadow-[inset_0_0_40px_rgba(255,255,255,.035)] sm:p-5">
            <div className="absolute inset-0 rounded-[1.7rem] bg-[linear-gradient(135deg,rgba(34,211,238,.16),transparent_30%,rgba(217,70,239,.13)_72%,transparent)]" />

            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[.18em] text-lime-200">
                  Elite Card
                </div>

                <div className="mt-4 flex items-end gap-3">
                  <div className="text-[58px] font-black leading-none tracking-[-.06em] text-white sm:text-[70px]">
                    91
                  </div>

                  <div className="pb-2">
                    <div className="text-[11px] font-black uppercase tracking-[.18em] text-cyan-200">
                      RivalScore
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-400">
                      Calcetto · Stagione beta
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-center gap-2">
                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/25 bg-cyan-400/10 shadow-[0_0_24px_rgba(34,211,238,.14)] sm:h-20 sm:w-20">
                  <span className="text-3xl font-black text-white sm:text-4xl">R</span>
                </div>

                <div className="rounded-full bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-1 text-[10px] font-black uppercase tracking-[.16em] text-white">
                  MVP
                </div>
              </div>
            </div>

            <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
              <Mini value="24" label="Vittorie" tone="lime" />
              <Mini value="11" label="MVP" tone="cyan" />
              <Mini value="+320" label="XP" tone="pink" />
            </div>

            <div className="relative mt-4 grid grid-cols-4 gap-2">
              <Skill value="88" label="TEC" />
              <Skill value="92" label="VEL" />
              <Skill value="84" label="PAS" />
              <Skill value="90" label="CLT" />
            </div>

            <div className="relative mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-black text-white">
                    Rivalo Player
                  </div>
                  <div className="mt-0.5 text-xs font-bold text-slate-400">
                    Badge, ranking e progressione live
                  </div>
                </div>

                <div className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                  LVL 12
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone: "lime" | "cyan" | "pink";
}) {
  const toneClass =
    tone === "lime"
      ? "text-lime-300"
      : tone === "pink"
      ? "text-fuchsia-300"
      : "text-cyan-300";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.045] p-3 text-center sm:p-4">
      <div className={`text-xl font-black sm:text-2xl ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Skill({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2 text-center">
      <div className="text-base font-black text-white">{value}</div>
      <div className="mt-0.5 text-[9px] font-black tracking-[.14em] text-cyan-200">
        {label}
      </div>
    </div>
  );
}
