"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ArrowLeft, CalendarDays, ChevronRight, Clock, ShieldCheck, Trophy, Users } from "lucide-react";

type GroupDoc = { id: string; name?: string; city?: string; sport?: string };
type MatchDoc = {
  id: string;
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  mode?: string;
  slots?: number;
  status?: string;
};

export default function MatchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [groupId, setGroupId] = useState("");
  const [matchName, setMatchName] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [city, setCity] = useState("");
  const [field, setField] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState("amichevole");
  const [slots, setSlots] = useState("10");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }
      setUser(currentUser);
      await loadData(currentUser.uid);
    });
    return () => unsubscribe();
  }, []);

  async function loadData(uid: string) {
    setLoadingData(true);
    try {
      let loadedGroups: GroupDoc[] = [];

      try {
        const groupsQuery = query(collection(db, "groups"), where("members", "array-contains", uid));
        const groupsSnapshot = await getDocs(groupsQuery);
        loadedGroups = groupsSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GroupDoc, "id">) }));
      } catch {
        loadedGroups = [];
      }

      setGroups(loadedGroups);

      if (loadedGroups.length > 0) {
        setGroupId((current) => current || loadedGroups[0].id);
        setSport((current) => current || loadedGroups[0].sport || "calcetto");
        setCity((current) => current || loadedGroups[0].city || "");
      }

      const matchesQuery = query(collection(db, "matches"), where("createdBy", "==", uid));
      const matchesSnapshot = await getDocs(matchesQuery);
      setMatches(matchesSnapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MatchDoc, "id">) })));
    } catch {
      setMessage("Errore nel caricamento dei match.");
    } finally {
      setLoadingData(false);
    }
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await addDoc(collection(db, "matches"), {
        groupId: groupId || "nessun-gruppo",
        createdBy: user.uid,
        name: matchName,
        sport,
        city,
        field,
        date,
        time,
        mode,
        slots: Number(slots),
        status: "programmata",
        participants: [user.uid],
        resultStatus: "non_inserito",
        fairPlayStatus: "in_attesa",
        homeTeam: "",
        awayTeam: "",
        homeScore: null,
        awayScore: null,
        mvpName: "",
        notes: "",
        confirmedBy: [],
        disputedBy: [],
        statsApplied: false,
        createdAt: serverTimestamp(),
      });

      setMatchName("");
      setField("");
      setDate("");
      setTime("");
      setMessage("Partita creata correttamente.");
      await loadData(user.uid);
    } catch {
      setMessage("Errore durante la creazione della partita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_.95fr]">
          <section className="rounded-[2rem] border border-white/10 bg-[#071126]/75 p-7 shadow-2xl backdrop-blur">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <CalendarDays size={28} />
              </div>
              <div>
                <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">Rivalo Match</div>
                <h1 className="mt-2 text-4xl font-black">Crea una partita</h1>
              </div>
            </div>

            <form onSubmit={createMatch} className="space-y-5">
              <Field label="Gruppo collegato">
                <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="w-full bg-transparent outline-none">
                  <option value="">Nessun gruppo / Beta</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name || "Gruppo senza nome"}</option>
                  ))}
                </select>
              </Field>

              <Field label="Nome partita">
                <input value={matchName} onChange={(e) => setMatchName(e.target.value)} placeholder="Es: Rival Team vs Black Sharks" className="w-full bg-transparent outline-none placeholder:text-slate-500" required />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Sport">
                  <select value={sport} onChange={(e) => setSport(e.target.value)} className="w-full bg-transparent outline-none">
                    <option value="calcetto">Calcetto</option>
                    <option value="padel">Padel</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </Field>

                <Field label="Modalità">
                  <select value={mode} onChange={(e) => setMode(e.target.value)} className="w-full bg-transparent outline-none">
                    <option value="amichevole">Amichevole</option>
                    <option value="campionato">Campionato</option>
                    <option value="torneo">Torneo</option>
                  </select>
                </Field>
              </div>

              <Field label="Città">
                <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Milano, Lecce, Roma..." className="w-full bg-transparent outline-none placeholder:text-slate-500" required />
              </Field>

              <Field label="Campo / luogo">
                <input value={field} onChange={(e) => setField(e.target.value)} placeholder="Centro sportivo, indirizzo..." className="w-full bg-transparent outline-none placeholder:text-slate-500" required />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Data">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent outline-none" required />
                </Field>
                <Field label="Ora">
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full bg-transparent outline-none" required />
                </Field>
                <Field label="Slot">
                  <input type="number" min="2" value={slots} onChange={(e) => setSlots(e.target.value)} className="w-full bg-transparent outline-none" required />
                </Field>
              </div>

              <button type="submit" disabled={saving} className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60">
                {saving ? "Creazione..." : "Crea partita Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              {message && <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">{message}</div>}
            </form>
          </section>

          <section className="space-y-6">
            <InfoCard icon={<Users size={28} />} title="Partecipanti" text="Slot liberi e inviti futuri." />
            <InfoCard icon={<Trophy size={28} />} title="Ranking" text="Ogni match ufficiale aggiorna statistiche e RivalScore." />
            <InfoCard icon={<ShieldCheck size={28} />} title="FairPlay" text="Risultato proposto, confermato o contestato." />
            <InfoCard icon={<Clock size={28} />} title="Post-partita" text="Inserisci risultato e MVP dal dettaglio match." />
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#071126]/75 p-7 shadow-2xl backdrop-blur">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[.28em] text-cyan-300">Match creati</div>
              <h2 className="mt-2 text-3xl font-black">Le tue partite</h2>
            </div>
            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">{matches.length} match</div>
          </div>

          {loadingData ? (
            <EmptyBox text="Caricamento partite..." />
          ) : matches.length === 0 ? (
            <EmptyBox text="Nessuna partita creata. Crea il primo match Rivalo." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {matches.map((match) => <MatchCard key={match.id} match={match} />)}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <div className="rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4">{children}</div>
    </label>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#071126]/75 p-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">{icon}</div>
        <div>
          <div className="text-2xl font-black">{title}</div>
          <div className="mt-1 text-slate-400">{text}</div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchDoc }) {
  return (
    <Link href={`/match/${match.id}`}>
      <div className="rounded-[1.7rem] border border-white/10 bg-[#0b1730] p-5 transition hover:scale-[1.02] hover:border-cyan-400/30 hover:bg-[#112041]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-2xl font-black">{match.name}</div>
            <div className="mt-2 text-slate-400">{match.city}</div>
            <div className="mt-1 text-sm text-slate-500">{match.field}</div>
          </div>
          <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-300">{match.sport}</div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Badge>{match.date || "Data"}</Badge>
          <Badge>{match.time || "Ora"}</Badge>
          <Badge>{match.slots || 0} slot</Badge>
          <Badge>{match.mode}</Badge>
          <div className="rounded-xl bg-lime-400/10 px-3 py-2 font-black text-lime-300">{match.status || "programmata"}</div>
        </div>
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl bg-white/5 px-3 py-2 text-slate-300">{children}</div>;
}

function EmptyBox({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 p-6 text-slate-400">{text}</div>;
}
