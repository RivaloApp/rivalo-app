"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createActivity } from "../../lib/createActivity";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  Plus,
  Trophy,
  Users,
} from "lucide-react";

type CompetitionFormat = "singolo" | "squadre" | "doppio";

type EventItem = {
  id: string;
  title?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  type?: string;
  competitionFormat?: CompetitionFormat;
  maxPlayers?: number;
  prize?: string;
  status?: string;
  createdBy?: string;
  createdByName?: string;
  participants?: string[];
  teams?: any[];
};

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
      <div className="absolute right-[-250px] top-[130px] h-[650px] w-[650px] rounded-full border border-cyan-400/10" />
    </div>
  );
}

export default function EventsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [type, setType] = useState("torneo");
  const [competitionFormat, setCompetitionFormat] =
    useState<CompetitionFormat>("squadre");
  const [city, setCity] = useState("");
  const [field, setField] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("10");
  const [prize, setPrize] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadEvents();
    });

    return () => unsub();
  }, []);

  function handleSportChange(value: string) {
    setSport(value);

    if (value === "calcetto") {
      setCompetitionFormat("squadre");
      setMaxPlayers("10");
    }

    if (value === "padel") {
      setCompetitionFormat("doppio");
      setMaxPlayers("4");
    }

    if (value === "tennis") {
      setCompetitionFormat("singolo");
      setMaxPlayers("2");
    }
  }

  async function loadEvents() {
    setLoading(true);

    try {
      const q = query(
        collection(db, "events"),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(q);

      setEvents(
        snap.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EventItem, "id">),
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !title.trim()) return;

    setSaving(true);

    try {
      const creatorName = user.displayName || "Rivalo Player";

      await addDoc(collection(db, "events"), {
        title,
        sport,
        type,
        competitionFormat,
        city,
        field,
        date,
        time,
        maxPlayers: Number(maxPlayers || 0),
        prize,
        status: "aperto",

        participants: [user.uid],
        participantsInfo: [
          {
            uid: user.uid,
            name: creatorName,
            photoUrl: user.photoURL || "",
          },
        ],

        teams: [],

        createdBy: user.uid,
        createdByName: creatorName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await createActivity({
        uid: user.uid,
        type: "event",
        text: `Evento creato: ${title}`,
        value: 1,
      });

      setTitle("");
      setCity("");
      setField("");
      setDate("");
      setTime("");
      setPrize("");

      if (sport === "calcetto") {
        setMaxPlayers("10");
        setCompetitionFormat("squadre");
      } else if (sport === "padel") {
        setMaxPlayers("4");
        setCompetitionFormat("doppio");
      } else {
        setMaxPlayers("2");
        setCompetitionFormat("singolo");
      }

      await loadEvents();
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <header className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna alla dashboard
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">
                Rivalo Events
              </div>

              <h1 className="mt-3 text-5xl font-black tracking-tight md:text-6xl">
                Eventi e Tornei
              </h1>

              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
                Crea tornei, sfide e campionati per calcetto, padel e tennis.
                Scegli se giocare singolo, doppio o a squadre.
              </p>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-6 py-4">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Eventi attivi
              </div>

              <div className="mt-1 text-3xl font-black text-cyan-100">
                {events.length}
              </div>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={createEvent}
            className="rounded-[2.5rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                <Plus size={30} />
              </div>

              <div>
                <h2 className="text-3xl font-black">Crea evento</h2>
                <p className="mt-1 text-slate-400">
                  Scegli sport, formato e tipo competizione.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Titolo evento">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Torneo del venerdì, Campionato amici, Sfida padel..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Tipo">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#020617] text-white outline-none"
                  >
                    <option className="bg-[#020617] text-white" value="torneo">
                      Torneo
                    </option>
                    <option className="bg-[#020617] text-white" value="sfida">
                      Sfida
                    </option>
                    <option
                      className="bg-[#020617] text-white"
                      value="campionato"
                    >
                      Campionato
                    </option>
                    <option className="bg-[#020617] text-white" value="evento">
                      Evento libero
                    </option>
                  </select>
                </Field>

                <Field label="Sport">
                  <select
                    value={sport}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full bg-[#020617] text-white outline-none"
                  >
                    <option className="bg-[#020617] text-white" value="calcetto">
                      Calcetto
                    </option>
                    <option className="bg-[#020617] text-white" value="padel">
                      Padel
                    </option>
                    <option className="bg-[#020617] text-white" value="tennis">
                      Tennis
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Formato competizione">
  <select
    value={competitionFormat}
    onChange={(e) =>
      setCompetitionFormat(e.target.value as CompetitionFormat)
    }
    disabled={sport === "calcetto"}
    className="w-full bg-[#020617] text-white outline-none disabled:cursor-not-allowed disabled:opacity-70"
  >
    {sport === "calcetto" ? (
      <option className="bg-[#020617] text-white" value="squadre">
        Squadre
      </option>
    ) : (
      <>
        <option className="bg-[#020617] text-white" value="singolo">
          Singolo
        </option>
        <option className="bg-[#020617] text-white" value="doppio">
          Doppio
        </option>
      </>
    )}
  </select>

  <div className="mt-3 text-xs leading-5 text-slate-400">
    Scegli come si giocherà la competizione. In singolo partecipano i
    player, in doppio o a squadre parteciperanno gruppi di giocatori.
  </div>
</Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Città">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Lecce, Milano, Roma..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                <Field label="Campo / luogo">
                  <input
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    placeholder="Centro sportivo, campo, club..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                {field.trim() && (
                  <div className="overflow-hidden rounded-[1.5rem] border border-cyan-400/20 bg-black/30 sm:col-span-2">
                    <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                      <div>
                        <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                          Mappa campo
                        </div>

                        <div className="mt-1 text-xs text-slate-400">
                          Risultati per: {field} {city}
                        </div>
                      </div>

                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          `${field} ${city}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200"
                      >
                        Apri Maps
                      </a>
                    </div>

                    <iframe
                      title="Mappa campo"
                      src={`https://www.google.com/maps?q=${encodeURIComponent(
                        `${field} ${city}`
                      )}&output=embed`}
                      className="h-[260px] w-full border-0"
                      loading="lazy"
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>

                <Field label="Ora">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>

                <Field label="Posti">
                  <input
                    type="number"
                    min="2"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  />
                </Field>
              </div>

              <Field label="Premio opzionale">
                <input
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  placeholder="Coppa, badge, pizza, premio sponsor..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <button
                type="submit"
                disabled={saving}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black transition hover:scale-[1.01] disabled:opacity-60"
              >
                {saving ? "Creazione..." : "Crea evento"}
                <ChevronRight size={20} />
              </button>
            </div>
          </form>

          <section className="rounded-[2.5rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                  Calendario Rivalo
                </div>

                <h2 className="mt-2 text-3xl font-black">
                  Eventi disponibili
                </h2>
              </div>

              <CalendarDays className="text-cyan-300" />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                Caricamento eventi...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                Nessun evento ancora. Crea il primo evento Rivalo.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function EventCard({ event }: { event: EventItem }) {
  const sportLabel =
    event.sport === "padel"
      ? "Padel"
      : event.sport === "tennis"
      ? "Tennis"
      : "Calcetto";

  const typeLabel =
    event.type === "campionato"
      ? "Campionato"
      : event.type === "sfida"
      ? "Sfida"
      : event.type === "evento"
      ? "Evento"
      : "Torneo";

  const formatLabel =
    event.competitionFormat === "doppio"
      ? "Doppio"
      : event.competitionFormat === "squadre"
      ? "Squadre"
      : "Singolo";

  const participantsCount = event.participants?.length || 0;
  const teamsCount = event.teams?.length || 0;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block rounded-[2rem] border border-white/10 bg-[#071126] p-5 transition hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{typeLabel}</Badge>
            <Badge>{sportLabel}</Badge>
            <Badge>{formatLabel}</Badge>
            <Badge>{event.status || "aperto"}</Badge>
          </div>

          <h3 className="text-2xl font-black uppercase">
            {event.title || "Evento Rivalo"}
          </h3>

          <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <MapPin size={16} />
              {event.city || "Città da definire"}
            </span>

            <span className="inline-flex items-center gap-2">
              <CalendarDays size={16} />
              {event.date || "Data da definire"}{" "}
              {event.time ? `• ${event.time}` : ""}
            </span>

            <span className="inline-flex items-center gap-2">
              <Users size={16} />
              {event.competitionFormat === "squadre"
                ? `${teamsCount} squadre`
                : `${participantsCount}${
                    event.maxPlayers ? ` / ${event.maxPlayers}` : ""
                  } iscritti`}
            </span>
          </div>

          {event.field && (
            <div className="mt-2 text-sm text-slate-300">
              Campo: {event.field}
            </div>
          )}

          {event.prize && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-200">
              <Trophy size={14} />
              {event.prize}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition group-hover:translate-x-1">
          Apri
          <ChevronRight size={18} />
        </div>
      </div>
    </Link>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black uppercase tracking-[0.12em] text-slate-300">
        {label}
      </span>

      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
        {children}
      </div>
    </label>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
      {children}
    </span>
  );
}