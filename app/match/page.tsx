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
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { createNotification } from "../../lib/createNotification";
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

type Sport = "calcetto" | "padel" | "tennis";

type CompetitionFormat = "singolo" | "doppio" | "squadre";

function normalizeSport(value?: string): Sport {
  const sport = (value || "").toLowerCase().trim();

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

function getProfileActiveSport(profile?: UserProfile | null): Sport {
  return normalizeSport(profile?.activeSport || profile?.mainSport || profile?.sport || "calcetto");
}

function getSportProfileId(uid: string, sport: string) {
  return `${uid}_${normalizeSport(sport)}`;
}

function getMatchCopy(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") {
    return {
      title: "Match padel",
      teamA: "Coppia 1",
      teamB: "Coppia 2",
      participantsLabel: "Giocatori padel",
      resultLabel: "Risultato padel",
      postMatchText: "Inserisci risultato, MVP e conferma FairPlay. Gol e assist non vengono usati.",
      formatHelp: "Padel: singolo o doppio. Il doppio richiede 4 giocatori.",
      scoreMode: "racket",
    };
  }

  if (sport === "tennis") {
    return {
      title: "Match tennis",
      teamA: "Player/Coppia 1",
      teamB: "Player/Coppia 2",
      participantsLabel: "Giocatori tennis",
      resultLabel: "Risultato tennis",
      postMatchText: "Inserisci risultato, MVP e conferma FairPlay. Gol e assist non vengono usati.",
      formatHelp: "Tennis: singolo o doppio. Il singolo richiede 2 giocatori.",
      scoreMode: "racket",
    };
  }

  return {
    title: "Match calcetto",
    teamA: "Squadra 1",
    teamB: "Squadra 2",
    participantsLabel: "Giocatori calcetto",
    resultLabel: "Risultato",
    postMatchText: "Inserisci risultato, gol, assist e MVP dal dettaglio match.",
    formatHelp: "Calcetto: formato a squadre con gol, assist e MVP.",
    scoreMode: "football",
  };
}

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
  captainId?: string;
  captainName?: string;
  createdBy?: string;
};

type UserOption = {
  uid: string;
  name?: string;
  nickname?: string;
  photoUrl?: string;
  photoURL?: string;
};

