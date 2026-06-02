"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
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

type GroupTeam = {
  id: string;
  groupId?: string;
  name?: string;
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
  groupId?: string;
  eventId?: string;
  eventTitle?: string;
  homeTeamId?: string;
awayTeamId?: string;
sourceType?: string;
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
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
          Caricamento match...
        </main>
      }
    >
      <MatchPageContent />
    </Suspense>
  );
}

function MatchPageContent() {
  const searchParams = useSearchParams();
  const requestedGroupId = searchParams.get("groupId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [groupTeams, setGroupTeams] = useState<GroupTeam[]>([]);
  const [homeTeamId, setHomeTeamId] = useState("");
const [awayTeamId, setAwayTeamId] = useState("");

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
  const [matchFilter, setMatchFilter] = useState<
    "tutti" | "ufficiali" | "da_confermare" | "contestati"
  >("tutti");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      await loadData(
        currentUser.uid,
        currentUser.displayName || "Rivalo Player",
        requestedGroupId
      );
    });

    return () => unsubscribe();
  }, [requestedGroupId]);

  async function loadData(
    uid: string,
    fallbackName?: string,
    preferredGroupId?: string
  ) {
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
        const selectedGroup =
          loadedGroups.find((group) => group.id === preferredGroupId) ||
          loadedGroups[0];

        setGroupId(selectedGroup.id);
        setSport(selectedGroup.sport || "calcetto");
        setCity(selectedGroup.city || "");

        if (selectedGroup.sport === "padel") {
          setCompetitionFormat("doppio");
          setSlots("4");
        } else if (selectedGroup.sport === "tennis") {
          setCompetitionFormat("singolo");
          setSlots("2");
        } else {
          setCompetitionFormat("squadre");
          setSlots("10");
        }

        await loadGroupMembers(selectedGroup.id, uid, fallbackName);
        await loadGroupTeams(selectedGroup.id);
      } else {
        await loadGroupMembers("", uid, fallbackName);
        await loadGroupTeams("");
      }

      const createdMatchesQuery = query(
        collection(db, "matches"),
        where("createdBy", "==", uid)
      );

      const participantMatchesQuery = query(
        collection(db, "matches"),
        where("participants", "array-contains", uid)
      );

      const [createdMatchesSnapshot, participantMatchesSnapshot] =
        await Promise.all([
          getDocs(createdMatchesQuery),
          getDocs(participantMatchesQuery),
        ]);

      const matchesMap = new Map<string, MatchDoc>();

      createdMatchesSnapshot.docs.forEach((d) => {
        matchesMap.set(d.id, {
          id: d.id,
          ...(d.data() as Omit<MatchDoc, "id">),
        });
      });

      participantMatchesSnapshot.docs.forEach((d) => {
        matchesMap.set(d.id, {
          id: d.id,
          ...(d.data() as Omit<MatchDoc, "id">),
        });
      });

      const sortedMatches = Array.from(matchesMap.values()).sort((a, b) => {
        const dateA = `${a.date || ""} ${a.time || ""}`;
        const dateB = `${b.date || ""} ${b.time || ""}`;

        return dateB.localeCompare(dateA);
      });

      setMatches(sortedMatches);
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
async function loadGroupTeams(nextGroupId: string) {
  if (!nextGroupId) {
    setGroupTeams([]);
    return;
  }

  try {
    const teamsQuery = query(
      collection(db, "groupTeams"),
      where("groupId", "==", nextGroupId)
    );

    const teamsSnap = await getDocs(teamsQuery);

    const teamsResult = teamsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<GroupTeam, "id">),
    }));

    setGroupTeams(teamsResult);
  } catch (error) {
    console.error(error);
    setGroupTeams([]);
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
    setHomeTeamId("");
setAwayTeamId("");

    const selectedGroup = groups.find((group) => group.id === nextGroupId);

    if (selectedGroup?.sport) {
      handleSportChange(selectedGroup.sport);
    }

    if (selectedGroup?.city) {
      setCity(selectedGroup.city);
    }

    await loadGroupMembers(nextGroupId);
    await loadGroupTeams(nextGroupId);
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

   const selectedHomeTeam = groupTeams.find((team) => team.id === homeTeamId);
const selectedAwayTeam = groupTeams.find((team) => team.id === awayTeamId);

let matchPlayers: {
  uid: string;
  name: string;
  team: "home" | "away";
  goals: number;
  assists: number;
  isMvp: boolean;
}[] = [];

let homeTeamName = sport === "calcetto" ? "Squadra 1" : "Player/Coppia 1";
let awayTeamName = sport === "calcetto" ? "Squadra 2" : "Player/Coppia 2";
let matchHomeTeamId = "";
let matchAwayTeamId = "";
let sourceType = "manual";

if (sport === "calcetto" && selectedHomeTeam && selectedAwayTeam) {
  if (selectedHomeTeam.id === selectedAwayTeam.id) {
    setMessage("Seleziona due squadre diverse.");
    return;
  }

  const homeMembers = availableUsers.filter((availableUser) =>
    selectedHomeTeam.members?.includes(availableUser.uid)
  );

  const awayMembers = availableUsers.filter((availableUser) =>
    selectedAwayTeam.members?.includes(availableUser.uid)
  );

  if (homeMembers.length < 1 || awayMembers.length < 1) {
    setMessage("Entrambe le squadre devono avere almeno un giocatore.");
    return;
  }

  homeTeamName = selectedHomeTeam.name || "Squadra 1";
  awayTeamName = selectedAwayTeam.name || "Squadra 2";
  matchHomeTeamId = selectedHomeTeam.id;
matchAwayTeamId = selectedAwayTeam.id;
sourceType = "groupTeams";

  matchPlayers = [
    ...homeMembers.map((selectedUser) => ({
      uid: selectedUser.uid,
      name: selectedUser.name || selectedUser.nickname || "Rivalo Player",
      team: "home" as const,
      goals: 0,
      assists: 0,
      isMvp: false,
    })),
    ...awayMembers.map((selectedUser) => ({
      uid: selectedUser.uid,
      name: selectedUser.name || selectedUser.nickname || "Rivalo Player",
      team: "away" as const,
      goals: 0,
      assists: 0,
      isMvp: false,
    })),
  ];
} else {
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

  matchPlayers = selectedUsers.map((selectedUser, index) => ({
    uid: selectedUser.uid,
    name: selectedUser.name || selectedUser.nickname || "Rivalo Player",
    team: index < half ? "home" : "away",
    goals: 0,
    assists: 0,
    isMvp: false,
  }));
}

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

     homeTeam: homeTeamName,
awayTeam: awayTeamName,
homeTeamId: matchHomeTeamId,
awayTeamId: matchAwayTeamId,
sourceType,
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
      await loadData(user.uid, user.displayName || "Rivalo Player", groupId);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione della partita.");
    } finally {
      setSaving(false);
    }
  }

  const totalMatches = matches.length;

  const officialMatches = matches.filter(
    (match) =>
      match.status === "ufficiale" || match.resultStatus === "confermato"
  ).length;

  const pendingMatches = matches.filter(
    (match) =>
      match.status === "in_attesa_conferma" ||
      match.resultStatus === "proposto"
  ).length;

  const disputedMatches = matches.filter(
    (match) =>
      match.status === "contestato" || match.resultStatus === "contestato"
  ).length;

  const filteredMatches = matches.filter((match) => {
    const isOfficial =
      match.status === "ufficiale" || match.resultStatus === "confermato";

    const isPending =
      match.status === "in_attesa_conferma" ||
      match.resultStatus === "proposto";

    const isDisputed =
      match.status === "contestato" || match.resultStatus === "contestato";

    if (matchFilter === "ufficiali") return isOfficial;
    if (matchFilter === "da_confermare") return isPending;
    if (matchFilter === "contestati") return isDisputed;

    return true;
  });

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl overflow-x-hidden px-4 py-6 sm:px-5 sm:py-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-8">
          <section className="rounded-[2rem] border border-white/10 bg-[#071126]/75 p-4 shadow-2xl backdrop-blur sm:p-7">
            <div className="mb-6 flex items-start gap-3 sm:mb-7 sm:items-center sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 sm:h-14 sm:w-14">
                <CalendarDays size={28} />
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-[.28em] text-cyan-300 sm:text-sm sm:tracking-[.3em]">
                  Rivalo Match
                </div>

                <h1 className="mt-2 text-[34px] font-black leading-tight sm:text-4xl">
                  Match rapido / Amichevole
                </h1>
              </div>
            </div>

            <form onSubmit={createMatch} className="space-y-4 sm:space-y-5">
              <Field label="Gruppo collegato">
                <select
                  value={groupId}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full min-w-0 bg-[#0b1730] text-white outline-none"
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
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sport">
                  <select
                    value={sport}
                    onChange={(e) => handleSportChange(e.target.value)}
                    className="w-full min-w-0 bg-[#0b1730] text-white outline-none"
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

                <Field label="Modalità">
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full min-w-0 bg-[#0b1730] text-white outline-none"
                  >
                    <option className="bg-[#020617] text-white" value="amichevole">
                      Amichevole
                    </option>
                    <option className="bg-[#020617] text-white" value="allenamento">
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
                  className="w-full min-w-0 bg-[#0b1730] text-white outline-none"
                >
                  {sport === "calcetto" && (
                    <option className="bg-[#020617] text-white" value="squadre">
                      Squadre
                    </option>
                  )}

                  {(sport === "padel" || sport === "tennis") && (
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
              </Field>

              {groupTeams.length > 0 && sport === "calcetto" && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 sm:p-4">
                  <div className="text-sm font-black text-cyan-200">
                    {groupTeams.length} squadre trovate in questo gruppo.
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="mb-2 text-sm font-black text-slate-300">
                        Squadra 1
                      </div>

                      <select
                        value={homeTeamId}
                        onChange={(e) => setHomeTeamId(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none"
                      >
                        <option value="" className="bg-[#020617] text-white">
                          Seleziona squadra
                        </option>

                        {groupTeams.map((team) => (
                          <option
                            key={team.id}
                            value={team.id}
                            className="bg-[#020617] text-white"
                          >
                            {team.name || "Squadra Rivalo"} · {team.members?.length || 0} membri
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-black text-slate-300">
                        Squadra 2
                      </div>

                      <select
                        value={awayTeamId}
                        onChange={(e) => setAwayTeamId(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none"
                      >
                        <option value="" className="bg-[#020617] text-white">
                          Seleziona squadra
                        </option>

                        {groupTeams.map((team) => (
                          <option
                            key={team.id}
                            value={team.id}
                            className="bg-[#020617] text-white"
                          >
                            {team.name || "Squadra Rivalo"} · {team.members?.length || 0} membri
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3 text-xs leading-5 text-slate-300">
                    Se scegli due squadre, Rivalo userà automaticamente i giocatori presenti nelle rose.
                  </div>
                </div>
              )}

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
                          className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <div className="min-w-0">
                            <div className="break-words font-black">
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
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <Field label="Campo / luogo">
                <input
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                  placeholder="Centro sportivo, indirizzo..."
                  className="w-full min-w-0 bg-transparent outline-none placeholder:text-slate-500"
                  required
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full min-w-0 bg-transparent outline-none"
                    required
                  />
                </Field>

                <Field label="Ora">
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-w-0 bg-transparent outline-none"
                    required
                  />
                </Field>

                <Field label="Slot">
                  <input
                    type="number"
                    min="2"
                    value={slots}
                    onChange={(e) => setSlots(e.target.value)}
                    className="w-full min-w-0 bg-transparent outline-none"
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

          <section className="space-y-4 sm:space-y-6">
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

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-[#071126]/75 p-4 shadow-2xl backdrop-blur sm:p-7">
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
            <MatchSummaryBox label="Totali" value={totalMatches} tone="cyan" />
            <MatchSummaryBox label="Ufficiali" value={officialMatches} tone="lime" />
            <MatchSummaryBox
              label="Da confermare"
              value={pendingMatches}
              tone="yellow"
            />
            <MatchSummaryBox label="Contestati" value={disputedMatches} tone="red" />
          </div>

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[.28em] text-cyan-300">
                Match creati
              </div>

              <h2 className="mt-2 text-[34px] font-black leading-tight sm:text-3xl">Le tue partite</h2>
            </div>

            <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-black text-cyan-300">
              {filteredMatches.length} / {matches.length} match
            </div>
          </div>

          <div className="mb-6 flex flex-wrap gap-3">
            <FilterButton
              active={matchFilter === "tutti"}
              onClick={() => setMatchFilter("tutti")}
            >
              Tutti
            </FilterButton>

            <FilterButton
              active={matchFilter === "ufficiali"}
              onClick={() => setMatchFilter("ufficiali")}
            >
              Ufficiali
            </FilterButton>

            <FilterButton
              active={matchFilter === "da_confermare"}
              onClick={() => setMatchFilter("da_confermare")}
            >
              Da confermare
            </FilterButton>

            <FilterButton
              active={matchFilter === "contestati"}
              onClick={() => setMatchFilter("contestati")}
            >
              Contestati
            </FilterButton>
          </div>

          {loadingData ? (
            <EmptyBox text="Caricamento partite..." />
          ) : filteredMatches.length === 0 ? (
            <EmptyBox text="Nessun match trovato con questo filtro." />
          ) : (
            <div className="grid min-w-0 gap-4 lg:grid-cols-2">
              {filteredMatches.map((match) => (
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
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-black text-slate-300">
        {label}
      </span>

      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#0b1730] px-4 py-3 text-base sm:px-5 sm:py-4">
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
    <div className="rounded-[1.7rem] border border-white/10 bg-[#071126]/75 p-4 backdrop-blur sm:rounded-[2rem] sm:p-6">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/10 text-cyan-300 sm:h-14 sm:w-14">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="break-words text-[26px] font-black leading-tight sm:text-2xl">
            {title}
          </div>
          <div className="mt-1 text-base leading-6 text-slate-400 sm:text-base">
            {text}
          </div>
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
    <div className="min-w-0 overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#0b1730] p-4 transition hover:border-cyan-400/30 hover:bg-[#112041] sm:p-5 lg:hover:scale-[1.02]">
      <Link href={`/match/${match.id}`} className="block min-w-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <div className="break-words text-[26px] font-black leading-tight sm:text-2xl">
              {match.name || "Match Rivalo"}
            </div>

            <div className="mt-2 break-words text-slate-400">
              {match.city || "Città non inserita"}
            </div>

            <div className="mt-1 break-words text-sm text-slate-500">
              {match.field || "Campo non inserito"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {match.groupId && match.groupId !== "nessun-gruppo" && (
                <span className="rounded-lg border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 font-black text-cyan-200">
                  Gruppo
                </span>
              )}

              {match.eventId && (
                <span className="max-w-full truncate rounded-lg border border-fuchsia-400/20 bg-fuchsia-400/10 px-2 py-1 font-black text-fuchsia-200">
                  {match.eventTitle || "Evento"}
                </span>
              )}
            </div>
          </div>

          <div className="w-fit rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-black uppercase text-cyan-300">
            {match.sport || "sport"}
          </div>
        </div>

        {scoreIsVisible && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              Risultato
            </div>

            <div className="mt-1 text-4xl font-black leading-none text-white">
              {match.homeScore} - {match.awayScore}
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2 text-sm sm:gap-3">
          <Badge>{match.date || "Data"}</Badge>
          <Badge>{match.time || "Ora"}</Badge>
          <Badge>{match.slots || 0} slot</Badge>
          <Badge>{match.mode || "modalità"}</Badge>
          <Badge>{match.competitionFormat || "formato"}</Badge>

          <div className={`max-w-full rounded-xl border px-3 py-2 font-black ${statusClass}`}>
            {statusLabel}
          </div>

          <div className={`max-w-full rounded-xl border px-3 py-2 font-black ${statsClass}`}>
            {statsLabel}
          </div>
        </div>
      </Link>

      <div className="mt-5 flex flex-wrap gap-3">
        {match.groupId && match.groupId !== "nessun-gruppo" && (
          <Link
            href={`/groups/${match.groupId}`}
            className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200"
          >
            Apri gruppo
          </Link>
        )}

        {match.eventId && (
          <Link
            href={`/events/${match.eventId}`}
            className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-2 text-xs font-black text-fuchsia-200"
          >
            Apri evento
          </Link>
        )}
      </div>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-4 py-3 text-sm font-black transition ${
        active
          ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
          : "border-white/10 bg-white/[.03] text-slate-300 hover:border-cyan-400/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MatchSummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "lime" | "yellow" | "red";
}) {
  const toneClass =
    tone === "lime"
      ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
      : tone === "yellow"
      ? "border-yellow-400/20 bg-yellow-400/10 text-yellow-200"
      : tone === "red"
      ? "border-red-400/20 bg-red-500/10 text-red-200"
      : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";

  return (
    <div className={`rounded-2xl border p-4 text-center sm:p-5 ${toneClass}`}>
      <div className="text-3xl font-black leading-none">{value}</div>

      <div className="mt-2 break-words text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]">
        {label}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-full break-words rounded-xl bg-white/5 px-3 py-2 text-slate-300">
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