import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
} from "lucide-react";

export default function Home() {
  const ranking = [
    { n: "1", medal: "👑", avatar: "🧑🏻", name: "The Warriors", pts: "2.450 pt", color: "text-lime-300" },
    { n: "2", medal: "2", avatar: "🐺", name: "Rival Team", pts: "2.210 pt", color: "text-slate-200" },
    { n: "3", medal: "⭐", avatar: "🦈", name: "Black Sharks", pts: "1.980 pt", color: "text-slate-200" },
    { n: "4", medal: "", avatar: "👨🏽", name: "I Magnifici", pts: "1.760 pt", color: "text-slate-200" },
    { n: "5", medal: "", avatar: "🧔🏻", name: "Dream Team", pts: "1.520 pt", color: "text-slate-200" },
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_4%,rgba(34,211,238,.15),transparent_24%),radial-gradient(circle_at_88%_4%,rgba(168,85,247,.15),transparent_28%),linear-gradient(180deg,#020617_0%,#030712_45%,#020617_100%)]" />
        <div className="absolute right-[-310px] top-[120px] h-[780px] w-[780px] rounded-full border border-cyan-400/10" />
        <div className="absolute right-[-250px] top-[185px] h-[660px] w-[660px] rounded-full border border-blue-500/12" />
        <div className="absolute right-[-190px] top-[250px] h-[540px] w-[540px] rounded-full border border-fuchsia-500/12" />
        <div className="absolute right-[-130px] top-[385px] h-[2px] w-[620px] -rotate-[31deg] bg-gradient-to-r from-transparent via-cyan-400/90 to-transparent blur-[.7px]" />
        <div className="absolute right-[-110px] top-[435px] h-[2px] w-[620px] -rotate-[31deg] bg-gradient-to-r from-transparent via-blue-500/90 to-transparent blur-[.7px]" />
        <div className="absolute right-[-90px] top-[490px] h-[2px] w-[620px] -rotate-[31deg] bg-gradient-to-r from-transparent via-fuchsia-500/90 to-transparent blur-[.7px]" />
        <div className="absolute left-[-120px] bottom-[-120px] h-[350px] w-[350px] rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <section className="relative z-10 mx-auto max-w-[1220px] px-6 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-[78px] w-[78px] items-center justify-center">
  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400/30 via-blue-500/20 to-fuchsia-500/30 blur-xl" />

  <div className="absolute left-[10px] top-[6px] text-[70px] font-black italic leading-none text-white drop-shadow-[0_0_14px_rgba(255,255,255,.55)]">
    R
  </div>

  <div className="absolute bottom-[12px] left-[4px] h-[12px] w-[68px] -rotate-45 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_20px_rgba(168,85,247,.9)]" />

  <div className="absolute bottom-[22px] left-[18px] h-[7px] w-[50px] -rotate-45 rounded-full bg-fuchsia-500 blur-[2px]" />
</div>
            <div>
              <div className="text-[35px] font-black leading-none tracking-tight">Rivalo</div>
              <div className="mt-2 text-[13px] font-black tracking-[.34em] text-cyan-300">OWN THE GAME</div>
            </div>
          </div>

          <div className="hidden items-center gap-9 text-[15px] font-semibold text-slate-200 lg:flex">
            <a className="relative text-white" href="#">
              Home
              <span className="absolute -bottom-[18px] left-0 h-[2px] w-full rounded-full bg-blue-500" />
            </a>
            <a className="hover:text-white" href="#features">Funzionalità</a>
            <a className="hover:text-white" href="#ranking">Classifiche</a>
            <a className="hover:text-white" href="#sports">Sport</a>
            <a className="hover:text-white" href="#">Blog</a>
          </div>

          <div className="flex items-center gap-4">
            <button className="hidden rounded-2xl border border-white/25 bg-white/[.025] px-8 py-4 text-[15px] font-bold backdrop-blur transition hover:bg-white/[.075] sm:block">
              Accedi
            </button>
            <button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-7 py-4 text-[15px] font-black shadow-[0_0_35px_rgba(168,85,247,.24)] transition hover:scale-105">
              Prova la Beta
            </button>
          </div>
        </nav>

        <section className="mt-[74px] grid items-start gap-10 lg:grid-cols-[.99fr_1.01fr]">
          <div>
            <div className="mb-7 inline-flex rounded-full border border-cyan-400/55 bg-cyan-400/[.055] px-6 py-3 text-[15px] font-black uppercase tracking-wide shadow-[0_0_25px_rgba(34,211,238,.14)]">
              <span className="text-lime-300">Calcetto</span>
              <span className="mx-3 text-cyan-400">•</span>
              <span className="text-cyan-300">Padel</span>
              <span className="mx-3 text-fuchsia-400">•</span>
              <span className="text-fuchsia-300">Tennis</span>
            </div>

            <h1 className="max-w-[650px] text-[55px] font-black leading-[1.08] tracking-[-.045em] md:text-[72px]">
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

            <p className="mt-7 max-w-[560px] text-[18.5px] leading-[1.75] text-slate-300">
              Crea il tuo gruppo, organizza le partite, sfida i tuoi amici
              e scala le classifiche. Ogni partita conta.
            </p>

            <div className="mt-10 flex flex-wrap gap-5">
              <button className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-10 py-5 text-lg font-black shadow-[0_0_34px_rgba(168,85,247,.24)] transition hover:scale-105">
                Inizia ora
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15">
                  <ChevronRight className="transition group-hover:translate-x-1" size={22} />
                </span>
              </button>
              <button className="flex items-center gap-4 rounded-2xl border border-white/16 bg-white/[.025] px-8 py-5 text-lg font-black backdrop-blur transition hover:bg-white/[.075]">
                Scopri come funziona
                <PlayCircle size={25} />
              </button>
            </div>

            <div className="mt-12 grid max-w-[520px] grid-cols-3 overflow-hidden rounded-3xl border border-white/10 bg-[#071126]/75 p-2 backdrop-blur">
              <HeroStat icon={<Trophy size={34} />} value="24.7K" label="Partite giocate" color="text-lime-300" />
              <HeroStat icon={<Users size={34} />} value="5.892" label="Giocatori attivi" color="text-fuchsia-400" border />
              <HeroStat icon={<BarChart3 size={34} />} value="92%" label="Attività settimanale" color="text-cyan-300" border />
            </div>
          </div>

          <PhoneMockup />
        </section>

        <section id="features" className="mt-[74px] grid gap-4 md:grid-cols-5">
          <Feature icon={<Users size={44} />} title="Crea il tuo gruppo" text="Invita i tuoi amici e costruisci la tua squadra." color="text-lime-300" />
          <Feature icon={<CalendarDays size={44} />} title="Organizza partite" text="Scegli data, ora e campo. Noi pensiamo al resto." color="text-fuchsia-400" />
          <Feature icon={<BarChart3 size={44} />} title="Statistiche reali" text="Ogni partita, ogni voto, ogni dettaglio conta." color="text-cyan-300" />
          <Feature icon={<Trophy size={44} />} title="Classifiche live" text="Scala la classifica e diventa il numero uno." color="text-orange-400" />
          <Feature icon={<Star size={44} />} title="Badge & XP" text="Gioca, vinci, sali di livello e sblocca badge unici." color="text-yellow-300" />
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
              {ranking.map((r) => (
                <div key={r.name} className="flex items-center justify-between border-b border-white/[.06] py-[15px] last:border-none">
                  <div className="flex items-center gap-4">
                    <div className="w-5 font-black text-cyan-300">{r.n}</div>
                    <div className="w-5 text-center">{r.medal}</div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-cyan-400/20 to-fuchsia-500/20 text-xl">
                      {r.avatar}
                    </div>
                    <div className="font-semibold text-slate-100">{r.name}</div>
                  </div>
                  <div className={`font-black ${r.color}`}>{r.pts}</div>
                </div>
              ))}
            </div>
          </div>

          <div id="sports" className="rounded-[2rem] border border-white/10 bg-[#061126]/78 p-6 shadow-2xl backdrop-blur">
            <h2 className="mb-6 text-2xl font-black">Sport disponibili</h2>
            <div className="grid grid-cols-3 gap-3">
              <Sport title="Calcetto" sub="5v5" emoji="⚽" bg="from-lime-500/20 via-slate-900 to-slate-950" />
              <Sport title="Padel" sub="Doppio" emoji="🎾" bg="from-fuchsia-600/28 via-purple-950/45 to-slate-950" />
              <Sport title="Tennis" sub="Singolare / Doppio" emoji="🏸" bg="from-blue-600/30 via-blue-950/55 to-slate-950" />
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
            <button className="relative mt-9 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-4 font-black shadow-[0_0_26px_rgba(34,211,238,.18)]">
              Unisciti alla Beta
            </button>
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

function LogoMark() {
  return (
    <div className="relative h-[74px] w-[74px]">
      <div className="absolute left-0 top-0 h-[58px] w-[58px] -skew-x-12 rounded-xl bg-white shadow-[0_0_24px_rgba(255,255,255,.32)]" />
      <div className="absolute left-[8px] top-[8px] h-[42px] w-[42px] -skew-x-12 rounded-lg bg-[#071126]" />
      <div className="absolute left-[12px] top-[5px] -skew-x-12 text-[58px] font-black italic leading-none text-white drop-shadow-[0_0_14px_rgba(34,211,238,.75)]">
        R
      </div>
      <div className="absolute bottom-[6px] left-[2px] h-[12px] w-[62px] -rotate-45 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 shadow-[0_0_18px_rgba(168,85,247,.8)]" />
      <div className="absolute bottom-[17px] left-[20px] h-[8px] w-[48px] -rotate-45 rounded-full bg-fuchsia-500 blur-[3px]" />
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

function Feature({ icon, title, text, color }: { icon: React.ReactNode; title: string; text: string; color: string }) {
  return (
    <div className="rounded-[1.65rem] border border-white/10 bg-[#061126]/78 p-7 text-center shadow-2xl backdrop-blur transition hover:-translate-y-1 hover:border-cyan-400/30">
      <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center ${color}`}>{icon}</div>
      <h3 className="text-xl font-black">{title}</h3>
      <p className="mt-4 text-[15px] leading-7 text-slate-300">{text}</p>
    </div>
  );
}

function Sport({ title, sub, emoji, bg }: { title: string; sub: string; emoji: string; bg: string }) {
  return (
    <div className={`relative min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${bg} p-4`}>
      <div className="absolute left-1/2 top-12 -translate-x-1/2 text-[86px] drop-shadow-[0_18px_24px_rgba(0,0,0,.55)]">{emoji}</div>
      <div className="absolute bottom-5 left-4">
        <div className="text-2xl font-black">{title}</div>
        <div className="mt-1 text-sm text-slate-300">{sub}</div>
      </div>
    </div>
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
    <div className="relative mx-auto w-full max-w-[478px] lg:-mt-8 lg:translate-x-2">
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
              <div className="mt-6 text-xl font-black text-lime-300">ON FIRE 🔥</div>
              <div className="mt-7 text-xs text-slate-400">2.350 / 3.000 XP</div>
            </div>
          </div>

          <div className="relative mt-5 overflow-hidden rounded-[1.7rem] border border-blue-400/25 bg-gradient-to-br from-blue-700/30 to-blue-950/80 p-5">
            <div className="absolute right-[-10px] top-0 text-[130px] opacity-10">🏃</div>
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
              <div className="flex items-center gap-2">
                <span className="text-3xl">🦁</span>
                <span className="font-black">Rival Team</span>
              </div>
              <span className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-400">VS</span>
              <div className="flex items-center gap-2">
                <span className="font-black">Black Sharks</span>
                <span className="text-3xl">🦈</span>
              </div>
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