type UserProfile = {
  name?: string;
  nickname?: string;
  mainSport?: string;
  sport?: string;
  activeSport?: string;
  sportProfileId?: string;
  city?: string;
  cityZone?: string;
  zone?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

function getUserDisplayName(user?: UserOption) {
  return user?.name || user?.nickname || "Rivalo Player";
}

function getRequiredRacketPlayers(format: CompetitionFormat) {
  return format === "doppio" ? 4 : 2;
}

function getRacketSideSize(format: CompetitionFormat) {
  return format === "doppio" ? 2 : 1;
}

function buildRacketTeamName(users: UserOption[]) {
  return users.map(getUserDisplayName).join(" / ") || "Da definire";
}

function applySportDefaults(
  nextSport: string,
  setCompetitionFormat: (value: CompetitionFormat) => void,
  setSlots: (value: string) => void
) {
  const normalizedSport = normalizeSport(nextSport);

  if (normalizedSport === "padel") {
    setCompetitionFormat("doppio");
    setSlots("4");
    return;
  }

  if (normalizedSport === "tennis") {
    setCompetitionFormat("singolo");
    setSlots("2");
    return;
  }

  setCompetitionFormat("squadre");
  setSlots("10");
}

function getMatchTimeOptions() {
  const options: string[] = [];

  for (let hour = 6; hour <= 23; hour += 1) {
    ["00", "30"].forEach((minute) => {
      options.push(`${String(hour).padStart(2, "0")}:${minute}`);
    });
  }

  return options;
}

function isProfileDeletionRequested(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

type MatchDoc = {
  id: string;
  groupId?: string;
  eventId?: string;
  eventTitle?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeCaptainId?: string;
  awayCaptainId?: string;
  sourceType?: string;
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  mode?: string;
  competitionFormat?: CompetitionFormat;
  scoreMode?: "football" | "racket";
  sportStatsMode?: "football" | "racket";
  slots?: number;
  status?: string;
  resultStatus?: string;
  fairPlayStatus?: string;
  statsApplied?: boolean;
  statsApplying?: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
};

type MatchmakingRequestDoc = {
  id: string;
  type?: string;
  activeSport?: string;
  city?: string;
  zone?: string;
  matchPlace?: string;
  format?: string;
  date?: string;
  time?: string;
  createdBy?: string;
  createdByName?: string;
  status?: string;
  linkedMatchId?: string;
};

type MatchmakingApplicationDoc = {
  id: string;
  requestId?: string;
  fromUid?: string;
  fromName?: string;
  status?: string;
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
  const requestedMatchmakingRequestId =
    searchParams.get("matchmakingRequestId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [userCity, setUserCity] = useState("");
  const [accountLocked, setAccountLocked] = useState(false);
  const [groups, setGroups] = useState<GroupDoc[]>([]);
  const [matches, setMatches] = useState<MatchDoc[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [homePlayerIds, setHomePlayerIds] = useState<string[]>([]);
  const [awayPlayerIds, setAwayPlayerIds] = useState<string[]>([]);
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
  const [matchmakingSourceId, setMatchmakingSourceId] = useState("");
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
        requestedGroupId,
        requestedMatchmakingRequestId
      );
    });

    return () => unsubscribe();
  }, [requestedGroupId, requestedMatchmakingRequestId]);

  async function loadData(
    uid: string,
    fallbackName?: string,
    preferredGroupId?: string,
    preferredMatchmakingRequestId?: string
  ) {
    setLoadingData(true);

    try {
      const profileSnap = await getDoc(doc(db, "users", uid));
      const profileData = profileSnap.exists()
        ? (profileSnap.data() as UserProfile)
        : null;

      const profileSport = getProfileActiveSport(profileData);

      const profileCity =
        profileData?.city || profileData?.cityZone || profileData?.zone || "";

      setUserSport(profileSport);
      setUserCity(profileCity);
      setAccountLocked(isProfileDeletionRequested(profileData));

      const profileName =
        profileData?.name ||
        profileData?.nickname ||
        fallbackName ||
        "Rivalo Player";

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

      loadedGroups = loadedGroups.filter(
        (group) => !group.sport || normalizeSport(group.sport) === profileSport
      );

      setGroups(loadedGroups);

      if (loadedGroups.length > 0) {
        const selectedGroup =
          loadedGroups.find((group) => group.id === preferredGroupId) ||
          loadedGroups[0];

        const selectedSport = normalizeSport(selectedGroup.sport || profileSport);

        setGroupId(selectedGroup.id);
        setSport(selectedSport);
        setCity(selectedGroup.city || profileCity || "");
        applySportDefaults(selectedSport, setCompetitionFormat, setSlots);

        await loadGroupMembers(selectedGroup.id, uid, profileName);
        await loadGroupTeams(selectedGroup.id);
      } else {
        setGroupId("");
        setSport(profileSport);
        setCity(profileCity);
        applySportDefaults(profileSport, setCompetitionFormat, setSlots);

        await loadGroupMembers("", uid, profileName);
        await loadGroupTeams("");
      }

      if (preferredMatchmakingRequestId) {
        await loadMatchmakingSource({
          requestId: preferredMatchmakingRequestId,
          currentUid: uid,
          fallbackName: profileName,
          activeSport: profileSport,
          profileCity,
        });
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

      const sortedMatches = Array.from(matchesMap.values())
        .filter((match) => normalizeSport(match.sport) === profileSport)
        .sort((a, b) => {
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

  async function loadMatchmakingSource({
    requestId,
    currentUid,
    fallbackName,
    activeSport,
    profileCity,
  }: {
    requestId: string;
    currentUid: string;
    fallbackName: string;
    activeSport: Sport;
    profileCity: string;
  }) {
    try {
      const requestSnap = await getDoc(doc(db, "matchmakingRequests", requestId));

      if (!requestSnap.exists()) {
        setMessage("Annuncio matchmaking non trovato.");
        return;
      }

      const requestData = {
        id: requestSnap.id,
        ...(requestSnap.data() as Omit<MatchmakingRequestDoc, "id">),
      };

      const requestSport = normalizeSport(requestData.activeSport || activeSport);

      if (requestSport !== activeSport) {
        setMessage("L'annuncio appartiene a uno sport diverso dal profilo attivo.");
        return;
      }

      if (requestData.createdBy !== currentUid) {
        setMessage("Solo il creator dell'annuncio può creare il match.");
        return;
      }

      if (requestData.linkedMatchId || requestData.status === "match_created") {
        setMatchmakingSourceId("");
        setMessage("Questo annuncio ha già un match collegato. Apri il match esistente dall'annuncio matchmaking.");
        return;
      }

      const applicationsQuery = query(
        collection(db, "matchmakingApplications"),
        where("requestId", "==", requestId),
        where("requestOwnerId", "==", currentUid),
        where("status", "==", "accepted")
      );

      const applicationsSnap = await getDocs(applicationsQuery);

      const applications = applicationsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MatchmakingApplicationDoc, "id">),
      }));

      const participantIds = Array.from(
        new Set([currentUid, ...applications.map((application) => application.fromUid || "")].filter(Boolean))
      );

      const usersResult: UserOption[] = [];

      for (const participantId of participantIds) {
        if (participantId === currentUid) {
          usersResult.push({
            uid: currentUid,
            name: fallbackName || "Rivalo Player",
          });
          continue;
        }

        const userSnap = await getDoc(doc(db, "users", participantId));

        if (userSnap.exists()) {
          const userData = userSnap.data() as UserProfile & {
            photoUrl?: string;
            photoURL?: string;
          };

          if (isProfileDeletionRequested(userData)) continue;
          if (getProfileActiveSport(userData) !== requestSport) continue;

          usersResult.push({
            uid: participantId,
            name: userData.name || userData.nickname || "Rivalo Player",
            nickname: userData.nickname || "",
            photoUrl: userData.photoUrl || userData.photoURL || "",
          });
        }
      }

      const safeFormat =
        requestData.format === "doppio" || requestData.format === "singolo"
          ? (requestData.format as CompetitionFormat)
          : requestSport === "calcetto"
          ? "squadre"
          : "singolo";

      const sideSize = requestSport === "calcetto" ? 0 : getRacketSideSize(safeFormat);
      const selectedIds = usersResult.map((item) => item.uid);

      setMatchmakingSourceId(requestId);
      setGroupId("");
      setSport(requestSport);
      setCity(requestData.city || profileCity || "");
      setField(requestData.matchPlace || requestData.zone || "");
      setDate(requestData.date || "");
      setTime(requestData.time || "");
      setMode("amichevole");
      setMatchName(
        `${sportLabel(requestSport)} amichevole${requestData.matchPlace ? ` · ${requestData.matchPlace}` : ""}`
      );
      setCompetitionFormat(safeFormat);
      setSlots(String(Math.max(selectedIds.length, requestSport === "calcetto" ? 2 : sideSize * 2)));
      setAvailableUsers(usersResult);
      setSelectedPlayerIds(selectedIds);

      if (requestSport === "calcetto") {
        const half = Math.ceil(selectedIds.length / 2);
        setHomePlayerIds(selectedIds.slice(0, half));
        setAwayPlayerIds(selectedIds.slice(half));
      } else {
        setHomePlayerIds(selectedIds.slice(0, sideSize));
        setAwayPlayerIds(selectedIds.slice(sideSize, sideSize * 2));
      }

      setMessage("Annuncio matchmaking caricato. Controlla i dati e crea il match amichevole.");
    } catch (error) {
      console.error(error);
      setMessage("Errore nel caricamento dell'annuncio matchmaking.");
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
        setHomePlayerIds([currentUid]);
        setAwayPlayerIds([]);
      }

      return;
    }

    try {
      const groupSnap = await getDoc(doc(db, "groups", nextGroupId));

      if (!groupSnap.exists()) {
        setAvailableUsers([]);
        setSelectedPlayerIds([]);
        setHomePlayerIds([]);
        setAwayPlayerIds([]);
        return;
      }

      const groupData = groupSnap.data() as GroupDoc;
      const memberIds = Array.isArray(groupData.members)
        ? groupData.members
        : [];

      const groupSport = normalizeSport(groupData.sport || userSport);
      const usersResult: UserOption[] = [];

      for (const uid of memberIds) {
        const userSnap = await getDoc(doc(db, "users", uid));

        if (userSnap.exists()) {
          const data = userSnap.data() as UserProfile & {
            photoUrl?: string;
            photoURL?: string;
          };

          if (isProfileDeletionRequested(data)) continue;
          if (getProfileActiveSport(data) !== groupSport) continue;

          usersResult.push({
            uid,
            name: data.name || data.nickname || "Rivalo Player",
            nickname: data.nickname || "",
            photoUrl: data.photoUrl || data.photoURL || "",
          });
        }
      }

      setAvailableUsers(usersResult);
      setSelectedPlayerIds(usersResult.map((player) => player.uid));
      setHomePlayerIds(usersResult.slice(0, 2).map((player) => player.uid));
      setAwayPlayerIds(usersResult.slice(2, 4).map((player) => player.uid));
    } catch (error) {
      console.error(error);
      setAvailableUsers([]);
      setSelectedPlayerIds([]);
      setHomePlayerIds([]);
      setAwayPlayerIds([]);
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
    const normalizedSport = normalizeSport(nextSport);
    const lockedSport = normalizeSport(userSport);
    const safeSport = normalizedSport === lockedSport ? normalizedSport : lockedSport;

    setSport(safeSport);
    applySportDefaults(safeSport, setCompetitionFormat, setSlots);

    if (safeSport === "padel" || safeSport === "tennis") {
      const defaultFormat = safeSport === "padel" ? "doppio" : "singolo";
      const sideSize = getRacketSideSize(defaultFormat);
      const selectedIds = availableUsers.map((availableUser) => availableUser.uid);

      setHomePlayerIds(selectedIds.slice(0, sideSize));
      setAwayPlayerIds(selectedIds.slice(sideSize, sideSize * 2));
      setSelectedPlayerIds(selectedIds.slice(0, sideSize * 2));
    }
  }

  function getSelectedUsers(ids: string[]) {
    return ids
      .map((uid) => availableUsers.find((availableUser) => availableUser.uid === uid))
      .filter(Boolean) as UserOption[];
  }

  function getTakenPlayerIds(exceptSide: "home" | "away") {
    return exceptSide === "home" ? awayPlayerIds : homePlayerIds;
  }

  function updateRacketPlayerSelection(
    side: "home" | "away",
    index: number,
    uid: string
  ) {
    const sideSize = getRacketSideSize(competitionFormat);

    if (side === "home") {
      setHomePlayerIds((current) => {
        const next = [...current].slice(0, sideSize);
        next[index] = uid;
        const cleaned = next.filter(Boolean);
        setSelectedPlayerIds(Array.from(new Set([...cleaned, ...awayPlayerIds])));
        return cleaned;
      });
      return;
    }

    setAwayPlayerIds((current) => {
      const next = [...current].slice(0, sideSize);
      next[index] = uid;
      const cleaned = next.filter(Boolean);
      setSelectedPlayerIds(Array.from(new Set([...homePlayerIds, ...cleaned])));
      return cleaned;
    });
  }

  function handleCompetitionFormatChange(nextFormat: CompetitionFormat) {
    setCompetitionFormat(nextFormat);

    if (normalizeSport(sport) === "padel" || normalizeSport(sport) === "tennis") {
      const sideSize = getRacketSideSize(nextFormat);
      const selectedIds = availableUsers.map((availableUser) => availableUser.uid);

      setHomePlayerIds(selectedIds.slice(0, sideSize));
      setAwayPlayerIds(selectedIds.slice(sideSize, sideSize * 2));
      setSelectedPlayerIds(selectedIds.slice(0, sideSize * 2));
      setSlots(String(sideSize * 2));
    }
  }

  async function handleGroupChange(nextGroupId: string) {
    setGroupId(nextGroupId);
    setHomeTeamId("");
    setAwayTeamId("");

    if (!nextGroupId) {
      handleSportChange(userSport);
      setCity(userCity);
      await loadGroupMembers("");
      await loadGroupTeams("");
      return;
    }

    const selectedGroup = groups.find((group) => group.id === nextGroupId);

    if (
      selectedGroup?.sport &&
      normalizeSport(selectedGroup.sport) !== userSport
    ) {
      setMessage("Questo gruppo appartiene a un altro sport. Usa un profilo sport compatibile.");
      setGroupId("");
      handleSportChange(userSport);
      setCity(userCity);
      await loadGroupMembers("");
      await loadGroupTeams("");
      return;
    }

    handleSportChange(normalizeSport(selectedGroup?.sport || userSport));

    if (selectedGroup?.city) {
      setCity(selectedGroup.city);
    } else {
      setCity(userCity);
    }

    await loadGroupMembers(nextGroupId);
    await loadGroupTeams(nextGroupId);
  }

  async function createMatch(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: creazione match bloccata.");
      return;
    }

    const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
    const freshProfile = freshProfileSnap.exists()
      ? (freshProfileSnap.data() as UserProfile)
      : null;

    if (isProfileDeletionRequested(freshProfile)) {
      setAccountLocked(true);
      setMessage("Profilo non attivo: creazione match bloccata.");
      return;
    }

    const activeSport = getProfileActiveSport(freshProfile);
    const matchCopy = getMatchCopy(activeSport);

    if (normalizeSport(sport) !== activeSport || activeSport !== normalizeSport(userSport)) {
      setUserSport(activeSport);
      handleSportChange(activeSport);
      setMessage("Il match usa solo lo sport attivo del profilo.");
      return;
    }

   const selectedGroup = groups.find((group) => group.id === groupId);

if (
  selectedGroup?.sport &&
  normalizeSport(selectedGroup.sport) !== activeSport
) {
  setMessage("Questo gruppo non appartiene allo sport attivo del profilo.");
  return;
}

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

let homeTeamName = activeSport === "calcetto" ? "Squadra 1" : matchCopy.teamA;
let awayTeamName = activeSport === "calcetto" ? "Squadra 2" : matchCopy.teamB;
let matchHomeTeamId = "";
let matchAwayTeamId = "";
let homeCaptainId = "";
let awayCaptainId = "";
let sourceType = matchmakingSourceId ? "matchmaking" : "manual";

if (activeSport === "calcetto" && selectedHomeTeam && selectedAwayTeam) {
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
homeCaptainId = selectedHomeTeam.captainId || selectedHomeTeam.createdBy || "";
awayCaptainId = selectedAwayTeam.captainId || selectedAwayTeam.createdBy || "";
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
} else if (activeSport !== "calcetto") {
  const sideSize = getRacketSideSize(competitionFormat);
  const requiredPlayers = getRequiredRacketPlayers(competitionFormat);
  const allSelectedIds = [...homePlayerIds, ...awayPlayerIds].filter(Boolean);
  const uniqueSelectedIds = Array.from(new Set(allSelectedIds));

  if (!groupId && !matchmakingSourceId) {
    setMessage("Per creare match padel o tennis seleziona prima un gruppo.");
    return;
  }

  if (
    homePlayerIds.length !== sideSize ||
    awayPlayerIds.length !== sideSize ||
    uniqueSelectedIds.length !== requiredPlayers
  ) {
    setMessage(
      `${sportLabel(activeSport)} ${competitionFormat} richiede ${requiredPlayers} utenti del gruppo, senza duplicati.`
    );
    return;
  }

  const homeUsers = getSelectedUsers(homePlayerIds);
  const awayUsers = getSelectedUsers(awayPlayerIds);

  if (homeUsers.length !== sideSize || awayUsers.length !== sideSize) {
    setMessage("Seleziona utenti validi dal gruppo per entrambe le parti.");
    return;
  }

  homeTeamName = buildRacketTeamName(homeUsers);
  awayTeamName = buildRacketTeamName(awayUsers);
  homeCaptainId = homeUsers[0]?.uid || "";
  awayCaptainId = awayUsers[0]?.uid || "";
  sourceType = matchmakingSourceId ? "matchmaking" : "groupPlayers";

  matchPlayers = [
    ...homeUsers.map((selectedUser) => ({
      uid: selectedUser.uid,
      name: getUserDisplayName(selectedUser),
      team: "home" as const,
      goals: 0,
      assists: 0,
      isMvp: false,
    })),
    ...awayUsers.map((selectedUser) => ({
      uid: selectedUser.uid,
      name: getUserDisplayName(selectedUser),
      team: "away" as const,
      goals: 0,
      assists: 0,
      isMvp: false,
    })),
  ];

  setSelectedPlayerIds(matchPlayers.map((player) => player.uid));
} else {
  const selectedUsers = availableUsers.filter((availableUser) =>
    selectedPlayerIds.includes(availableUser.uid)
  );

  const minimumPlayers = 2;

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

  homeCaptainId = matchPlayers.find((player) => player.team === "home")?.uid || "";
  awayCaptainId = matchPlayers.find((player) => player.team === "away")?.uid || "";
}

    setSaving(true);
    setMessage("");

    try {
      if (matchmakingSourceId) {
        const freshRequestSnap = await getDoc(
          doc(db, "matchmakingRequests", matchmakingSourceId)
        );

        if (!freshRequestSnap.exists()) {
          setMessage("Annuncio matchmaking non trovato. Torna al matchmaking e riprova.");
          setSaving(false);
          return;
        }

        const freshRequest = freshRequestSnap.data() as MatchmakingRequestDoc;

        if (freshRequest.createdBy !== user.uid) {
          setMessage("Solo il creator dell'annuncio può creare il match.");
          setSaving(false);
          return;
        }

        if (freshRequest.linkedMatchId || freshRequest.status === "match_created") {
          setMessage("Questo annuncio ha già un match collegato. Apri il match esistente dal matchmaking.");
          setSaving(false);
          return;
        }
      }

      const matchRef = await addDoc(collection(db, "matches"), {
        groupId: groupId || "nessun-gruppo",
        matchmakingRequestId: matchmakingSourceId || "",
        createdBy: user.uid,
        createdByName:
          freshProfile?.name ||
          freshProfile?.nickname ||
          user.displayName ||
          "Rivalo Player",

        name: matchName,
        sport: activeSport,
        activeSport,
        creatorSport: activeSport,
        sportProfileId: getSportProfileId(user.uid, activeSport),
        competitionFormat,
        scoreMode: matchCopy.scoreMode,
        sportStatsMode: matchCopy.scoreMode,
        city,
        field,
        date,
        time,
        mode: "amichevole",
        isRanked: false,
        competitive: false,
        sourceLabel: matchmakingSourceId ? "matchmaking" : "",
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
homeCaptainId,
awayCaptainId,
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

      if (matchmakingSourceId) {
        await updateDoc(doc(db, "matchmakingRequests", matchmakingSourceId), {
          linkedMatchId: matchRef.id,
          status: "match_created",
          updatedAt: serverTimestamp(),
        });
      }

      const notifyParticipantIds = Array.from(
        new Set(matchPlayers.map((player) => player.uid).filter(Boolean))
      ).filter((uid) => uid !== user.uid);

      await Promise.all(
        notifyParticipantIds.map((uid) =>
          createNotification({
            uid,
            type: "new_match",
            title: "Nuovo match amichevole",
            message: `${matchName || "Match amichevole"} è stato creato su Rivalo.`,
            link: `/match/${matchRef.id}`,
            createdBy: user.uid,
            metadata: {
              matchId: matchRef.id,
              sourceType,
              matchmakingRequestId: matchmakingSourceId || "",
              activeSport,
              isRanked: false,
            },
          })
        )
      );

      setMatchmakingSourceId("");
      setMatchName("");
      setField("");
      setDate("");
      setTime("");

      if (activeSport === "calcetto") {
        setCompetitionFormat("squadre");
        setSlots("10");
      } else if (activeSport === "padel") {
        setCompetitionFormat("doppio");
        setSlots("4");
      } else {
        setCompetitionFormat("singolo");
        setSlots("2");
      }

      setHomePlayerIds(availableUsers.slice(0, 2).map((player) => player.uid));
      setAwayPlayerIds(availableUsers.slice(2, 4).map((player) => player.uid));

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

  const pageCopy = getMatchCopy(sport);
  const timeOptions = getMatchTimeOptions();

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
                  {pageCopy.title} / Amichevole
                </h1>
              </div>
            </div>

            <form onSubmit={createMatch} className="space-y-4 sm:space-y-5">
              {accountLocked && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  Profilo non attivo: la creazione di nuovi match è bloccata.
                </div>
              )}

              <fieldset disabled={accountLocked || saving} className="space-y-4 sm:space-y-5 disabled:opacity-60">
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
                <Field label="Sport profilo">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black capitalize text-cyan-200">
                      {sportLabel(sport)}
                    </div>

                    <span className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                      Bloccato
                    </span>
                  </div>

                  <div className="mt-2 text-xs leading-5 text-slate-400">
                    Per creare match in un altro sport servirà un profilo sport separato.
                  </div>
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
                    handleCompetitionFormatChange(e.target.value as CompetitionFormat)
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

                <div className="mt-2 text-xs leading-5 text-slate-400">
                  {pageCopy.formatHelp}
                </div>
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

              {(sport === "padel" || sport === "tennis") && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4">
                  <div className="text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                    Selezione {competitionFormat === "doppio" ? "coppie" : "player"}
                  </div>

                  <div className="mt-2 text-sm font-bold leading-6 text-cyan-100">
                    Seleziona gli utenti dal gruppo. Niente nomi scritti a mano: Rivalo userà questi profili per squadre, partecipanti e rivalità.
                  </div>

                  {!groupId && (
                    <div className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-sm font-bold text-yellow-100">
                      Per padel e tennis seleziona un gruppo con almeno {getRequiredRacketPlayers(competitionFormat)} utenti.
                    </div>
                  )}

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <RacketSideSelector
                      title={competitionFormat === "doppio" ? pageCopy.teamA : "Player 1"}
                      side="home"
                      sideSize={getRacketSideSize(competitionFormat)}
                      availableUsers={availableUsers}
                      selectedIds={homePlayerIds}
                      takenIds={getTakenPlayerIds("home")}
                      onChange={updateRacketPlayerSelection}
                    />

                    <RacketSideSelector
                      title={competitionFormat === "doppio" ? pageCopy.teamB : "Player 2"}
                      side="away"
                      sideSize={getRacketSideSize(competitionFormat)}
                      availableUsers={availableUsers}
                      selectedIds={awayPlayerIds}
                      takenIds={getTakenPlayerIds("away")}
                      onChange={updateRacketPlayerSelection}
                    />
                  </div>
                </div>
              )}

              {sport === "calcetto" && (
                <Field label={pageCopy.participantsLabel}>
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
              )}

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

              {(field.trim() || city.trim()) && (
                <div className="overflow-hidden rounded-[1.5rem] border border-cyan-400/20 bg-black/30">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                        Mappa campo
                      </div>

                      <div className="mt-1 text-xs text-slate-400">
                        Risultati per: {field || "Campo"} {city}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${field} ${city}`.trim()
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200"
                    >
                      Apri Maps
                    </a>
                  </div>

                  <iframe
                    title="Mappa campo match"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${field} ${city}`.trim()
                    )}&output=embed`}
                    className="h-[260px] w-full border-0"
                    loading="lazy"
                  />
                </div>
              )}

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
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full min-w-0 bg-[#0b1730] text-white outline-none"
                    required
                  >
                    <option className="bg-[#020617] text-white" value="">
                      Seleziona ora
                    </option>

                    {timeOptions.map((option) => (
                      <option
                        key={option}
                        value={option}
                        className="bg-[#020617] text-white"
                      >
                        {option}
                      </option>
                    ))}
                  </select>
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
                disabled={saving || accountLocked}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {accountLocked
                  ? "Creazione bloccata"
                  : saving
                  ? "Creazione..."
                  : "Crea match rapido"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              </fieldset>

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
              title={pageCopy.participantsLabel}
              text="Nel match privato puoi scegliere solo membri del gruppo collegato e compatibili con lo sport attivo."
            />

            <InfoCard
              icon={<Trophy size={28} />}
              title="Sport profilo"
              text="Il match rapido usa solo lo sport del profilo attivo, senza mischiare statistiche."
            />

            <InfoCard
              icon={<ShieldCheck size={28} />}
              title="FairPlay"
              text="Risultato proposto, confermato o contestato."
            />

            <InfoCard
              icon={<Clock size={28} />}
              title="Post-partita"
              text={pageCopy.postMatchText}
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

function RacketSideSelector({
  title,
  side,
  sideSize,
  availableUsers,
  selectedIds,
  takenIds,
  onChange,
}: {
  title: string;
  side: "home" | "away";
  sideSize: number;
  availableUsers: UserOption[];
  selectedIds: string[];
  takenIds: string[];
  onChange: (side: "home" | "away", index: number, uid: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-black text-cyan-100">
        {title}
      </div>

      <div className="mt-3 grid gap-3">
        {Array.from({ length: sideSize }).map((_, index) => (
          <select
            key={`${side}-${index}`}
            value={selectedIds[index] || ""}
            onChange={(e) => onChange(side, index, e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none"
          >
            <option value="" className="bg-[#020617] text-white">
              Seleziona utente {index + 1}
            </option>

            {availableUsers.map((availableUser) => {
              const disabled =
                takenIds.includes(availableUser.uid) ||
                selectedIds.some(
                  (selectedId, selectedIndex) =>
                    selectedIndex !== index && selectedId === availableUser.uid
                );

              return (
                <option
                  key={availableUser.uid}
                  value={availableUser.uid}
                  disabled={disabled}
                  className="bg-[#020617] text-white"
                >
                  {getUserDisplayName(availableUser)}
                </option>
              );
            })}
          </select>
        ))}
      </div>
    </div>
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
  const matchCopy = getMatchCopy(match.sport);
  const isCancelled =
    match.status === "annullato" || match.resultStatus === "annullato";

  const isOfficial =
    match.status === "ufficiale" || match.resultStatus === "confermato";

  const isDisputed =
    match.status === "contestato" || match.resultStatus === "contestato";

  const isProposed =
    match.status === "in_attesa_conferma" ||
    match.resultStatus === "proposto";

  const scoreIsVisible =
    typeof match.homeScore === "number" && typeof match.awayScore === "number";

  const statusLabel = isCancelled
    ? "Annullato"
    : isOfficial
    ? "Ufficiale"
    : isDisputed
    ? "Contestato"
    : isProposed
    ? "Da confermare"
    : "Programmato";

  const statusClass = isCancelled
    ? "border-red-400/30 bg-red-500/15 text-red-200"
    : isOfficial
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

  const mapQuery = `${match.field || ""} ${match.city || ""}`.trim();

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[1.7rem] border p-4 transition sm:p-5 ${
        isCancelled
          ? "border-red-400/20 bg-red-500/[.06] opacity-80 hover:border-red-400/30"
          : "border-white/10 bg-[#0b1730] hover:border-cyan-400/30 hover:bg-[#112041] lg:hover:scale-[1.02]"
      }`}
    >
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

          <div className="flex flex-wrap gap-2">
            {isCancelled && (
              <div className="w-fit rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm font-black uppercase text-red-200">
                Annullato
              </div>
            )}

            <div className="w-fit rounded-xl bg-cyan-400/10 px-3 py-2 text-sm font-black uppercase text-cyan-300">
              {sportLabel(match.sport)}
            </div>
          </div>
        </div>

        {scoreIsVisible && (
          <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 p-4 text-center">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
              {matchCopy.resultLabel}
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
          <Badge>{match.scoreMode === "racket" ? "no gol/assist" : "gol/assist"}</Badge>

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

        {mapQuery && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              mapQuery
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black text-cyan-200"
          >
            <MapPin size={14} />
            Apri Maps
          </a>
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