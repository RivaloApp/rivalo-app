"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Search,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
      <div className="absolute right-[-250px] top-[130px] h-[650px] w-[650px] rounded-full border border-cyan-400/10" />
    </div>
  );
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
        <ArrowLeft size={17} />
        Torna alla dashboard
      </Link>
      <h1 className="mt-6 text-5xl font-black tracking-tight md:text-6xl">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">{subtitle}</p>
    </header>
  );
}

function Panel({ icon, title, text, button }: { icon: React.ReactNode; title: string; text: string; button: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
      <div className="text-cyan-300">{icon}</div>
      <h2 className="mt-5 text-2xl font-black">{title}</h2>
      <p className="mt-3 leading-7 text-slate-300">{text}</p>
      <button className="mt-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black">
        {button}
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />
      <section className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <PageHeader title="Eventi" subtitle="Tornei, campionati stagionali, premi, countdown e classifiche evento." />
        <div className="grid gap-5 lg:grid-cols-3">
          <Panel icon={<Trophy size={42} />} title="Crea torneo" text="Data, luogo, premio, partecipanti, tabellone e classifica dedicata." button="Nuovo torneo" />
          <Panel icon={<CalendarDays size={42} />} title="Campionato" text="Season da 3 mesi con ranking, premi finali e Hall of Fame." button="Crea season" />
          <Panel icon={<Zap size={42} />} title="Premi" text="Coppe, badge, pizza, quote evento e ricompense FairPlay." button="Gestisci premi" />
        </div>
      </section>
    </main>
  );
}
