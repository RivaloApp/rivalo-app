"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createActivity } from "../../../lib/createActivity";
import { createNotification } from "../../../lib/createNotification";

import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";

import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Trophy,
  Users,
  ShieldCheck,
  Clock,
  UserPlus,
  UserRound,
  Share2,
  PlayCircle,
  Crown,
  Medal,
  Star,
} from "lucide-react";

type CompetitionFormat = "singolo" | "squadre" | "doppio";

type BracketMatch = {
  round: number;
  matchNumber: number;
  homeTeamId?: string;
  awayTeamId?: string;
  homeName: string;
  awayName: string;
  winnerTeamId?: string;
  matchId?: string;
  status?: string;
  resultStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type LeagueFixture = {
  round: number;
  matchNumber: number;
  homeTeamId: string;
  awayTeamId: string;
  homeName: string;
  awayName: string;
  matchId?: string;
  status?: string;
  resultStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type ParticipantInfo = {
  uid: string;
  name?: string;
  photoUrl?: string;
};

type TeamInfo = {
  id: string;
  name: string;
  players: ParticipantInfo[];
  createdBy?: string;
  captainId?: string;
  captainName?: string;
};

type UserOption = {
  uid: string;
  name?: string;
  nickname?: string;
  photoUrl?: string;
  photoURL?: string;
};

type EventStat = {
  id: string;
  eventId?: string;
  uid: string;
  playerName?: string;
  sport?: string;
  points?: number;
  matchesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goals?: number;
  assists?: number;
  mvp?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  photoUrl?: string;
  teamId?: string;
  teamName?: string;
};

type TeamStat = {
  id: string;
  eventId?: string;
  teamId?: string;
  teamName?: string;
  points?: number;
  matchesPlayed?: number;
  wins?: number;
  draws?: number;
  losses?: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  sport?: string;
};

type EventData = {
  id: string;
  title?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  type?: string;
  competitionFormat?: CompetitionFormat;
  scoreMode?: "football" | "racket";
  sportStatsMode?: "football" | "racket";
  maxPlayers?: number;
  prize?: string;
  status?: string;
  cancelledAt?: any;
  cancelledBy?: string;
  cancellationReason?: string;
  participants?: string[];
  participantsInfo?: ParticipantInfo[];
  teams?: TeamInfo[];
  createdBy?: string;
  createdByName?: string;
  linkedMatchId?: string;
linkedMatchIds?: string[];
bracket? : BracketMatch[];
leagueFixtures?: LeagueFixture[];
};

type UserProfile = {
  mainSport?: string;
  sport?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

function normalizeSport(value?: string) {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";
  return "calcetto";
}

function formatSportLabel(value?: string) {
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
      teamLabel: "Coppie / player",
      teamSingle: "Coppia",
      teamPlural: "Coppie",
      scoreFor: "SF",
      scoreAgainst: "SS",
      scoreDiff: "DS",
      rankingTitle: "Ranking padel",
      rankingText: "Classifica basata su punti, vittorie e score dei match confermati. Gol e assist non vengono usati.",
      matchStatsMode: "no gol/assist",
    };
  }

  if (sport === "tennis") {
    return {
      teamLabel: "Player / coppie",
      teamSingle: "Player/Coppia",
      teamPlural: "Player/Coppie",
      scoreFor: "SF",
      scoreAgainst: "SS",
      scoreDiff: "DS",
      rankingTitle: "Ranking tennis",
      rankingText: "Classifica basata su punti, vittorie e score dei match confermati. Gol e assist non vengono usati.",
      matchStatsMode: "no gol/assist",
    };
  }

  return {
    teamLabel: "Squadre",
    teamSingle: "Squadra",
    teamPlural: "Squadre",
    scoreFor: "GF",
    scoreAgainst: "GS",
    scoreDiff: "DR",
    rankingTitle: "Ranking competizione",
    rankingText: "Classifica basata su punti, vittorie, gol fatti e differenza reti.",
    matchStatsMode: "gol/assist",
  };
}

function isProfileDeletionRequested(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function isUserCandidateActive(data: any) {
  return !(
    data?.accountStatus === "deletion_requested" ||
    data?.accountStatus === "deleted" ||
    data?.deletionRequested
  );
}

function getParticipantName(participant?: ParticipantInfo) {
  return participant?.name || "Rivalo Player";
}

function buildAutoTeamName(players: ParticipantInfo[], format: CompetitionFormat) {
  if (format === "singolo") {
    return getParticipantName(players[0]);
  }

  return players.map(getParticipantName).join(" / ") || "Da definire";
}

function buildSinglePlayerUnits(players: ParticipantInfo[]) {
  return players.map((player) => ({
    id: player.uid,
    name: getParticipantName(player),
    players: [player],
    createdBy: player.uid,
    captainId: player.uid,
    captainName: getParticipantName(player),
  })) as TeamInfo[];
}

function getCompetitionUnits({
  event,
  participantsInfo,
}: {
  event: EventData;
  participantsInfo: ParticipantInfo[];
}) {
  const competitionFormat =
    event.competitionFormat ||
    (normalizeSport(event.sport) === "calcetto" ? "squadre" : "singolo");

  if (competitionFormat === "singolo" && isRacketSport(event.sport)) {
    return buildSinglePlayerUnits(participantsInfo);
  }

  return event.teams || [];
}

function getNextPowerOfTwo(value: number) {
  if (value <= 2) return 2;

  return Math.pow(2, Math.ceil(Math.log2(value)));
}

function getRoundName(round: number, totalRounds: number) {
  const remainingRounds = totalRounds - round + 1;

  if (remainingRounds === 1) return "Finale";
  if (remainingRounds === 2) return "Semifinali";
  if (remainingRounds === 3) return "Quarti";
  if (remainingRounds === 4) return "Ottavi";

  return `Round ${round}`;
}

function buildTournamentBracket(units: TeamInfo[]) {
  const shuffledTeams = [...units].sort(() => Math.random() - 0.5);
  const bracketSize = getNextPowerOfTwo(shuffledTeams.length);
  const totalRounds = Math.ceil(Math.log2(bracketSize));
  const firstRoundMatches = bracketSize / 2;
  const bracket: BracketMatch[] = [];

  let matchNumber = 1;

  for (let index = 0; index < firstRoundMatches; index++) {
    const homeTeam = shuffledTeams[index * 2];
    const awayTeam = shuffledTeams[index * 2 + 1];

    if (!homeTeam) continue;

    bracket.push({
      round: 1,
      matchNumber: matchNumber++,
      homeTeamId: homeTeam.id,
      awayTeamId: awayTeam?.id || "",
      homeName: homeTeam.name || "Da definire",
      awayName: awayTeam?.name || "Riposo",
      winnerTeamId: awayTeam ? "" : homeTeam.id,
      matchId: "",
      status: awayTeam ? "programmato" : "riposo",
      resultStatus: awayTeam ? "da_creare" : "confermato",
      homeScore: null,
      awayScore: null,
    });
  }

  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.max(1, bracketSize / Math.pow(2, round));

    for (let index = 0; index < matchesInRound; index++) {
      bracket.push({
        round,
        matchNumber: matchNumber++,
        homeTeamId: "",
        awayTeamId: "",
        homeName: `Vincitore match ${index * 2 + 1}`,
        awayName: `Vincitore match ${index * 2 + 2}`,
        winnerTeamId: "",
        matchId: "",
        status: "in_attesa",
        resultStatus: "in_attesa",
        homeScore: null,
        awayScore: null,
      });
    }
  }

  return bracket;
}

function getTeamCreationTitle(format: CompetitionFormat, sport?: string) {
  if (isRacketSport(sport)) {
    if (format === "singolo") return "Crea player";
    if (format === "doppio") return "Crea coppia";
  }

  return "Crea squadra";
}

function getTeamPluralLabel(format: CompetitionFormat, sport?: string) {
  if (isRacketSport(sport)) {
    if (format === "singolo") return "Player";
    if (format === "doppio") return "Coppie";
  }

  return "Squadre";
}

function canManageEventTeam({
  userId,
  event,
  team,
}: {
  userId?: string;
  event: EventData;
  team: TeamInfo;
}) {
  if (!userId) return false;

  if (userId === event.createdBy) return true;
  if (userId === team.captainId) return true;
  if (!team.captainId && userId === team.createdBy) return true;

  return false;
}

function isEventCancelled(event: EventData) {
  return event.status === "annullato";
}

function hasCreatedEventMatches(event: EventData) {
  const linkedIds = Array.isArray(event.linkedMatchIds)
    ? event.linkedMatchIds.filter(Boolean)
    : [];

  const hasLinkedMatch =
    Boolean(event.linkedMatchId) || linkedIds.length > 0;

  const hasBracketMatch = Array.isArray(event.bracket)
    ? event.bracket.some((match) => Boolean(match.matchId))
    : false;

  const hasLeagueMatch = Array.isArray(event.leagueFixtures)
    ? event.leagueFixtures.some((fixture) => Boolean(fixture.matchId))
    : false;

  return hasLinkedMatch || hasBracketMatch || hasLeagueMatch;
}

function hasStartedEvent(event: EventData) {
  return (
    Boolean(event.bracket && event.bracket.length > 0) ||
    Boolean(event.leagueFixtures && event.leagueFixtures.length > 0) ||
    event.status === "tabellone creato" ||
    event.status === "calendario creato" ||
    event.status === "in corso" ||
    event.status === "torneo completato" ||
    event.status === "campionato completato"
  );
}

function canCancelEventSafely(event: EventData) {
  if (isEventCancelled(event)) return false;
  if (hasCreatedEventMatches(event)) return false;
  if (hasStartedEvent(event)) return false;

  return true;
}

function getEventCancelBlockedReason(event: EventData) {
  if (isEventCancelled(event)) {
    return "Evento già annullato.";
  }

  if (hasCreatedEventMatches(event)) {
    return "Evento con match già creati. Annullamento diretto bloccato per proteggere risultati e statistiche.";
  }

  if (hasStartedEvent(event)) {
    return "Competizione già iniziata. Annullamento diretto bloccato.";
  }

  return "";
}

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [sportMismatch, setSportMismatch] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [event, setEvent] = useState<EventData | null>(null);
  const [participantsInfo, setParticipantsInfo] = useState<ParticipantInfo[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [candidateUsers, setCandidateUsers] = useState<UserOption[]>([]);
  const [selectedUserToAdd, setSelectedUserToAdd] = useState("");
  const [addingUser, setAddingUser] = useState(false);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [generatingLeague, setGeneratingLeague] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [cancellationReason, setCancellationReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [creatingTeam, setCreatingTeam] = useState(false);
  const [creatingMatch, setCreatingMatch] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadEvent(currentUser.uid);
    });

    return () => unsub();
  }, [id]);

  async function loadEvent(currentUserId = user?.uid || "") {
    if (!id) return;

    setLoading(true);
    setSportMismatch(false);
    setAccountLocked(false);

    try {
      const snap = await getDoc(doc(db, "events", id));

      if (!snap.exists()) {
        setEvent(null);
        return;
      }

      const eventData = {
        id: snap.id,
        ...(snap.data() as Omit<EventData, "id">),
      };

      const profileSnap = currentUserId
        ? await getDoc(doc(db, "users", currentUserId))
        : null;

      const profile = profileSnap?.exists()
        ? (profileSnap.data() as UserProfile)
        : null;

      const currentUserSport = normalizeSport(
        profile?.mainSport || profile?.sport || "calcetto"
      );

      setUserSport(currentUserSport);
      setAccountLocked(isProfileDeletionRequested(profile));
      setCancellationReason(eventData.cancellationReason || "");
      setEvent(eventData);

      if (normalizeSport(eventData.sport) !== currentUserSport) {
        setSportMismatch(true);
        setParticipantsInfo([]);
        setAvailableUsers([]);
        setCandidateUsers([]);
        setEventStats([]);
        setTeamStats([]);
        return;
      }

      const savedInfo = Array.isArray(eventData.participantsInfo)
  ? eventData.participantsInfo
  : [];

const participants = Array.isArray(eventData.participants)
  ? eventData.participants
  : [];

const participantsResult: ParticipantInfo[] = [];

for (const uid of participants) {
  const alreadySaved = savedInfo.find((p) => p.uid === uid);

  let userName = alreadySaved?.name || "Rivalo Player";
  let userPhoto = alreadySaved?.photoUrl || "";

  try {
    const userSnap = await getDoc(doc(db, "users", uid));

    if (userSnap.exists()) {
      const userData = userSnap.data();

      userName =
        userData.name ||
        userData.nickname ||
        alreadySaved?.name ||
        "Rivalo Player";

      userPhoto =
        userData.photoUrl ||
        userData.photoURL ||
        alreadySaved?.photoUrl ||
        "";
    }
  } catch {
    // Se il profilo non si legge, usa i dati salvati nell'evento
  }

  participantsResult.push({
    uid,
    name: userName,
    photoUrl: userPhoto,
  });
}

setParticipantsInfo(participantsResult);

setAvailableUsers(
  participantsResult.map((participant) => ({
    uid: participant.uid,
    name: participant.name || "Rivalo Player",
    nickname: "",
    photoUrl: participant.photoUrl || "",
    photoURL: participant.photoUrl || "",
  }))
);

const usersSnap = await getDocs(collection(db, "users"));
const candidateUsersResult: UserOption[] = [];

usersSnap.docs.forEach((userDoc) => {
  const data = userDoc.data() as any;
  const candidateSport = normalizeSport(data.mainSport || data.sport || "calcetto");

  if (candidateSport !== normalizeSport(eventData.sport)) return;
  if (!isUserCandidateActive(data)) return;
  if (participants.includes(userDoc.id)) return;

  candidateUsersResult.push({
    uid: userDoc.id,
    name: data.name || data.nickname || "Rivalo Player",
    nickname: data.nickname || "",
    photoUrl: data.photoUrl || data.photoURL || "",
    photoURL: data.photoURL || data.photoUrl || "",
  });
});

setCandidateUsers(
  candidateUsersResult.sort((a, b) =>
    getParticipantName({ uid: a.uid, name: a.name }).localeCompare(
      getParticipantName({ uid: b.uid, name: b.name })
    )
  )
);

      const statsQuery = query(
        collection(db, "eventStats"),
        where("eventId", "==", id)
      );

      const statsSnap = await getDocs(statsQuery);

      const statsResult = statsSnap.docs.map((docSnap) => {
        const data = docSnap.data() as any;

        const participant = participantsResult.find((p) => p.uid === data.uid);

        return {
          id: docSnap.id,
          ...data,
          playerName: data.playerName || participant?.name || "Rivalo Player",
          photoUrl: participant?.photoUrl || "",
          points: Number(data.points || 0),
          matchesPlayed: Number(data.matchesPlayed || 0),
          wins: Number(data.wins || 0),
          draws: Number(data.draws || 0),
          losses: Number(data.losses || 0),
          goals: Number(data.goals || 0),
          assists: Number(data.assists || 0),
          mvp: Number(data.mvp || 0),
          goalsFor: Number(data.goalsFor || 0),
          goalsAgainst: Number(data.goalsAgainst || 0),
          goalDifference: Number(data.goalDifference || 0),
        };
      });

      setEventStats(statsResult);
      const teamStatsQuery = query(
  collection(db, "teamEventStats"),
  where("eventId", "==", id)
);

const teamStatsSnap = await getDocs(teamStatsQuery);

const teamStatsResult = teamStatsSnap.docs.map((docSnap) => {
  const data = docSnap.data() as any;

  return {
    id: docSnap.id,
    ...data,
    points: Number(data.points || 0),
    matchesPlayed: Number(data.matchesPlayed || 0),
    wins: Number(data.wins || 0),
    draws: Number(data.draws || 0),
    losses: Number(data.losses || 0),
    goalsFor: Number(data.goalsFor || 0),
    goalsAgainst: Number(data.goalsAgainst || 0),
  };
});

setTeamStats(teamStatsResult);
    } finally {
      setLoading(false);
    }
  }

  async function joinEvent() {
    if (!user || !event) return;

    if (accountLocked) {
      setMessage("Profilo segnato per rimozione: non puoi iscriverti agli eventi.");
      return;
    }

    if (sportMismatch || normalizeSport(event.sport) !== userSport) {
      setMessage("Questo evento appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    if (isEventCancelled(event)) {
      setMessage("Evento annullato. Non puoi iscriverti.");
      return;
    }

    const competitionStarted =
  Boolean(event.bracket && event.bracket.length > 0) ||
  Boolean(event.leagueFixtures && event.leagueFixtures.length > 0) ||
  event.status === "tabellone creato" ||
  event.status === "calendario creato" ||
  event.status === "torneo completato" ||
  event.status === "campionato completato";

if (competitionStarted) {
  setMessage("Le iscrizioni sono chiuse perché la competizione è già iniziata.");
  return;
}

    const participants = event.participants || [];

    if (participants.includes(user.uid)) {
      setMessage("Sei già iscritto a questo evento.");
      return;
    }

    const maxPlayers = Number(event.maxPlayers || 0);

    if (maxPlayers > 0 && participants.length >= maxPlayers) {
      setMessage("Evento pieno.");
      return;
    }

    setJoining(true);
    setMessage("");

    try {
      let participantName = user.displayName || "Rivalo Player";
      let participantPhoto = user.photoURL || "";

      const userSnap = await getDoc(doc(db, "users", user.uid));

      if (userSnap.exists()) {
        const data = userSnap.data();

        participantName = data.name || data.nickname || participantName;
        participantPhoto = data.photoUrl || data.photoURL || participantPhoto;
      }

      const newParticipant: ParticipantInfo = {
        uid: user.uid,
        name: participantName,
        photoUrl: participantPhoto,
      };

      const newParticipantsCount = participants.length + 1;

      const nextStatus =
        maxPlayers > 0 && newParticipantsCount >= maxPlayers
          ? "completo"
          : "aperto";
          const eventWillBeFull =
  maxPlayers > 0 && newParticipantsCount >= maxPlayers;

      await updateDoc(doc(db, "events", event.id), {
        participants: arrayUnion(user.uid),
        participantsInfo: arrayUnion(newParticipant),
        status: nextStatus,
        updatedAt: serverTimestamp(),
      });

      await createActivity({
        uid: user.uid,
        type: "event",
        text: `Si è iscritto a: ${event.title || "Evento Rivalo"}`,
        value: 1,
      });

      if (eventWillBeFull && event.createdBy && event.createdBy !== user.uid) {
  await createNotification({
    uid: event.createdBy,
    type: "event_full",
    title: "Evento pieno",
    message: `${event.title || "Il tuo evento Rivalo"} ha raggiunto il numero massimo di partecipanti.`,
    link: "/events/" + event.id,
    createdBy: user.uid,
    metadata: {
      eventId: event.id,
      eventTitle: event.title || "Evento Rivalo",
      maxPlayers,
      participantsCount: newParticipantsCount,
    },
  });
}

      setEvent({
        ...event,
        participants: [...participants, user.uid],
        participantsInfo: [...(event.participantsInfo || []), newParticipant],
        status: nextStatus,
      });

      setParticipantsInfo([...participantsInfo, newParticipant]);
      setAvailableUsers([
  ...availableUsers,
  {
    uid: newParticipant.uid,
    name: newParticipant.name || "Rivalo Player",
    nickname: "",
    photoUrl: newParticipant.photoUrl || "",
    photoURL: newParticipant.photoUrl || "",
  },
]);

      setMessage("Iscrizione confermata.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'iscrizione.");
    }

    setJoining(false);
  }

async function addUserToEvent() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi aggiungere utenti.");
    return;
  }

  if (user.uid !== event.createdBy) {
    setMessage("Solo il creator può aggiungere utenti all'evento.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Non puoi aggiungere utenti a un evento di un altro sport.");
    return;
  }

  if (isEventCancelled(event)) {
    setMessage("Evento annullato. Non puoi aggiungere utenti.");
    return;
  }

  const competitionStarted =
    Boolean(event.bracket && event.bracket.length > 0) ||
    Boolean(event.leagueFixtures && event.leagueFixtures.length > 0) ||
    event.status === "tabellone creato" ||
    event.status === "calendario creato" ||
    event.status === "in corso" ||
    event.status === "torneo completato" ||
    event.status === "campionato completato";

  if (competitionStarted) {
    setMessage("Le iscrizioni sono chiuse perché la competizione è già iniziata.");
    return;
  }

  if (!selectedUserToAdd) {
    setMessage("Seleziona un utente da aggiungere.");
    return;
  }

  const participants = event.participants || [];

  if (participants.includes(selectedUserToAdd)) {
    setMessage("Questo utente è già iscritto all'evento.");
    return;
  }

  const maxPlayers = Number(event.maxPlayers || 0);

  if (maxPlayers > 0 && participants.length >= maxPlayers) {
    setMessage("Evento pieno.");
    return;
  }

  const selectedUser = candidateUsers.find(
    (candidate) => candidate.uid === selectedUserToAdd
  );

  if (!selectedUser) {
    setMessage("Utente non disponibile o non compatibile con questo sport.");
    return;
  }

  const newParticipant: ParticipantInfo = {
    uid: selectedUser.uid,
    name: selectedUser.name || selectedUser.nickname || "Rivalo Player",
    photoUrl: selectedUser.photoUrl || selectedUser.photoURL || "",
  };

  const newParticipantsCount = participants.length + 1;
  const nextStatus =
    maxPlayers > 0 && newParticipantsCount >= maxPlayers
      ? "completo"
      : "aperto";

  setAddingUser(true);
  setMessage("");

  try {
    await updateDoc(doc(db, "events", event.id), {
      participants: arrayUnion(newParticipant.uid),
      participantsInfo: arrayUnion(newParticipant),
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    await createNotification({
      uid: newParticipant.uid,
      type: "generic",
      title: "Sei stato aggiunto a un evento",
      message: `Sei stato aggiunto a ${event.title || "un evento Rivalo"}.`,
      link: "/events/" + event.id,
      createdBy: user.uid,
      metadata: {
        eventId: event.id,
        eventTitle: event.title || "Evento Rivalo",
      },
    });

    const nextParticipantsInfo = [...participantsInfo, newParticipant];

    setEvent({
      ...event,
      participants: [...participants, newParticipant.uid],
      participantsInfo: [...(event.participantsInfo || []), newParticipant],
      status: nextStatus,
    });

    setParticipantsInfo(nextParticipantsInfo);
    setAvailableUsers([
      ...availableUsers,
      {
        uid: newParticipant.uid,
        name: newParticipant.name || "Rivalo Player",
        nickname: "",
        photoUrl: newParticipant.photoUrl || "",
        photoURL: newParticipant.photoUrl || "",
      },
    ]);
    setCandidateUsers((current) =>
      current.filter((candidate) => candidate.uid !== newParticipant.uid)
    );
    setSelectedUserToAdd("");
    setMessage("Utente aggiunto all'evento.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante l'aggiunta dell'utente.");
  } finally {
    setAddingUser(false);
  }
}

 async function createTeam() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi creare squadre o coppie.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Non puoi creare squadre/coppie in un evento di un altro sport.");
    return;
  }

  if (isEventCancelled(event)) {
    setMessage("Evento annullato. Non puoi creare squadre/coppie.");
    return;
  }

    const competitionStarted =
    Boolean(event.bracket && event.bracket.length > 0) ||
    Boolean(event.leagueFixtures && event.leagueFixtures.length > 0) ||
    event.status === "tabellone creato" ||
    event.status === "calendario creato" ||
    event.status === "in corso" ||
    event.status === "torneo completato" ||
    event.status === "campionato completato";

  if (competitionStarted) {
    setMessage("Rose bloccate: la competizione è già iniziata.");
    return;
  }

  const competitionFormat =
    event.competitionFormat ||
    (normalizeSport(event.sport) === "calcetto" ? "squadre" : "singolo");

  const eventParticipants = event.participants || [];

  if (eventParticipants.length === 0) {
    setMessage("Prima devono esserci partecipanti iscritti all'evento.");
    return;
  }

  if (competitionFormat === "singolo" && selectedPlayerIds.length !== 1) {
    setMessage("Nel singolo devi selezionare esattamente 1 giocatore.");
    return;
  }

  if (competitionFormat === "doppio" && selectedPlayerIds.length !== 2) {
    setMessage("Nel doppio devi selezionare esattamente 2 giocatori.");
    return;
  }

  if (competitionFormat === "squadre") {
    const minPlayers = normalizeSport(event.sport) === "calcetto" ? 5 : 2;
    const maxPlayers = normalizeSport(event.sport) === "calcetto" ? 8 : 2;

    if (selectedPlayerIds.length < minPlayers) {
      setMessage(`Per questa squadra servono almeno ${minPlayers} giocatori.`);
      return;
    }

    if (selectedPlayerIds.length > maxPlayers) {
      setMessage(
        `Per questa squadra puoi selezionare massimo ${maxPlayers} giocatori.`
      );
      return;
    }
  }

  const invalidSelection = selectedPlayerIds.some(
    (uid) => !eventParticipants.includes(uid)
  );

  if (invalidSelection) {
    setMessage("Puoi selezionare solo giocatori iscritti a questo evento.");
    return;
  }

  const currentTeams = event.teams || [];

  const alreadyInTeam = currentTeams.some((team) =>
    team.players?.some((player) => selectedPlayerIds.includes(player.uid))
  );

  if (alreadyInTeam) {
    setMessage(
      "Uno o più giocatori selezionati sono già presenti in un'altra squadra/coppia dell'evento."
    );
    return;
  }

  if (!selectedPlayerIds.includes(user.uid)) {
    setMessage("Chi crea la squadra/coppia deve essere incluso nella rosa e diventa capitano.");
    return;
  }

  const selectedPlayers: ParticipantInfo[] = selectedPlayerIds.map((uid) => {
    const selectedUser = availableUsers.find((u) => u.uid === uid);

    return {
      uid,
      name: selectedUser?.name || selectedUser?.nickname || "Rivalo Player",
      photoUrl: selectedUser?.photoUrl || selectedUser?.photoURL || "",
    };
  });

  const autoTeamName = buildAutoTeamName(selectedPlayers, competitionFormat);
  const cleanTeamName = isRacketSport(event.sport)
    ? autoTeamName
    : teamName.trim();

  if (!cleanTeamName.trim()) {
    setMessage("Inserisci il nome della squadra.");
    return;
  }

  const duplicatedTeamName = (event.teams || []).some(
    (team) => team.name?.toLowerCase().trim() === cleanTeamName.toLowerCase()
  );

  if (duplicatedTeamName) {
    setMessage("Esiste già una squadra/coppia/player con questo nome nell'evento.");
    return;
  }

  const captainPlayer =
    selectedPlayers.find((player) => player.uid === user.uid) ||
    selectedPlayers[0];

  const newTeam: TeamInfo = {
    id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    name: cleanTeamName,
    players: selectedPlayers,
    createdBy: user.uid,
    captainId: captainPlayer?.uid || user.uid,
    captainName: getParticipantName(captainPlayer),
  };

  const nextTeams = [...currentTeams, newTeam];

  const currentParticipants = event.participants || [];
  const currentParticipantsInfo = event.participantsInfo || [];

  const mergedParticipants = Array.from(
    new Set([
      ...currentParticipants,
      ...selectedPlayers.map((player) => player.uid),
    ])
  );

  const mergedParticipantsInfo = [...currentParticipantsInfo];

  for (const player of selectedPlayers) {
    if (!mergedParticipantsInfo.some((p) => p.uid === player.uid)) {
      mergedParticipantsInfo.push(player);
    }
  }

  setCreatingTeam(true);
  setMessage("");

  try {
    await updateDoc(doc(db, "events", event.id), {
      teams: nextTeams,
      participants: mergedParticipants,
      participantsInfo: mergedParticipantsInfo,
      updatedAt: serverTimestamp(),
    });

    await createActivity({
      uid: user.uid,
      type: "event",
      text: `Squadra creata: ${newTeam.name}`,
      value: 1,
    });

    setEvent({
      ...event,
      teams: nextTeams,
      participants: mergedParticipants,
      participantsInfo: mergedParticipantsInfo,
    });

    setParticipantsInfo(mergedParticipantsInfo);
    setTeamName("");
    setSelectedPlayerIds([]);
    setMessage(`${getTeamCreationTitle(competitionFormat, event.sport)} creato. Il creator è stato impostato come capitano.`);
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la creazione della squadra.");
  } finally {
    setCreatingTeam(false);
  }
}

