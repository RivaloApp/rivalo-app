import {
  BarChart3,
  CalendarDays,
  ChevronRight,
  Lock,
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
    ["1", "The Warriors", "2.450 pt", "👑"],
    ["2", "Rival Team", "2.210 pt", "⚡"],
    ["3", "Black Sharks", "1.980 pt", "🔥"],
    ["4", "I Magnifici", "1.760 pt", "🎯"],
    ["5", "Dream Team", "1.520 pt", "⭐"],
  ];

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-white">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.20),transparent_32%),radial-gradient(circle_at_top_right,rgba(168,85,247,.18),transparent_34%),radial-gradient(circle_at_bottom,rgba(37,99,235,.18),transparent_38%)]" />
      </div>

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-blue-500 to-fuchsia-600 shadow-2xl">
              <div className="absolute inset-[3px] rounded-2xl bg-[#061126]" />
              <div className="relative text-4xl font-black italic text-white">
                R
              </div>
            </div>

            <div>
              <div className="text-3xl font-black">Rivalo</div>
              <div className="text-xs font-black tracking-[.3em] text-cyan-300">
                OWN THE GAME
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-300">
            <a href="#">Home</a>
            <a href="#">Funzionalità</a>
            <a href="#">Classifiche</a>
            <a href="#">Sport</a>
          </div>

          <div className="flex gap-3">
            <button className="hidden sm:block rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 font-bold">
              Accedi
            </button>

            <button className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black">
              Prova la Beta
            </button>
          </div>
        </nav>

        <div className="mt-20 grid gap-14 lg:grid-cols-[1.05fr_.95fr] items-center">
          <div>
            <div className="mb-8 inline-flex rounded-full border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200">
              Calcetto
              <span className="mx-3 text-slate-500">•</span>
              Padel
              <span className="mx-3 text-slate-500">•</span>
              Tennis
            </div>

            <h1 className="text-5xl md:text-7xl font-black leading-[1.03] tracking-tight">
              Competizione.
              <br />
              Statistiche.
              <br />
              Rivalità.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-fuchsia-500 bg-clip-text text-transparent">
                Tutto in un’unica app.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300">
              Crea il tuo gruppo, organizza le partite, sfida i tuoi
              amici e scala le classifiche. Ogni partita conta.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <button className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-8 py-4 font-black">
                Inizia ora
                <ChevronRight className="group-hover:translate-x-1 transition" />
              </button>

              <button className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-8 py-4 font-black">
                Scopri come funziona
                <PlayCircle size={22} />
              </button>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-3">
              <Stat
                icon={<Trophy />}
                value="24.7K"
                label="Partite giocate"
              />

              <Stat
                icon={<Users />}
                value="5.892"
                label="Giocatori attivi"
              />

              <Stat
                icon={<BarChart3 />}
                value="92%"
                label="Attività settimanale"
              />
            </div>
          </div>

          <PhoneMockup />
        </div>

        <section className="mt-20 grid gap-5 md:grid-cols-5">
          <Feature
            icon={<Users />}
            title="Crea il tuo gruppo"
            text="Invita i tuoi amici e costruisci la tua squadra."
          />

          <Feature
            icon={<CalendarDays />}
            title="Organizza partite"
            text="Scegli data, ora e campo."
          />

          <Feature
            icon={<BarChart3 />}
            title="Statistiche reali"
            text="Ogni partita e ogni voto conta."
          />

          <Feature
            icon={<Trophy />}
            title="Classifiche live"
            text="Scala la classifica e domina."
          />

          <Feature
            icon={<Star />}
            title="Badge & XP"
            text="Sblocca livelli e premi."
          />
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-[1fr_1fr_.75fr]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 backdrop-blur">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-black">
                Classifica generale
              </h2>

              <button className="rounded-xl border border-white/10 px-4 py-2 text-sm font-bold text-slate-300">
                Vedi tutte
              </button>
            </div>

            <div className="space-y-4">
              {ranking.map(([pos, name, pts, icon]) => (
                <div
                  key={name}
                  className="flex items-center justify-between rounded-2xl bg-white/[.03] p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-7 text-center font-black text-cyan-300">
                      {pos}
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/30 to-fuchsia-500/30">
                      {icon}
                    </div>

                    <div className="font-bold">{name}</div>
                  </div>

                  <div className="font-black text-lime-300">
                    {pts}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 backdrop-blur">
            <h2 className="mb-6 text-2xl font-black">
              Sport disponibili
            </h2>

            <div className="grid grid-cols-3 gap-3">
              <Sport title="Calcetto" sub="5v5" emoji="⚽" />
              <Sport title="Padel" sub="Doppio" emoji="🎾" />
              <Sport title="Tennis" sub="Singolo" emoji="🏸" />
            </div>
          </div>

          <div className="rounded-[2rem] border border-fuchsia-400/40 bg-gradient-to-br from-white/[.05] to-fuchsia-500/10 p-7">
            <div className="text-3xl font-black leading-tight">
              La tua rivalità.
              <br />
              La tua storia.
              <br />
              Lascia il segno.
            </div>

            <p className="mt-6 leading-7 text-slate-300">
              Ogni partita è un passo verso la leggenda.
            </p>

            <button className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black">
              Unisciti alla Beta
            </button>
          </div>
        </section>

        <footer className="mt-16 grid gap-6 pb-10 text-sm font-semibold text-slate-400 md:grid-cols-4">
          <FooterItem
            icon={<ShieldCheck />}
            text="Sicuro e protetto"
          />

          <FooterItem
            icon={<Lock />}
            text="Dati sempre tuoi"
          />

          <FooterItem
            icon={<Sparkles />}
            text="Nato per competere"
          />

          <FooterItem
            icon={<RefreshCw />}
            text="Sempre in evoluzione"
          />
        </footer>
      </section>
    </main>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[.04] p-6">
      <div className="mb-3 text-lime-300">{icon}</div>

      <div className="text-3xl font-black text-lime-300">
        {value}
      </div>

      <div className="mt-2 text-sm text-slate-300">
        {label}
      </div>
    </div>
  );
}

function Feature({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 text-center">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
        {icon}
      </div>

      <h3 className="text-xl font-black">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-300">
        {text}
      </p>
    </div>
  );
}

function Sport({
  title,
  sub,
  emoji,
}: {
  title: string;
  sub: string;
  emoji: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-5">
      <div className="text-5xl">{emoji}</div>

      <div className="mt-10 text-xl font-black">
        {title}
      </div>

      <div className="text-sm text-slate-400">{sub}</div>
    </div>
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
      <span className="text-cyan-300">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[430px]">
      <div className="absolute inset-0 rounded-[3.2rem] bg-cyan-400/20 blur-3xl" />

      <div className="relative rotate-3 rounded-[3.2rem] border border-white/20 bg-black p-3 shadow-2xl">
        <div className="rounded-[2.8rem] border border-white/10 bg-[#050b1f] p-5">
          <div className="mb-6 flex items-center justify-between text-sm font-bold">
            <span>9:41</span>
            <span>▮▮▮ ▰</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
              <div className="text-sm text-slate-300">
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
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[.04] p-4">
              <div className="text-sm text-slate-300">
                Stato attuale
              </div>

              <div className="mt-5 text-xl font-black text-lime-300">
                ON FIRE 🔥
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] border border-blue-400/20 bg-gradient-to-br from-blue-600/25 to-cyan-400/10 p-5">
            <div className="text-sm text-slate-300">
              La tua card
            </div>

            <div className="mt-2 text-3xl font-black">
              Antonio
            </div>

            <div className="text-sm text-slate-400">
              Fondatore • Playmaker
            </div>
          </div>

          <div className="mt-5 rounded-[2rem] bg-white/[.04] p-5">
            <div className="text-sm font-bold text-slate-300">
              Prossima partita
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="font-black">Rival Team</span>
              <span className="text-slate-400">VS</span>
              <span className="font-black">Black Sharks</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
