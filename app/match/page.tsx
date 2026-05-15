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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadGroups(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function loadGroups(uid: string) {
    const q = query(collection(db, "groups"), where("members", "array-contains", uid));
    const snap = await getDocs(q);

    const list = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<RivaloGroup, "id">),
    }));

    setGroups(list);

    if (list.length > 0) {
      setGroupId(list[0].id);
      setSport(list[0].sport || "calcetto");
      setCity(list[0].city || "");
    }
  }

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
      setMessage("Partita creata. Ora può essere usata per inviti, conferme e statistiche.");
    } catch {
      setMessage("Errore durante la creazione della partita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">
              Rivalo Match
            </div>

            <h1 className="mt-3 text-5xl font-black leading-tight md:text-6xl">
              Crea una partita ufficiale.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Ogni match parte come programmato. Dopo la partita verranno richiesti risultato,
              conferme e statistiche per aggiornare ranking e RivalScore.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Feature icon={<CalendarDays />} title="Calendario" text="Data e orario del match." />
              <Feature icon={<Users />} title="Partecipanti" text="Slot liberi e inviti futuri." />
              <Feature icon={<ShieldCheck />} title="FairPlay" text="Statistiche solo dopo conferma." />
              <Feature icon={<Trophy />} title="Ranking" text="Ogni match può aggiornare classifiche." />
            </div>
          </div>

          <form onSubmit={createMatch} className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <CalendarDays className="text-cyan-300" size={30} />
              <div>
                <h2 className="text-2xl font-black">Nuova partita</h2>
                <p className="mt-1 text-sm text-slate-400">Crea un match collegato a un gruppo.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Select label="Gruppo" value={groupId} setValue={setGroupId}>
                {groups.length === 0 ? (
                  <option value="">Nessun gruppo disponibile</option>
                ) : (
                  groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))
                )}
              </Select>

              <Field label="Nome partita">
                <input
                  required
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="Esempio: Rival Team vs Black Sharks"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Sport" value={sport} setValue={setSport}>
                  <option value="calcetto">Calcetto</option>
                  <option value="padel">Padel</option>
                  <option value="tennis">Tennis</option>
                </Select>

                <Select label="Modalità" value={mode} setValue={setMode}>
                  <option value="amichevole">Amichevole</option>
                  <option value="campionato">Campionato</option>
                  <option value="torneo">Torneo</option>
                </Select>
              </div>

              <Field label="Città">
                <div className="flex items-center gap-3">
                  <MapPin className="text-cyan-300" size={20} />
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Milano, Lecce, Roma..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </div>
              </Field>

              <Field label="Campo / luogo">
                <input
                  required
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Centro sportivo, campo, indirizzo..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Data">
                  <input
                    required
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>

                <Field label="Ora">
                  <div className="flex items-center gap-3">
                    <Clock className="text-cyan-300" size={20} />
                    <input
                      required
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full bg-transparent outline-none"
                    />
                  </div>
                </Field>

                <Field label="Posti">
                  <input
                    required
                    type="number"
                    min="2"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>
              </div>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !groupId}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {saving ? "Creazione..." : "Crea partita Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
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

function Select({
  label,
  value,
  setValue,
  children,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4 font-bold outline-none"
      >
        {children}
      </select>
    </label>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-white/[.04] p-5 backdrop-blur">
      <div className="text-cyan-300">{icon}</div>
      <h3 className="mt-4 text-xl font-black">{title}</h3>
      <p className="mt-2 leading-7 text-slate-300">{text}</p>
    </div>
  );
}