function getInvalidEventTeams() {
  if (!event) return [];

  const competitionFormat =
    event.competitionFormat ||
    (normalizeSport(event.sport) === "calcetto" ? "squadre" : "singolo");

  const teams = event.teams || [];

  return teams.filter((team) => {
    const playersCount = Array.isArray(team.players) ? team.players.length : 0;

    if (competitionFormat === "singolo" && (event.teams || []).length < 2) {
      return playersCount !== 1;
    }

    if (competitionFormat === "doppio") {
      return playersCount !== 2;
    }

    if (competitionFormat === "squadre") {
      const minPlayers = normalizeSport(event.sport) === "calcetto" ? 5 : 2;
      const maxPlayers = normalizeSport(event.sport) === "calcetto" ? 8 : 2;

      return playersCount < minPlayers || playersCount > maxPlayers;
    }

    return false;
  });
}

function validateTeamsForCompetition() {
  if (!event) return false;

  const competitionFormat =
    event.competitionFormat ||
    (normalizeSport(event.sport) === "calcetto" ? "squadre" : "singolo");

  const teams = getCompetitionUnits({ event, participantsInfo });

  if (teams.length < 2) {
    setMessage(
      competitionFormat === "singolo" && isRacketSport(event.sport)
        ? "Servono almeno 2 player iscritti per generare il tabellone."
        : "Servono almeno 2 squadre/coppie/player per iniziare."
    );
    return false;
  }

  if (competitionFormat === "singolo" && isRacketSport(event.sport)) {
    return true;
  }

  const invalidTeams = getInvalidEventTeams();

  if (invalidTeams.length > 0) {
    setMessage(
      "Ci sono squadre/coppie non valide. Controlla le rose prima di continuare."
    );
    return false;
  }

  const validTeams = teams.filter(
    (team) => !invalidTeams.some((invalidTeam) => invalidTeam.id === team.id)
  );

  if (validTeams.length < 2) {
    setMessage("Servono almeno 2 squadre/coppie valide per continuare.");
    return false;
  }

  return true;
}

