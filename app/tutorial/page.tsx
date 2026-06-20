"use client";

import Link from "next/link";
import RivaloLogo from "../../components/RivaloLogo";
import {
  ArrowLeft,
  CalendarDays,
  CircleDot,
  Globe2,
  MessageCircle,
  PlayCircle,
  Share2,
  ShieldCheck,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";

const STEPS = [
  {
    title: "Completa il profilo",
    text: "Imposta nome, nickname, sport, ruolo, città e foto. La tua card Rivalo userà questi dati per mostrarti in modo professionale.",
    icon: <UserRound />,
  },
  {
    title: "Cerca match o gruppi",
    text: "Usa il matchmaking per trovare gruppi, giocatori, avversari o partite compatibili con sport, zona e livello.",
    icon: <Users />,
  },
  {
    title: "Crea o partecipa a un match",
    text: "Organizza una partita, assegna squadre e partecipanti, poi conferma risultato e statistiche quando il match è concluso.",
    icon: <CircleDot />,
  },
  {
    title: "Gestisci eventi e tornei",
    text: "Crea eventi, squadre, calendari e tabelloni. Rivalo tiene insieme partecipanti, match, classifiche e risultati.",
    icon: <CalendarDays />,
  },
  {
    title: "Scala il ranking",
    text: "I match confermati fanno crescere RivalScore, vittorie, MVP, streak e statistiche specifiche per il tuo sport.",
    icon: <Trophy />,
  },
  {
    title: "Condividi il profilo",
    text: "Condividi profilo, card e match per far conoscere Rivalo e rendere ogni sfida più competitiva.",
    icon: <Share2 />,
  },
];

const VIDEO_POINTS = [
  "Creare e completare il profilo sportivo",
  "Trovare gruppi, player e avversari",
  "Creare un match e gestire le squadre",
  "Confermare risultato, FairPlay e statistiche",
  "Condividere card profilo e risultato match",
];

const SPORT_RULES = [
  {
    title: "Calcetto",
    text: "Gestisce ruoli, formazioni, gol, assist, MVP e statistiche dedicate ai portieri.",
    icon: <ShieldCheck />,
  },
  {
    title: "Padel",
    text: "Usa logiche separate per set, coppie, vittorie, streak e continuità.",
    icon: <CircleDot />,
  },
  {
    title: "Tennis",
    text: "Mantiene ranking e statistiche separate, senza mischiare i dati con gli altri sport.",
    icon: <Globe2 />,
  },
];

export default function TutorialPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-4 py-7 text-white sm:px-6 sm:py-10">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_52%,#020617_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/dashboard" className="block w-fit">
            <RivaloLogo />
          </Link>

          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 text-sm font-black text-cyan-200 transition hover:bg-white/[.08]"
          >
            <ArrowLeft size={18} />
            Torna alla dashboard
          </Link>
        </div>

        <div className="mt-10 overflow-hidden rounded-[2.4rem] border border-cyan-300/15 bg-white/[.035] shadow-[0_0_45px_rgba(34,211,238,.08)]">
          <div className="relative px-5 py-9 sm:px-9 sm:py-12">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_0%,rgba(34,211,238,.20),transparent_32%),radial-gradient(circle_at_82%_0%,rgba(217,70,239,.16),transparent_34%)]" />

            <div className="relative max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                <PlayCircle size={16} />
                Tutorial Rivalo
              </div>

              <h1 className="mt-5 text-4xl font-black uppercase leading-none tracking-tight sm:text-6xl">
                Impara a usare Rivalo
              </h1>

              <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-300 sm:text-lg">
                Una guida rapida per capire profilo, match, gruppi, eventi, ranking e condivisione. Questa pagina sarà la base anche per il futuro video tutorial.
              </p>
            </div>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-[2.4rem] border border-fuchsia-300/15 bg-[#071126]/80 shadow-[0_0_45px_rgba(217,70,239,.08)]">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_.85fr]">
            <div className="relative min-h-[300px] overflow-hidden border-b border-white/10 bg-black/25 p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(34,211,238,.22),transparent_32%),radial-gradient(circle_at_78%_28%,rgba(217,70,239,.18),transparent_34%)]" />

              <div className="relative flex min-h-[260px] items-center justify-center rounded-[2rem] border border-cyan-300/20 bg-[#020617]/80 p-5 shadow-[inset_0_0_40px_rgba(34,211,238,.08)]">
                <div className="absolute left-5 top-5 rounded-full border border-lime-300/25 bg-lime-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-lime-200">
                  In arrivo
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 shadow-[0_0_35px_rgba(34,211,238,.18)]">
                    <PlayCircle size={48} />
                  </div>

                  <div className="mt-5 text-2xl font-black uppercase tracking-tight sm:text-3xl">
                    Video tutorial Rivalo
                  </div>

                  <p className="mx-auto mt-3 max-w-md text-sm font-bold leading-6 text-slate-300">
                    Qui verrà inserito il video ufficiale per mostrare l’app in modo veloce, chiaro e condivisibile.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">
                Video dimostrativo
              </div>

              <h2 className="mt-2 text-3xl font-black uppercase leading-tight">
                Cosa mostrerà
              </h2>

              <div className="mt-5 space-y-3">
                {VIDEO_POINTS.map((point, index) => (
                  <div
                    key={point}
                    className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-4"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 text-xs font-black text-cyan-200">
                      {index + 1}
                    </div>

                    <div className="text-sm font-bold leading-6 text-slate-200">
                      {point}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled
                className="mt-6 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-4 text-sm font-black uppercase text-white/45 sm:w-auto"
              >
                <PlayCircle size={18} />
                Guarda tutorial · in arrivo
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Percorso rapido
              </div>

              <h2 className="mt-2 text-3xl font-black uppercase tracking-tight">
                Da nuovo utente a player Rivalo
              </h2>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {STEPS.map((step, index) => (
              <TutorialCard
                key={step.title}
                index={index + 1}
                title={step.title}
                text={step.text}
                icon={step.icon}
              />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] border border-white/10 bg-[#071126]/75 p-5 shadow-2xl sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
              <Globe2 size={22} />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
                Sport separati
              </div>

              <h2 className="mt-1 text-2xl font-black uppercase">
                Ogni sport ha la sua logica
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {SPORT_RULES.map((rule) => (
              <div
                key={rule.title}
                className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 [&>svg]:h-5 [&>svg]:w-5">
                  {rule.icon}
                </div>

                <div className="mt-4 text-lg font-black uppercase">
                  {rule.title}
                </div>

                <p className="mt-2 text-sm font-medium leading-6 text-slate-300">
                  {rule.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-lime-300/15 bg-lime-400/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-lime-200">
              Consiglio
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase">
              Conferma solo risultati reali
            </h2>

            <p className="mt-3 text-sm font-bold leading-6 text-lime-50/90">
              Rivalo diventa interessante quando risultati, statistiche e ranking sono affidabili. Usa match confermati, FairPlay e ruoli corretti per mantenere la competizione pulita.
            </p>
          </div>

          <div className="rounded-[2rem] border border-fuchsia-300/15 bg-fuchsia-400/10 p-6">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-fuchsia-200">
              Prossimamente
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase">
              Video tutorial
            </h2>

            <p className="mt-3 text-sm font-bold leading-6 text-fuchsia-50/90">
              Questa sezione potrà ospitare un video dimostrativo riutilizzabile anche per contenuti social e sponsorizzate.
            </p>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-4 text-sm font-black uppercase text-white transition hover:scale-[1.02]"
          >
            Completa il profilo
          </Link>

          <Link
            href="/opponents"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-6 py-4 text-sm font-black uppercase text-cyan-100 transition hover:bg-cyan-400/20"
          >
            <MessageCircle size={18} />
            Vai al matchmaking
          </Link>
        </div>
      </section>
    </main>
  );
}

function TutorialCard({
  index,
  title,
  text,
  icon,
}: {
  index: number;
  title: string;
  text: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="group min-w-0 rounded-[1.7rem] border border-white/10 bg-[#071126]/80 p-5 transition hover:-translate-y-1 hover:border-cyan-300/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200 [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>

        <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-black text-white/70">
          {String(index).padStart(2, "0")}
        </div>
      </div>

      <h3 className="mt-5 text-xl font-black uppercase leading-tight">
        {title}
      </h3>

      <p className="mt-3 text-sm font-medium leading-6 text-slate-300">
        {text}
      </p>
    </div>
  );
}
