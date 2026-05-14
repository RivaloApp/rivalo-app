import { Trophy, Users, Zap } from "lucide-react";
import { FeatureCard } from "../components/FeatureCard";
import { PlayerCard } from "../components/PlayerCard";
import { SportCard } from "../components/SportCard";
import { dictionary } from "../lib/i18n";

export default function Home() {
  const t = dictionary.it;

  return (
    <main className="min-h-screen px-4 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <nav className="mb-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-red-500 text-2xl font-black shadow-xl">
              R
            </div>
            <div>
              <div className="text-2xl font-black tracking-tight">Rivalo</div>
              <div className="text-xs font-semibold text-slate-400">Sports rivalry platform</div>
            </div>
          </div>
          <button className="rounded-2xl border border-white/10 bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15">
            Beta Preview
          </button>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 text-sm font-bold text-sky-200">
              Calcetto • Padel • Tennis
            </div>
            <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight md:text-7xl">
              {t.heroTitle}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              {t.heroSubtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <button className="rounded-2xl bg-gradient-to-r from-sky-400 to-cyan-300 px-6 py-4 font-black text-slate-950 shadow-2xl transition hover:-translate-y-1">
                {t.start}
              </button>
              <button className="rounded-2xl border border-white/10 bg-white/10 px-6 py-4 font-black transition hover:-translate-y-1 hover:bg-white/15">
                {t.demo}
              </button>
            </div>

            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black text-sky-300">3</div>
                <div className="text-xs text-slate-400">sport iniziali</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black text-sky-300">Live</div>
                <div className="text-xs text-slate-400">ranking realtime</div>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-2xl font-black text-sky-300">XP</div>
                <div className="text-xs text-slate-400">badge e livelli</div>
              </div>
            </div>
          </div>

          <PlayerCard name="Antonio" role="Founder Player" score={87} badge="🔥" />
        </div>

        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-black">{t.sports}</h2>
          <div className="grid gap-5 md:grid-cols-3">
            <SportCard icon="⚽" title="Calcetto" description="Gol, assist, portieri, formazioni, MVP e ranking tra amici." />
            <SportCard icon="🎾" title="Padel" description="Coppie, chemistry, win rate, sfide e tornei di gruppo." />
            <SportCard icon="🏸" title="Tennis" description="Testa a testa, set, ranking, streak e storico partite." />
          </div>
        </section>

        <section className="mt-20">
          <h2 className="mb-6 text-3xl font-black">{t.features}</h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard tag="Social" title="Invita amici" description="Crea gruppi privati e invita amici con link o codice gruppo." />
            <FeatureCard tag="Match" title="Lancia una sfida" description="Invia richieste partita, scegli data, ora, luogo e partecipanti." />
            <FeatureCard tag="Calendar" title="Calendario partite" description="Conferma presenze e organizza match senza confusione." />
            <FeatureCard tag="Ranking" title="RivalScore" description="Punteggio dinamico basato su vittorie, MVP, streak e difficoltà." />
            <FeatureCard tag="Gaming" title="Card giocatore" description="Carte originali Rivalo con overall, badge, ruoli e statistiche." />
            <FeatureCard tag="Community" title="Chat gruppo" description="Chat leggere per gruppi, sfide e partite senza sostituire WhatsApp." />
          </div>
        </section>

        <section className="mt-20 rounded-[2rem] border border-white/10 bg-white/[0.04] p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex gap-4">
              <Trophy className="h-8 w-8 text-sky-300" />
              <div>
                <h3 className="font-black">Seasons</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Stagioni mensili con premi e reset ranking.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Users className="h-8 w-8 text-sky-300" />
              <div>
                <h3 className="font-black">Chemistry</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Scopri con chi vinci di più nel tuo gruppo.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <Zap className="h-8 w-8 text-sky-300" />
              <div>
                <h3 className="font-black">On Fire</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">Badge dinamici per giocatori in striscia positiva.</p>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