function getTeamValidationLabel(team: TeamInfo) {
  if (!event) return "Da controllare";

  const competitionFormat =
    event.competitionFormat ||
    (normalizeSport(event.sport) === "calcetto" ? "squadre" : "singolo");

  const playersCount = Array.isArray(team.players) ? team.players.length : 0;

  if (competitionFormat === "singolo") {
    return playersCount === 1 ? "Valida" : "Serve 1 giocatore";
  }

  if (competitionFormat === "doppio") {
    return playersCount === 2 ? "Valida" : "Servono 2 giocatori";
  }

  if (competitionFormat === "squadre") {
    const minPlayers = normalizeSport(event.sport) === "calcetto" ? 5 : 2;
    const maxPlayers = normalizeSport(event.sport) === "calcetto" ? 8 : 2;

    if (playersCount < minPlayers) {
      return `Minimo ${minPlayers} giocatori`;
    }

    if (playersCount > maxPlayers) {
      return `Massimo ${maxPlayers} giocatori`;
    }

    return "Valida";
  }

  return "Da controllare";
}

function isTeamValid(team: TeamInfo) {
  return getTeamValidationLabel(team) === "Valida";
}

async function generateTournamentBracket() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi generare tabelloni.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Non puoi generare tabelloni per eventi di un altro sport.");
    return;
  }

  if (isEventCancelled(event)) {
    setMessage("Evento annullato. Non puoi generare il tabellone.");
    return;
  }

  const teams = getCompetitionUnits({ event, participantsInfo });

  if (event.type !== "torneo") {
    setMessage("Il tabellone è disponibile solo per i tornei.");
    return;
  }

  if (event.bracket && event.bracket.length > 0) {
    setMessage("Il tabellone è già stato generato.");
    return;
  }

  if (!validateTeamsForCompetition()) {
    return;
  }

  const invalidTeams = getInvalidEventTeams();

  const validTeams = teams.filter(
    (team) => !invalidTeams.some((invalidTeam) => invalidTeam.id === team.id)
  );

  setGeneratingBracket(true);
  setMessage("");

  try {
    const bracket = buildTournamentBracket(validTeams);

    await updateDoc(doc(db, "events", event.id), {
      bracket,
      status: "tabellone creato",
      updatedAt: serverTimestamp(),
    });

    setEvent({
      ...event,
      bracket,
      status: "tabellone creato",
    });

    await createActivity({
  uid: user.uid,
  type: "event",
  text: `Tabellone generato: ${event.title || "Torneo Rivalo"}`,
  value: 1,
});

const notifiedPlayerIds = Array.from(
  new Set((event.participants || []).filter(Boolean))
).filter((uid) => uid !== user.uid);

await Promise.all(
  notifiedPlayerIds.map((uid) =>
    createNotification({
      uid,
      type: "tournament_ready",
      title: "Tabellone torneo pronto",
      message: `Il tabellone di ${
        event.title || "un torneo Rivalo"
      } è stato generato.`,
      link: "/events/" + event.id,
      createdBy: user.uid,
      metadata: {
        eventId: event.id,
        eventTitle: event.title || "Torneo Rivalo",
        source: "torneo",
      },
    })
  )
);

setMessage("Tabellone generato.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la generazione del tabellone.");
  } finally {
    setGeneratingBracket(false);
  }
}

