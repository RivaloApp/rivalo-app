"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type RivaloMatch = {
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  mode?: string;
  slots?: number;
  status?: string;
  resultStatus?: string;
  fairPlayStatus?: string;
  homeTeam?: string;
  awayTeam?: string;
  homeScore?: number;
  awayScore?: number;
  mvpName?: string;
  notes?: string;
};

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [match, setMatch] = useState<RivaloMatch | null>(null);
  const [loading, setLoading] = useState(true);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [mvpName, setMvpName] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMatch() {
      try {
        const snap = await getDoc(doc(db, "matches", matchId));

        if (snap.exists()) {
          const data = snap.data() as RivaloMatch;
          setMatch(data);

          setHomeTeam(data.homeTeam || "");
          setAwayTeam(data.awayTeam || "");
          setHomeScore(data.homeScore !== undefined ? String(data.homeScore) : "");
          setAwayScore(data.awayScore !== undefined ? String(data.awayScore) : "");
          setMvpName(data.mvpName || "");
          setNotes(data.notes || "");
        }
      } finally {
        setLoading(false);
      }
    }

    if (matchId) {
      loadMatch();
    }
  }, [matchId]);

  async function proposeResult(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "matches", matchId), {
        homeTeam,
        awayTeam,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        mvpName,
        notes,
        status: "in_attesa_conferma",
        resultStatus: "proposto",
        fairPlayStatus: "in_attesa",
        resultProposedAt: serverTimestamp(),
      });

      setMatch((prev) => ({
        ...prev,
        homeTeam,
        awayTeam,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        mvpName,
        notes,
        status: "in_attesa_conferma",
        resultStatus: "proposto",
        fairPlayStatus: "in_attesa",
      }));

      setMessage("Risultato proposto. Ora servirà la conferma dei partecipanti/capitani.");
    } catch {
      setMessage("Errore durante il salvataggio del risultato.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-cyan-300/20 bg-cyan-400/10 px-8 py-5 font-black text-cyan-200">
          Caricamento partita...
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-8 py-5 font-black text-red-200">
          Partita non trovata.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link href="/match" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna ai match
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden p-8 md:p-10">
            <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                  {match.sport}
                </div>

                <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">
                  {match.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
                  <Info icon={<MapPin size={17} />} text={match.city || "-"} />
                  <Info icon={<CalendarDays size={17} />} text={match.date || "-"} />
                  <Info icon={<Clock size={17} />} text={match.time || "-"} />
                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {match.mode}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Stat value={String(match.slots || 0)} label="Slot" />
                <Stat value={match.status || "programmata"} label="Stato" />
                <Stat value={match.resultStatus || "non inserito"} label="Risultato" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <form onSubmit={proposeResult} className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="text-cyan-300" size={30} />
              <div>
                <h2 className="text-2xl font-black">Proponi risultato</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Il risultato non diventa ufficiale finché non viene confermato.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Squadra 1">
                  <input
                    required
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="Es. Rival Team"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                <Field label="Squadra 2">
                  <input
                    required
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="Es. Black Sharks"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gol squadra 1">
                  <input
                    required
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>

                <Field label="Gol squadra 2">
                  <input
                    required
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>
              </div>

              <Field label="MVP partita">
                <input
                  value={mvpName}
                  onChange={(e) => setMvpName(e.target.value)}
                  placeholder="Nome MVP"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <Field label="Note statistiche">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gol, assist, note, contestazioni o dettagli partita..."
                  className="min-h-[120px] w-full resize-none bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {saving ? "Salvataggio..." : "Proponi risultato"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </div>
          </form>

          <div className="space-y-5">
            <Panel icon={<ShieldCheck />} title="Sistema anti-fake">
              Il match segue il flusso deciso: risultato proposto → conferma partecipanti/capitani → match ufficiale → statistiche aggiornate.
            </Panel>

            <Panel icon={<Users />} title="Conferme future">
              Nel prossimo step aggiungiamo pulsanti Conferma / Contesta con reputazione FairPlay.
            </Panel>

            <Panel icon={<Trophy />} title="Ranking">
              Solo i match ufficiali aggiorneranno classifica, RivalScore, MVP e statistiche.
            </Panel>
          </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
        {children}
      </div>
    </label>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-cyan-300">{icon}</span>
      {text}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="max-w-[130px] truncate text-2xl font-black text-cyan-300">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>
        <h3 className="text-2xl font-black">{title}</h3>
      </div>
      <p className="leading-7 text-slate-300">{children}</p>
    </div>
  );
}
