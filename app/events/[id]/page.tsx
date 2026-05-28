"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createActivity } from "../../../lib/createActivity";

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
  maxPlayers?: number;
  prize?: string;
  status?: string;
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

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<EventData | null>(null);
  const [participantsInfo, setParticipantsInfo] = useState<ParticipantInfo[]>([]);
  const [eventStats, setEventStats] = useState<EventStat[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserOption[]>([]);
  const [generatingBracket, setGeneratingBracket] = useState(false);
  const [generatingLeague, setGeneratingLeague] = useState(false);

  const [teamName, setTeamName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);

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
      await loadEvent();
    });

    return () => unsub();
  }, [id]);

  async function loadEvent() {
    if (!id) return;

    setLoading(true);

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

      setEvent(eventData);

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

  async function createTeam() {
    if (!user || !event) return;

    if (!teamName.trim()) {
      setMessage("Inserisci il nome della squadra.");
      return;
    }

    const competitionFormat =
      event.competitionFormat ||
      (event.sport === "calcetto" ? "squadre" : "singolo");

   if (competitionFormat === "doppio" && selectedPlayerIds.length !== 2) {
  setMessage("Nel doppio devi selezionare esattamente 2 giocatori.");
  return;
}

if (competitionFormat === "squadre" && selectedPlayerIds.length < 2) {
  setMessage("Per creare una squadra servono almeno 2 giocatori.");
  return;
}

if (competitionFormat === "squadre" && selectedPlayerIds.length > 8) {
  setMessage("Una squadra può avere massimo 8 giocatori.");
  return;
}

const currentTeams = event.teams || [];

const alreadyUsedPlayerIds = currentTeams.flatMap((team) =>
  Array.isArray(team.players) ? team.players.map((player) => player.uid) : []
);

const duplicatedPlayer = selectedPlayerIds.find((uid) =>
  alreadyUsedPlayerIds.includes(uid)
);

if (duplicatedPlayer) {
  const duplicatedUser = availableUsers.find((u) => u.uid === duplicatedPlayer);

  setMessage(
    `${duplicatedUser?.name || duplicatedUser?.nickname || "Questo giocatore"} è già in una squadra di questo evento.`
  );
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

    const newTeam: TeamInfo = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      name: teamName.trim(),
      players: selectedPlayers,
      createdBy: user.uid,
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
      setMessage("Squadra creata.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione della squadra.");
    }

    setCreatingTeam(false);
  }

  function validateTeamsForCompetition() {
  if (!event) return false;

  const competitionFormat =
    event.competitionFormat ||
    (event.sport === "calcetto" ? "squadre" : "singolo");

  const teams = event.teams || [];

  if (teams.length < 2) {
    setMessage("Servono almeno 2 squadre/coppie per iniziare.");
    return false;
  }

  for (const team of teams) {
    const playersCount = Array.isArray(team.players) ? team.players.length : 0;

    if (competitionFormat === "doppio" && playersCount !== 2) {
      setMessage(`La coppia ${team.name} deve avere esattamente 2 giocatori.`);
      return false;
    }

    if (competitionFormat === "squadre" && playersCount < 2) {
      setMessage(`La squadra ${team.name} deve avere almeno 2 giocatori.`);
      return false;
    }

    if (competitionFormat === "squadre" && playersCount > 8) {
      setMessage(`La squadra ${team.name} supera il massimo di 8 giocatori.`);
      return false;
    }
  }

  return true;
}

async function generateTournamentBracket() {
  if (!user || !event) return;

  const teams = event.teams || [];

  if (event.type !== "torneo") {
    setMessage("Il tabellone è disponibile solo per i tornei.");
    return;
  }

  if (event.bracket && event.bracket.length > 0) {
  setMessage("Il tabellone è già stato generato.");
  return;
}

  if (teams.length < 2) {
    setMessage("Servono almeno 2 squadre per generare il tabellone.");
    return;
  }
  if (!validateTeamsForCompetition()) {
  return;
}

  setGeneratingBracket(true);
  setMessage("");

  try {
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

    const bracket: BracketMatch[] = [];

    for (let i = 0; i < shuffledTeams.length; i += 2) {
      const homeTeam = shuffledTeams[i];
      const awayTeam = shuffledTeams[i + 1];

      bracket.push({
        round: 1,
        matchNumber: bracket.length + 1,
        homeTeamId: homeTeam?.id || "",
        awayTeamId: awayTeam?.id || "",
        homeName: homeTeam?.name || "Da definire",
        awayName: awayTeam?.name || "Riposo",
        winnerTeamId: "",
        matchId: "",
      });
    }

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

    setMessage("Tabellone generato.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la generazione del tabellone.");
  }

  setGeneratingBracket(false);
}
async function generateLeagueSchedule() {
  if (!user || !event) return;

  const teams = event.teams || [];

  if (event.type !== "campionato") {
    setMessage("Il calendario è disponibile solo per i campionati.");
    return;
  }
   if (event.leagueFixtures && event.leagueFixtures.length > 0) {
  setMessage("Il calendario è già stato generato.");
  return;
}

  if (teams.length < 2) {
    setMessage("Servono almeno 2 squadre per generare il calendario.");
    return;
  }
  if (!validateTeamsForCompetition()) {
  return;
}

  setGeneratingLeague(true);
  setMessage("");

  try {
    const workingTeams: TeamInfo[] =
      teams.length % 2 === 0
        ? [...teams]
        : [
            ...teams,
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

    setMessage("Calendario campionato generato.");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la generazione del calendario.");
  }

  setGeneratingLeague(false);
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

const competitionFormat =
  event.competitionFormat ||
  (event.sport === "calcetto" ? "squadre" : "singolo");

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

    let sourceBracketIndex = -1;
    let sourceLeagueIndex = -1;

    if (competitionFormat === "singolo") {
      if (participantsInfo.length < 2) {
        setMessage("Servono almeno 2 partecipanti per creare un match.");
        setCreatingMatch(false);
        return;
      }

      players = participantsInfo.slice(0, 2).map((participant, index) => ({
        uid: participant.uid,
        name: participant.name || "Rivalo Player",
        team: index === 0 ? "home" : "away",
        goals: 0,
        assists: 0,
        isMvp: false,
      }));

      homeTeamName = participantsInfo[0]?.name || "Player 1";
      awayTeamName = participantsInfo[1]?.name || "Player 2";
    } else {
      const teams = event.teams || [];

      if (teams.length < 2) {
        setMessage("Servono almeno 2 squadre per creare un match.");
        setCreatingMatch(false);
        return;
      }

      let homeTeam: TeamInfo | undefined;
      let awayTeam: TeamInfo | undefined;

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

      sport: event.sport || "calcetto",
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

    router.push(`/match/${matchRef.id}`);
  } catch (error) {
    console.error(error);
    setMessage("Errore durante la creazione del match.");
  }

  setCreatingMatch(false);
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

  const participants = event.participants || [];
  const maxPlayers = Number(event.maxPlayers || 0);
  const teams = event.teams || [];

  const competitionFormat: CompetitionFormat =
    event.competitionFormat ||
    (event.sport === "calcetto" ? "squadre" : "singolo");

  const isTeamCompetition =
    competitionFormat === "squadre" || competitionFormat === "doppio";

  const availableSpots =
    maxPlayers > 0 ? Math.max(0, maxPlayers - participants.length) : 0;

  const isJoined = user ? participants.includes(user.uid) : false;
  const isCreator = user?.uid === event.createdBy;

  const isFull = maxPlayers > 0 && participants.length >= maxPlayers;

  const canJoin = !isJoined && !isFull && event.status !== "completo";

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

      const rankedTeamStats = [...teamStats].sort((a, b) => {
  const goalDiffA = Number(a.goalsFor || 0) - Number(a.goalsAgainst || 0);
  const goalDiffB = Number(b.goalsFor || 0) - Number(b.goalsAgainst || 0);

  return (
    Number(b.points || 0) - Number(a.points || 0) ||
    goalDiffB - goalDiffA ||
    Number(b.goalsFor || 0) - Number(a.goalsFor || 0) ||
    Number(b.wins || 0) - Number(a.wins || 0)
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

const canCreateEventMatch =
  event.type === "torneo"
    ? hasPendingTournamentMatch
    : event.type === "campionato"
    ? hasPendingLeagueMatch
    : true;

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
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna agli eventi
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{typeLabel}</Badge>
                  <Badge>{sportLabel}</Badge>
                  <Badge>{formatLabel}</Badge>
                  <Badge>{event.status || "aperto"}</Badge>
                </div>

                <h1 className="mt-5 text-5xl font-black uppercase">
                  {event.title || "Evento Rivalo"}
                </h1>

                <p className="mt-4 max-w-3xl text-slate-300">
                  Organizza, partecipa e porta la competizione sul campo.
                </p>
              </div>

              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-6 py-4">
                <div className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">
                  {isTeamCompetition ? "Squadre" : "Posti liberi"}
                </div>

                <div className="mt-1 text-3xl font-black text-cyan-100">
                  {isTeamCompetition
                    ? teams.length
                    : maxPlayers > 0
                    ? availableSpots
                    : "N/D"}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-6">
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

              {event.prize && (
                <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-400/10 p-6">
                  <div className="flex items-center gap-3 text-yellow-200">
                    <Trophy />
                    <div className="text-sm font-black uppercase tracking-[0.2em]">
                      Premio
                    </div>
                  </div>

                  <div className="mt-3 text-2xl font-black">{event.prize}</div>
                </div>
              )}

              {isTeamCompetition && (
                <section className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
                  <div className="mb-5">
                    <div className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      Squadre
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
                      Gestione squadre
                    </h2>

                    <p className="mt-2 text-sm text-slate-400">
                      Crea le squadre o le coppie che parteciperanno alla competizione.
                    </p>
                  </div>

                  {isCreator && (
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                      <Field label={competitionFormat === "doppio" ? "Nome coppia" : "Nome squadra"}>
                        <input
                          value={teamName}
                          onChange={(e) => setTeamName(e.target.value)}
                          placeholder={
                            competitionFormat === "doppio"
                              ? "Es. Coppia Blu"
                              : "Es. Team Black"
                          }
                          className="w-full bg-transparent outline-none placeholder:text-slate-500"
                        />
                      </Field>

                      <div className="mt-4">
                        <div className="mb-2 text-sm font-black uppercase tracking-[0.12em] text-slate-300">
                          Giocatori iscritti all'evento
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

                        <div className="mt-2 text-xs text-slate-400">
                         Puoi selezionare solo giocatori già iscritti all'evento. Un giocatore non può stare in due squadre.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={createTeam}
                        disabled={creatingTeam}
                        className="mt-4 w-full rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
                      >
                        {creatingTeam ? "Creazione..." : "Crea squadra"}
                      </button>
                    </div>
                  )}

                  <div className="mt-5 space-y-3">
                    {teams.length === 0 ? (
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
                        Nessuna squadra creata.
                      </div>
                    ) : (
                      teams.map((team) => <TeamCard key={team.id} team={team} />)
                    )}
                  </div>
                </section>
              )}

              
{event.type === "torneo" && (
  <section className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-yellow-300">
          Tabellone torneo
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Primo turno
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Le sfide vengono generate dalle squadre iscritte al torneo.
        </p>
      </div>

      <Trophy className="text-yellow-300" />
    </div>

    {!event.bracket || event.bracket.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Nessun tabellone generato.
      </div>
    ) : (
      <div className="space-y-3">
        {event.bracket.map((match) => (
          <div
            key={`${match.round}_${match.matchNumber}`}
            className="rounded-2xl border border-white/10 bg-white/[.03] p-4"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
    Round {match.round} · Match {match.matchNumber}
  </div>

  <div
    className={`rounded-xl border px-3 py-1 text-xs font-black uppercase ${
      match.resultStatus === "confermato"
        ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
        : match.matchId
        ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
        : "border-white/10 bg-white/[.03] text-slate-400"
    }`}
  >
    {match.resultStatus === "confermato"
      ? "Completato"
      : match.matchId
      ? "Match creato"
      : "Da creare"}
  </div>
</div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 font-black text-cyan-100">
                {match.homeName}
              </div>

              <div className="text-center text-sm font-black text-slate-400">
                VS
              </div>

              {typeof match.homeScore === "number" &&
  typeof match.awayScore === "number" && (
    <div className="mt-3 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200">
      Risultato: {match.homeScore} - {match.awayScore}
    </div>
  )}

              <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4 font-black text-fuchsia-100">
                {match.awayName}
              </div>
            </div>
            {match.matchId ? (
  <Link
    href={`/match/${match.matchId}`}
    className="mt-3 inline-flex rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200"
  >
    Apri match
  </Link>
) : (
  <div className="mt-3 inline-flex rounded-xl border border-white/10 bg-white/[.03] px-4 py-2 text-xs font-black text-slate-400">
    Match non ancora creato
  </div>
)}
          </div>
        ))}
      </div>
    )}
  </section>
)}{event.type === "campionato" && isTeamCompetition && (
  <section className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-lime-300">
          Calendario campionato
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Giornate andata / ritorno
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Le giornate vengono generate dalle squadre iscritte al campionato.
        </p>
      </div>

      <CalendarDays className="text-lime-300" />
    </div>

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

            {fixture.matchId && (
              <Link
                href={`/match/${fixture.matchId}`}
                className="mt-3 inline-flex rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-xs font-black text-lime-200"
              >
                Apri match
              </Link>
            )}
          </div>
        ))}
      </div>
    )}
  </section>
)}

