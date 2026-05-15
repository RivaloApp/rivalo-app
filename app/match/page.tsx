"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";

import { auth, db } from "../../lib/firebase";

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

type RivaloGroup = {
  id: string;
  name: string;
  city: string;
  sport: string;
};

export default function MatchPage() {
  const [user, setUser] = useState<User | null>(null);

  const [groups, setGroups] = useState<RivaloGroup[]>([]);
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
  const [message, setMessage] = useState("");
const [matches, setMatches] = useState<any[]>([]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const q = query(
        collection(db, "groups"),
        where("members", "array-contains", currentUser.uid)
      );

      const snapshot = await getDocs(q);

      const loadedGroups: RivaloGroup[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<RivaloGroup, "id">),
      }));

      setGroups(loadedGroups);
      const matchQuery = query(
  collection(db, "matches"),
  where("createdBy", "==", currentUser.uid)
);

const matchSnapshot = await getDocs(matchQuery);

const loadedMatches = matchSnapshot.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

setMatches(loadedMatches);
    });

    return () => unsubscribe();
  }, []);

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await addDoc(collection(db, "matches"), {
        groupId,
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
        createdAt: serverTimestamp(),
      });

      setMatchName("");
      setField("");
      setDate("");
      setTime("");
      setMode("amichevole");
      setSlots("10");

      setMessage(
        "Partita creata. Ora può essere usata per inviti, conferme e statistiche."
      );
    } catch {
      setMessage("Errore durante la creazione della partita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">
              Rivalo Match System
            </div>

            <h1 className="mt-3 text-5xl font-black">
              Nuova Partita
            </h1>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={18} />
            Dashboard
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[2rem] border border-white/10 bg-[#071126]/70 p-7 backdrop-blur">
            <div className="mb-7 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
                <CalendarDays size={28} />
              </div>

              <div>
                <div className="text-3xl font-black">
                  Crea un Match
                </div>

                <div className="mt-1 text-slate-400">
                  Organizza partite competitive o amichevoli.
                </div>
              </div>
            </div>

            <form onSubmit={createMatch} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Gruppo collegato
                </label>

                <select
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  required
                >
                  <option value="">
                    Seleziona un gruppo
                  </option>

                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Nome partita
                </label>

                <input
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="Es: Rival Team vs Black Sharks"
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Sport
                  </label>

                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  >
                    <option value="calcetto">Calcetto</option>
                    <option value="padel">Padel</option>
                    <option value="tennis">Tennis</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Modalità
                  </label>

                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  >
                    <option value="amichevole">Amichevole</option>
                    <option value="campionato">Campionato</option>
                    <option value="torneo">Torneo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Città
                </label>

                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Milano, Lecce, Roma..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-300">
                  Campo / Luogo
                </label>

                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Centro sportivo, indirizzo..."
                  className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                  required
                />
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Data
                  </label>

                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Ora
                  </label>

                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-300">
                    Slot partecipanti
                  </label>

                  <input
                    type="number"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4 outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !groupId}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {saving ? "Creazione..." : "Crea partita Rivalo"}

                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-200">
                  {message}
                </div>
              )}
            </form>
          </div>
<div className="rounded-[2rem] border border-white/10 bg-[#071126]/70 p-7 backdrop-blur">
  <div className="mb-6 flex items-center justify-between">
    <div>
      <div className="text-sm uppercase tracking-[0.25em] text-cyan-300">
        Match creati
      </div>

      <h2 className="mt-2 text-3xl font-black">
        Le tue partite
      </h2>
    </div>

    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-bold text-cyan-300">
      {matches.length} match
    </div>
  </div>

  <div className="space-y-4">
    {matches.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-slate-400">
        Nessuna partita creata.
      </div>
    ) : (
      matches.map((match) => (
        <div
          key={match.id}
          className="rounded-2xl border border-white/10 bg-[#0b1730] p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-2xl font-black">
                {match.name}
              </div>

              <div className="mt-2 text-slate-400">
                {match.city}
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {match.field}
              </div>
            </div>

            <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-bold text-cyan-300">
              {match.sport}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            <div className="rounded-xl bg-white/5 px-3 py-2">
              📅 {match.date}
            </div>

            <div className="rounded-xl bg-white/5 px-3 py-2">
              ⏰ {match.time}
            </div>

            <div className="rounded-xl bg-white/5 px-3 py-2">
              👥 {match.slots} slot
            </div>

            <div className="rounded-xl bg-lime-400/10 px-3 py-2 text-lime-300">
              {match.status}
            </div>
          </div>
        </div>
      ))
    )}
  </div>
</div>
          <div className="space-y-6">
            <InfoCard
              icon={<Users size={28} />}
              title="Partecipanti"
              text="Slot liberi e inviti futuri."
            />

            <InfoCard
              icon={<Trophy size={28} />}
              title="Ranking"
              text="Ogni match può aggiornare classifiche."
            />

            <InfoCard
              icon={<ShieldCheck size={28} />}
              title="Fair Play"
              text="Conferma risultati e validazione gruppo."
            />

            <InfoCard
              icon={<Clock size={28} />}
              title="Evento in scadenza"
              text="Ultimi 3 giorni per salire."
            />

            <InfoCard
              icon={<MapPin size={28} />}
              title="Sistema location"
              text="Campi e centri sportivi collegabili."
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#071126]/70 p-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <div>
          <div className="text-2xl font-black">
            {title}
          </div>

          <div className="mt-1 text-slate-400">
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}
