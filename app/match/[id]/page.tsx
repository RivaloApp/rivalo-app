"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { applyMatchStats } from "../../../lib/rivaloStats";
import { ArrowLeft, CalendarDays, ChevronRight, Clock, MapPin, ShieldCheck, Trophy, Users } from "lucide-react";

type MatchDoc = {
  createdBy?: string;
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
  homeScore?: number | null;
  awayScore?: number | null;
  mvpName?: string;
  notes?: string;
  statsApplied?: boolean;
};

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [match, setMatch] = useState<MatchDoc | null>(null);
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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadMatch();
    });

    return () => unsubscribe();
  }, [matchId]);

  async function loadMatch() {
    setLoading(true);

    try {
      const snap = await getDoc(doc(db, "matches", matchId));

      if (snap.exists()) {
        const data = snap.data() as MatchDoc;
        setMatch(data);
        setHomeTeam(data.homeTeam || "");
        setAwayTeam(data.awayTeam || "");
        setHomeScore(data.homeScore !== undefined && data.homeScore !== null ? String(data.homeScore) : "");
        setAwayScore(data.awayScore !== undefined && data.awayScore !== null ? String(data.awayScore) : "");
        setMvpName(data.mvpName || "");
        setNotes(data.notes || "");
      }
    } finally {
      setLoading(false);
    }
  }

  async function proposeResult(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

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
        resultProposedBy: user.uid,
        resultProposedAt: serverTimestamp(),
      });

      await loadMatch();
      setMessage("Risultato proposto. Ora puoi confermarlo.");
    } catch {
      setMessage("Errore durante il salvataggio del risultato.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmResult() {
    if (!user || !match) return;

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "matches", matchId), {
        confirmedBy: arrayUnion(user.uid),
        status: "ufficiale",
        resultStatus: "confermato",
        fairPlayStatus: "confermato",
        confirmedAt: serverTimestamp(),
      });

      if (!match.statsApplied) {
        const result =
          Number(homeScore) > Number(awayScore)
            ? "win"
            : Number(homeScore) < Number(awayScore)
              ? "loss"
              : "draw";

        await applyMatchStats({
          uid: user.uid,
          result,
          isMvp: mvpName.trim().length > 0,
          goals: 0,
          assists: 0,
        });

        await updateDoc(doc(db, "matches", matchId), {
          statsApplied: true,
          statsAppliedAt: serverTimestamp(),
          statsAppliedBy: user.uid,
        });
      }

      await loadMatch();
      setMessage("Risultato confermato. Statistiche, XP e RivalScore aggiornati.");
    } catch {
      setMessage("Errore durante la conferma.");
    } finally {
      setSaving(false);
    }
  }

  async function disputeResult() {
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "matches", matchId), {
        disputedBy: arrayUnion(user.uid),
        status: "contestato",
        resultStatus: "contestato",
        fairPlayStatus: "contestato",
        disputedAt: serverTimestamp(),
      });

      await loadMatch();
      setMessage("Risultato contestato. Servirà revisione.");
    } catch {
      setMessage("Errore durante la contestazione.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">Caricamento partita...</main>;
  }

  if (!match) {
    return <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">Partita non trovata.</main>;
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link href="/match" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna ai match
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden p-8 md:p-10">
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">{match.sport}</div>
                <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">{match.name}</h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
                  <Info icon={<MapPin size={17} />} text={match.city || "-"} />
                  <Info icon={<CalendarDays size={17} />} text={match.date || "-"} />
                  <Info icon={<Clock size={17} />} text={match.time || "-"} />
                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">{match.mode}</div>
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
                <h2 className="text-2xl font-black">Risultato e FairPlay</h2>
                <p className="mt-1 text-sm text-slate-400">Il risultato diventa ufficiale solo dopo conferma.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Squadra 1">
                  <input required value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} placeholder="Es. Rival Team" className="w-full bg-transparent outline-none placeholder:text-slate-500" />
                </Field>

                <Field label="Squadra 2">
                  <input required value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} placeholder="Es. Black Sharks" className="w-full bg-transparent outline-none placeholder:text-slate-500" />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gol squadra 1">
                  <input required type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)} className="w-full bg-transparent outline-none" />
                </Field>

                <Field label="Gol squadra 2">
                  <input required type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)} className="w-full bg-transparent outline-none" />
                </Field>
              </div>

              <Field label="MVP partita">
                <input value={mvpName} onChange={(e) => setMvpName(e.target.value)} placeholder="Nome MVP" className="w-full bg-transparent outline-none placeholder:text-slate-500" />
              </Field>

              <Field label="Note statistiche">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Gol, assist, note o dettagli partita..." className="min-h-[120px] w-full resize-none bg-transparent outline-none placeholder:text-slate-500" />
              </Field>

              {message && <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200">{message}</div>}

              <button type="submit" disabled={saving} className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60">
                {saving ? "Salvataggio..." : "Proponi risultato"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={confirmResult} disabled={saving} className="rounded-2xl border border-lime-300/30 bg-lime-400/10 px-6 py-4 font-black text-lime-200 disabled:opacity-60">
                  Conferma risultato
                </button>

                <button type="button" onClick={disputeResult} disabled={saving} className="rounded-2xl border border-red-300/30 bg-red-500/10 px-6 py-4 font-black text-red-200 disabled:opacity-60">
                  Contesta
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-5">
            <Panel icon={<ShieldCheck />} title="Sistema anti-fake">Risultato proposto → conferma → match ufficiale → statistiche aggiornate.</Panel>
            <Panel icon={<Users />} title="Conferme">La contestazione mette il match in revisione.</Panel>
            <Panel icon={<Trophy />} title="Ranking">Solo i match confermati aggiornano RivalScore, XP, vittorie e MVP.</Panel>
          </div>
        </section>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">{children}</div>
    </label>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <div className="flex items-center gap-2"><span className="text-cyan-300">{icon}</span>{text}</div>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="max-w-[130px] truncate text-2xl font-black text-cyan-300">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">{label}</div>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
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