async function generateLeagueSchedule() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi generare calendari.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Non puoi generare calendari per eventi di un altro sport.");
    return;
  }

  if (isEventCancelled(event)) {
    setMessage("Evento annullato. Non puoi generare il calendario.");
    return;
  }

  const teams = event.teams || [];

  if (event.type !== "campionato") {
    setMessage("Il calendario è disponibile solo per i campionati.");
    return;
  }

  if (event.leagueFixtures && event.leagueFixtures.length > 0) {
    setMessage("Il calendario è già stato generato.");
    return;
  }

  if (!validateTeamsForCompetition()) {
    return;
  }

  const invalidTeams = getInvalidEventTeams();

  const validTeams = teams.filter(
    (team) => !invalidTeams.some((invalidTeam) => invalidTeam.id === team.id)
  );

  setGeneratingLeague(true);
  setMessage("");

  try {
    const workingTeams: TeamInfo[] =
      validTeams.length % 2 === 0
        ? [...validTeams]
        : [
            ...validTeams,
            {
              id: "bye",
              name: "Riposo",
              players: [],
            },
          ];

    const teamCount = workingTeams.length;
    const rounds = teamCount - 1;
    const half = teamCount / 2;

    let rotating = [...workingTeams];
    const firstLeg: LeagueFixture[] = [];
    let matchNumber = 1;

    for (let round = 1; round <= rounds; round++) {
      for (let i = 0; i < half; i++) {
        const home = rotating[i];
        const away = rotating[teamCount - 1 - i];

        if (home.id !== "bye" && away.id !== "bye") {
          firstLeg.push({
            round,
            matchNumber,
            homeTeamId: home.id,
            awayTeamId: away.id,
            homeName: home.name,
            awayName: away.name,
            matchId: "",
            status: "programmata",
          });

          matchNumber++;
        }
      }

      rotating = [
        rotating[0],
        rotating[teamCount - 1],
        ...rotating.slice(1, teamCount - 1),
      ];
    }

    const secondLeg: LeagueFixture[] = firstLeg.map((fixture) => ({
      round: fixture.round + rounds,
      matchNumber: matchNumber++,
      homeTeamId: fixture.awayTeamId,
      awayTeamId: fixture.homeTeamId,
      homeName: fixture.awayName,
      awayName: fixture.homeName,
      matchId: "",
      status: "programmata",
    }));

    const leagueFixtures = [...firstLeg, ...secondLeg];

    await updateDoc(doc(db, "events", event.id), {
      leagueFixtures,
      status: "calendario creato",
      updatedAt: serverTimestamp(),
    });

    setEvent({
      ...event,
      leagueFixtures,
      status: "calendario creato",
    });

   await createActivity({
  uid: user.uid,
  type: "event",
  text: `Calendario campionato generato: ${
    event.title || "Campionato Rivalo"
  }`,
  value: 1,
});

const notifiedPlayerIds = Array.from(
  new Set((event.participants || []).filter(Boolean))
).filter((uid) => uid !== user.uid);

await Promise.all(
  notifiedPlayerIds.map((uid) =>
    createNotification({
      uid,
      type: "league_ready",
      title: "Calendario campionato pronto",
      message: `Il calendario di ${
        event.title || "un campionato Rivalo"
      } è stato generato.`,
      link: "/events/" + event.id,
      createdBy: user.uid,
      metadata: {
        eventId: event.id,
        eventTitle: event.title || "Campionato Rivalo",
        source: "campionato",
      },
    })
  )
);

setMessage("Calendario campionato generato.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la generazione del calendario.");
  } finally {
    setGeneratingLeague(false);
  }
}

  async function shareEvent() {
    if (!event) return;

    const url = typeof window !== "undefined" ? window.location.href : "";

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link evento copiato. Puoi inviarlo su WhatsApp.");
    } catch (error) {
      console.error(error);
      setMessage("Non sono riuscito a copiare il link.");
    }
  }

async function createMatchFromEvent() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi creare match evento.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Non puoi creare match da un evento di un altro sport.");
    return;
  }

  if (isEventCancelled(event)) {
    setMessage("Evento annullato. Non puoi creare match.");
    return;
  }

  const competitionFormat =
    event.competitionFormat ||
    (event.sport === "calcetto" ? "squadre" : "singolo");

  if (!validateTeamsForCompetition()) {
    return;
  }

  if (
    event.type === "torneo" &&
    (!event.bracket || event.bracket.length === 0)
  ) {
    setMessage("Prima genera il tabellone del torneo.");
    return;
  }

if (
  event.type === "campionato" &&
  (!event.leagueFixtures || event.leagueFixtures.length === 0)
) {
  setMessage("Prima genera il calendario del campionato.");
  return;
}

