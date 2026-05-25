"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Crown,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

type RivaloGroup = {
  name: string;
  city: string;
  sport: string;
  mode: string;
  privacy: string;
  premiumPlan?: string;
  members?: string[];
};

export default function GroupDetailsPage() {
  const params = useParams();

const groupId =
  typeof params?.id === "string"
    ? params.id
    : Array.isArray(params?.id)
    ? params.id[0]
    : "";

  const [group, setGroup] = useState<RivaloGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    async function loadGroup() {
      try {
        const ref = doc(db, "groups", groupId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();

setGroup({
  name: data.name || "Gruppo Rivalo",
  city: data.city || "Nessuna città",
  sport: data.sport || "Sport",
  mode: data.mode || "Amichevole",
  privacy: data.privacy || "public",
  premiumPlan: data.premiumPlan || "free",
  members: Array.isArray(data.members) ? data.members : [],
});
        }
      } finally {
        setLoading(false);
      }
    }

    if (groupId) {
      loadGroup();
    }
  }, [groupId]);
  useEffect(() => {
  setMounted(true);
}, []);
if (!mounted) {
  return null;
}
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 px-8 py-5 font-black text-cyan-200">
          Caricamento gruppo...
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-8 py-5 font-black text-red-200">
          Gruppo non trovato.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link href="/groups" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna ai gruppi
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden p-8 md:p-10">
            <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                  {group.sport}
                </div>

                <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">
                  {group.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-fuchsia-300" />
                    {group.city}
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {group.mode}
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {group.privacy}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Stat value={String(group.members?.length || 1)} label="Membri" />
                <Stat value="0" label="Partite" />
                <Stat value="0" label="Eventi" />
                <Stat value={group.premiumPlan || "free"} label="Piano" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-4">
          <ActionCard
            icon={<CalendarDays />}
            title="Crea partita"
            text="Organizza match del gruppo."
          />

          <ActionCard
            icon={<Trophy />}
            title="Classifica"
            text="Ranking squadre e singoli."
          />

          <ActionCard
            icon={<ShieldCheck />}
            title="FairPlay"
            text="Conferma risultati ufficiali."
          />

          <ActionCard
            icon={<Users />}
            title="Invita amici"
            text="Espandi la community."
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <Panel
            title="Campionato del gruppo"
            subtitle="Season competitive, premi e ranking."
          >
            <div className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/[.06] p-5">
              <div className="text-sm font-black uppercase tracking-[.22em] text-fuchsia-300">
                Season futura
              </div>

              <h3 className="mt-3 text-3xl font-black">
                Campionato Rivalo
              </h3>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Classifiche live, premi finali, badge, MVP, top scorer,
                tornei e gestione quote evento.
              </p>

              <button className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black">
                Attiva campionato
                <ChevronRight size={20} />
              </button>
            </div>
          </Panel>

          <Panel
            title="Attività gruppo"
            subtitle="Partite, risultati e notifiche."
          >
            <div className="space-y-4">
              <Activity
                title="Nessuna partita ancora"
                text="Crea il primo match del gruppo."
              />

              <Activity
                title="Classifica pronta"
                text="Il ranking inizierà dopo le prime partite."
              />

              <Activity
                title="FairPlay attivo"
                text="Risultati ufficiali solo dopo conferma."
              />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="text-3xl font-black text-cyan-300">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <button className="rounded-[1.8rem] border border-white/10 bg-white/[.04] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/30">
      <div className="text-cyan-300">{icon}</div>

      <h3 className="mt-5 text-2xl font-black">{title}</h3>

      <p className="mt-3 leading-7 text-slate-300">{text}</p>
    </button>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
      <div className="mb-5">
        <h2 className="text-3xl font-black">{title}</h2>
        <p className="mt-2 text-slate-300">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

function Activity({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5">
      <div className="font-black">{title}</div>
      <div className="mt-2 leading-7 text-slate-300">{text}</div>
    </div>
  );
}
