"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createActivity } from "../../lib/createActivity";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
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
  activeSport?: string;
  creatorSport?: string;
  sportProfileId?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  type?: string;
  competitionFormat?: CompetitionFormat;
  maxPlayers?: number;
  prize?: string;
  status?: string;
  visibility?: string;
  isPublic?: boolean;
  createdBy?: string;
  createdByName?: string;
  participants?: string[];
  teams?: any[];
};

type UserProfile = {
  activeSport?: string;
  mainSport?: string;
  sport?: string;
  city?: string;
  cityZone?: string;
  zone?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

const TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

function normalizeText(value?: string) {
  return (value || "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

type Sport = "calcetto" | "padel" | "tennis";

function normalizeSport(value?: string): Sport {
  const sport = normalizeText(value || "calcetto");

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function sportLabel(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "Padel";
  if (sport === "tennis") return "Tennis";
  return "Calcetto";
}

function isRacketSport(value?: string) {
  const sport = normalizeSport(value);

  return sport === "padel" || sport === "tennis";
}

function getEventCopy(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") {
    return {
      title: "Eventi e Tornei Padel",
      createText: "Crea tornei, sfide e campionati padel senza usare gol o assist.",
      formatHelp: "Padel: singolo o doppio. In doppio parteciperanno coppie da 2 giocatori.",
      participantsLabel: "coppie/player",
      scoreMode: "racket",
    };
  }

  if (sport === "tennis") {
    return {
      title: "Eventi e Tornei Tennis",
      createText: "Crea tornei, sfide e campionati tennis senza usare gol o assist.",
      formatHelp: "Tennis: singolo o doppio. In singolo parteciperanno player individuali.",
      participantsLabel: "player/coppie",
      scoreMode: "racket",
    };
  }

  return {
    title: "Eventi e Tornei",
    createText: "Crea tornei, campionati e sfide calcetto con squadre, gol, assist e MVP.",
    formatHelp: "Calcetto: formato squadre con classifica, gol, assist e MVP.",
    participantsLabel: "squadre/iscritti",
    scoreMode: "football",
  };
}

function isPublicEvent(event: EventItem) {
  const visibility = normalizeText(event.visibility);

  return (
    event.isPublic === true ||
    visibility === "public" ||
    visibility === "pubblico" ||
    visibility === "aperto"
  );
}

function isSameSport(event: EventItem, userSport: string) {
  return normalizeSport(event.activeSport || event.sport) === normalizeSport(userSport);
}

function isCancelledEvent(event: EventItem) {
  return event.status === "annullato";
}

function isProfileDeletionRequested(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function getAccountLockedMessage() {
  return "Profilo non attivo: puoi consultare gli eventi, ma non puoi crearne di nuovi.";
}

function isSameCityOrCompatible(event: EventItem, userCity: string) {
  const normalizedUserCity = normalizeText(userCity);
  const normalizedEventCity = normalizeText(event.city);

  if (!normalizedUserCity || !normalizedEventCity) {
    return true;
  }

  return normalizedEventCity === normalizedUserCity;
}

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
  const [userSport, setUserSport] = useState("calcetto");
  const [userCity, setUserCity] = useState("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [message, setMessage] = useState("");

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

      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnap.exists()
        ? (profileSnap.data() as UserProfile)
        : null;

      const currentUserSport = normalizeSport(
        profile?.activeSport || profile?.mainSport || profile?.sport || "calcetto"
      );

      const currentUserCity =
        profile?.city || profile?.cityZone || profile?.zone || "";

      setUserSport(currentUserSport);
      setUserCity(currentUserCity);
      setAccountLocked(isProfileDeletionRequested(profile));
      handleSportChange(currentUserSport);
      setCity(currentUserCity);

      await loadEvents(currentUser.uid, currentUserSport, currentUserCity);
    });

    return () => unsub();
  }, []);

  function handleSportChange(value: string) {
    const nextSport = normalizeSport(value);

    setSport(nextSport);

    if (nextSport === "calcetto") {
      setCompetitionFormat("squadre");
      setMaxPlayers("10");
    }

    if (nextSport === "padel") {
      setCompetitionFormat("doppio");
      setMaxPlayers("4");
    }

    if (nextSport === "tennis") {
      setCompetitionFormat("singolo");
      setMaxPlayers("2");
    }
  }

  function handleCompetitionFormatChange(value: CompetitionFormat) {
    setCompetitionFormat(value);

    if (sport === "padel" || sport === "tennis") {
      setMaxPlayers(value === "doppio" ? "4" : "2");
    }
  }

  async function loadEvents(currentUserId: string, currentUserSport: string, currentUserCity: string) {
    setLoading(true);

    try {
      const createdEventsQuery = query(
        collection(db, "events"),
        where("createdBy", "==", currentUserId)
      );

      const participantEventsQuery = query(
        collection(db, "events"),
        where("participants", "array-contains", currentUserId)
      );

      const publicEventsQuery = query(
        collection(db, "events"),
        where("isPublic", "==", true)
      );

      const [createdSnap, participantSnap, publicSnap] = await Promise.all([
        getDocs(createdEventsQuery),
        getDocs(participantEventsQuery),
        getDocs(publicEventsQuery),
      ]);

      const eventsMap = new Map<string, EventItem>();

      [...createdSnap.docs, ...participantSnap.docs, ...publicSnap.docs].forEach(
        (docSnap) => {
          eventsMap.set(docSnap.id, {
            id: docSnap.id,
            ...(docSnap.data() as Omit<EventItem, "id">),
          });
        }
      );

      const filteredEvents = Array.from(eventsMap.values())
        .filter((event) => {
          const isMine = event.createdBy === currentUserId;
          const isParticipant = event.participants?.includes(currentUserId);
          const canDiscover = isPublicEvent(event);

          if (!isMine && !isParticipant && !canDiscover) {
            return false;
          }

          if (!isSameSport(event, currentUserSport)) {
            return false;
          }

          if (isMine || isParticipant) {
            return true;
          }

          return isSameCityOrCompatible(event, currentUserCity);
        })
        .sort((a, b) => {
          const dateA = `${a.date || ""} ${a.time || ""}`;
          const dateB = `${b.date || ""} ${b.time || ""}`;

          return dateB.localeCompare(dateA);
        });

      setEvents(filteredEvents);
    } finally {
      setLoading(false);
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !title.trim()) return;

    if (accountLocked) {
      setMessage(getAccountLockedMessage());
      return;
    }

    const lockedSport = normalizeSport(userSport);

    if (sport !== lockedSport) {
      handleSportChange(lockedSport);
    }

    const safeCompetitionFormat =
      lockedSport === "calcetto" ? "squadre" : competitionFormat;

    setSaving(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage(getAccountLockedMessage());
        setSaving(false);
        return;
      }

      const freshProfileSport = normalizeSport(
        freshProfile?.activeSport ||
          freshProfile?.mainSport ||
          freshProfile?.sport ||
          lockedSport
      );

      if (freshProfileSport !== lockedSport) {
        handleSportChange(freshProfileSport);
        setUserSport(freshProfileSport);
        setMessage("Lo sport attivo del profilo è cambiato. Riprova con lo sport corretto.");
        setSaving(false);
        return;
      }

      const creatorName =
        (freshProfile as any)?.name ||
        (freshProfile as any)?.nickname ||
        user.displayName ||
        "Rivalo Player";

      await addDoc(collection(db, "events"), {
        title,
        sport: lockedSport,
        activeSport: lockedSport,
        creatorSport: lockedSport,
        sportProfileId: `${user.uid}_${lockedSport}`,
        scoreMode: isRacketSport(lockedSport) ? "racket" : "football",
        sportStatsMode: isRacketSport(lockedSport) ? "racket" : "football",
        type,
        competitionFormat: safeCompetitionFormat,
        city,
        field,
        date,
        time,
        maxPlayers: Number(maxPlayers || 0),
        prize,
        status: "aperto",
        visibility: "public",
        isPublic: true,

        participants: [user.uid],
        participantsInfo: [
          {
            uid: user.uid,
            name: creatorName,
            photoUrl:
              (freshProfile as any)?.photoUrl ||
              (freshProfile as any)?.photoURL ||
              user.photoURL ||
              "",
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
      setCity(userCity);
      setField("");
      setDate("");
      setTime("");
      setPrize("");

      handleSportChange(userSport);

      await loadEvents(user.uid, userSport, userCity);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione dell'evento.");
    } finally {
      setSaving(false);
    }
  }

  const pageCopy = getEventCopy(userSport);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto w-full max-w-7xl min-w-0 px-3 py-6 sm:px-5 sm:py-8">
        <header className="mb-6 sm:mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna alla dashboard
          </Link>

          <div className="mt-6 flex flex-col gap-5 lg:mt-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300 sm:text-sm sm:tracking-[0.35em]">
                Rivalo Events · {sportLabel(userSport)}
              </div>

              <h1 className="mt-3 text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                {pageCopy.title}
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
                {pageCopy.createText}
              </p>
            </div>

            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 sm:rounded-[2rem] sm:px-6">
              <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                Eventi visibili
              </div>

              <div className="mt-1 text-3xl font-black text-cyan-100">
                {events.length}
              </div>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <form
            onSubmit={createEvent}
            className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur sm:rounded-[2.5rem] sm:p-6"
          >
            <div className="mb-5 flex items-center gap-3 sm:mb-6 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 sm:h-14 sm:w-14 sm:rounded-3xl">
                <Plus size={30} />
              </div>

              <div>
                <h2 className="text-2xl font-black sm:text-3xl">Crea evento</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400 sm:text-base">
                  Lo sport è bloccato sul profilo attivo: {sportLabel(userSport)}.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {accountLocked && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  {getAccountLockedMessage()}
                </div>
              )}

              <fieldset disabled={accountLocked || saving} className="space-y-4 disabled:opacity-60">
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

                <Field label="Sport profilo">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-cyan-200">
                      {sportLabel(userSport)}
                    </div>

                    <span className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                      Bloccato
                    </span>
                  </div>

                  <div className="mt-2 text-xs leading-5 text-slate-400">
                    Per creare eventi in un altro sport servirà un profilo sport separato.
                  </div>
                </Field>
              </div>

              <Field label="Formato competizione">
                <select
                  value={competitionFormat}
                  onChange={(e) =>
                    handleCompetitionFormatChange(e.target.value as CompetitionFormat)
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
                  {pageCopy.formatHelp}
                </div>
              </Field>

              {isRacketSport(userSport) && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold leading-6 text-cyan-100">
                  Gli eventi racket usano player/coppie e score a set. I nomi delle coppie o dei player verranno creati dagli utenti iscritti, non scritti a mano.
                </div>
              )}

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
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-[#020617] text-white outline-none"
                  >
                    <option className="bg-[#020617] text-white" value="">
                      Seleziona ora
                    </option>

                    {TIME_OPTIONS.map((option) => (
                      <option
                        key={option}
                        className="bg-[#020617] text-white"
                        value={option}
                      >
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label={isRacketSport(userSport) ? "Posti player" : "Posti"}>
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
                disabled={saving || accountLocked}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black transition hover:scale-[1.01] disabled:opacity-60"
              >
                {accountLocked ? "Creazione bloccata" : saving ? "Creazione..." : "Crea evento"}
                <ChevronRight size={20} />
              </button>
              </fieldset>

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
                  {message}
                </div>
              )}
            </div>
          </form>

          <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur sm:rounded-[2.5rem] sm:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                  Calendario Rivalo
                </div>

                <h2 className="mt-2 text-3xl font-black leading-tight">
                  Eventi disponibili
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Filtro attivo: {sportLabel(userSport)}
                  {userCity ? ` · ${userCity}` : ""}
                </p>
              </div>

              <CalendarDays className="shrink-0 text-cyan-300" />
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                Caricamento eventi...
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                Nessun evento disponibile per il tuo sport e la tua zona. Crea il primo evento Rivalo.
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
  const isCancelled = isCancelledEvent(event);

  const sportLabel =
    normalizeSport(event.activeSport || event.sport) === "padel"
      ? "Padel"
      : normalizeSport(event.activeSport || event.sport) === "tennis"
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
  const scoreModeLabel = isRacketSport(event.activeSport || event.sport) ? "no gol/assist" : "gol/assist";

  return (
    <Link
      href={`/events/${event.id}`}
      className={`group block rounded-[1.7rem] border p-4 transition sm:rounded-[2rem] sm:p-5 ${
        isCancelled
          ? "border-red-400/20 bg-red-500/[.06] opacity-80 hover:border-red-400/30"
          : "border-white/10 bg-[#071126] hover:border-cyan-400/30 hover:bg-cyan-400/[0.04]"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge>{typeLabel}</Badge>
            <Badge>{sportLabel}</Badge>
            <Badge>{formatLabel}</Badge>
            <Badge>{scoreModeLabel}</Badge>

            {isCancelled ? (
              <StatusBadge tone="red">Annullato</StatusBadge>
            ) : (
              <Badge>{event.status || "aperto"}</Badge>
            )}
          </div>

          <h3 className="break-words text-[26px] font-black uppercase leading-tight sm:text-2xl">
            {event.title || "Evento Rivalo"}
          </h3>

          {isCancelled && (
            <div className="mt-3 inline-flex rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-red-200">
              Evento annullato
            </div>
          )}

          <div className="mt-3 grid gap-2 text-[15px] leading-6 text-slate-400">
            <span className="inline-flex min-w-0 items-center gap-2">
              <MapPin size={16} className="shrink-0" />
              <span className="min-w-0 truncate">
                {event.city || "Città da definire"}
              </span>
            </span>

            <span className="inline-flex min-w-0 items-center gap-2">
              <CalendarDays size={16} className="shrink-0" />
              <span className="min-w-0 truncate">
                {event.date || "Data da definire"}
                {event.time ? ` · ${event.time}` : ""}
              </span>
            </span>

            <span className="inline-flex min-w-0 items-center gap-2">
              <Users size={16} className="shrink-0" />
              <span className="min-w-0 truncate">
                {event.competitionFormat === "squadre"
                  ? `${teamsCount} squadre`
                  : event.competitionFormat === "doppio"
                  ? `${teamsCount || participantsCount} coppie/player`
                  : `${participantsCount}${
                      event.maxPlayers ? ` / ${event.maxPlayers}` : ""
                    } iscritti`}
              </span>
            </span>
          </div>

          {event.field && (
            <div className="mt-2 break-words text-[15px] leading-6 text-slate-300">
              Campo: {event.field}
            </div>
          )}

          {event.prize && (
            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-xs font-black uppercase text-yellow-200">
              <Trophy size={14} className="shrink-0" />
              <span className="truncate">{event.prize}</span>
            </div>
          )}
        </div>

        <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-300 transition group-hover:translate-x-1 lg:w-auto">
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
    <label className="block min-w-0">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-300 sm:text-sm sm:tracking-[0.12em]">
        {label}
      </span>

      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-3 text-base sm:py-4">
        {children}
      </div>
    </label>
  );
}

function StatusBadge({
  tone,
  children,
}: {
  tone: "red";
  children: React.ReactNode;
}) {
  const toneClass =
    tone === "red"
      ? "border-red-400/30 bg-red-500/15 text-red-200"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-200";

  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase sm:text-xs ${toneClass}`}>
      {children}
    </span>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-black uppercase text-cyan-200 sm:text-xs">
      {children}
    </span>
  );
}
