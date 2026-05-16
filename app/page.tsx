import RivaloLogo from "../components/RivaloLogo";
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
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
  <RivaloLogo size={82} />

  <div>
    <h1 className="text-5xl font-black">Rivalo</h1>

    <p className="mt-2 text-sm font-black tracking-[.35em] text-cyan-300">
      OWN THE GAME
    </p>
  </div>
</div>

          <div className="flex gap-4">
            <Link
              href="/login"
              className="rounded-2xl border border-white/10 px-6 py-3"
            >
              Accedi
            </Link>

            <Link
              href="/signup"
              className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-3 font-black"
            >
              Prova la Beta
            </Link>
          </div>
        </div>

        <div className="mt-20 grid gap-6 md:grid-cols-5">
          <Feature
            href="/community"
            icon={<Users size={40} />}
            title="Crea il tuo gruppo"
            text="Invita amici e costruisci la tua squadra."
          />

          <Feature
            href="/match"
            icon={<CalendarDays size={40} />}
            title="Organizza partite"
            text="Crea e gestisci match reali."
          />

          <Feature
            href="/dashboard"
            icon={<BarChart3 size={40} />}
            title="Statistiche reali"
            text="XP, RivalScore e progressione vera."
          />

          <Feature
            href="/leaderboard"
            icon={<Trophy size={40} />}
            title="Classifiche live"
            text="Scala il ranking globale Rivalo."
          />

          <Feature
            href="/dashboard"
            icon={<Star size={40} />}
            title="Badge & XP"
            text="Sblocca livelli e badge premium."
          />
        </div>

        <div className="mt-20 grid gap-6 lg:grid-cols-3">
          <Card>
            <Trophy className="text-lime-300" size={38} />
            <h2 className="mt-4 text-2xl font-black">Classifica generale</h2>

            <div className="mt-6 space-y-3">
              {ranking.map((r) => (
                <div
                  key={r.n}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-black text-cyan-300">#{r.n}</div>
                    <div className="font-bold">{r.name}</div>
                  </div>

                  <div className="font-black text-lime-300">{r.pts}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <Sparkles className="text-fuchsia-400" size={38} />
            <h2 className="mt-4 text-2xl font-black">Esperienza Premium</h2>
            <p className="mt-4 leading-8 text-slate-300">
              Glow animati, card premium, ranking competitivo e UI stile game.
            </p>
          </Card>

          <Card>
            <ShieldCheck className="text-cyan-300" size={38} />
            <h2 className="mt-4 text-2xl font-black">Sistema competitivo</h2>
            <p className="mt-4 leading-8 text-slate-300">
              Match reali, conferme risultati, statistiche persistenti e RivalScore.
            </p>
          </Card>
        </div>

        <footer className="mt-20 grid gap-4 text-sm text-slate-400 md:grid-cols-4">
          <FooterItem icon={<ShieldCheck size={22} />} text="Sicuro e protetto" />
          <FooterItem icon={<LockKeyhole size={22} />} text="Dati sempre tuoi" />
          <FooterItem icon={<Sparkles size={22} />} text="Esperienza premium" />
          <FooterItem icon={<RefreshCw size={22} />} text="Sempre aggiornato" />
        </footer>
      </section>
    </main>
  );
}

function Feature({
  icon,
  title,
  text,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[1.7rem] border border-white/10 bg-[#061126]/80 p-7 text-center shadow-2xl backdrop-blur transition duration-300 hover:-translate-y-2 hover:border-cyan-400/40 hover:shadow-[0_0_35px_rgba(34,211,238,.18)]"
    >
      <div className="mb-5 flex justify-center text-cyan-300 transition duration-300 group-hover:scale-110">
        {icon}
      </div>

      <h3 className="text-xl font-black transition group-hover:text-cyan-300">
        {title}
      </h3>

      <p className="mt-4 text-sm leading-7 text-slate-300">{text}</p>

      <div className="mt-5 flex items-center justify-center gap-2 text-sm font-black text-cyan-300 opacity-0 transition duration-300 group-hover:opacity-100">
        Apri
        <ChevronRight size={16} />
      </div>
    </Link>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#061126]/80 p-6 shadow-2xl backdrop-blur">
      {children}
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
      <span className="text-cyan-400">{icon}</span>
      <span>{text}</span>
    </div>
  );
}