{isTeamCompetition && (event.type === "campionato" || event.type === "torneo") && (
  <section className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <div className="text-sm font-black uppercase tracking-[0.25em] text-lime-300">
          Classifica squadre
        </div>

        <h2 className="mt-2 text-3xl font-black">
          Ranking competizione
        </h2>

        <p className="mt-2 text-sm text-slate-400">
          Qui contano solo i risultati confermati di questa competizione.
        </p>
      </div>

      <Trophy className="text-lime-300" />
    </div>

    {rankedTeamStats.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Nessuna statistica squadra ancora.
      </div>
    ) : (
      <div className="space-y-3">
        {rankedTeamStats.map((team, index) => (
          <TeamRankRow key={team.id} team={team} index={index} />
        ))}
      </div>
    )}
  </section>
)}
              <section className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.25em] text-cyan-300">
                      Ranking evento
                    </div>

                    <h2 className="mt-2 text-3xl font-black">
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
                      <EventRankRow key={stat.uid} stat={stat} index={index} />
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
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
                  disabled={joining || !canJoin}
                  className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black transition hover:scale-[1.01] disabled:opacity-60"
                >
                  <UserPlus size={18} />
                  {isJoined
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
      disabled={creatingMatch || !canCreateEventMatch}
      className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-6 py-4 font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
    >
      <PlayCircle size={18} />
      {creatingMatch
  ? "Creazione match..."
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
        disabled={generatingBracket || Boolean(event.bracket?.length)}
        className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-6 py-4 font-black text-yellow-200 transition hover:bg-yellow-400/20 disabled:opacity-60"
      >
        <Trophy size={18} />
        {generatingBracket
  ? "Generazione..."
  : event.bracket?.length
  ? "Tabellone già generato"
  : "Genera tabellone"}
      </button>
    )}
    {event.type === "campionato" && isTeamCompetition && (
  <button
    onClick={generateLeagueSchedule}
    disabled={generatingLeague || Boolean(event.leagueFixtures?.length)}
    className="mt-3 flex w-full items-center justify-center gap-3 rounded-2xl border border-lime-400/20 bg-lime-400/10 px-6 py-4 font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-60"
  >
    <CalendarDays size={18} />
    {generatingLeague
  ? "Generazione..."
  : event.leagueFixtures?.length
  ? "Calendario già generato"
  : "Genera calendario"}
  </button>
)}
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

