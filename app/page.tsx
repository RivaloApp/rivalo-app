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
         <Link href="/" className="flex items-center gap-4">
  <div className="relative h-16 w-16 shrink-0">
    <div className="absolute inset-0 rounded-[1.4rem] bg-cyan-400/25 blur-2xl" />

    <div className="relative flex h-16 w-16 items-center justify-center rounded-[1.4rem] bg-white text-4xl font-black italic text-[#020617] shadow-[0_0_25px_rgba(255,255,255,.18)]">
      R
    </div>
  </div>

  <div>
    <div className="text-[35px] font-black leading-none text-white">
      Rivalo
    </div>

    <div className="mt-2 text-[13px] font-black tracking-[.34em] text-cyan-300">
      OWN THE GAME
    </div>
  </div>
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
    <div className="relative h-[84px] w-[84px] shrink-0">
      <div className="absolute inset-0 rounded-3xl bg-cyan-400/25 blur-2xl" />
      <div className="absolute inset-0 translate-x-2 translate-y-2 rounded-3xl bg-fuchsia-500/20 blur-2xl" />
      <div className="relative flex h-[84px] w-[84px] items-center justify-center rounded-3xl border border-white/20 bg-white text-[48px] font-black italic text-[#020617]">
        R
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
    <div className="relative mx-auto w-full max-w-[480px]">
      <div className="absolute inset-0 rounded-[3rem] bg-cyan-400/20 blur-3xl" />
      <div className="relative overflow-hidden rounded-[3rem] border border-white/10 bg-[#071126] p-5 shadow-[0_0_60px_rgba(34,211,238,.12)]">
        <div className="rounded-[2rem] border border-white/10 bg-[#0b1730] p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-cyan-300">RivalScore</div>
              <div className="mt-2 text-5xl font-black text-white">91</div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-500 px-5 py-3 text-lg font-black text-white">
              MVP
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            <Mini value="24" label="Vittorie" />
            <Mini value="11" label="MVP" />
            <Mini value="+320" label="XP" />
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


