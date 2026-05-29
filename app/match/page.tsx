"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
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
import { auth, db } from "../../lib/firebase";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type CompetitionFormat = "singolo" | "doppio" | "squadre";

type GroupDoc = {
  id: string;
  name?: string;
  city?: string;
  sport?: string;
  members?: string[];
};

type UserOption = {
  uid: string;
  name?: string;
  nickname?: string;
  photoUrl?: string;
  photoURL?: string;
};

type MatchDoc = {
  id: string;
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  mode?: string;
  competitionFormat?: CompetitionFormat;
  slots?: number;
  status?: string;
  resultStatus?: string;
  fairPlayStatus?: string;
  statsApplied?: boolean;
  statsApplying?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
};

export default function MatchPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

  const [groupId, setGroupId] = useState("");
  const [matchName, setMatchName] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [competitionFormat, setCompetitionFormat] =
    useState<CompetitionFormat>("squadre");
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
      await loadData(
        currentUser.uid,
        currentUser.displayName || "Rivalo Player"
      );
    });

    return () => unsubscribe();
  }, []);

  async function loadData(uid: string, fallbackName?: string) {
    setLoadingData(true);

    try {
      let loadedGroups: GroupDoc[] = [];

      try {
        const groupsQuery = query(
          collection(db, "groups"),
          where("members", "array-contains", uid)
        );

        const groupsSnapshot = await getDocs(groupsQuery);

        loadedGroups = groupsSnapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<GroupDoc, "id">),
        }));
      } catch {
        loadedGroups = [];
      }

      setGroups(loadedGroups);

      if (loadedGroups.length > 0) {
        const firstGroup = loadedGroups[0];

        setGroupId(firstGroup.id);
        setSport(firstGroup.sport || "calcetto");
        setCity(firstGroup.city || "");

        if (firstGroup.sport === "padel") {
          setCompetitionFormat("doppio");
          setSlots("4");
        } else if (firstGroup.sport === "tennis") {
          setCompetitionFormat("singolo");
          setSlots("2");
        } else {
          setCompetitionFormat("squadre");
          setSlots("10");
        }

        await loadGroupMembers(firstGroup.id, uid, fallbackName);
      } else {
        await loadGroupMembers("", uid, fallbackName);
      }

      const matchesQuery = query(
        collection(db, "matches"),
        where("createdBy", "==", uid)
      );

      const matchesSnapshot = await getDocs(matchesQuery);

      setMatches(
        matchesSnapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<MatchDoc, "id">),
        }))
      );
    } catch {
      setMessage("Errore nel caricamento dei match.");
    } finally {
      setLoadingData(false);
    }
  }

  async function loadGroupMembers(
    nextGroupId: string,
    fallbackUid?: string,
    fallbackName?: string
  ) {
    const currentUid = fallbackUid || user?.uid || "";

    if (!nextGroupId) {
      if (currentUid) {
        setAvailableUsers([
          {
            uid: currentUid,
            name: fallbackName || user?.displayName || "Rivalo Player",
          },
        ]);

        setSelectedPlayerIds([currentUid]);
      }

      return;
    }

    try {
      const groupSnap = await getDoc(doc(db, "groups", nextGroupId));

      if (!groupSnap.exists()) {
        setAvailableUsers([]);
        setSelectedPlayerIds([]);
        return;
      }

      const groupData = groupSnap.data() as GroupDoc;
      const memberIds = Array.isArray(groupData.members)
        ? groupData.members
        : [];

      const usersResult: UserOption[] = [];

      for (const uid of memberIds) {
        const userSnap = await getDoc(doc(db, "users", uid));

        if (userSnap.exists()) {
          const data = userSnap.data();

          usersResult.push({
            uid,
            name: data.name || data.nickname || "Rivalo Player",
            nickname: data.nickname || "",
            photoUrl: data.photoUrl || data.photoURL || "",
          });
        } else {
          usersResult.push({
            uid,
            name: "Rivalo Player",
          });
        }
      }

      setAvailableUsers(usersResult);
      setSelectedPlayerIds(usersResult.map((player) => player.uid));
    } catch (error) {
      console.error(error);
      setAvailableUsers([]);
      setSelectedPlayerIds([]);
    }
  }

  function handleSportChange(nextSport: string) {
    setSport(nextSport);

    if (nextSport === "calcetto") {
      setCompetitionFormat("squadre");
      setSlots("10");
      return;
    }

    if (nextSport === "padel") {
      setCompetitionFormat("doppio");
      setSlots("4");
      return;
    }

    if (nextSport === "tennis") {
      setCompetitionFormat("singolo");
      setSlots("2");
    }
  }

  async function handleGroupChange(nextGroupId: string) {
    setGroupId(nextGroupId);

    const selectedGroup = groups.find((group) => group.id === nextGroupId);

    if (selectedGroup?.sport) {
      handleSportChange(selectedGroup.sport);
    }

    if (selectedGroup?.city) {
      setCity(selectedGroup.city);
    }

    await loadGroupMembers(nextGroupId);
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    const selectedUsers = availableUsers.filter((availableUser) =>
      selectedPlayerIds.includes(availableUser.uid)
    );

    const minimumPlayers =
      sport === "calcetto" ? 2 : competitionFormat === "doppio" ? 4 : 2;

    if (selectedUsers.length < minimumPlayers) {
      setMessage(
        `Servono almeno ${minimumPlayers} giocatori per questo formato.`
      );
      return;
    }

    const half = Math.ceil(selectedUsers.length / 2);

    const matchPlayers = selectedUsers.map((selectedUser, index) => ({
      uid: selectedUser.uid,
      name: selectedUser.name || selectedUser.nickname || "Rivalo Player",
      team: index < half ? "home" : "away",
      goals: 0,
      assists: 0,
      isMvp: false,
    }));

    setSaving(true);
    setMessage("");

    try {
      await addDoc(collection(db, "matches"), {
        groupId: groupId || "nessun-gruppo",
        createdBy: user.uid,
        createdByName: user.displayName || "Rivalo Player",

        name: matchName,
        sport,
        competitionFormat,
        city,
        field,
        date,
        time,
        mode,
        slots: Number(slots),

        status: "programmata",
        participants: matchPlayers.map((player) => player.uid),
        players: matchPlayers,

        resultStatus: "non_inserito",
        fairPlayStatus: "in_attesa",

        homeTeam: sport === "calcetto" ? "Squadra 1" : "Player/Coppia 1",
        awayTeam: sport === "calcetto" ? "Squadra 2" : "Player/Coppia 2",
        homeScore: null,
        awayScore: null,

        mvpName: "",
        notes: "",
        confirmedBy: [],
        disputedBy: [],
        statsApplied: false,
        statsApplying: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMatchName("");
      setField("");
      setDate("");
      setTime("");

      if (sport === "calcetto") {
        setCompetitionFormat("squadre");
        setSlots("10");
      } else if (sport === "padel") {
        setCompetitionFormat("doppio");
        setSlots("4");
      } else {
        setCompetitionFormat("singolo");
        setSlots("2");
      }

      setMessage("Match rapido creato correttamente.");
      await loadData(user.uid, user.displayName || "Rivalo Player");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione della partita.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
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
                <div className="text-sm font-black uppercase tracking-[.3em] text-cyan-300">
                  Rivalo Match
                </div>

                <h1 className="mt-2 text-4xl font-black">
                  Match rapido / Amichevole
                </h1>
              </div>
            </div>

            <form onSubmit={createMatch} className="space-y-5">
              <Field label="Gruppo collegato">
                <select
                  value={groupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full bg-[#0b1730] text-white outline-none"
                >
                  <option className="bg-[#020617] text-white" value="">
                    Nessun gruppo / Solo io
                  </option>

                  {groups.map((group) => (
                    <option
                      className="bg-[#020617] text-white"
                      key={group.id}
                      value={group.id}
                    >
                      {group.name || "Gruppo senza nome"}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nome partita">
                <input
                  value={matchName}
                  onChange={(e) => setMatchName(e.target.value)}
                  placeholder="Es: Rival Team vs Black Sharks"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Sport">
                  <select
                    value={sport}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full bg-[#0b1730] text-white outline-none"
                  >
                    <option
                      className="bg-[#020617] text-white"
                      value="calcetto"
                    >
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

                <Field label="Modalità">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full bg-[#0b1730] text-white outline-none"
                  >
                    <option
                      className="bg-[#020617] text-white"
                      value="amichevole"
                    >
                      Amichevole
                    </option>

                    <option
                      className="bg-[#020617] text-white"
                      value="allenamento"
                    >
                      Allenamento
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Formato partita">
                <select
                  value={competitionFormat}
                  onChange={(e) =>
                    setCompetitionFormat(e.target.value as CompetitionFormat)
                  }
                  className="w-full bg-[#0b1730] text-white outline-none"
                >
                  {sport === "calcetto" && (
                    <option
                      className="bg-[#020617] text-white"
                      value="squadre"
                    >
                      Squadre
                    </option>
                  )}

                  {(sport === "padel" || sport === "tennis") && (
                    <>
                      <option
                        className="bg-[#020617] text-white"
                        value="singolo"
                      >
                        Singolo
                      </option>

                      <option
                        className="bg-[#020617] text-white"
                        value="doppio"
                      >
                        Doppio
                      </option>
                    </>
                  )}
                </select>
              </Field>

              <Field label="Giocatori del gruppo">
                <div className="space-y-3">
                  {availableUsers.length === 0 ? (
                    <div className="text-sm text-slate-400">
                      Nessun giocatore disponibile. Crea o seleziona un gruppo.
                    </div>
                  ) : (
                    availableUsers.map((availableUser) => {
                      const checked = selectedPlayerIds.includes(
                        availableUser.uid
                      );

                      return (
                        <label
                          key={availableUser.uid}
                          className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <div>
                            <div className="font-black">
                              {availableUser.name ||
                                availableUser.nickname ||
                                "Rivalo Player"}
                            </div>

                            <div className="text-xs text-slate-400">
                              {availableUser.nickname || "Membro gruppo"}
                            </div>
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPlayerIds((current) =>
                                  Array.from(
                                    new Set([...current, availableUser.uid])
                                  )
                                );
                              } else {
                                setSelectedPlayerIds((current) =>
                                  current.filter(
                                    (uid) => uid !== availableUser.uid
                                  )
                                );
                              }
                            }}
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </Field>

              <Field label="Città">
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Milano, Lecce, Roma..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <Field label="Campo / luogo">
                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Centro sportivo, indirizzo..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <div className="grid gap-5 md:grid-cols-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    required
                  />
                </Field>

                <Field label="Ora">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    required
                  />
                </Field>

                <Field label="Slot">
                  <input
                    type="number"
                    min="2"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    required
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {saving ? "Creazione..." : "Crea match rapido"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
                  {message}
                </div>
              )}
            </form>
          </section>

          <section className="space-y-6">
            <InfoCard
              icon={<Users size={28} />}
              title="Giocatori gruppo"
              text="Nel match privato puoi scegliere solo membri del gruppo collegato."
            />

            <InfoCard
              icon={<Trophy size={28} />}
              title="Sport reali"
              text="Calcetto a squadre, padel e tennis in singolo o doppio."
            />

            <InfoCard
              icon={<ShieldCheck size={28} />}
              title="FairPlay"
              text="Risultato proposto, confermato o contestato."
            />

            <InfoCard
              icon={<Clock size={28} />}
              title="Post-partita"
              text="Inserisci risultato, gol, assist e MVP dal dettaglio match."
            />
          </section>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#071126]/75 p-7 shadow-2xl backdrop-blur">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[.28em] text-cyan-300">
                Match creati
              </div>

              <h2 className="mt-2 text-3xl font-black">Le tue partite</h2>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
              {matches.length} match
            </div>
          </div>

          {loadingData ? (
            <EmptyBox text="Caricamento partite..." />
          ) : matches.length === 0 ? (
            <EmptyBox text="Nessuna partita creata. Crea il primo match Rivalo." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {matches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
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
      <span className="mb-2 block text-sm font-black text-slate-300">
        {label}
      </span>

      <div className="rounded-2xl border border-white/10 bg-[#0b1730] px-5 py-4">
        {children}
      </div>
    </label>
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
    <div className="rounded-[2rem] border border-white/10 bg-[#071126]/75 p-6 backdrop-blur">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300">
          {icon}
        </div>

        <div>
          <div className="text-2xl font-black">{title}</div>
          <div className="mt-1 text-slate-400">{text}</div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({ match }: { match: MatchDoc }) {
  const isOfficial =
    match.status === "ufficiale" || match.resultStatus === "confermato";

  const isDisputed =
    match.status === "contestato" || match.resultStatus === "contestato";

  const isProposed =
    match.status === "in_attesa_conferma" ||
    match.resultStatus === "proposto";

  const scoreIsVisible =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  const statusLabel = isOfficial
    ? "Ufficiale"
    : isDisputed
    ? "Contestato"
    : isProposed
    ? "Da confermare"
    : "Programmato";

  const statusClass = isOfficial
    ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
    : isDisputed
    ? "border-red-400/20 bg-red-500/10 text-red-200"
    : isProposed
    ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
    : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  const statsLabel = match.statsApplied
    ? "Stats applicate"
    : match.statsApplying
    ? "Stats in corso"
    : "Stats da applicare";

  const statsClass = match.statsApplied
    ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
    : match.statsApplying
    ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
    : "border-white/10 bg-white/[.04] text-slate-300";

  return (
    <Link href={`/match/${match.id}`}>
      <div className="rounded-[1.7rem] border border-white/10 bg-[#0b1730] p-5 transition hover:scale-[1.02] hover:border-cyan-400/30 hover:bg-[#112041]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="truncate text-2xl font-black">
              {match.name || "Match Rivalo"}
            </div>

            <div className="mt-2 text-slate-400">
              {match.city || "Città non inserita"}
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {match.field || "Campo non inserito"}
            </div>
          </div>

          <div className="rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-black uppercase text-cyan-300">
            {match.sport || "sport"}
          </div>
        </div>

        {scoreIsVisible && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Risultato
            </div>

            <div className="mt-1 text-4xl font-black text-white">
              {match.homeScore} - {match.awayScore}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Badge>{match.date || "Data"}</Badge>
          <Badge>{match.time || "Ora"}</Badge>
          <Badge>{match.slots || 0} slot</Badge>
          <Badge>{match.mode || "modalità"}</Badge>
          <Badge>{match.competitionFormat || "formato"}</Badge>

          <div className={`rounded-xl border px-3 py-2 font-black ${statusClass}`}>
            {statusLabel}
          </div>

          <div className={`rounded-xl border px-3 py-2 font-black ${statsClass}`}>
            {statsLabel}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-white/5 px-3 py-2 text-slate-300">
      {children}
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 p-6 text-slate-400">
      {text}
    </div>
  );
}