function TeamCard({ team }: { team: TeamInfo }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div className="text-xl font-black uppercase text-cyan-200">
        {team.name}
      </div>
      <div className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
  {team.players.length} giocatori
</div>

      <div className="mt-3 space-y-2">
        {team.players.map((player) => (
          <div
            key={player.uid}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
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

            <div className="font-bold">
              {player.name || "Rivalo Player"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamRankRow({
  team,
  index,
}: {
  team: TeamStat;
  index: number;
}) {
  const goalDifference =
    Number(team.goalsFor || 0) - Number(team.goalsAgainst || 0);

  return (
    <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 md:grid-cols-[50px_1fr_54px_54px_54px_54px_54px_54px_54px_54px] md:items-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime-400/10 text-lg font-black text-lime-300">
        #{index + 1}
      </div>

      <div className="min-w-0">
        <div className="truncate font-black uppercase">
          {team.teamName || "Squadra"}
        </div>

        <div className="text-xs text-slate-400">
          {team.matchesPlayed || 0} match giocati
        </div>
      </div>

      <RankStat label="PT" value={team.points || 0} />
<RankStat label="G" value={team.matchesPlayed || 0} />
<RankStat label="V" value={team.wins || 0} />
<RankStat label="N" value={team.draws || 0} />
<RankStat label="P" value={team.losses || 0} />
<RankStat label="GF" value={team.goalsFor || 0} />
<RankStat label="GS" value={team.goalsAgainst || 0} />
<RankStat label="DR" value={goalDifference} />
    </div>
  );
}

function EventRankRow({
  stat,
  index,
}: {
  stat: EventStat;
  index: number;
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
    Number(stat.goalsFor || 0) - Number(stat.goalsAgainst || 0);

  return (
    <Link
      href={`/public/${stat.uid}`}
      className="grid gap-4 rounded-2xl border border-white/10 bg-white/[.03] p-4 transition hover:border-cyan-400/30 md:grid-cols-[50px_1fr_70px_70px_70px_70px]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/30">
        {icon}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
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
          <div className="truncate font-black uppercase">
            {stat.playerName || "Rivalo Player"}
          </div>

          <div className="text-xs text-slate-400">
            {stat.matchesPlayed || 0} match evento
          </div>
        </div>
      </div>

      <RankStat label="PT" value={stat.points || 0} />
      <RankStat label="V" value={stat.wins || 0} />
      <RankStat label="MVP" value={stat.mvp || 0} />
      <RankStat label="DR" value={goalDifference} />
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
    <div className="text-center">
      <div className="text-lg font-black text-cyan-200">
        {value}
      </div>

      <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
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

      <div className="mt-2 break-words text-2xl font-black">
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

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
      {children}
    </span>
  );
}