setCreatingMatch(true);
setMessage("");

  try {
    let players: {
      uid: string;
      name: string;
      team: "home" | "away";
      goals: number;
      assists: number;
      isMvp: boolean;
    }[] = [];

    let homeTeamName = "Home";
    let awayTeamName = "Away";
    let matchHomeTeamId = "";
    let matchAwayTeamId = "";
    let sourceType = "event";
    let homeTeam: TeamInfo | undefined;
    let awayTeam: TeamInfo | undefined;

    let sourceBracketIndex = -1;
    let sourceLeagueIndex = -1;

    if (competitionFormat === "singolo") {
      const units = getCompetitionUnits({ event, participantsInfo });

      if (units.length < 2) {
        setMessage("Servono almeno 2 player per creare un match.");
        setCreatingMatch(false);
        return;
      }

      if (event.type === "torneo" && event.bracket?.length) {
        const nextBracketIndex = event.bracket.findIndex(
          (match) => !match.matchId && Boolean(match.awayTeamId)
        );

        if (nextBracketIndex === -1) {
          setMessage("Non ci sono match del tabellone da creare.");
          setCreatingMatch(false);
          return;
        }

        const bracketMatch = event.bracket[nextBracketIndex];

        homeTeam = units.find((team) => team.id === bracketMatch.homeTeamId);
        awayTeam = units.find((team) => team.id === bracketMatch.awayTeamId);

        homeTeamName = bracketMatch.homeName;
        awayTeamName = bracketMatch.awayName;
        matchHomeTeamId = bracketMatch.homeTeamId || "";
        matchAwayTeamId = bracketMatch.awayTeamId || "";
        sourceBracketIndex = nextBracketIndex;
      } else {
        homeTeam = units[0];
        awayTeam = units[1];

        homeTeamName = homeTeam?.name || "Player 1";
        awayTeamName = awayTeam?.name || "Player 2";
        matchHomeTeamId = homeTeam?.id || "";
        matchAwayTeamId = awayTeam?.id || "";
      }

      if (!homeTeam || !awayTeam) {
        setMessage("Player non trovati. Controlla il tabellone.");
        setCreatingMatch(false);
        return;
      }

      sourceType = event.type === "torneo" ? "eventBracketPlayers" : "eventParticipants";

      players = [
        ...homeTeam.players.map((player) => ({
          uid: player.uid,
          name: player.name || "Rivalo Player",
          team: "home" as const,
          goals: 0,
          assists: 0,
          isMvp: false,
        })),
        ...awayTeam.players.map((player) => ({
          uid: player.uid,
          name: player.name || "Rivalo Player",
          team: "away" as const,
          goals: 0,
          assists: 0,
          isMvp: false,
        })),
      ];
    } else {
      const teams = event.teams || [];

      if (teams.length < 2) {
        setMessage(`Servono almeno 2 ${getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()} per creare un match.`);
        setCreatingMatch(false);
        return;
      }

      if (event.type === "torneo" && event.bracket?.length) {
        const nextBracketIndex = event.bracket.findIndex(
          (match) => !match.matchId && Boolean(match.awayTeamId)
        );

        if (nextBracketIndex === -1) {
          setMessage("Non ci sono match del tabellone da creare.");
          setCreatingMatch(false);
          return;
        }

        const bracketMatch = event.bracket[nextBracketIndex];

        homeTeam = teams.find((team) => team.id === bracketMatch.homeTeamId);
        awayTeam = teams.find((team) => team.id === bracketMatch.awayTeamId);

        homeTeamName = bracketMatch.homeName;
        awayTeamName = bracketMatch.awayName;
        sourceBracketIndex = nextBracketIndex;
      } else if (event.type === "campionato" && event.leagueFixtures?.length) {
        const nextFixtureIndex = event.leagueFixtures.findIndex(
          (fixture) => !fixture.matchId
        );

        if (nextFixtureIndex === -1) {
          setMessage("Tutte le giornate del campionato hanno già un match.");
          setCreatingMatch(false);
          return;
        }

        const fixture = event.leagueFixtures[nextFixtureIndex];

        homeTeam = teams.find((team) => team.id === fixture.homeTeamId);
        awayTeam = teams.find((team) => team.id === fixture.awayTeamId);

        homeTeamName = fixture.homeName;
        awayTeamName = fixture.awayName;
        sourceLeagueIndex = nextFixtureIndex;
      } else {
        homeTeam = teams[0];
        awayTeam = teams[1];

        homeTeamName = homeTeam.name || "Squadra 1";
        awayTeamName = awayTeam.name || "Squadra 2";
      }

      if (!homeTeam || !awayTeam) {
        setMessage("Squadre non trovate. Controlla tabellone o calendario.");
        setCreatingMatch(false);
        return;
      }

      matchHomeTeamId = homeTeam.id;
      matchAwayTeamId = awayTeam.id;
      sourceType = "eventTeams";

      players = [
        ...homeTeam.players.map((player) => ({
          uid: player.uid,
          name: player.name || "Rivalo Player",
          team: "home" as const,
          goals: 0,
          assists: 0,
          isMvp: false,
        })),
        ...awayTeam.players.map((player) => ({
          uid: player.uid,
          name: player.name || "Rivalo Player",
          team: "away" as const,
          goals: 0,
          assists: 0,
          isMvp: false,
        })),
      ];
    }

    const homeCaptainId =
      homeTeam?.captainId || homeTeam?.createdBy || players[0]?.uid || "";
    const awayCaptainId =
      awayTeam?.captainId || awayTeam?.createdBy || players[1]?.uid || "";

    const matchRef = await addDoc(collection(db, "matches"), {
      createdBy: user.uid,
      createdByName: user.displayName || "Rivalo Player",

      eventId: event.id,
      eventTitle: event.title || "Evento Rivalo",

      name:
        event.type === "campionato"
          ? `${event.title || "Campionato"} · ${homeTeamName} vs ${awayTeamName}`
          : event.type === "torneo"
          ? `${event.title || "Torneo"} · ${homeTeamName} vs ${awayTeamName}`
          : event.title || "Match da evento",

      sport: normalizeSport(event.sport),
      scoreMode: isRacketSport(event.sport) ? "racket" : "football",
      sportStatsMode: isRacketSport(event.sport) ? "racket" : "football",
      city: event.city || "",
      field: event.field || "",
      date: event.date || "",
      time: event.time || "",
      mode: event.type || "evento",
      competitionFormat,

      slots: event.maxPlayers || players.length,
      participants: players.map((player) => player.uid),
      players,

      homeTeam: homeTeamName,
      awayTeam: awayTeamName,
      homeTeamId: matchHomeTeamId,
      awayTeamId: matchAwayTeamId,
      homeCaptainId,
      awayCaptainId,
      sourceType,
      homeScore: null,
      awayScore: null,

      status: "programmato",
      resultStatus: "da_confermare",
      fairPlayStatus: "da_confermare",

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const updatePayload: any = {
      linkedMatchId: matchRef.id,
      linkedMatchIds: arrayUnion(matchRef.id),
      status: "in corso",
      updatedAt: serverTimestamp(),
    };

    if (sourceBracketIndex >= 0 && event.bracket) {
      const nextBracket = [...event.bracket];

      nextBracket[sourceBracketIndex] = {
        ...nextBracket[sourceBracketIndex],
        matchId: matchRef.id,
      };

      updatePayload.bracket = nextBracket;
    }

    if (sourceLeagueIndex >= 0 && event.leagueFixtures) {
      const nextFixtures = [...event.leagueFixtures];

      nextFixtures[sourceLeagueIndex] = {
        ...nextFixtures[sourceLeagueIndex],
        matchId: matchRef.id,
        status: "match creato",
      };

      updatePayload.leagueFixtures = nextFixtures;
    }

    await updateDoc(doc(db, "events", event.id), updatePayload);

    await createActivity({
      uid: user.uid,
      type: "event",
      text: `Match creato dall'evento: ${event.title || "Evento Rivalo"}`,
      value: 1,
    });

    const notifiedPlayerIds = Array.from(
  new Set(players.map((player) => player.uid).filter(Boolean))
).filter((uid) => uid !== user.uid);

await Promise.all(
  notifiedPlayerIds.map((uid) =>
    createNotification({
      uid,
      type: "new_match",
      title: "Nuovo match creato",
      message: `${homeTeamName} vs ${awayTeamName} è stato creato da ${
        event.title || "un evento Rivalo"
      }.`,
      link: `/match/${matchRef.id}`,
      createdBy: user.uid,
      metadata: {
        eventId: event.id,
        matchId: matchRef.id,
        eventTitle: event.title || "Evento Rivalo",
        homeTeam: homeTeamName,
        awayTeam: awayTeamName,
        source: event.type || "evento",
        scoreMode: isRacketSport(event.sport) ? "racket" : "football",
      },
    })
  )
);
    router.push(`/match/${matchRef.id}`);
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la creazione del match.");
  }

  setCreatingMatch(false);
}

async function cancelEvent() {
  if (!user || !event) return;

  if (accountLocked) {
    setMessage("Profilo segnato per rimozione: non puoi annullare eventi.");
    return;
  }

  if (user.uid !== event.createdBy) {
    setMessage("Solo il creator può annullare questo evento.");
    return;
  }

  if (sportMismatch || normalizeSport(event.sport) !== userSport) {
    setMessage("Questo evento appartiene a un altro sport. Usa un profilo sport compatibile.");
    return;
  }

  if (!canCancelEventSafely(event)) {
    setMessage(getEventCancelBlockedReason(event));
    return;
  }

  const reason = cancellationReason.trim();

  if (reason.length < 5) {
    setMessage("Inserisci un motivo di annullamento di almeno 5 caratteri.");
    return;
  }

  setMessage("");

  try {
    await updateDoc(doc(db, "events", event.id), {
      status: "annullato",
      cancellationReason: reason,
      cancelledBy: user.uid,
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await createActivity({
      uid: user.uid,
      type: "event",
      text: `Evento annullato: ${event.title || "Evento Rivalo"}`,
      value: 1,
    });

    const notifiedPlayerIds = Array.from(
      new Set((event.participants || []).filter(Boolean))
    ).filter((uid) => uid !== user.uid);

    await Promise.all(
      notifiedPlayerIds.map((uid) =>
        createNotification({
          uid,
          type: "generic",
          title: "Evento annullato",
          message: `${event.title || "Un evento Rivalo"} è stato annullato. Motivo: ${reason}`,
          link: "/events/" + event.id,
          createdBy: user.uid,
          metadata: {
            eventId: event.id,
            eventTitle: event.title || "Evento Rivalo",
            reason,
          },
        })
      )
    );

    setEvent({
      ...event,
      status: "annullato",
      cancellationReason: reason,
      cancelledBy: user.uid,
    });

    setMessage("Evento annullato correttamente.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante l'annullamento dell'evento.");
  }
}

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento evento...
      </main>
    );
  }

  if (!event) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-8 text-center">
          <div className="text-3xl font-black">Evento non trovato</div>

          <Link
            href="/events"
            className="mt-6 inline-block rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-300"
          >
            Torna agli eventi
          </Link>
        </div>
      </main>
    );
  }

  if (sportMismatch) {
    return (
      <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/events"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna agli eventi
          </Link>

          <div className="mt-8 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-7 text-center">
            <div className="text-3xl font-black text-red-100">
              Evento non compatibile
            </div>

            <p className="mt-4 leading-7 text-slate-300">
              Questo evento è dedicato a {formatSportLabel(event.sport)}, mentre il tuo profilo attivo è {formatSportLabel(userSport)}.
              Per usare un altro sport servirà un profilo sport separato.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const isCancelled = isEventCancelled(event);
  const canCancelSafely = canCancelEventSafely(event);
  const cancelBlockedReason = getEventCancelBlockedReason(event);

  const participants = event.participants || [];
  const maxPlayers = Number(event.maxPlayers || 0);
  const teams = event.teams || [];
  const competitionStarted =
  Boolean(event.bracket && event.bracket.length > 0) ||
  Boolean(event.leagueFixtures && event.leagueFixtures.length > 0) ||
  event.status === "tabellone creato" ||
  event.status === "calendario creato" ||
  event.status === "in corso" ||
  event.status === "torneo completato" ||
  event.status === "campionato completato";

  const competitionFormat: CompetitionFormat =
    event.competitionFormat ||
    (event.sport === "calcetto" ? "squadre" : "singolo");

  const isTeamCompetition =
    competitionFormat === "squadre" ||
    competitionFormat === "doppio" ||
    (competitionFormat === "singolo" && isRacketSport(event.sport));

  const availableSpots =
    maxPlayers > 0 ? Math.max(0, maxPlayers - participants.length) : 0;

  const isJoined = user ? participants.includes(user.uid) : false;
  const isCreator = user?.uid === event.createdBy;

  const isFull = maxPlayers > 0 && participants.length >= maxPlayers;

  const canJoin = !accountLocked && !isCancelled && !isJoined && !isFull && event.status !== "completo";

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
    competitionFormat === "doppio"
      ? "Doppio"
      : competitionFormat === "squadre"
      ? "Squadre"
      : "Singolo";

  const eventCopy = getEventCopy(event.sport);
  const racketEvent = isRacketSport(event.sport);

      const invalidEventTeams = getInvalidEventTeams();
const competitionUnits = getCompetitionUnits({ event, participantsInfo });
const validEventTeamsCount =
  competitionFormat === "singolo" && isRacketSport(event.sport)
    ? competitionUnits.length
    : teams.length - invalidEventTeams.length;
const invalidEventTeamsCount =
  competitionFormat === "singolo" && isRacketSport(event.sport)
    ? 0
    : invalidEventTeams.length;

      const rankedTeamStats = [...teamStats].sort((a, b) => {
  const scoreDiffA =
    Number(a.goalDifference || 0) ||
    Number(a.goalsFor || 0) - Number(a.goalsAgainst || 0);
  const scoreDiffB =
    Number(b.goalDifference || 0) ||
    Number(b.goalsFor || 0) - Number(b.goalsAgainst || 0);

  return (
    Number(b.points || 0) - Number(a.points || 0) ||
    scoreDiffB - scoreDiffA ||
    Number(b.wins || 0) - Number(a.wins || 0) ||
    Number(b.goalsFor || 0) - Number(a.goalsFor || 0)
  );
});

const hasPendingTournamentMatch =
  event.type === "torneo" &&
  Array.isArray(event.bracket) &&
  event.bracket.some((match) => !match.matchId && Boolean(match.awayTeamId));

const hasPendingLeagueMatch =
  event.type === "campionato" &&
  Array.isArray(event.leagueFixtures) &&
  event.leagueFixtures.some((fixture) => !fixture.matchId);

const isCompetitionCompleted =
  event.status === "torneo completato" ||
  event.status === "campionato completato";

const canCreateEventMatch =
  accountLocked || isCancelled || isCompetitionCompleted
    ? false
    : event.type === "torneo"
    ? hasPendingTournamentMatch
    : event.type === "campionato"
    ? hasPendingLeagueMatch
    : true;
const validTeamsCount = validEventTeamsCount;
const invalidTeamsCount = invalidEventTeamsCount;
const hasEnoughValidTeams = isTeamCompetition && validEventTeamsCount >= 2;

    const totalTournamentMatches = Array.isArray(event.bracket)
  ? event.bracket.filter((match) => Boolean(match.awayTeamId)).length
  : 0;

const createdTournamentMatches = Array.isArray(event.bracket)
  ? event.bracket.filter((match) => Boolean(match.matchId)).length
  : 0;

const completedTournamentMatches = Array.isArray(event.bracket)
  ? event.bracket.filter((match) => match.resultStatus === "confermato").length
  : 0;

const totalLeagueMatches = Array.isArray(event.leagueFixtures)
  ? event.leagueFixtures.length
  : 0;

const createdLeagueMatches = Array.isArray(event.leagueFixtures)
  ? event.leagueFixtures.filter((fixture) => Boolean(fixture.matchId)).length
  : 0;

const completedLeagueMatches = Array.isArray(event.leagueFixtures)
  ? event.leagueFixtures.filter(
      (fixture) => fixture.resultStatus === "confermato"
    ).length
  : 0;

const totalCompetitionMatches =
  event.type === "torneo" ? totalTournamentMatches : totalLeagueMatches;

const createdCompetitionMatches =
  event.type === "torneo" ? createdTournamentMatches : createdLeagueMatches;

const completedCompetitionMatches =
  event.type === "torneo" ? completedTournamentMatches : completedLeagueMatches;

const pendingCompetitionMatches = Math.max(
  0,
  totalCompetitionMatches - completedCompetitionMatches
);

const previewTournamentBracket =
  event.type === "torneo" &&
  (!event.bracket || event.bracket.length === 0) &&
  hasEnoughValidTeams
    ? buildTournamentBracket(competitionUnits)
    : [];

const visibleTournamentBracket =
  event.bracket && event.bracket.length > 0
    ? event.bracket
    : previewTournamentBracket;

  const rankedEventStats =
    eventStats.length > 0
      ? [...eventStats].sort(
          (a, b) =>
            (b.points || 0) - (a.points || 0) ||
            (b.wins || 0) - (a.wins || 0) ||
            (b.mvp || 0) - (a.mvp || 0) ||
            (b.goals || 0) - (a.goals || 0) ||
            (b.assists || 0) - (a.assists || 0)
        )
      : participantsInfo.map((participant) => ({
          id: participant.uid,
          eventId: event.id,
          uid: participant.uid,
          playerName: participant.name || "Rivalo Player",
          photoUrl: participant.photoUrl || "",
          points: 0,
          matchesPlayed: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          goals: 0,
          assists: 0,
          mvp: 0,
          goalsFor: 0,
          goalsAgainst: 0,
        }));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-8 text-white sm:px-5">
      <div className="mx-auto w-full max-w-6xl min-w-0 overflow-hidden">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna agli eventi
        </Link>

        <section className="mt-8 w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl sm:rounded-[2.5rem]">
          <div className="relative min-w-0 border-b border-white/10 px-4 py-8 sm:px-8 sm:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{typeLabel}</Badge>
                  <Badge>{sportLabel}</Badge>
                  <Badge>{formatLabel}</Badge>
                  <Badge>{event.status || "aperto"}</Badge>
                </div>

                <h1 className="mt-5 break-words text-3xl font-black uppercase sm:text-5xl">
                  {event.title || "Evento Rivalo"}
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                  Organizza, partecipa e porta la competizione sul campo.
                </p>
              </div>

              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-6 py-4">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  {isTeamCompetition ? getTeamPluralLabel(competitionFormat, event.sport) : "Posti liberi"}
                </div>

                <div className="mt-1 text-3xl font-black text-cyan-100">
                  {isTeamCompetition
                    ? competitionUnits.length
                    : maxPlayers > 0
                    ? availableSpots
                    : "N/D"}
                </div>
              </div>
            </div>
          </div>

          {isCancelled && (
            <div className="border-b border-red-400/20 bg-red-500/10 px-6 py-4 text-sm font-bold text-red-100">
              Evento annullato. Motivo: {event.cancellationReason || "Non specificato"}.
            </div>
          )}

          {accountLocked && (
            <div className="border-b border-yellow-300/20 bg-yellow-400/10 px-6 py-4 text-sm font-bold text-yellow-100">
              Profilo segnato per rimozione: iscrizioni, squadre, tabelloni, calendari, match e annullamento evento sono bloccati.
            </div>
          )}

          <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0 space-y-5 overflow-hidden">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard
                  icon={<MapPin />}
                  label="Città"
                  value={event.city || "Da definire"}
                  color="text-cyan-300"
                />

                <InfoCard
                  icon={<ShieldCheck />}
                  label="Campo"
                  value={event.field || "Da definire"}
                  color="text-lime-300"
                />

                <InfoCard
                  icon={<CalendarDays />}
                  label="Data"
                  value={event.date || "Da definire"}
                  color="text-yellow-300"
                />

                <InfoCard
                  icon={<Clock />}
                  label="Ora"
                  value={event.time || "Da definire"}
                  color="text-orange-300"
                />
              </div>

              {event.field && (
                <div className="overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-black/20">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                        Mappa evento
                      </div>

                      <div className="mt-1 text-sm text-slate-400">
                        {event.field} {event.city}
                      </div>
                    </div>

                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${event.field} ${event.city || ""}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200"
                    >
                      Apri Maps
                    </a>
                  </div>

                  <iframe
                    title="Mappa evento"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(
                      `${event.field} ${event.city || ""}`
                    )}&output=embed`}
                    className="h-[320px] w-full border-0"
                    loading="lazy"
                  />
                </div>
              )}

              {(event.type === "torneo" || event.type === "campionato") && (
  <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
    <div className="mb-5">
      <div className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
        Riepilogo competizione
      </div>

      <h2 className="mt-2 text-2xl font-black sm:text-3xl">
        Stato torneo / campionato
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Controllo rapido su squadre, match creati e match completati.
      </p>
    </div>

    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7">
  <SummaryBox
    label={isTeamCompetition ? getTeamPluralLabel(competitionFormat, event.sport) : "Partecipanti"}
    value={isTeamCompetition ? competitionUnits.length : participants.length}
    tone="cyan"
  />

  {isTeamCompetition && (
    <>
      <SummaryBox
        label={`${getTeamPluralLabel(competitionFormat, event.sport)} validi`}
        value={validTeamsCount}
        tone="green"
      />

      <SummaryBox
        label="Da sistemare"
        value={invalidTeamsCount}
        tone="orange"
      />
    </>
  )}

  <SummaryBox
    label="Match totali"
    value={totalCompetitionMatches}
    tone="yellow"
  />

  <SummaryBox
    label="Match creati"
    value={createdCompetitionMatches}
    tone="lime"
  />

  <SummaryBox
    label="Completati"
    value={completedCompetitionMatches}
    tone="green"
  />

  <SummaryBox
    label="Da giocare"
    value={pendingCompetitionMatches}
    tone="orange"
  />
</div>
  </section>
)}

              {event.prize && (
                <div className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-yellow-300/20 bg-yellow-400/10 p-4 sm:rounded-[2rem] sm:p-6">
                  <div className="flex items-center gap-3 text-yellow-200">
                    <Trophy />
                    <div className="text-sm font-black uppercase tracking-[0.2em]">
                      Premio
                    </div>
                  </div>

                  <div className="mt-3 text-2xl font-black">{event.prize}</div>
                </div>
              )}

              {isCreator && !accountLocked && !isCancelled && !competitionStarted && (
                <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-cyan-400/20 bg-cyan-400/5 p-4 sm:rounded-[2rem] sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <UserPlus className="text-cyan-300" />
                    <div>
                      <div className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                        Aggiungi utente
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-400">
                        Aggiungi utenti Rivalo compatibili con {formatSportLabel(event.sport)} prima di creare player/coppie o generare la competizione.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <select
                      value={selectedUserToAdd}
                      onChange={(e) => setSelectedUserToAdd(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none"
                    >
                      <option value="" className="bg-[#020617] text-white">
                        {candidateUsers.length > 0
                          ? "Seleziona utente"
                          : "Nessun utente disponibile"}
                      </option>

                      {candidateUsers.map((candidate) => (
                        <option
                          key={candidate.uid}
                          value={candidate.uid}
                          className="bg-[#020617] text-white"
                        >
                          {candidate.name || candidate.nickname || "Rivalo Player"}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={addUserToEvent}
                      disabled={addingUser || !selectedUserToAdd}
                      className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
                    >
                      {addingUser ? "Aggiungo..." : "Aggiungi"}
                    </button>
                  </div>
                </section>
              )}

              {isTeamCompetition && (
                <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
                  <div className="mb-5">
                    <div className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      {getTeamPluralLabel(competitionFormat, event.sport)}
                    </div>

                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      Gestione {getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()}
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      {isRacketSport(event.sport)
                        ? "Crea player o coppie usando gli iscritti all'evento. I nomi vengono generati dai profili selezionati."
                        : "Crea le squadre che parteciperanno alla competizione."}
                    </p>
                    <div className="mt-5 grid gap-3 sm:grid-cols-3">
  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
    <div className="text-2xl font-black text-cyan-200">
      {teams.length}
    </div>
    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      {getTeamPluralLabel(competitionFormat, event.sport)}
    </div>
  </div>

  <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4 text-center">
    <div className="text-2xl font-black text-lime-200">
      {validEventTeamsCount}
    </div>
    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      Validi
    </div>
  </div>

  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-center">
    <div className="text-2xl font-black text-red-200">
      {invalidEventTeamsCount}
    </div>
    <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
      Da sistemare
    </div>
  </div>
</div>
                  </div>

                  {isCreator && !accountLocked && !isCancelled && !competitionStarted && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      {!isRacketSport(event.sport) ? (
                        <Field label="Nome squadra">
                          <input
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Es. Team Black"
                            className="w-full bg-transparent outline-none placeholder:text-slate-500"
                          />
                        </Field>
                      ) : (
                        <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 p-4 text-sm font-bold leading-6 text-lime-100">
                          {competitionFormat === "singolo"
                            ? "Nel singolo il nome del player viene preso dal profilo selezionato."
                            : "Nel doppio il nome della coppia viene generato dai due profili selezionati."}
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="mb-2 text-sm font-black uppercase tracking-[0.12em] text-slate-300">
                          {isRacketSport(event.sport) ? "Utenti iscritti all'evento" : "Giocatori iscritti all'evento"}
                        </div>

                        <select
                          multiple
                          value={selectedPlayerIds}
                          onChange={(e) =>
                            setSelectedPlayerIds(
                              Array.from(e.target.selectedOptions).map(
                                (option) => option.value
                              )
                            )
                          }
                          className="min-h-[150px] w-full rounded-2xl border border-white/10 bg-[#020617] p-4 text-white outline-none"
                        >
                          {availableUsers.length === 0 && (
  <option className="bg-[#020617] text-white" disabled>
    Nessun giocatore iscritto all'evento
  </option>
)}
                          {availableUsers.map((availableUser) => (
                            <option
                              key={availableUser.uid}
                              value={availableUser.uid}
                              className="bg-[#020617] text-white"
                            >
                              {availableUser.name ||
                                availableUser.nickname ||
                                "Rivalo Player"}
                            </option>
                          ))}
                        </select>

                        <div className="mt-2 text-xs leading-5 text-slate-400">
                         Puoi selezionare solo utenti già iscritti all'evento. Un utente non può stare in due squadre/coppie/player.
                         Chi crea la squadra/coppia/player deve selezionare anche sé stesso: diventerà capitano.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={createTeam}
                        disabled={creatingTeam}
                        className="mt-4 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
                      >
                        {creatingTeam
                          ? "Creazione..."
                          : getTeamCreationTitle(competitionFormat, event.sport)}
                      </button>
                    </div>
                  )}
                  {isCreator && !isCancelled && competitionStarted && (
  <div className="rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-100">
    Rose bloccate: la competizione è già iniziata. Non puoi creare o modificare squadre/coppie.
  </div>
)}

                  {isCreator && isCancelled && (
  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm font-bold text-red-100">
    Evento annullato: gestione squadre/coppie bloccata.
  </div>
)}

                  {isCreator && accountLocked && (
  <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold text-yellow-100">
    Profilo segnato per rimozione: gestione squadre/coppie bloccata.
  </div>
)}

                  <div className="mt-5 space-y-3">
                    {teams.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                        Nessuna squadra/coppia creata. Iscritti evento: {participants.length}. Crea almeno 2 squadre valide per generare tabellone o calendario.
                      </div>
                    ) : (
                     teams.map((team) => (
  <TeamCard
    key={team.id}
    team={team}
    validationLabel={getTeamValidationLabel(team)}
    valid={isTeamValid(team)}
  />
))
                    )}
                  </div>
                </section>
              )}

              
{event.type === "torneo" && (
  <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">
          Tabellone torneo
        </div>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          Mappa torneo
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Il tabellone mostra round, passaggi, match creati e vincitori. Vale per calcetto, padel e tennis: cambia solo l’unità di gioco, cioè squadre, coppie o player.
        </p>
      </div>

      <Trophy className="text-yellow-300" />
    </div>

    {previewTournamentBracket.length > 0 && (
      <div className="mb-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm font-bold leading-6 text-cyan-100">
        Anteprima tabellone: premi “Genera tabellone” per salvarlo e poter creare i match.
      </div>
    )}

    {event.status === "torneo completato" && (
      <div className="mb-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-5">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-yellow-200">
          Torneo completato
        </div>

        <div className="mt-2 text-2xl font-black text-yellow-100">
          Vincitore: {(event as any).winnerTeamName || "Vincitore torneo"}
        </div>
      </div>
    )}

    {visibleTournamentBracket.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Nessun tabellone generato. Aggiungi almeno 2 {getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()} validi e genera il tabellone.
      </div>
    ) : (
      <div className="w-full min-w-0 overflow-hidden pb-2 lg:overflow-x-auto">
        <div className="flex w-full min-w-0 flex-col gap-4 lg:min-w-[720px] lg:flex-row">
          {Array.from(
            new Set(visibleTournamentBracket.map((match) => Number(match.round || 1)))
          )
            .sort((a, b) => a - b)
            .map((round) => {
              const roundMatches = visibleTournamentBracket.filter(
                (match) => Number(match.round || 1) === round
              );

              const roundTitle =
                roundMatches.length === 1
                  ? "Finale"
                  : roundMatches.length === 2
                  ? "Semifinali"
                  : roundMatches.length === 4
                  ? "Quarti"
                  : `Round ${round}`;

              return (
                <div
                  key={round}
                  className="w-full min-w-0 flex-1 overflow-hidden rounded-[1.4rem] border border-white/10 bg-white/[.025] p-3 sm:rounded-[1.7rem] lg:min-w-[260px] lg:p-4"
                >
                  <div className="mb-4">
                    <div className="text-xs font-black uppercase tracking-[0.22em] text-yellow-200">
                      {roundTitle}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {roundMatches.length} match
                    </div>
                  </div>

                  <div className="space-y-3">
                    {roundMatches.map((match) => {
                      const isWaiting = match.status === "in_attesa";
                      const isBye = !isWaiting && !match.awayTeamId;
                      const isCompleted = match.resultStatus === "confermato";
                      const winnerName =
                        match.winnerTeamId === match.homeTeamId
                          ? match.homeName
                          : match.winnerTeamId === match.awayTeamId
                          ? match.awayName
                          : "";

                      return (
                        <div
                          key={`${match.round}_${match.matchNumber}`}
                          className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-3"
                        >
                          <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                              Match {match.matchNumber}
                            </div>

                            <div
                              className={`rounded-xl border px-2 py-1 text-[10px] font-black uppercase ${
                                isCompleted
                                  ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
                                  : match.matchId
                                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                                  : isBye
                                  ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-200"
                                  : isWaiting
                                  ? "border-white/10 bg-white/[.03] text-slate-400"
                                  : "border-white/10 bg-white/[.03] text-slate-400"
                              }`}
                            >
                              {isCompleted
                                ? isBye
                                  ? "Bye"
                                  : "Completato"
                                : match.matchId
                                ? "Creato"
                                : "Da creare"}
                            </div>
                          </div>

                          <div
                            className={`min-w-0 break-words rounded-xl border px-3 py-2 text-sm font-black ${
                              winnerName && winnerName === match.homeName
                                ? "border-lime-300/30 bg-lime-400/10 text-lime-100"
                                : "border-cyan-400/20 bg-cyan-400/10 text-cyan-100"
                            }`}
                          >
                            {match.homeName}
                          </div>

                          <div className="my-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                            {isBye ? "passa il turno" : isWaiting ? "in attesa" : "vs"}
                          </div>

                          <div
                            className={`min-w-0 break-words rounded-xl border px-3 py-2 text-sm font-black ${
                              winnerName && winnerName === match.awayName
                                ? "border-lime-300/30 bg-lime-400/10 text-lime-100"
                                : "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100"
                            }`}
                          >
                            {isBye ? "Riposo" : match.awayName}
                          </div>

                          {typeof match.homeScore === "number" &&
                            typeof match.awayScore === "number" && (
                              <div className="mt-3 rounded-xl border border-lime-400/20 bg-lime-400/10 px-3 py-2 text-xs font-black text-lime-200">
                                Risultato: {match.homeScore} - {match.awayScore}
                              </div>
                            )}

                          {winnerName && (
                            <div className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-xs font-black text-yellow-100">
                              Passa: {winnerName}
                            </div>
                          )}

                          {match.matchId ? (
                            <Link
                              href={"/match/" + match.matchId}
                              className="mt-3 inline-flex rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-400/20"
                            >
                              Apri match
                            </Link>
                          ) : isBye ? (
                            <div className="mt-3 inline-flex rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-2 text-xs font-black text-yellow-100">
                              Passaggio automatico
                            </div>
                          ) : isWaiting ? (
                            <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-xs text-white/60">
                              In attesa dei vincitori
                            </div>
                          ) : event.bracket && event.bracket.length > 0 ? (
                            <button
                              type="button"
                              onClick={createMatchFromEvent}
                              disabled={creatingMatch || accountLocked || isCancelled}
                              className="mt-3 inline-flex rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
                            >
                              {creatingMatch ? "Creazione..." : "Crea match"}
                            </button>
                          ) : (
                            <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-xs text-white/60">
                              Genera tabellone prima
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    )}
  </section>
)}

{event.type === "campionato" && isTeamCompetition && (
  <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-lime-300">
          Calendario campionato
        </div>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          Giornate andata / ritorno
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Le giornate vengono generate dalle squadre iscritte al campionato.
        </p>
      </div>

      <CalendarDays className="text-lime-300" />
    </div>

    {event.status === "campionato completato" && (
      <div className="mb-5 rounded-2xl border border-lime-300/20 bg-lime-400/10 p-5">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-lime-200">
          Campionato completato
        </div>

        <div className="mt-2 text-2xl font-black text-lime-100">
          Tutte le giornate sono state completate.
        </div>
      </div>
    )}

    {!event.leagueFixtures || event.leagueFixtures.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Nessun calendario generato.
      </div>
    ) : (
      <div className="space-y-3">
        {event.leagueFixtures.map((fixture) => (
          <div
            key={`${fixture.round}_${fixture.matchNumber}`}
            className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Giornata {fixture.round} · Match {fixture.matchNumber}
              </div>

              <div
                className={`rounded-xl border px-3 py-1 text-xs font-black uppercase ${
                  fixture.resultStatus === "confermato"
                    ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
                    : fixture.matchId
                    ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[.03] text-slate-400"
                }`}
              >
                {fixture.resultStatus === "confermato"
                  ? "Completata"
                  : fixture.matchId
                  ? "Match creato"
                  : "Da creare"}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 font-black text-cyan-100">
                {fixture.homeName}
              </div>

              <div className="text-center text-sm font-black text-slate-400">
                VS
              </div>

              <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4 font-black text-fuchsia-100">
                {fixture.awayName}
              </div>
            </div>

            {typeof fixture.homeScore === "number" &&
              typeof fixture.awayScore === "number" && (
                <div className="mt-3 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200">
                  Risultato: {fixture.homeScore} - {fixture.awayScore}
                </div>
              )}

            {fixture.matchId ? (
              <Link
                href={"/match/" + fixture.matchId}
                className="mt-3 inline-flex rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200 transition hover:bg-lime-400/20"
              >
                Apri match
              </Link>
            ) : (
              <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-xs text-white/60">
                Match non ancora creato
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
)}

{isTeamCompetition && (event.type === "campionato" || event.type === "torneo") && (
  <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-lime-300">
          Classifica {getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()}
        </div>

        <h2 className="mt-2 text-2xl font-black sm:text-3xl">
          {eventCopy.rankingTitle}
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          {eventCopy.rankingText}
        </p>
      </div>

      <Trophy className="text-lime-300" />
    </div>

    {rankedTeamStats.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Nessuna statistica ancora.
      </div>
    ) : (
      <div className="space-y-3">
        {rankedTeamStats.map((team, index) => (
          <TeamRankRow key={team.id} team={team} index={index} eventCopy={eventCopy} />
        ))}
      </div>
    )}
  </section>
)}

              <section className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      Ranking evento
                    </div>

                    <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                      Classifica evento
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Qui contano solo i match confermati collegati a questo evento.
                    </p>
                  </div>

                  <Trophy className="text-yellow-300" />
                </div>

                {rankedEventStats.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-slate-400">
                    Nessun partecipante ancora.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rankedEventStats.map((stat, index) => (
                      <EventRankRow key={stat.uid} stat={stat} index={index} eventCopy={eventCopy} racketEvent={racketEvent} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/20 p-4 sm:rounded-[2rem] sm:p-6">
              <div className="flex items-center gap-3">
                <Users className="text-cyan-300" />

                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
                    {isTeamCompetition ? "Squadre" : "Partecipanti"}
                  </div>

                  <div className="mt-1 text-3xl font-black">
                    {isTeamCompetition ? teams.length : participants.length}
                    {!isTeamCompetition && maxPlayers > 0 ? ` / ${maxPlayers}` : ""}
                  </div>

                  {isTeamCompetition && (
                    <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      {participants.length} giocatori iscritti
                    </div>
                  )}
                </div>
              </div>

              {!isTeamCompetition && (
                <div className="mt-6 h-4 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300"
                    style={{
                      width:
                        maxPlayers > 0
                          ? `${Math.min(
                              100,
                              (participants.length / maxPlayers) * 100
                            )}%`
                          : "0%",
                    }}
                  />
                </div>
              )}

              {!isTeamCompetition && (
                <button
                  onClick={joinEvent}
                  disabled={joining || accountLocked || !canJoin}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black transition hover:scale-[1.01] disabled:opacity-60"
                >
                  <UserPlus size={18} />
                  {accountLocked
                    ? "Azione bloccata"
                    : isCancelled
                    ? "Evento annullato"
                    : isJoined
                    ? "Già iscritto"
                    : isFull || event.status === "completo"
                    ? "Evento completo"
                    : joining
                    ? "Iscrizione..."
                    : "Partecipa"}
                </button>
              )}

              <button
                onClick={shareEvent}
                className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-6 py-4 font-black text-cyan-200 transition hover:bg-cyan-400/20"
              >
                <Share2 size={18} />
                Condividi evento
              </button>

              {isCreator && (
  <>
    <button
      onClick={createMatchFromEvent}
      disabled={creatingMatch || accountLocked || isCancelled || !canCreateEventMatch}
      className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-6 py-4 font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
    >
      <PlayCircle size={18} />
      {creatingMatch
  ? "Creazione match..."
  : accountLocked
  ? "Azione bloccata"
  : isCancelled
  ? "Evento annullato"
  : isCompetitionCompleted
  ? "Competizione completata"
  : event.type === "torneo" && (!event.bracket || event.bracket.length === 0)
  ? "Genera prima il tabellone"
  : event.type === "torneo" && (!event.bracket || event.bracket.length === 0)
  ? "Genera prima il tabellone"
  : !canCreateEventMatch
  ? "Tutti i match creati"
  : event.type === "torneo"
  ? "Crea prossimo match torneo"
  : event.type === "campionato"
  ? "Crea prossima giornata"
  : "Crea nuovo match"}
    </button>

    {event.type === "torneo" && isTeamCompetition && (
      <button
        onClick={generateTournamentBracket}
        disabled={
  generatingBracket ||
  accountLocked ||
  isCancelled ||
  Boolean(event.bracket?.length) ||
  !hasEnoughValidTeams
}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-6 py-4 font-black text-yellow-200 transition hover:bg-yellow-400/20 disabled:opacity-60"
      >
        <Trophy size={18} />
        {generatingBracket
  ? "Generazione..."
  : event.bracket?.length
  ? "Tabellone già generato"
  : !hasEnoughValidTeams
  ? `Servono ${getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()} validi`
  : "Genera tabellone"}
      </button>
    )}
    {event.type === "campionato" && isTeamCompetition && (
  <button
    onClick={generateLeagueSchedule}
    disabled={
  generatingLeague ||
  accountLocked ||
  isCancelled ||
  Boolean(event.leagueFixtures?.length) ||
  !hasEnoughValidTeams
}
    className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-6 py-4 font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
  >
    <CalendarDays size={18} />
 {generatingLeague
  ? "Generazione..."
  : event.leagueFixtures?.length
  ? "Calendario già generato"
  : !hasEnoughValidTeams
  ? `Servono ${getTeamPluralLabel(competitionFormat, event.sport).toLowerCase()} validi`
  : "Genera calendario"}
  </button>
)}
    <div className="mt-5 rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
      <div className="text-sm font-black uppercase tracking-[0.16em] text-red-200">
        Annullamento evento
      </div>

      <p className="mt-2 text-sm leading-6 text-slate-300">
        Puoi annullare solo eventi non iniziati e senza match creati.
        Se tabellone, calendario o match sono già stati generati, l'annullamento diretto viene bloccato.
      </p>

      {!canCancelSafely && cancelBlockedReason && (
        <div className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-sm font-bold text-yellow-100">
          {cancelBlockedReason}
        </div>
      )}

      <textarea
        value={cancellationReason}
        onChange={(e) => setCancellationReason(e.target.value)}
        disabled={accountLocked || isCancelled || !canCancelSafely}
        placeholder="Motivo annullamento"
        className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-[#020617]/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
      />

      <button
        type="button"
        onClick={cancelEvent}
        disabled={accountLocked || isCancelled || !canCancelSafely}
        className="mt-3 w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-6 py-4 font-black text-red-200 disabled:opacity-60"
      >
        {isCancelled
          ? "Evento già annullato"
          : accountLocked
          ? "Azione bloccata"
          : canCancelSafely
          ? "Annulla evento"
          : "Annullamento bloccato"}
      </button>
    </div>
  </>
)}

              {message && (
                <div className="mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                  {message}
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/[.03] p-4 text-sm leading-6 text-slate-300">
                Creato da:{" "}
                <span className="font-black text-white">
                  {event.createdByName || "Rivalo Player"}
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                  {isTeamCompetition ? "Giocatori iscritti" : "Lista iscritti"}
                </div>

                <div className="space-y-3">
                  {participantsInfo.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                      Nessun iscritto visibile.
                    </div>
                  ) : (
                    participantsInfo.map((participant) => (
                      <ParticipantRow
                        key={participant.uid}
                        participant={participant}
                      />
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function TeamCard({
  team,
  validationLabel,
  valid,
}: {
  team: TeamInfo;
  validationLabel: string;
  valid: boolean;
}) {
  const captain =
    team.players.find((player) => player.uid === team.captainId) ||
    team.players.find((player) => player.uid === team.createdBy);

  const captainName = team.captainName || captain?.name || "Rivalo Player";

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] p-3 sm:p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="text-xl font-black uppercase text-cyan-200">
            {team.name}
          </div>

          <div className="mt-2 inline-flex rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-100">
            Capitano: {captainName}
          </div>
        </div>

        <div
          className={`rounded-xl border px-3 py-2 text-xs font-black ${
            valid
              ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
              : "border-red-400/20 bg-red-500/10 text-red-200"
          }`}
        >
          {validationLabel}
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {team.players.map((player) => (
          <div
            key={player.uid}
            className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                {player.photoUrl ? (
                  <img
                    src={player.photoUrl}
                    alt="Player"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="text-cyan-200" size={18} />
                )}
              </div>

              <div className="truncate font-bold">
                {player.name || "Rivalo Player"}
              </div>
            </div>

            {(player.uid === team.captainId ||
              (!team.captainId && player.uid === team.createdBy)) && (
              <span className="shrink-0 rounded-lg border border-yellow-300/20 bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100">
                Capitano
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRankRow({
  team,
  index,
  eventCopy,
}: {
  team: TeamStat;
  index: number;
  eventCopy: ReturnType<typeof getEventCopy>;
}) {
  const goalDifference =
    Number(team.goalDifference || 0) ||
    Number(team.goalsFor || 0) - Number(team.goalsAgainst || 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-lime-400/10 text-lg font-black text-lime-300">
          #{index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="break-words text-base font-black uppercase sm:text-lg">
            {team.teamName || eventCopy.teamSingle}
          </div>

          <div className="text-xs text-slate-400">
            {team.matchesPlayed || 0} match giocati
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <RankStat label="PT" value={team.points || 0} />
        <RankStat label="G" value={team.matchesPlayed || 0} />
        <RankStat label="V" value={team.wins || 0} />
        <RankStat label="N" value={team.draws || 0} />
        <RankStat label="P" value={team.losses || 0} />
        <RankStat label={eventCopy.scoreFor} value={team.goalsFor || 0} />
        <RankStat label={eventCopy.scoreAgainst} value={team.goalsAgainst || 0} />
        <RankStat label={eventCopy.scoreDiff} value={goalDifference} />
      </div>
    </div>
  );
}

function EventRankRow({
  stat,
  index,
  eventCopy,
  racketEvent,
}: {
  stat: EventStat;
  index: number;
  eventCopy: ReturnType<typeof getEventCopy>;
  racketEvent: boolean;
}) {
  const icon =
    index === 0 ? (
      <Crown className="text-yellow-300" />
    ) : index === 1 ? (
      <Medal className="text-slate-300" />
    ) : index === 2 ? (
      <Star className="text-orange-300" />
    ) : (
      <span className="font-black text-cyan-300">#{index + 1}</span>
    );

  const goalDifference =
    Number(stat.goalDifference || 0) ||
    Number(stat.goalsFor || 0) - Number(stat.goalsAgainst || 0);

  return (
    <Link
      href={`/public/${stat.uid}`}
      className="block min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-white/[.03] p-3 transition hover:border-cyan-400/30 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-black/30">
          {icon}
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
            {stat.photoUrl ? (
              <img
                src={stat.photoUrl}
                alt="Player"
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="text-cyan-200" size={22} />
            )}
          </div>

          <div className="min-w-0">
            <div className="break-words text-base font-black uppercase sm:text-lg">
              {stat.playerName || "Rivalo Player"}
            </div>

            <div className="text-xs text-slate-400">
              {stat.matchesPlayed || 0} match evento
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-4">
        <RankStat label="PT" value={stat.points || 0} />
        <RankStat label="V" value={stat.wins || 0} />
        <RankStat label="MVP" value={stat.mvp || 0} />
        <RankStat label={eventCopy.scoreDiff} value={goalDifference} />
      </div>
    </Link>
  );
}

function RankStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-2 py-3 text-center">
      <div className="break-words text-base font-black text-cyan-200">
        {value}
      </div>

      <div className="mt-1 break-words text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant,
}: {
  participant: ParticipantInfo;
}) {
  return (
    <Link
      href={`/public/${participant.uid}`}
      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-3 transition hover:border-cyan-400/30"
    >
      <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
        {participant.photoUrl ? (
          <img
            src={participant.photoUrl}
            alt="Partecipante"
            className="h-full w-full object-cover"
          />
        ) : (
          <UserRound className="text-cyan-200" size={22} />
        )}
      </div>

      <div className="min-w-0">
        <div className="truncate font-black">
          {participant.name || "Rivalo Player"}
        </div>

        <div className="text-xs text-slate-400">
          Iscritto
        </div>
      </div>
    </Link>
  );
}

function InfoCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-black/20 p-5">
      <div className={`mb-4 ${color}`}>{icon}</div>

      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>

      <div className="mt-2 break-words text-xl font-black sm:text-2xl">
        {value}
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

function SummaryBox({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "cyan" | "yellow" | "lime" | "green" | "orange";
}) {
  const toneClass =
    tone === "yellow"
      ? "border-yellow-300/20 bg-yellow-400/10 text-yellow-200"
      : tone === "lime"
      ? "border-lime-300/20 bg-lime-400/10 text-lime-200"
      : tone === "green"
      ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-200"
      : tone === "orange"
      ? "border-orange-300/20 bg-orange-400/10 text-orange-200"
      : "border-cyan-300/20 bg-cyan-400/10 text-cyan-200";

  return (
    <div className={`min-w-0 rounded-2xl border p-3 text-center sm:p-4 ${toneClass}`}>
      <div className="text-2xl font-black sm:text-3xl">{value}</div>

      <div className="mt-2 break-words text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs sm:tracking-[0.16em]">
        {label}
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
      {children}
    </span>
  );
}