import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  MessageCircle,
  UserRound,
} from "lucide-react";

export default function Home() {
  const ranking = [
    { n: "1", name: "The Warriors", pts: "2.450 pt" },
    { n: "2", name: "Rival Team", pts: "2.210 pt" },
    { n: "3", name: "Black Sharks", pts: "1.980 pt" },
    { n: "4", name: "I Magnifici", pts: "1.760 pt" },
    { n: "5", name: "Dream Team", pts: "1.520 pt" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-[1240px] px-5 py-7">
        <nav className="flex items-center justify-between gap-5">
          <Link href="/" className="flex items-center gap-4">
            <LogoMark />

            <div>
              <div className="text-[35px] font-black leading-none tracking-tight text-white">
                Rivalo
              </div>

              <div className="mt-2 text-[13px] font-black tracking-[.34em] text-cyan-300">
                OWN THE GAME
              </div>
            </div>
          </Link>

          <div className="hidden items-center gap-9 text-[15px] font-semibold text-slate-200 lg:flex">
            <Link className="relative text-white" href="/">
              Home

              <span className="absolute -bottom-[18px] left-0 h-[3px] w-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
            </Link>

            <a href="#features" className="hover:text-white">
              Funzionalità
            </a>

            <Link href="/leaderboard" className="hover:text-white">
              Classifiche
            </Link>

            <Link href="/community" className="hover:text-white">
              Community
            </Link>

            <Link href="/signup" className="hover:text-white">
              Beta
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="hidden rounded-2xl border border-white/20 bg-white/[.03] px-8 py-4 text-[15px] font-bold backdrop-blur transition hover:bg-white/[.08] sm:block"
            >
              Accedi
            </Link>

            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 text-[15px] font-black shadow-[0_0_35px_rgba(168,85,247,.25)] transition hover:scale-105"
            >
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
              <Link
                href="/dashboard"
                className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-10 py-5 text-lg font-black shadow-[0_0_34px_rgba(168,85,247,.25)] transition hover:scale-105"
              >
                Entra in Rivalo

                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <ChevronRight
                    className="transition group-hover:translate-x-1"
                    size={22}
                  />
                </span>
              </Link>

              <Link
                href="/login"
                className="flex items-center gap-4 rounded-2xl border border-white/16 bg-white/[.025] px-8 py-5 text-lg font-black backdrop-blur transition hover:bg-white/[.075]"
              >
                Accedi
                <UserRound size={25} />
              </Link>
            </div>

            <div className="mt-12 grid max-w-[530px] grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/80 p-2 backdrop-blur">
              <HeroStat
                icon={<Trophy size={34} />}
                value="24.7K"
                label="Partite giocate"
                color="text-lime-300"
              />

              <HeroStat
                icon={<Users size={34} />}
                value="5.892"
                label="Giocatori attivi"
                color="text-fuchsia-400"
                border
              />

              <HeroStat
                icon={<BarChart3 size={34} />}
                value="92%"
                label="Attività settimanale"
                color="text-cyan-300"
                border
              />
            </div>
          </div>

          <PhoneMockup />
        </section>

        <section
          id="features"
          className="mt-[76px] grid gap-4 md:grid-cols-5"
        >
          <Feature
            href="/community"
            icon={<Users size={44} />}
            title="Crea il tuo gruppo"
            text="Invita i tuoi amici e costruisci la tua squadra."
            color="text-lime-300"
          />

          <Feature
            href="/match"
            icon={<CalendarDays size={44} />}
            title="Organizza partite"
            text="Crea match, risultati e MVP."
            color="text-fuchsia-400"
          />

          <Feature
            href="/dashboard"
            icon={<BarChart3 size={44} />}
            title="Statistiche reali"
            text="RivalScore, XP e progressione."
            color="text-cyan-300"
          />

          <Feature
            href="/leaderboard"
            icon={<Trophy size={44} />}
            title="Classifiche live"
            text="Scala la classifica e diventa il numero uno."
            color="text-orange-400"
          />

          <Feature
            href="/dashboard"
            icon={<Star size={44} />}
            title="Badge & XP"
            text="Gioca, vinci, sali di livello."
            color="text-yellow-300"
          />
        </section>

        <section className="mt-9 grid gap-6 lg:grid-cols-[1fr_1fr_.76fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                Classifica generale
              </h2>

              <Link
                href="/leaderboard"
                className="rounded-xl border border-white/10 bg-white/[.035] px-4 py-2 text-sm font-semibold text-slate-300"
              >
                Vedi tutte
              </Link>
            </div>

            <div>
              {ranking.map((r, i) => (
                <div
                  key={r.name}
                  className="flex items-center justify-between border-b border-white/[.06] py-[15px] last:border-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-5 font-black text-cyan-300">
                      {r.n}
                    </div>

                    <TeamBadge rank={i + 1} />

                    <div className="font-semibold text-slate-100">
                      {r.name}
                    </div>
                  </div>

                  <div
                    className={
                      i === 0
                        ? "font-black text-lime-300"
                        : "font-black text-slate-200"
                    }
                  >
                    {r.pts}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-2xl font-black">
              Percorsi rapidi
            </h2>

            <div className="grid gap-3">
              <QuickLink
                href="/dashboard"
                icon={<BarChart3 />}
                title="Dashboard"
              />

              <QuickLink
                href="/match"
                icon={<CalendarDays />}
                title="Match"
              />

              <QuickLink
                href="/community"
                icon={<MessageCircle />}
                title="Community"
              />

              <QuickLink
                href="/profile"
                icon={<UserRound />}
                title="Profilo"
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-fuchsia-400/50 bg-gradient-to-br from-[#071126] to-fuchsia-950/20 p-8 shadow-[0_0_35px_rgba(217,70,239,.16)]">
            <div className="absolute bottom-[-42px] right-[-18px] text-[190px] font-black italic text-white/[.035]">
              R
            </div>

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

            <Link
              href="/signup"
              className="relative mt-9 inline-block rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-4 font-black shadow-[0_0_26px_rgba(34,211,238,.18)]"
            >
              Unisciti alla Beta
            </Link>
          </div>
        </section>

        <footer className="mt-8 grid gap-6 pb-10 text-sm font-semibold text-slate-400 md:grid-cols-4">
          <FooterItem
            icon={<ShieldCheck size={26} />}
            text="Sicuro e protetto"
          />

          <FooterItem
            icon={<LockKeyhole size={26} />}
            text="Dati sempre tuoi"
          />

          <FooterItem
            icon={<Sparkles size={26} />}
            text="Nato per competere"
          />

          <FooterItem
            icon={<RefreshCw size={26} />}
            text="Sempre in evoluzione"
          />
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

      <div className="absolute right-[-155px] top-[390px] h-[2px] w-[650px] -rotate-[31deg] bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent blur-[.7px]" />

      <div className="absolute right-[-100px] top-[496px] h-[2px] w-[650px] -rotate-[31deg] bg-gradient-to-r from-transparent via-fuchsia-500/90 to-transparent blur-[.7px]" />
    </div>
  );
}

function LogoMark() {
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl" />

      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-fuchsia-500/20 blur-2xl" />

      <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-3xl border border-white/20 bg-white text-[48px] font-black italic text-[#020617] shadow-[0_0_35px_rgba(34,211,238,.2)]">
        R
      </div>
    </div>
  );
}

function HeroStat({
  icon,
  value,
  label,
  color,
  border,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
  border?: boolean;
}) {
  return (
    <div className={`px-5 py-5 ${border ? "border-l border-white/10" : ""}`}>
      <div className={`mb-4 ${color}`}>{icon}</div>

      <div className={`text-[30px] font-black leading-none ${color}`}>
        {value}
      </div>

      <div className="mt-3 text-[15px] leading-tight text-slate-300">
        {label}
      </div>
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
  color: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.65rem] border border-white/10 bg-[#061126]/78 p-7 text-center shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-400/30"
    >
      <div
        className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center transition group-hover:scale-110 ${color}`}
      >
        {icon}
      </div>

      <h3 className="text-xl font-black transition group-hover:text-cyan-300">
        {title}
      </h3>

      <p className="mt-4 text-[15px] leading-7 text-slate-300">
        {text}
      </p>
    </Link>
  );
}

function TeamBadge({ rank }: { rank: number }) {
  const colors =
    rank === 1
      ? "from-lime-300 to-cyan-400"
      : rank === 2
      ? "from-cyan-400 to-blue-500"
      : "from-fuchsia-500 to-blue-500";

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${colors} p-[2px]`}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#071126] text-sm font-black text-white">
        {rank}
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.035] px-5 py-4 font-black transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
    >
      <span className="flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>

        {title}
      </span>

      <ChevronRight size={18} />
    </Link>
  );
}

function FooterItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
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

            <span>▮▮▮ ▰</span>
          </div>

          <div className="rounded-2xl border border-blue-400/20 bg-[#071333] p-4">
            <div className="text-sm font-semibold text-slate-300">
              Il tuo RivalScore
            </div>

            <div className="mt-2 flex items-center gap-3">
              <span className="text-5xl font-black text-lime-300">
                91
              </span>

              <span className="rounded-full bg-lime-400/15 px-3 py-1 text-sm font-black text-lime-300">
                +7
              </span>
            </div>

            <div className="mt-4 text-sm text-slate-300">
              Livello 18
            </div>

            <div className="mt-2 h-2 rounded-full bg-white/10">
              <div className="h-2 w-[78%] rounded-full bg-lime-300" />
            </div>
          </div>

          <div className="mt-5 rounded-[1.7rem] border border-white/5 bg-white/[.035] p-5">
            <div className="text-sm font-bold text-slate-200">
              Prossima partita
            </div>

            <div className="mt-5 flex items-center justify-between">
              <div className="font-black">Rival Team</div>

              <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-cyan-300">
                VS
              </span>

              <div className="font-black">Black Sharks</div>
            </div>

            <div className="mt-4 text-center text-sm text-slate-300">
              Sab 17 Mag • 21:00
              <br />
              Centro Sportivo Aurora
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
