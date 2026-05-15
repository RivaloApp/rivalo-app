"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Crown,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

export default function GroupsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groupName, setGroupName] = useState("");
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [mode, setMode] = useState("amichevole");
  const [privacy, setPrivacy] = useState("privato");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    setSaving(true);
    setMessage("");

    try {
      await addDoc(collection(db, "groups"), {
        name: groupName,
        city,
        sport,
        mode,
        privacy,
        ownerId: user.uid,
        members: [user.uid],
        admins: [user.uid],
        createdAt: serverTimestamp(),
        rankingEnabled: true,
        fairPlayEnabled: true,
        seasonActive: false,
        premiumPlan: "free",
      });

      setGroupName("");
      setCity("");
      setSport("calcetto");
      setMode("amichevole");
      setPrivacy("privato");
      setMessage("Gruppo creato. Ora potrai usarlo per partite, ranking e campionati.");
    } catch {
      setMessage("Errore durante la creazione del gruppo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-6xl px-5 py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">
              Rivalo Groups
            </div>

            <h1 className="mt-3 text-5xl font-black leading-tight md:text-6xl">
              Crea il tuo gruppo competitivo.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
              Il gruppo è la base di Rivalo: da qui partono partite, ranking,
              campionati, eventi, conferme risultati e classifiche singoli/squadre.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <Feature icon={<Trophy />} title="Classifiche" text="Squadre e singoli per ogni gruppo." />
              <Feature icon={<ShieldCheck />} title="FairPlay" text="Risultati ufficiali solo dopo conferma." />
              <Feature icon={<CalendarDays />} title="Campionati" text="Season da 3 mesi con premi." />
              <Feature icon={<Crown />} title="Premium" text="Badge, coppe, eventi e boost futuri." />
            </div>
          </div>

          <form onSubmit={createGroup} className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center gap-3">
              <Users className="text-cyan-300" size={30} />
              <div>
                <h2 className="text-2xl font-black">Nuovo gruppo</h2>
                <p className="mt-1 text-sm text-slate-400">Crea la tua prima community Rivalo.</p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Nome gruppo">
                <input
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Esempio: Solo Serie A"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

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

              <Select label="Privacy gruppo" value={privacy} setValue={setPrivacy}>
                <option value="privato">Privato</option>
                <option value="pubblico">Pubblico</option>
                <option value="su-invito">Solo su invito</option>
              </Select>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {saving ? "Creazione..." : "Crea gruppo Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-[2rem] border border-fuchsia-400/25 bg-fuchsia-500/[.06] p-6">
          <div className="text-sm font-black uppercase tracking-[.28em] text-fuchsia-300">
            Monetizzazione futura
          </div>
          <h2 className="mt-3 text-3xl font-black">Gruppi premium e campionati con premi</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Da qui potremo aggiungere quote evento, coppe, badge premium, tornei sponsorizzati,
            campi affiliati e pacchetti per centri sportivi.
          </p>
        </div>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
      <div className="absolute right-[-250px] top-[130px] h-[650px] w-[650px] rounded-full border border-cyan-400/10" />
      <div className="absolute left-[-150px] bottom-[-140px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl" />
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
