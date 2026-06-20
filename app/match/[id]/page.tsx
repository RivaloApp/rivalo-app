"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { applyMatchStats } from "../../../lib/rivaloStats";
import { updatePlayerStats } from "../../../lib/updatePlayerStats";
import { updateTeamEventStats } from "../../../lib/updateTeamEventStats";
import { createNotification } from "../../../lib/createNotification";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type MatchPlayer = {
  uid: string;
  name: string;
  team?: "home" | "away";
  accountStatus?: string;
  deletionRequested?: boolean;
  goals?: number;
  assists?: number;
  isMvp?: boolean;
  role?: string;
  goalsConceded?: number;
  cleanSheet?: boolean;
  penaltiesSaved?: number;
};

type MatchDoc = {
  createdBy?: string;
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  mode?: string;
  slots?: number;
  status?: string;
  resultStatus?: string;
  fairPlayStatus?: string;
  resultProposedBy?: string;
  resultProposedTeam?: "home" | "away" | "";
  resultConfirmRequiredTeam?: "home" | "away" | "";
  resultProposalExpiresAt?: any;
  confirmedBy?: string[];
  disputedBy?: string[];
  homeTeam?: string;
  awayTeam?: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeCaptainId?: string;
  awayCaptainId?: string;
  sourceType?: string;
  matchmakingRequestId?: string;
  homeScore?: number | null;
  awayScore?: number | null;
  mvpName?: string;
  notes?: string;
  statsApplied?: boolean;
  statsApplying?: boolean;
  statsAppliedAt?: any;
  statsAppliedBy?: string;
  statsApplyingBy?: string;
  statsError?: boolean;
  statsErrorAt?: any;
  cancelledAt?: any;
  cancelledBy?: string;
  cancellationReason?: string;
  statsReverted?: boolean;
  statsRevertedAt?: any;
  statsRevertedBy?: string;
  participants?: string[];
  players?: MatchPlayer[];
  eventId?: string;
  eventTitle?: string;
  competitionFormat?: string;
  scoreMode?: "football" | "racket";
  sportStatsMode?: "football" | "racket";
};

type UserProfile = {
  mainSport?: string;
  sport?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

type CompetitionFormat = "singolo" | "doppio" | "squadre";

function normalizeSport(value?: string) {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";
  return "calcetto";
}

function normalizeCalcettoRole(value?: string) {
  const role = (value || "").toLowerCase().trim();

  if (role.includes("port")) return "portiere";
  if (role.includes("dif")) return "difensore";
  if (role.includes("cent")) return "centrocampista";
  if (role.includes("att")) return "attaccante";
  if (role.includes("jolly")) return "jolly";

  return role;
}

function isGoalkeeper(player?: MatchPlayer) {
  return normalizeCalcettoRole(player?.role) === "portiere";
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

function getMatchCopy(value?: string, format?: CompetitionFormat) {
  const sport = normalizeSport(value);
  const isSingle = format === "singolo";
  const sideOneLabel = isSingle ? "Giocatore 1" : "Coppia 1";
  const sideTwoLabel = isSingle ? "Giocatore 2" : "Coppia 2";

  if (sport === "padel") {
    return {
      teamA: sideOneLabel,
      teamB: sideTwoLabel,
      homeScore: `Set vinti ${sideOneLabel}`,
      awayScore: `Set vinti ${sideTwoLabel}`,
      resultLabel: "Set finali",
      statsTitle: "Prestazione padel",
      playerStatsHelp: "Per il padel contano risultato, vittoria, MVP, streak e continuità.",
      notesPlaceholder: "Dettaglio set/game, esempio: 6-4 3-6 10-8, tie-break o note partita...",
      officialMessage: "Match ufficiale. Risultato e statistiche padel non sono più modificabili.",
      rankingText: "Solo i match confermati aggiornano RivalScore, XP, vittorie, MVP e streak.",
      formTitle: "Risultato padel e FairPlay",
      formDescription: "Inserisci i set vinti e usa le note per il dettaglio game/tie-break.",
      mvpLabel: "MVP del match",
      mvpPlaceholder: "Nome giocatore decisivo",
      scoreHelp: "I set vinti vengono salvati come risultato. Il dettaglio game/tie-break va nelle note.",
    };
  }

  if (sport === "tennis") {
    return {
      teamA: sideOneLabel,
      teamB: sideTwoLabel,
      homeScore: `Set vinti ${sideOneLabel}`,
      awayScore: `Set vinti ${sideTwoLabel}`,
      resultLabel: "Set finali",
      statsTitle: "Prestazione tennis",
      playerStatsHelp: "Per il tennis contano risultato, vittoria, MVP, streak e continuità.",
      notesPlaceholder: "Dettaglio set/game, esempio: 6-3 4-6 7-5, tie-break o note partita...",
      officialMessage: "Match ufficiale. Risultato e statistiche tennis non sono più modificabili.",
      rankingText: "Solo i match confermati aggiornano RivalScore, XP, vittorie, MVP e streak.",
      formTitle: "Risultato tennis e FairPlay",
      formDescription: "Inserisci i set vinti e usa le note per il dettaglio game/tie-break.",
      mvpLabel: "MVP del match",
      mvpPlaceholder: "Nome giocatore decisivo",
      scoreHelp: "I set vinti vengono salvati come risultato. Il dettaglio game/tie-break va nelle note.",
    };
  }

  return {
    teamA: "Squadra 1",
    teamB: "Squadra 2",
    homeScore: "Gol squadra 1",
    awayScore: "Gol squadra 2",
    resultLabel: "Risultato",
    statsTitle: "Statistiche giocatori",
    playerStatsHelp: "Per calcetto puoi inserire gol, assist, MVP e statistiche portiere quando il ruolo è portiere.",
    notesPlaceholder: "Gol, assist, note o dettagli partita...",
    officialMessage: "Match ufficiale. Risultato e statistiche non sono più modificabili.",
    rankingText: "Solo i match confermati aggiornano RivalScore, XP, vittorie, gol, assist e MVP.",
    formTitle: "Risultato e FairPlay",
    formDescription: "Il risultato diventa ufficiale solo dopo conferma.",
    mvpLabel: "MVP partita",
    mvpPlaceholder: "Nome MVP",
    scoreHelp: "",
  };
}

function getSafePlayersForStats(match: MatchDoc, players: MatchPlayer[]) {
  if (!isRacketSport(match.sport)) return players;

  return players.map((player) => ({
    ...player,
    goals: 0,
    assists: 0,
  }));
}

function getRacketScoreError(match: MatchDoc, homeValue: string | number | null | undefined, awayValue: string | number | null | undefined) {
  if (!isRacketSport(match.sport)) return "";

  const homeScoreNumber = Number(homeValue);
  const awayScoreNumber = Number(awayValue);

  if (
    homeValue === "" ||
    awayValue === "" ||
    homeValue === null ||
    awayValue === null ||
    Number.isNaN(homeScoreNumber) ||
    Number.isNaN(awayScoreNumber)
  ) {
    return "Seleziona un risultato set valido.";
  }

  const validScores = new Set(["2-0", "2-1", "1-2", "0-2"]);
  const scoreKey = `${homeScoreNumber}-${awayScoreNumber}`;

  if (!validScores.has(scoreKey)) {
    return "Per padel e tennis puoi inserire solo risultati set reali: 2-0, 2-1, 1-2 o 0-2.";
  }

  return "";
}

function isSameUserSport(match: MatchDoc, userSport: string) {
  return normalizeSport(match.sport) === normalizeSport(userSport);
}

function isProfileDeletionRequested(profile?: UserProfile | MatchPlayer | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function getPlayerDisplayName(player?: MatchPlayer | null) {
  if (!player) return "Rivalo Player";
  if (isProfileDeletionRequested(player)) return "Utente rimosso";

  return player.name || "Rivalo Player";
}

function getPlayerStatusLabel(player?: MatchPlayer | null) {
  return isProfileDeletionRequested(player) ? "Profilo non attivo" : "";
}

function getUniqueChatPlayers(players: MatchPlayer[], currentUid?: string) {
  const seen = new Set<string>();

  return players.filter((player) => {
    if (!player.uid) return false;
    if (player.uid === currentUid) return false;
    if (isProfileDeletionRequested(player)) return false;
    if (seen.has(player.uid)) return false;

    seen.add(player.uid);
    return true;
  });
}

function getAccountLockedMessage() {
  return "Profilo non attivo: puoi consultare lo storico, ma non puoi eseguire nuove azioni.";
}

function canUseMatch(match: MatchDoc, uid: string, userSport: string) {
  return canAccessMatch(match, uid) && isSameUserSport(match, userSport);
}

function canAccessMatch(match: MatchDoc, uid: string) {
  if (!uid) return false;

  if (match.createdBy === uid) return true;

  if (Array.isArray(match.participants) && match.participants.includes(uid)) {
    return true;
  }

  if (
    Array.isArray(match.players) &&
    match.players.some((player) => player.uid === uid)
  ) {
    return true;
  }

  return false;
}

function isPlayerInMatch(match: MatchDoc, uid: string) {
  return Boolean(
    uid &&
      Array.isArray(match.players) &&
      match.players.some((player) => player.uid === uid)
  );
}

function canManageMatchResult(match: MatchDoc, uid: string) {
  if (!uid) return false;
  if (!isPlayerInMatch(match, uid)) return false;

  return Boolean(getUserConfirmationTeam(match, uid));
}

function getUserTeam(match: MatchDoc, uid: string): "home" | "away" | "" {
  if (!uid) return "";

  const playerTeam = (match.players || []).find(
    (player) => player.uid === uid
  )?.team;

  if (playerTeam === "home" || playerTeam === "away") {
    return playerTeam;
  }

  return "";
}

function getCaptainTeam(match: MatchDoc, uid: string): "home" | "away" | "" {
  if (!uid) return "";

  if (match.homeCaptainId && match.homeCaptainId === uid) return "home";
  if (match.awayCaptainId && match.awayCaptainId === uid) return "away";

  return "";
}

function hasCaptainRules(match: MatchDoc) {
  return Boolean(match.homeCaptainId && match.awayCaptainId);
}

function isEventLinkedMatch(match: MatchDoc) {
  const sourceType = (match.sourceType || "").toLowerCase();

  return Boolean(match.eventId) ||
    sourceType.includes("event") ||
    match.mode === "torneo" ||
    match.mode === "campionato";
}

function requiresCaptainRules(match: MatchDoc) {
  return (
    hasCaptainRules(match) ||
    isEventLinkedMatch(match) ||
    match.competitionFormat === "doppio" ||
    match.competitionFormat === "squadre"
  );
}

function getUserConfirmationTeam(match: MatchDoc, uid: string): "home" | "away" | "" {
  const captainTeam = getCaptainTeam(match, uid);

  if (captainTeam) return captainTeam;

  if (requiresCaptainRules(match)) return "";

  return getUserTeam(match, uid);
}

function getPermissionLabel(match: MatchDoc) {
  return requiresCaptainRules(match)
    ? "Solo i capitani possono gestire risultato e FairPlay."
    : "Solo i giocatori coinvolti possono gestire il risultato.";
}

function getOpponentCaptainLabel(match: MatchDoc, team: "home" | "away" | "") {
  if (!hasCaptainRules(match)) return getTeamName(match, team);

  if (team === "home") return `capitano di ${match.homeTeam || "Squadra 1"}`;
  if (team === "away") return `capitano di ${match.awayTeam || "Squadra 2"}`;

  return "capitano avversario";
}

function getOpponentTeam(team: "home" | "away" | ""): "home" | "away" | "" {
  if (team === "home") return "away";
  if (team === "away") return "home";
  return "";
}

function getTeamName(match: MatchDoc, team: "home" | "away" | "") {
  if (team === "home") return match.homeTeam || "Squadra 1";
  if (team === "away") return match.awayTeam || "Squadra 2";
  return "Squadra";
}

function isProposalExpired(match: MatchDoc) {
  const rawDeadline = match.resultProposalExpiresAt;

  if (!rawDeadline) return false;

  const deadline =
    typeof rawDeadline?.toDate === "function"
      ? rawDeadline.toDate()
      : new Date(rawDeadline);

  return deadline.getTime() <= Date.now();
}

function formatDeadline(match: MatchDoc) {
  const rawDeadline = match.resultProposalExpiresAt;

  if (!rawDeadline) return "";

  const deadline =
    typeof rawDeadline?.toDate === "function"
      ? rawDeadline.toDate()
      : new Date(rawDeadline);

  return deadline.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isMatchCancelled(match: MatchDoc) {
  return match.status === "annullato" || match.resultStatus === "annullato";
}

function canCancelMatch(match: MatchDoc, uid: string) {
  if (!uid) return false;

  if (match.createdBy === uid) return true;
  if (match.homeCaptainId === uid) return true;
  if (match.awayCaptainId === uid) return true;

  return false;
}

function canCancelWithoutRollback(match: MatchDoc) {
  if (isMatchCancelled(match)) return false;
  if (match.statsApplied || match.statsApplying) return false;
  if (match.status === "ufficiale") return false;
  if (match.resultStatus === "confermato") return false;

  return true;
}

function getCancelBlockedReason(match: MatchDoc) {
  if (isMatchCancelled(match)) {
    return "Match già annullato.";
  }

  if (match.statsApplying) {
    return "Statistiche in aggiornamento. Non puoi annullare questo match.";
  }

  if (match.statsApplied || match.status === "ufficiale" || match.resultStatus === "confermato") {
    return "Questo match ha già un risultato ufficiale o statistiche applicate. Non può essere annullato da qui.";
  }

  return "";
}

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [sportMismatch, setSportMismatch] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [mvpName, setMvpName] = useState("");
  const [notes, setNotes] = useState("");
  const [players, setPlayers] = useState<MatchPlayer[]>([]);
  const [cancellationReason, setCancellationReason] = useState("");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadMatch(currentUser.uid);
    });

    return () => unsubscribe();
  }, [matchId]);

  async function loadMatch(currentUserId?: string) {
    setLoading(true);
    setUnauthorized(false);
    setSportMismatch(false);
    setAccountLocked(false);

    try {
      const snap = await getDoc(doc(db, "matches", matchId));

      if (snap.exists()) {
        const data = snap.data() as MatchDoc;
        const safeUserId = currentUserId || user?.uid || "";

        const profileSnap = safeUserId
          ? await getDoc(doc(db, "users", safeUserId))
          : null;

        const profile = profileSnap?.exists()
          ? (profileSnap.data() as UserProfile)
          : null;

        const currentUserSport = normalizeSport(
          profile?.mainSport || profile?.sport || "calcetto"
        );

        setUserSport(currentUserSport);
        setAccountLocked(isProfileDeletionRequested(profile));

        if (!canAccessMatch(data, safeUserId)) {
          setUnauthorized(true);
          setMatch(null);
          return;
        }

        if (!isSameUserSport(data, currentUserSport)) {
          setSportMismatch(true);
          setMatch(data);
          return;
        }

        setMatch(data);
        setHomeTeam(data.homeTeam || "");
        setAwayTeam(data.awayTeam || "");
        setHomeScore(
          data.homeScore !== undefined && data.homeScore !== null
            ? String(data.homeScore)
            : ""
        );
        setAwayScore(
          data.awayScore !== undefined && data.awayScore !== null
            ? String(data.awayScore)
            : ""
        );
        setMvpName(data.mvpName || "");
        setNotes(data.notes || "");
        setCancellationReason(data.cancellationReason || "");
        const loadedPlayers = Array.isArray(data.players) ? data.players : [];

        const enrichedPlayers = await Promise.all(
          loadedPlayers.map(async (player) => {
            try {
              const playerSnap = await getDoc(doc(db, "users", player.uid));

              if (!playerSnap.exists()) {
                return {
                  ...player,
                  role: player.role || "",
                  goalsConceded: Number(player.goalsConceded || 0),
                  cleanSheet: Boolean(player.cleanSheet),
                  penaltiesSaved: Number(player.penaltiesSaved || 0),
                };
              }

              const playerData = playerSnap.data();

              const removed = isProfileDeletionRequested(playerData as UserProfile);

              return {
                ...player,
                name: removed
                  ? "Utente rimosso"
                  : playerData.name || playerData.nickname || player.name || "Rivalo Player",
                accountStatus: playerData.accountStatus || "",
                deletionRequested: Boolean(playerData.deletionRequested),
                role: player.role || playerData.role || "",
                goalsConceded: Number(player.goalsConceded || 0),
                cleanSheet: Boolean(player.cleanSheet),
                penaltiesSaved: Number(player.penaltiesSaved || 0),
              };
            } catch {
              return {
                ...player,
                role: player.role || "",
                goalsConceded: Number(player.goalsConceded || 0),
                cleanSheet: Boolean(player.cleanSheet),
                penaltiesSaved: Number(player.penaltiesSaved || 0),
              };
            }
          })
        );

        setPlayers(enrichedPlayers);
      }
    } finally {
      setLoading(false);
    }
  }

  function updatePlayerField(
    uid: string,
    field:
      | "goals"
      | "assists"
      | "isMvp"
      | "goalsConceded"
      | "cleanSheet"
      | "penaltiesSaved",
    value: number | boolean
  ) {
    setPlayers((currentPlayers) =>
      currentPlayers.map((player) =>
        player.uid === uid
          ? {
              ...player,
              [field]: value,
            }
          : player
      )
    );
  }

  async function notifyMatchPlayers({
  type,
  title,
  message,
}: {
  type: "result_proposed" | "result_confirmed" | "result_disputed";
  title: string;
  message: string;
}) {
  if (!user || !match) return;

  const playerIds = Array.from(
    new Set(
      (match.players || [])
        .map((player) => player.uid)
        .filter(Boolean)
    )
  ).filter((uid) => uid !== user.uid);

  if (playerIds.length === 0) return;

  await Promise.all(
    playerIds.map((uid) =>
      createNotification({
        uid,
        type,
        title,
        message,
        link: "/match/" + matchId,
        createdBy: user.uid,
        metadata: {
          matchId,
          eventId: match.eventId || "",
          eventTitle: match.eventTitle || "",
          homeTeam,
          awayTeam,
          homeScore: Number(homeScore || 0),
          awayScore: Number(awayScore || 0),
        },
      })
    )
  );
}

  async function syncEventMatchResult(safeMatch: MatchDoc) {
    if (!safeMatch.eventId) return;

    const eventRef = doc(db, "events", safeMatch.eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) return;

    const eventData = eventSnap.data() as any;

    const homeScoreNumber = Number(homeScore || 0);
    const awayScoreNumber = Number(awayScore || 0);

    const winnerSide =
      homeScoreNumber > awayScoreNumber
        ? "home"
        : homeScoreNumber < awayScoreNumber
        ? "away"
        : "draw";

    const updatePayload: any = {
      updatedAt: serverTimestamp(),
    };

    function getBracketWinner(bracketMatch: any) {
      if (!bracketMatch?.winnerTeamId) return null;

      const winnerName =
        bracketMatch.winnerTeamId === bracketMatch.homeTeamId
          ? bracketMatch.homeName
          : bracketMatch.winnerTeamId === bracketMatch.awayTeamId
          ? bracketMatch.awayName
          : bracketMatch.winnerName || "Vincitore";

      return {
        teamId: bracketMatch.winnerTeamId,
        name: winnerName || "Vincitore",
      };
    }

    function fillNextRound({
      bracket,
      round,
      winners,
    }: {
      bracket: any[];
      round: number;
      winners: { teamId: string; name: string }[];
    }) {
      return bracket.map((bracketMatch: any, index: number) => {
        if (Number(bracketMatch.round || 1) !== round + 1) {
          return bracketMatch;
        }

        const nextRoundIndex = bracket
          .filter((candidate: any) => Number(candidate.round || 1) === round + 1)
          .findIndex(
            (candidate: any) =>
              candidate.matchNumber === bracketMatch.matchNumber
          );

        const homeWinner = winners[nextRoundIndex * 2];
        const awayWinner = winners[nextRoundIndex * 2 + 1];

        if (!homeWinner) return bracketMatch;

        const alreadyHasConfirmedResult =
          bracketMatch.resultStatus === "confermato" &&
          Boolean(bracketMatch.winnerTeamId);

        if (alreadyHasConfirmedResult) return bracketMatch;

        return {
          ...bracketMatch,
          homeTeamId: homeWinner.teamId,
          awayTeamId: awayWinner?.teamId || "",
          homeName: homeWinner.name || "Da definire",
          awayName: awayWinner?.name || "Riposo",
          winnerTeamId: awayWinner ? "" : homeWinner.teamId,
          status: awayWinner
            ? bracketMatch.matchId
              ? bracketMatch.status || "match creato"
              : "programmato"
            : "riposo",
          resultStatus: awayWinner
            ? bracketMatch.resultStatus === "confermato"
              ? "confermato"
              : bracketMatch.matchId
              ? bracketMatch.resultStatus || "da_confermare"
              : "da_creare"
            : "confermato",
          homeScore: alreadyHasConfirmedResult
            ? bracketMatch.homeScore
            : null,
          awayScore: alreadyHasConfirmedResult
            ? bracketMatch.awayScore
            : null,
        };
      });
    }

    if (Array.isArray(eventData.bracket)) {
      let nextBracket = eventData.bracket.map((bracketMatch: any) => {
        if (bracketMatch.matchId !== matchId) return bracketMatch;

        if (bracketMatch.resultStatus === "confermato") {
          return bracketMatch;
        }

        const winnerTeamId =
          winnerSide === "home"
            ? bracketMatch.homeTeamId || ""
            : winnerSide === "away"
            ? bracketMatch.awayTeamId || ""
            : "";

        return {
          ...bracketMatch,
          homeScore: homeScoreNumber,
          awayScore: awayScoreNumber,
          resultStatus: "confermato",
          status: "completato",
          winnerTeamId,
        };
      });

      const maxRound = Math.max(
        1,
        ...nextBracket.map((bracketMatch: any) =>
          Number(bracketMatch.round || 1)
        )
      );

      for (let round = 1; round <= maxRound; round += 1) {
        const roundMatches = nextBracket.filter(
          (bracketMatch: any) => Number(bracketMatch.round || 1) === round
        );

        const allRoundCompleted =
          roundMatches.length > 0 &&
          roundMatches.every(
            (bracketMatch: any) =>
              bracketMatch.resultStatus === "confermato" &&
              Boolean(bracketMatch.winnerTeamId)
          );

        if (!allRoundCompleted) continue;

        const winners = roundMatches
          .map(getBracketWinner)
          .filter(Boolean) as { teamId: string; name: string }[];

        if (winners.length === 0) continue;

        const nextRoundMatches = nextBracket.filter(
          (bracketMatch: any) => Number(bracketMatch.round || 1) === round + 1
        );

        if (nextRoundMatches.length === 0) {
          if (winners.length === 1) {
            updatePayload.status = "torneo completato";
            updatePayload.winnerTeamId = winners[0].teamId;
            updatePayload.winnerTeamName = winners[0].name;
          }

          continue;
        }

        nextBracket = fillNextRound({
          bracket: nextBracket,
          round,
          winners,
        });

        updatePayload.status =
          nextRoundMatches.length === 1
            ? "finale generata"
            : `round ${round + 1} aggiornato`;
      }

      updatePayload.bracket = nextBracket;
    }

    if (Array.isArray(eventData.leagueFixtures)) {
      const nextFixtures = eventData.leagueFixtures.map((fixture: any) => {
        if (fixture.matchId !== matchId) return fixture;

        return {
          ...fixture,
          homeScore: homeScoreNumber,
          awayScore: awayScoreNumber,
          resultStatus: "confermato",
          status: "completata",
        };
      });

      const allLeagueCompleted =
        nextFixtures.length > 0 &&
        nextFixtures.every(
          (fixture: any) => fixture.resultStatus === "confermato"
        );

      updatePayload.leagueFixtures = nextFixtures;

      if (allLeagueCompleted) {
        updatePayload.status = "campionato completato";
      }
    }

    await updateDoc(eventRef, updatePayload);
  }
  
  async function syncEventMatchCancellation(safeMatch: MatchDoc, reason: string) {
    if (!safeMatch.eventId) return;

    const eventRef = doc(db, "events", safeMatch.eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) return;

    const eventData = eventSnap.data() as any;

    const resetMatch = (item: any) => {
      if (item.matchId !== matchId) return item;

      return {
        ...item,
        matchId: "",
        cancelledMatchId: matchId,
        cancellationReason: reason,
        homeScore: null,
        awayScore: null,
        winnerTeamId: "",
        status: "da_creare",
        resultStatus: "da_creare",
        fairPlayStatus: "da_confermare",
        updatedAt: serverTimestamp(),
      };
    };

    const updatePayload: any = {
      updatedAt: serverTimestamp(),
    };

    if (Array.isArray(eventData.bracket)) {
      updatePayload.bracket = eventData.bracket.map(resetMatch);
    }

    if (Array.isArray(eventData.leagueFixtures)) {
      updatePayload.leagueFixtures = eventData.leagueFixtures.map(resetMatch);
    }

    if (updatePayload.bracket || updatePayload.leagueFixtures) {
      await updateDoc(eventRef, updatePayload);
    }
  }

  async function updateGroupTeamStats(safeMatch: MatchDoc) {
  if (safeMatch.sourceType !== "groupTeams") return;
  if (!safeMatch.homeTeamId || !safeMatch.awayTeamId) return;

  const homeScoreNumber = Number(homeScore || 0);
  const awayScoreNumber = Number(awayScore || 0);

  const homeWin = homeScoreNumber > awayScoreNumber;
  const awayWin = awayScoreNumber > homeScoreNumber;
  const draw = homeScoreNumber === awayScoreNumber;

  const homeTeamRef = doc(db, "groupTeams", safeMatch.homeTeamId);
  const awayTeamRef = doc(db, "groupTeams", safeMatch.awayTeamId);

  await updateDoc(homeTeamRef, {
    matchesPlayed: increment(1),
    wins: increment(homeWin ? 1 : 0),
    draws: increment(draw ? 1 : 0),
    losses: increment(awayWin ? 1 : 0),
    goalsFor: increment(homeScoreNumber),
    goalsAgainst: increment(awayScoreNumber),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(awayTeamRef, {
    matchesPlayed: increment(1),
    wins: increment(awayWin ? 1 : 0),
    draws: increment(draw ? 1 : 0),
    losses: increment(homeWin ? 1 : 0),
    goalsFor: increment(awayScoreNumber),
    goalsAgainst: increment(homeScoreNumber),
    updatedAt: serverTimestamp(),
  });
}

  async function proposeResult(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !match) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: proposta risultato bloccata.");
      return;
    }

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi modificare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    if (!canManageMatchResult(match, user.uid)) {
      setMessage(
        requiresCaptainRules(match)
          ? "Solo un capitano di questo match può proporre il risultato."
          : "Solo i giocatori di questo match possono proporre il risultato."
      );
      return;
    }

    if (isMatchCancelled(match)) {
      setMessage("Match annullato. Non puoi proporre o modificare il risultato.");
      return;
    }

    if (match.resultStatus === "proposto") {
      setMessage("Esiste già una proposta risultato. La squadra avversaria deve confermare o contestare.");
      return;
    }

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi modificare il risultato.");
      return;
    }

    const racketScoreError = getRacketScoreError(match, homeScore, awayScore);

    if (racketScoreError) {
      setMessage(racketScoreError);
      return;
    }

    if (
      match.mode === "torneo" &&
      Number(homeScore || 0) === Number(awayScore || 0)
    ) {
      setMessage("Nei tornei serve un vincitore: inserisci un risultato non in parità.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const proposerTeam = getUserConfirmationTeam(match, user.uid);

      if (!proposerTeam) {
        setMessage(
          requiresCaptainRules(match)
            ? "Solo un capitano di questo match può proporre il risultato."
            : "Per proporre il risultato devi essere tra i giocatori del match."
        );
        setSaving(false);
        return;
      }

      const requiredTeam = getOpponentTeam(proposerTeam);
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setMessage("Profilo non attivo: azione bloccata.");
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, "matches", matchId), {
        homeTeam,
        awayTeam,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        mvpName,
        notes,
        players: players.map((player) => ({
          ...player,
          goalsConceded:
            normalizeSport(match.sport) === "calcetto" && isGoalkeeper(player)
              ? Number(player.goalsConceded || 0)
              : 0,
          cleanSheet:
            normalizeSport(match.sport) === "calcetto" && isGoalkeeper(player)
              ? Boolean(player.cleanSheet)
              : false,
          penaltiesSaved:
            normalizeSport(match.sport) === "calcetto" && isGoalkeeper(player)
              ? Number(player.penaltiesSaved || 0)
              : 0,
        })),
        status: "in_attesa_conferma",
        resultStatus: "proposto",
        fairPlayStatus: "in_attesa",
        resultProposedBy: user.uid,
        resultProposedTeam: proposerTeam,
        resultConfirmRequiredTeam: requiredTeam,
        resultProposalExpiresAt: expiresAt,
        resultProposedAt: serverTimestamp(),
      });

      await notifyMatchPlayers({
  type: "result_proposed",
  title: "Risultato proposto",
  message: `${homeTeam || "Squadra 1"} ${homeScore || "0"} - ${
    awayScore || "0"
  } ${awayTeam || "Squadra 2"}. Controlla e conferma se è corretto.`,
});

await loadMatch(user?.uid);
setMessage(
  `Risultato proposto da ${getTeamName(match, proposerTeam)}. Ora deve confermare o contestare ${getTeamName(match, requiredTeam)} entro 24 ore.`
);
    } catch {
      setMessage("Errore durante il salvataggio del risultato.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmResult() {
    if (!user || !match) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: conferma risultato bloccata.");
      return;
    }

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi confermare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Non puoi confermare né applicare statistiche.");
      return;
    }

    if (!canManageMatchResult(match, user.uid)) {
      setMessage(
        requiresCaptainRules(match)
          ? "Solo il capitano avversario può confermare o contestare."
          : "Solo i giocatori coinvolti possono confermare o contestare."
      );
      return;
    }

    if (isMatchCancelled(match)) {
      setMessage("Match annullato. Non puoi confermare né applicare statistiche.");
      return;
    }

    if (match.resultStatus !== "proposto") {
      setMessage("Prima deve essere proposto un risultato.");
      return;
    }

    const userTeam = getUserConfirmationTeam(match, user.uid);
    const requiredTeam = match.resultConfirmRequiredTeam || "";
    const autoConfirmAllowed = isProposalExpired(match);

    if (!autoConfirmAllowed && (!userTeam || userTeam !== requiredTeam)) {
      setMessage(
        `Solo ${getOpponentCaptainLabel(match, requiredTeam)} può confermare questo risultato.`
      );
      return;
    }

    if (!autoConfirmAllowed && match.resultProposedBy === user.uid) {
      setMessage("Chi propone il risultato non può confermarlo da solo.");
      return;
    }

    const racketScoreError = getRacketScoreError(match, homeScore, awayScore);

    if (racketScoreError) {
      setMessage(racketScoreError);
      return;
    }

    if (
      match.mode === "torneo" &&
      Number(homeScore || 0) === Number(awayScore || 0)
    ) {
      setMessage("Nei tornei serve un vincitore: il risultato non può essere in parità.");
      return;
    }

    setSaving(true);
    setMessage("");

    const matchRef = doc(db, "matches", matchId);
    let matchForStats: MatchDoc | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        const freshSnap = await transaction.get(matchRef);

        if (!freshSnap.exists()) {
          throw new Error("MATCH_NOT_FOUND");
        }

        const freshMatch = freshSnap.data() as MatchDoc;
        matchForStats = freshMatch;

        const freshProfileSnap = await transaction.get(doc(db, "users", user.uid));
        const freshProfile = freshProfileSnap.exists()
          ? (freshProfileSnap.data() as UserProfile)
          : null;

        if (accountLocked || isProfileDeletionRequested(freshProfile)) {
          throw new Error("ACCOUNT_LOCKED");
        }

        if (!canUseMatch(freshMatch, user.uid, userSport)) {
          throw new Error("SPORT_MISMATCH");
        }

        if (!canManageMatchResult(freshMatch, user.uid)) {
          throw new Error("CAPTAIN_REQUIRED");
        }

        if (isMatchCancelled(freshMatch)) {
          throw new Error("MATCH_CANCELLED");
        }

        const freshUserTeam = getUserConfirmationTeam(freshMatch, user.uid);
        const freshRequiredTeam = freshMatch.resultConfirmRequiredTeam || "";
        const freshAutoConfirmAllowed = isProposalExpired(freshMatch);

       if (freshMatch.resultStatus === "contestato") {
  throw new Error("RESULT_DISPUTED");
}

if (freshMatch.resultStatus !== "proposto") {
  throw new Error("NO_RESULT_PROPOSAL");
}

const freshRacketScoreError = getRacketScoreError(
  freshMatch,
  freshMatch.homeScore,
  freshMatch.awayScore
);

if (freshRacketScoreError) {
  throw new Error("RACKET_SCORE_INVALID");
}

if (
  !freshAutoConfirmAllowed &&
  (!freshUserTeam || freshUserTeam !== freshRequiredTeam)
) {
  throw new Error("WRONG_TEAM_CONFIRMATION");
}

if (!freshAutoConfirmAllowed && freshMatch.resultProposedBy === user.uid) {
  throw new Error("PROPOSER_CANNOT_CONFIRM");
}

        if (freshMatch.statsApplied) {
          throw new Error("STATS_ALREADY_APPLIED");
        }

        if (freshMatch.statsApplying) {
          throw new Error("STATS_IN_PROGRESS");
        }

        transaction.update(matchRef, {
          confirmedBy: arrayUnion(user.uid),
          confirmedTeam: freshAutoConfirmAllowed ? "auto_24h" : freshUserTeam,
          status: "ufficiale",
          resultStatus: "confermato",
          fairPlayStatus: freshAutoConfirmAllowed ? "auto_confermato_24h" : "confermato",
          confirmedAt: serverTimestamp(),
          statsApplying: true,
          statsApplyingBy: user.uid,
        });
      });

      const safeMatch: MatchDoc = matchForStats || match;

      const result =
        Number(homeScore) > Number(awayScore)
          ? "win"
          : Number(homeScore) < Number(awayScore)
          ? "loss"
          : "draw";

      const matchPlayers = Array.isArray(safeMatch.players)
        ? getSafePlayersForStats(safeMatch, safeMatch.players)
        : [];

      if (matchPlayers.length > 0) {
        const cleanPlayers = matchPlayers.map((player) => ({
          uid: player.uid,
          name: getPlayerDisplayName(player),
          team: player.team,
          goals: isRacketSport(safeMatch.sport) ? 0 : Number(player.goals || 0),
          assists: isRacketSport(safeMatch.sport) ? 0 : Number(player.assists || 0),
          role: player.role || "",
          goalsConceded:
            normalizeSport(safeMatch.sport) === "calcetto" && isGoalkeeper(player)
              ? Number(player.goalsConceded || 0)
              : 0,
          cleanSheet:
            normalizeSport(safeMatch.sport) === "calcetto" && isGoalkeeper(player)
              ? Boolean(player.cleanSheet)
              : false,
          penaltiesSaved:
            normalizeSport(safeMatch.sport) === "calcetto" && isGoalkeeper(player)
              ? Number(player.penaltiesSaved || 0)
              : 0,
          isMvp:
            Boolean(player.isMvp) ||
            getPlayerDisplayName(player).toLowerCase().trim() === mvpName.toLowerCase().trim(),
        }));

        await updatePlayerStats({
          homeScore: Number(homeScore || 0),
          awayScore: Number(awayScore || 0),
          players: cleanPlayers,
          eventId: safeMatch.eventId,
          sport: safeMatch.sport,
        });
      } else {
        await applyMatchStats({
          uid: user.uid,
          result,
          isMvp: mvpName.trim().length > 0,
          goals: 0,
          assists: 0,
          sport: safeMatch.sport,
        });
      }

     await updateTeamEventStats({
  eventId: safeMatch.eventId,
  homeTeam,
  awayTeam,
  homeTeamId: safeMatch.homeTeamId,
  awayTeamId: safeMatch.awayTeamId,
  sport: safeMatch.sport,
  homeScore: Number(homeScore || 0),
  awayScore: Number(awayScore || 0),
});

await updateGroupTeamStats(safeMatch);

await syncEventMatchResult(safeMatch);

await updateDoc(matchRef, {
        statsApplied: true,
        statsApplying: false,
        statsAppliedAt: serverTimestamp(),
        statsAppliedBy: user.uid,
      });

     await notifyMatchPlayers({
  type: "result_confirmed",
  title: "Risultato confermato",
  message: `${homeTeam || "Squadra 1"} ${homeScore || "0"} - ${
    awayScore || "0"
  } ${awayTeam || "Squadra 2"}. Statistiche aggiornate.`,
});

await loadMatch(user?.uid);
setMessage("Risultato confermato. Statistiche applicate una sola volta.");
    } catch (error: any) {
      console.error(error);

      if (error?.message === "STATS_ALREADY_APPLIED") {
        setMessage(
          "Statistiche già applicate. Questo match non può aggiornare due volte i dati."
        );
      } else if (error?.message === "STATS_IN_PROGRESS") {
        setMessage(
          "Aggiornamento statistiche già in corso. Attendi qualche secondo."
        );
      } else if (error?.message === "SPORT_MISMATCH") {
        setMessage(
          "Questo match appartiene a un altro sport. Statistiche non applicate."
        );
      } else if (error?.message === "NO_RESULT_PROPOSAL") {
        setMessage("Prima deve essere proposto un risultato.");
      } else if (error?.message === "WRONG_TEAM_CONFIRMATION") {
        setMessage("Solo il capitano della squadra avversaria può confermare questo risultato.");
      } else if (error?.message === "PROPOSER_CANNOT_CONFIRM") {
        setMessage("Chi propone il risultato non può confermarlo da solo.");
      } else if (error?.message === "RESULT_DISPUTED") {
        setMessage("Il risultato è contestato. Serve revisione prima della conferma.");
      } else if (error?.message === "RACKET_SCORE_INVALID") {
        setMessage("Risultato non valido: per padel e tennis usa 2-0, 2-1, 1-2 o 0-2.");
      } else if (error?.message === "MATCH_CANCELLED") {
        setMessage("Match annullato. Statistiche non applicate.");
      } else if (error?.message === "ACCOUNT_LOCKED") {
        setMessage("Profilo non attivo: azione bloccata.");
      } else {
        await updateDoc(matchRef, {
          statsApplying: false,
          statsError: true,
          statsErrorAt: serverTimestamp(),
        }).catch(() => null);

        setMessage("Errore durante la conferma.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function disputeResult() {
    if (!user || !match) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: contestazione bloccata.");
      return;
    }

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi contestare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    if (isMatchCancelled(match)) {
      setMessage("Match annullato. Non puoi contestarlo.");
      return;
    }

    const userTeam = getUserConfirmationTeam(match, user.uid);
    const requiredTeam = match.resultConfirmRequiredTeam || "";

    if (match.resultStatus === "proposto" && (!userTeam || userTeam !== requiredTeam)) {
      setMessage(
        `Solo ${getOpponentCaptainLabel(match, requiredTeam)} può contestare questa proposta.`
      );
      return;
    }

    if (match.resultProposedBy === user.uid) {
      setMessage("Chi propone il risultato non può contestare la propria proposta.");
      return;
    }

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi contestarlo da qui.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setMessage("Profilo non attivo: azione bloccata.");
        setSaving(false);
        return;
      }

      await updateDoc(doc(db, "matches", matchId), {
        disputedBy: arrayUnion(user.uid),
        disputedTeam: getUserConfirmationTeam(match, user.uid),
        status: "contestato",
        resultStatus: "contestato",
        fairPlayStatus: "contestato",
        disputedAt: serverTimestamp(),
      });

      await notifyMatchPlayers({
  type: "result_disputed",
  title: "Risultato contestato",
  message: `${homeTeam || "Squadra 1"} ${homeScore || "0"} - ${
    awayScore || "0"
  } ${awayTeam || "Squadra 2"}. Il risultato è stato contestato.`,
});

await loadMatch(user?.uid);
setMessage("Risultato contestato. Serve revisione.");
    } catch {
      setMessage("Errore durante la contestazione.");
    } finally {
      setSaving(false);
    }
  }

  async function cancelMatch() {
    if (!user || !match) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: annullamento match bloccato.");
      return;
    }

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi annullare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    if (!canCancelMatch(match, user.uid)) {
      setMessage("Solo chi ha creato il match o i capitani possono annullarlo.");
      return;
    }

    if (!canCancelWithoutRollback(match)) {
      setMessage(getCancelBlockedReason(match));
      return;
    }

    const reason = cancellationReason.trim();

    if (reason.length < 5) {
      setMessage("Inserisci un motivo di annullamento di almeno 5 caratteri.");
      return;
    }

    const confirmCancel = window.confirm(
      "Vuoi annullare questo match? Potrai ricrearlo dall'evento se non era ancora ufficiale."
    );

    if (!confirmCancel) return;

    setSaving(true);
    setMessage("");

    const matchRef = doc(db, "matches", matchId);
    let cancelledMatch: MatchDoc | null = null;

    try {
      await runTransaction(db, async (transaction) => {
        const freshSnap = await transaction.get(matchRef);

        if (!freshSnap.exists()) {
          throw new Error("MATCH_NOT_FOUND");
        }

        const freshMatch = freshSnap.data() as MatchDoc;
        cancelledMatch = freshMatch;

        const freshProfileSnap = await transaction.get(doc(db, "users", user.uid));
        const freshProfile = freshProfileSnap.exists()
          ? (freshProfileSnap.data() as UserProfile)
          : null;

        if (accountLocked || isProfileDeletionRequested(freshProfile)) {
          throw new Error("ACCOUNT_LOCKED");
        }

        if (!canAccessMatch(freshMatch, user.uid)) {
          throw new Error("UNAUTHORIZED");
        }

        if (!canUseMatch(freshMatch, user.uid, userSport)) {
          throw new Error("SPORT_MISMATCH");
        }

        if (!canCancelMatch(freshMatch, user.uid)) {
          throw new Error("CANCEL_NOT_ALLOWED");
        }

        if (!canCancelWithoutRollback(freshMatch)) {
          throw new Error("CANCEL_BLOCKED");
        }

        transaction.update(matchRef, {
          status: "annullato",
          resultStatus: "annullato",
          fairPlayStatus: "annullato",
          cancellationReason: reason,
          cancelledBy: user.uid,
          cancelledAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      });

      const safeCancelledMatch = cancelledMatch || match;

      await syncEventMatchCancellation(safeCancelledMatch, reason);

      await notifyMatchPlayers({
        type: "result_disputed",
        title: "Match annullato",
        message: `${homeTeam || "Squadra 1"} vs ${
          awayTeam || "Squadra 2"
        } è stato annullato.`,
      });

      await loadMatch(user.uid);

      setMessage("Match annullato correttamente.");
    } catch (error: any) {
      console.error(error);

      if (error?.message === "ACCOUNT_LOCKED") {
        setMessage("Profilo non attivo: azione bloccata.");
      } else if (error?.message === "SPORT_MISMATCH") {
        setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      } else if (error?.message === "CANCEL_NOT_ALLOWED") {
        setMessage("Solo chi ha creato il match o i capitani possono annullarlo.");
      } else if (error?.message === "CANCEL_BLOCKED") {
        setMessage(getCancelBlockedReason(match));
      } else if (error?.message === "UNAUTHORIZED") {
        setMessage("Non puoi annullare un match in cui non sei coinvolto.");
      } else {
        setMessage("Errore durante l'annullamento del match.");
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento partita...
      </main>
    );
  }

  if (unauthorized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] px-5 text-white">
        <div className="max-w-md rounded-[2rem] border border-red-400/20 bg-red-500/10 p-7 text-center">
          <div className="text-2xl font-black text-red-200">
            Match non disponibile
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-300">
            Puoi aprire solo match creati da te o in cui sei tra i partecipanti.
          </p>

          <Link
            href="/match"
            className="mt-6 inline-flex rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-300"
          >
            Torna ai match
          </Link>
        </div>
      </main>
    );
  }

  if (sportMismatch && match) {
    return (
      <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
        <section className="relative z-10 mx-auto max-w-2xl">
          <Link
            href="/match"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna ai match
          </Link>

          <div className="mt-8 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-7 text-center">
            <div className="text-3xl font-black text-red-100">
              Match non compatibile
            </div>

            <p className="mt-4 leading-7 text-slate-300">
              Questo match è dedicato a {sportLabel(match.sport)}, mentre il tuo profilo attivo è {sportLabel(userSport)}.
              Per usare un altro sport è necessario un profilo sportivo separato.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Partita non trovata.
      </main>
    );
  }

  const safeCompetitionFormat: CompetitionFormat =
    match.competitionFormat === "doppio"
      ? "doppio"
      : match.competitionFormat === "squadre"
      ? "squadre"
      : "singolo";

  const matchCopy = getMatchCopy(match.sport, safeCompetitionFormat);
  const racketMatch = isRacketSport(match.sport);
  const namesLockedFromGroup = racketMatch && players.length > 0;
  const racketScoreValue =
    racketMatch && homeScore !== "" && awayScore !== ""
      ? `${homeScore}-${awayScore}`
      : "";

  const homeSideLabel = homeTeam || matchCopy.teamA;
  const awaySideLabel = awayTeam || matchCopy.teamB;

  const racketScoreOptions = [
    {
      value: "2-0",
      winnerLabel: homeSideLabel,
      loserLabel: awaySideLabel,
      scoreLabel: "2 - 0",
      setSummary: `${homeSideLabel}: 2 set · ${awaySideLabel}: 0 set`,
    },
    {
      value: "2-1",
      winnerLabel: homeSideLabel,
      loserLabel: awaySideLabel,
      scoreLabel: "2 - 1",
      setSummary: `${homeSideLabel}: 2 set · ${awaySideLabel}: 1 set`,
    },
    {
      value: "1-2",
      winnerLabel: awaySideLabel,
      loserLabel: homeSideLabel,
      scoreLabel: "1 - 2",
      setSummary: `${awaySideLabel}: 2 set · ${homeSideLabel}: 1 set`,
    },
    {
      value: "0-2",
      winnerLabel: awaySideLabel,
      loserLabel: homeSideLabel,
      scoreLabel: "0 - 2",
      setSummary: `${awaySideLabel}: 2 set · ${homeSideLabel}: 0 set`,
    },
  ];

  function selectRacketScore(value: string) {
    const [nextHomeScore, nextAwayScore] = value.split("-");

    setHomeScore(nextHomeScore || "");
    setAwayScore(nextAwayScore || "");
  }

  const isCancelled = isMatchCancelled(match);

  const isOfficial =
    match.status === "ufficiale" || match.resultStatus === "confermato";

  const canCancelCurrentMatch = user ? canCancelMatch(match, user.uid) : false;
  const canCancelSafely = canCancelWithoutRollback(match);
  const cancelBlockedReason = getCancelBlockedReason(match);

  const statsLocked = Boolean(match.statsApplied || match.statsApplying);

  const homePlayers = players.filter((player) => player.team === "home");
  const awayPlayers = players.filter((player) => player.team === "away");
  const otherPlayers = players.filter(
    (player) => player.team !== "home" && player.team !== "away"
  );

  const chatPlayers = getUniqueChatPlayers(players, user?.uid);
  const chatContextId = match.matchmakingRequestId || matchId;

  async function shareMatch() {
    if (!match) return;

    const shareUrl = typeof window !== "undefined"
      ? window.location.href
      : `/match/${matchId}`;

    const shareTitle = match.name || "Match Rivalo";
    const shareText = `${shareTitle} · ${sportLabel(match.sport)}${
      match.city ? ` · ${match.city}` : ""
    }${match.date ? ` · ${match.date}` : ""}`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        setMessage("Link match copiato negli appunti.");
        return;
      }

      setMessage("Copia il link dalla barra del browser per condividere il match.");
    } catch (error: any) {
      if (error?.name === "AbortError") return;

      try {
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(shareUrl);
          setMessage("Link match copiato negli appunti.");
          return;
        }
      } catch {
        // Fallback handled below.
      }

      setMessage("Non è stato possibile aprire la condivisione. Copia il link dalla barra del browser.");
    }
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-7xl min-w-0 px-3 py-8 sm:px-5">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/match"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna ai match
          </Link>

          <button
            type="button"
            onClick={shareMatch}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-400/20 sm:w-auto"
          >
            <Share2 size={16} />
            Condividi match
          </button>
        </div>

        <section className="mt-8 w-full min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur sm:rounded-[2.5rem]">
          <div className="relative min-w-0 overflow-hidden p-4 sm:p-8 md:p-10">
            <div className="relative flex min-w-0 flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                  {sportLabel(match.sport)}
                </div>

                <h1 className="mt-5 break-words text-3xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">
                  {match.name}
                </h1>

                <div className="mt-5 flex min-w-0 flex-wrap items-center gap-3 text-sm font-semibold text-slate-300 sm:gap-4">
                  <Info icon={<MapPin size={17} />} text={match.city || "-"} />
                  <Info
                    icon={<CalendarDays size={17} />}
                    text={match.date || "-"}
                  />
                  <Info icon={<Clock size={17} />} text={match.time || "-"} />

                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {match.mode}
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                <Stat value={String(match.slots || 0)} label="Slot" />
                <Stat value={match.status || "programmata"} label="Stato" />
                <Stat
                  value={match.resultStatus || "non inserito"}
                  label="Risultato"
                />
              </div>
            </div>
          </div>
        </section>
                {match.eventId && (
          <section className="mt-6 w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-cyan-400/20 bg-cyan-400/10 p-4 sm:rounded-[2rem] sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Match collegato
                </div>

                <div className="mt-2 text-xl font-black text-cyan-100">
                  {match.eventTitle || "Evento Rivalo"}
                </div>

                <div className="mt-1 text-sm text-slate-300">
                  Questo match fa parte di un evento, torneo o campionato Rivalo.
                </div>
              </div>

              <Link
                href={"/events/" + match.eventId}
                className="inline-flex items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/20"
              >
                Apri evento
              </Link>
            </div>
          </section>
        )}

        {chatPlayers.length > 0 && (
          <section className="mt-6 w-full min-w-0 overflow-hidden rounded-[1.6rem] border border-cyan-400/20 bg-cyan-400/10 p-4 sm:rounded-[2rem] sm:p-5">
            <div className="flex items-start gap-3">
              <MessageCircle className="shrink-0 text-cyan-300" size={26} />

              <div className="min-w-0 flex-1">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Chat partecipanti
                </div>

                <h2 className="mt-2 break-words text-2xl font-black text-white">
                  Organizza il match
                </h2>

                <p className="mt-1 text-sm font-semibold leading-6 text-slate-300">
                  Apri una chat 1-to-1 con gli altri giocatori coinvolti in questo match.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {chatPlayers.map((player) => (
                    <Link
                      key={player.uid}
                      href={`/messages?with=${player.uid}&requestId=${chatContextId}`}
                      className="min-w-0 rounded-2xl border border-cyan-300/20 bg-[#020617]/70 p-4 transition hover:border-cyan-300/40 hover:bg-cyan-400/10"
                    >
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-base font-black text-white">
                            {getPlayerDisplayName(player)}
                          </div>

                          <div className="mt-1 text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                            {player.team === "home"
                              ? homeSideLabel
                              : player.team === "away"
                              ? awaySideLabel
                              : "Partecipante"}
                          </div>
                        </div>

                        <div className="shrink-0 rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase text-cyan-100">
                          Chat
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {normalizeSport(match.sport) === "calcetto" && players.length > 0 && (
          <CalcettoLineupPitch
            homeTeamName={homeSideLabel}
            awayTeamName={awaySideLabel}
            homePlayers={homePlayers}
            awayPlayers={awayPlayers}
          />
        )}

        <section className="mt-8 grid min-w-0 gap-5 lg:grid-cols-[1fr_.9fr]">
          <form
            onSubmit={proposeResult}
            className="min-w-0 overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur sm:rounded-[2rem] sm:p-6"
          >
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="text-cyan-300" size={30} />

              <div>
                <h2 className="text-2xl font-black">{matchCopy.formTitle}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {matchCopy.formDescription}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={matchCopy.teamA}>
                  <input
                    required
                    disabled={isOfficial || isCancelled || accountLocked || namesLockedFromGroup}
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder={matchCopy.teamA}
                    className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />
                </Field>

                <Field label={matchCopy.teamB}>
                  <input
                    required
                    disabled={isOfficial || isCancelled || accountLocked || namesLockedFromGroup}
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder={matchCopy.teamB}
                    className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />
                </Field>
              </div>

              {namesLockedFromGroup && (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-bold leading-6 text-lime-100">
                  {match.competitionFormat === "doppio"
                    ? "Coppie bloccate dalla creazione match: i nomi arrivano dagli utenti selezionati nel gruppo."
                    : "Giocatori bloccati dalla creazione match: i nomi arrivano dagli utenti selezionati nel gruppo."}
                </div>
              )}

              {racketMatch ? (
                <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                  <div className="text-sm font-black text-slate-300">
                    Risultato set
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {racketScoreOptions.map((option) => {
                      const selected = racketScoreValue === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={isOfficial || isCancelled || accountLocked}
                          onClick={() => selectRacketScore(option.value)}
                          className={`min-w-0 rounded-2xl border p-4 text-left transition disabled:opacity-60 ${
                            selected
                              ? "border-cyan-300/60 bg-cyan-400/15 shadow-[0_0_24px_rgba(34,211,238,.16)]"
                              : "border-white/10 bg-white/[.03] hover:border-cyan-300/30"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                                Vince
                              </div>

                              <div className="mt-2 break-words text-lg font-black text-white">
                                {option.winnerLabel}
                              </div>
                            </div>

                            <div className="shrink-0 rounded-2xl border border-yellow-300/25 bg-yellow-400/10 px-3 py-2 text-xl font-black text-yellow-100">
                              {option.scoreLabel}
                            </div>
                          </div>

                          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold leading-5 text-slate-300">
                            Perde: <span className="text-slate-100">{option.loserLabel}</span>
                          </div>

                          <div className="mt-2 break-words text-xs font-bold leading-5 text-slate-400">
                            {option.setSummary}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-bold leading-5 text-cyan-100">
                    Il dettaglio dei game o del tie-break va nelle note.
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label={matchCopy.homeScore}>
                    <input
                      required
                      disabled={isOfficial || isCancelled || accountLocked}
                      type="number"
                      min="0"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      className="w-full bg-transparent outline-none disabled:opacity-60"
                    />
                  </Field>

                  <Field label={matchCopy.awayScore}>
                    <input
                      required
                      disabled={isOfficial || isCancelled || accountLocked}
                      type="number"
                      min="0"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      className="w-full bg-transparent outline-none disabled:opacity-60"
                    />
                  </Field>
                </div>
              )}

              {racketMatch && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold leading-6 text-cyan-100">
                  Seleziona un risultato set valido: 2-0, 2-1, 1-2 o 0-2. Il dettaglio game/tie-break va nelle note.
                </div>
              )}

              <Field label={matchCopy.mvpLabel}>
                <input
                  disabled={isOfficial || isCancelled || accountLocked}
                  value={mvpName}
                  onChange={(e) => setMvpName(e.target.value)}
                  placeholder={matchCopy.mvpPlaceholder}
                  className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                />
              </Field>

              {players.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                  <div className="mb-2 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                    {matchCopy.statsTitle}
                  </div>

                  <div className="mb-4 text-sm font-bold leading-6 text-slate-400">
                    {matchCopy.playerStatsHelp}
                    {normalizeSport(match.sport) === "calcetto" && (
                      <span className="block pt-1 text-cyan-200">
                        Portieri: GS = gol subiti, CS = clean sheet, RP = rigori parati.
                      </span>
                    )}
                  </div>

                  <div className="space-y-4">
                    <PlayerStatsGroup
                      title={matchCopy.teamA}
                      players={homePlayers}
                      teamName={homeTeam}
                      isOfficial={isOfficial}
                      isCancelled={isCancelled}
                      accountLocked={accountLocked}
                      racketMatch={racketMatch}
                      calcettoMatch={normalizeSport(match.sport) === "calcetto"}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />

                    <PlayerStatsGroup
                      title={matchCopy.teamB}
                      players={awayPlayers}
                      teamName={awayTeam}
                      isOfficial={isOfficial}
                      isCancelled={isCancelled}
                      accountLocked={accountLocked}
                      racketMatch={racketMatch}
                      calcettoMatch={normalizeSport(match.sport) === "calcetto"}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />

                    <PlayerStatsGroup
                      title="Altri giocatori"
                      players={otherPlayers}
                      teamName="Non assegnati"
                      isOfficial={isOfficial}
                      isCancelled={isCancelled}
                      accountLocked={accountLocked}
                      racketMatch={racketMatch}
                      calcettoMatch={normalizeSport(match.sport) === "calcetto"}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />
                  </div>
                </div>
              )}

              <Field label="Note statistiche">
                <textarea
                  disabled={isOfficial || isCancelled || accountLocked}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={matchCopy.notesPlaceholder}
                  className="min-h-[120px] w-full resize-none bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                />
              </Field>

              {isCancelled && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
                  Match annullato. Motivo: {match.cancellationReason || "Non specificato"}.
                </div>
              )}

              {accountLocked && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold leading-6 text-yellow-100">
                  {getAccountLockedMessage()}
                </div>
              )}

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100">
                {getPermissionLabel(match)}
              </div>

              {match.resultStatus === "proposto" && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100">
                  Proposta inviata da {getTeamName(match, match.resultProposedTeam || "")}. Deve confermare o contestare {getOpponentCaptainLabel(match, match.resultConfirmRequiredTeam || "")}
                  {formatDeadline(match) ? ` entro ${formatDeadline(match)}` : ""}.
                  Dopo 24 ore senza contestazione, il risultato può essere confermato automaticamente.
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200">
                  {message}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
                <div className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                  Riepilogo conferma
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-center">
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                      {matchCopy.teamA}
                    </div>

                    <div className="mt-2 text-xl font-black">
                      {homeTeam || "Da definire"}
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-5xl font-black text-white">
                      {homeScore || "0"} - {awayScore || "0"}
                    </div>

                    <div className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                      {matchCopy.resultLabel}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-300">
                      {matchCopy.teamB}
                    </div>

                    <div className="mt-2 text-xl font-black">
                      {awayTeam || "Da definire"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <div className="text-xs text-slate-400">MVP</div>
                    <div className="mt-1 truncate font-black text-yellow-200">
                      {mvpName || "Non inserito"}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <div className="text-xs text-slate-400">Giocatori</div>
                    <div className="mt-1 font-black text-cyan-200">
                      {players.length}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
                    <div className="text-xs text-slate-400">Stato stats</div>
                    <div className="mt-1 font-black text-lime-200">
                      {match.statsApplied ? "Applicate" : "Da applicare"}
                    </div>
                    {racketMatch && (
                      <div className="mt-1 text-[11px] font-bold text-cyan-200">
                        Modalità racket
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isOfficial && (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-black text-lime-200">
                  {matchCopy.officialMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || isOfficial || isCancelled || accountLocked}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {saving
                  ? "Salvataggio..."
                  : accountLocked
                  ? "Azione bloccata"
                  : isCancelled
                  ? "Match annullato"
                  : isOfficial
                  ? "Risultato ufficiale"
                  : "Proponi risultato"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={confirmResult}
                  disabled={saving || isOfficial || isCancelled || accountLocked || statsLocked}
                  className="rounded-2xl border border-lime-300/30 bg-lime-400/10 px-6 py-4 font-black text-lime-200 disabled:opacity-60"
                >
                  {match.resultStatus === "proposto" && isProposalExpired(match)
                    ? "Conferma automatica 24h"
                    : "Conferma risultato"}
                </button>

                <button
                  type="button"
                  onClick={disputeResult}
                  disabled={saving || isOfficial || isCancelled || accountLocked || statsLocked}
                  className="rounded-2xl border border-red-300/30 bg-red-500/10 px-6 py-4 font-black text-red-200 disabled:opacity-60"
                >
                  Contesta
                </button>
              </div>

              {canCancelCurrentMatch && (
                <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4">
                  <div className="text-sm font-black uppercase tracking-[0.16em] text-red-200">
                    Annullamento match
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Puoi annullare solo match non ancora ufficiali e senza statistiche applicate.
                  </p>

                  {!canCancelSafely && cancelBlockedReason && (
                    <div className="mt-3 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-sm font-bold text-yellow-100">
                      {cancelBlockedReason}
                    </div>
                  )}

                  <textarea
                    value={cancellationReason}
                    onChange={(e) => setCancellationReason(e.target.value)}
                    disabled={saving || isCancelled || accountLocked || !canCancelSafely}
                    placeholder="Motivo annullamento"
                    className="mt-3 min-h-[90px] w-full resize-none rounded-2xl border border-white/10 bg-[#020617]/80 px-4 py-3 text-white outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />

                  <button
                    type="button"
                    onClick={cancelMatch}
                    disabled={saving || isCancelled || accountLocked || !canCancelSafely}
                    className="mt-3 w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-6 py-4 font-black text-red-200 disabled:opacity-60"
                  >
                    {isCancelled
                      ? "Match già annullato"
                      : accountLocked
                      ? "Azione bloccata"
                      : canCancelSafely
                      ? "Annulla match"
                      : "Annullamento bloccato"}
                  </button>
                </div>
              )}
            </div>
          </form>

          <div className="space-y-5">
            <Panel icon={<ShieldCheck />} title="Sistema anti-fake">
              Nei nuovi match propongono, confermano e contestano solo i capitani delle due squadre.
            </Panel>

            <Panel icon={<Users />} title="Conferme">
              Se nessuno contesta entro 24 ore, la proposta può diventare ufficiale con conferma automatica.
            </Panel>

            <Panel icon={<Trophy />} title="Ranking">
              {matchCopy.rankingText} I match annullati prima della conferma non aggiornano le statistiche applicate.
            </Panel>
          </div>
        </section>
      </section>
    </main>
  );
}


type FormationId = "1-2-1" | "2-1-1" | "1-1-2" | "1-3";
type LineupSide = "home" | "away";
type LineupSlotRole = "keeper" | "defense" | "midfield" | "attack";

type LineupSlot = {
  id: string;
  side: LineupSide;
  role: LineupSlotRole;
  label: string;
  shortLabel: string;
};

const LINEUP_FORMATIONS: { id: FormationId; label: string; description: string }[] = [
  {
    id: "1-2-1",
    label: "1-2-1",
    description: "Equilibrato",
  },
  {
    id: "2-1-1",
    label: "2-1-1",
    description: "Più coperto",
  },
  {
    id: "1-1-2",
    label: "1-1-2",
    description: "Più offensivo",
  },
  {
    id: "1-3",
    label: "1-3",
    description: "Pressing alto",
  },
];

function getLineupRoleLabel(player: MatchPlayer) {
  const role = normalizeCalcettoRole(player.role);

  if (role === "portiere") return "Portiere";
  if (role === "difensore") return "Difensore";
  if (role === "centrocampista") return "Centrocampo";
  if (role === "attaccante") return "Attaccante";
  if (role === "jolly") return "Jolly";

  return "Giocatore";
}

function getSlotRoleLabel(role: LineupSlotRole) {
  if (role === "keeper") return "Portiere";
  if (role === "defense") return "Difensore";
  if (role === "midfield") return "Centrocampo";
  return "Attaccante";
}

function getSlotRoleShort(role: LineupSlotRole) {
  if (role === "keeper") return "POR";
  if (role === "defense") return "DIF";
  if (role === "midfield") return "CEN";
  return "ATT";
}

function getPlayerInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getFormationLineRoles(formation: FormationId): LineupSlotRole[] {
  if (formation === "2-1-1") return ["defense", "defense", "midfield", "attack"];
  if (formation === "1-1-2") return ["defense", "midfield", "attack", "attack"];
  if (formation === "1-3") return ["defense", "attack", "attack", "attack"];

  return ["defense", "midfield", "midfield", "attack"];
}

function getTeamLineupSlots(side: LineupSide, formation: FormationId) {
  const lineRoles = getFormationLineRoles(formation);
  const counters: Record<LineupSlotRole, number> = {
    keeper: 0,
    defense: 0,
    midfield: 0,
    attack: 0,
  };

  const slots: LineupSlot[] = ["keeper", ...lineRoles].map((role) => {
    const safeRole = role as LineupSlotRole;
    counters[safeRole] += 1;
    const roleCount = counters[safeRole];
    const roleLabel = getSlotRoleLabel(safeRole);

    return {
      id: `${side}-${safeRole}-${roleCount}`,
      side,
      role: safeRole,
      label: safeRole === "keeper" ? roleLabel : `${roleLabel} ${roleCount}`,
      shortLabel: getSlotRoleShort(safeRole),
    };
  });

  return side === "away" ? slots : [...slots].reverse();
}

function getSlotBandLabel(role: LineupSlotRole) {
  if (role === "keeper") return "Porta";
  if (role === "defense") return "Difesa";
  if (role === "midfield") return "Centro";
  return "Attacco";
}

function getGroupedSlots(slots: LineupSlot[]) {
  const groups: { role: LineupSlotRole; label: string; slots: LineupSlot[] }[] = [];

  slots.forEach((slot) => {
    const lastGroup = groups[groups.length - 1];

    if (lastGroup?.role === slot.role) {
      lastGroup.slots.push(slot);
      return;
    }

    groups.push({
      role: slot.role,
      label: getSlotBandLabel(slot.role),
      slots: [slot],
    });
  });

  return groups;
}

function playerMatchesSlotRole(player: MatchPlayer, slotRole: LineupSlotRole) {
  const role = normalizeCalcettoRole(player.role);

  if (slotRole === "keeper") return role === "portiere";
  if (slotRole === "defense") return role === "difensore";
  if (slotRole === "midfield") return role === "centrocampista" || role === "jolly";
  if (slotRole === "attack") return role === "attaccante";

  return false;
}

function createTeamSlotAssignments(
  side: LineupSide,
  teamPlayers: MatchPlayer[],
  formation: FormationId
) {
  const assignments: Record<string, string> = {};
  const used = new Set<string>();
  const visualSlots = getTeamLineupSlots(side, formation);
  const assignmentSlots = side === "away" ? visualSlots : [...visualSlots].reverse();

  assignmentSlots.forEach((slot) => {
    const roleMatch = teamPlayers.find(
      (player) =>
        player.uid &&
        !used.has(player.uid) &&
        playerMatchesSlotRole(player, slot.role)
    );

    const fallback = teamPlayers.find(
      (player) => player.uid && !used.has(player.uid)
    );

    const selectedPlayer = roleMatch || fallback;

    if (!selectedPlayer?.uid) return;

    assignments[slot.id] = selectedPlayer.uid;
    used.add(selectedPlayer.uid);
  });

  return assignments;
}

function createInitialLineupAssignments(
  homePlayers: MatchPlayer[],
  awayPlayers: MatchPlayer[],
  formation: FormationId
) {
  return {
    ...createTeamSlotAssignments("home", homePlayers, formation),
    ...createTeamSlotAssignments("away", awayPlayers, formation),
  };
}

function getPlayerByUid(players: MatchPlayer[], uid?: string) {
  if (!uid) return null;
  return players.find((player) => player.uid === uid) || null;
}

function getGridColsClass(length: number) {
  if (length >= 3) return "grid-cols-3";
  if (length === 2) return "grid-cols-2";
  return "grid-cols-1";
}

function CalcettoLineupPitch({
  homeTeamName,
  awayTeamName,
  homePlayers,
  awayPlayers,
}: {
  homeTeamName: string;
  awayTeamName: string;
  homePlayers: MatchPlayer[];
  awayPlayers: MatchPlayer[];
}) {
  const totalPlayers = homePlayers.length + awayPlayers.length;
  const [formation, setFormation] = useState<FormationId>("1-2-1");
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>(() =>
    createInitialLineupAssignments(homePlayers, awayPlayers, "1-2-1")
  );
  const [activeSlotId, setActiveSlotId] = useState("");

  const homeSlots = getTeamLineupSlots("home", formation);
  const awaySlots = getTeamLineupSlots("away", formation);
  const allSlots = [...homeSlots, ...awaySlots];
  const activeSlot = allSlots.find((slot) => slot.id === activeSlotId) || null;
  const activeTeamPlayers = activeSlot?.side === "home" ? homePlayers : awayPlayers;
  const activeTeamName = activeSlot?.side === "home" ? homeTeamName : awayTeamName;
  const activeAssignedUid = activeSlot ? slotAssignments[activeSlot.id] || "" : "";

  function resetFormation(nextFormation: FormationId) {
    setFormation(nextFormation);
    setSlotAssignments(
      createInitialLineupAssignments(homePlayers, awayPlayers, nextFormation)
    );
    setActiveSlotId("");
  }

  function assignPlayerToSlot(slot: LineupSlot, uid: string) {
    setSlotAssignments((current) => {
      const next = { ...current };

      Object.entries(next).forEach(([slotId, assignedUid]) => {
        if (assignedUid === uid && slotId.startsWith(`${slot.side}-`)) {
          delete next[slotId];
        }
      });

      if (uid) {
        next[slot.id] = uid;
      } else {
        delete next[slot.id];
      }

      return next;
    });
  }

  return (
    <section className="mt-6 w-full min-w-0 overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-emerald-400/[0.06] p-3 shadow-2xl sm:p-5">
      <div className="mb-4 flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">
            Formazione calcetto
          </div>

          <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">
            Campo tattico 5v5
          </h2>

          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-300">
            Prova modulo e posizioni con 10 slot già pronti. Gli utenti disponibili arrivano dal match e non vengono scritti a mano.
          </p>
        </div>

        <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3">
          <LineupCounter label="Squadra 1" value={homePlayers.length} />
          <LineupCounter label="Squadra 2" value={awayPlayers.length} />
          <LineupCounter label="Totale" value={totalPlayers} className="col-span-2 sm:col-span-1" />
        </div>
      </div>

      <div className="mb-4 rounded-[1.5rem] border border-cyan-300/15 bg-[#020617]/60 p-3 sm:p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
          Scegli modulo
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {LINEUP_FORMATIONS.map((option) => {
            const selected = formation === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => resetFormation(option.id)}
                className={`rounded-2xl border px-3 py-3 text-center transition ${
                  selected
                    ? "border-cyan-300/50 bg-cyan-400/15 text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,.14)]"
                    : "border-white/10 bg-white/[.03] text-slate-300 hover:border-cyan-300/30"
                }`}
              >
                <div className="text-lg font-black leading-none">{option.label}</div>
                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em]">
                  {option.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative min-w-0 overflow-hidden rounded-[1.8rem] border border-emerald-200/25 bg-[linear-gradient(180deg,rgba(5,150,105,.42),rgba(6,95,70,.78)_48%,rgba(5,150,105,.42)_52%,rgba(6,78,59,.84))] p-2.5 shadow-[inset_0_0_60px_rgba(2,6,23,.48)] sm:p-5">
        <div className="pointer-events-none absolute inset-3 rounded-[1.35rem] border-2 border-white/20" />
        <div className="pointer-events-none absolute left-3 right-3 top-1/2 h-px -translate-y-1/2 bg-white/25" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/20 sm:h-32 sm:w-32" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25" />

        <div className="pointer-events-none absolute left-1/2 top-3 h-4 w-24 -translate-x-1/2 rounded-b-2xl border-x-2 border-b-2 border-white/20 sm:w-40" />
        <div className="pointer-events-none absolute left-1/2 top-3 h-16 w-40 -translate-x-1/2 rounded-b-[2rem] border-x-2 border-b-2 border-white/15 sm:h-24 sm:w-72" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-4 w-24 -translate-x-1/2 rounded-t-2xl border-x-2 border-t-2 border-white/20 sm:w-40" />
        <div className="pointer-events-none absolute bottom-3 left-1/2 h-16 w-40 -translate-x-1/2 rounded-t-[2rem] border-x-2 border-t-2 border-white/15 sm:h-24 sm:w-72" />

        <div className="relative grid min-w-0 gap-3 sm:gap-4">
          <PitchTeamHalf
            side="away"
            teamLabel="Squadra 2"
            teamName={awayTeamName}
            players={awayPlayers}
            slots={awaySlots}
            slotAssignments={slotAssignments}
            onSelectSlot={setActiveSlotId}
          />

          <div className="flex justify-center py-0.5">
            <div className="rounded-full border border-white/25 bg-[#020617]/75 px-5 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-100 shadow-xl">
              VS
            </div>
          </div>

          <PitchTeamHalf
            side="home"
            teamLabel="Squadra 1"
            teamName={homeTeamName}
            players={homePlayers}
            slots={homeSlots}
            slotAssignments={slotAssignments}
            onSelectSlot={setActiveSlotId}
          />
        </div>
      </div>

      {activeSlot && (
        <div className="mt-4 rounded-[1.5rem] border border-cyan-300/20 bg-cyan-400/10 p-4">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
                Assegna posizione
              </div>

              <div className="mt-1 break-words text-lg font-black text-white">
                {activeTeamName} · {activeSlot.label}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveSlotId("")}
              className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-slate-200"
            >
              Chiudi
            </button>
          </div>

          <select
            value={activeAssignedUid}
            onChange={(event) => assignPlayerToSlot(activeSlot, event.target.value)}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-sm font-black text-white outline-none"
          >
            <option value="">Slot libero</option>
            {activeTeamPlayers.map((player) => {
              const assignedToAnotherSlot = Object.entries(slotAssignments).some(
                ([slotId, uid]) =>
                  uid === player.uid &&
                  slotId !== activeSlot.id &&
                  slotId.startsWith(`${activeSlot.side}-`)
              );

              return (
                <option key={player.uid} value={player.uid}>
                  {getPlayerDisplayName(player)}{assignedToAnotherSlot ? " · già in campo" : ""}
                </option>
              );
            })}
          </select>

          <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
            Questa assegnazione serve per provare il modulo nella schermata. Il salvataggio definitivo delle formazioni arriverà nello step dedicato.
          </p>
        </div>
      )}
    </section>
  );
}

function LineupCounter({
  label,
  value,
  className = "",
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className={`min-w-0 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-3 py-3 text-center ${className}`}>
      <div className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200 sm:text-[10px]">
        {label}
      </div>

      <div className="mt-1 text-2xl font-black leading-none text-emerald-100">
        {value}
      </div>
    </div>
  );
}

function PitchTeamHalf({
  side,
  teamLabel,
  teamName,
  players,
  slots,
  slotAssignments,
  onSelectSlot,
}: {
  side: LineupSide;
  teamLabel: string;
  teamName: string;
  players: MatchPlayer[];
  slots: LineupSlot[];
  slotAssignments: Record<string, string>;
  onSelectSlot: (slotId: string) => void;
}) {
  const groups = getGroupedSlots(slots);

  return (
    <div className="min-w-0 rounded-[1.5rem] border border-white/15 bg-[#020617]/45 p-2.5 shadow-xl backdrop-blur sm:p-4">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
            {teamLabel}
          </div>

          <div className="mt-1 break-words text-xl font-black leading-tight text-white sm:text-2xl">
            {teamName}
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm font-black text-cyan-100">
          {players.length}/5
        </div>
      </div>

      <div className="grid min-w-0 gap-2.5 sm:gap-3">
        {groups.map((group) => (
          <div key={`${side}-${group.role}-${group.slots.length}`} className="min-w-0">
            <div className="mb-1.5 flex items-center justify-center gap-2">
              <div className="h-px flex-1 bg-white/10" />
              <div className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-emerald-100 sm:text-[9px]">
                {group.label}
              </div>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <div className={`grid min-w-0 gap-2 ${getGridColsClass(group.slots.length)}`}>
              {group.slots.map((slot) => {
                const player = getPlayerByUid(players, slotAssignments[slot.id]);

                return (
                  <LineupSlotCard
                    key={slot.id}
                    slot={slot}
                    player={player}
                    onClick={() => onSelectSlot(slot.id)}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LineupSlotCard({
  slot,
  player,
  onClick,
}: {
  slot: LineupSlot;
  player: MatchPlayer | null;
  onClick: () => void;
}) {
  const removed = isProfileDeletionRequested(player);
  const displayName = player ? getPlayerDisplayName(player) : "Slot libero";
  const roleLabel = player && !removed ? getLineupRoleLabel(player) : getSlotRoleLabel(slot.role);
  const initials = player ? getPlayerInitials(displayName) : "+";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-[1.05rem] border p-2 text-center transition sm:rounded-[1.25rem] sm:p-2.5 ${
        player
          ? "border-cyan-200/15 bg-[linear-gradient(145deg,rgba(15,23,42,.96),rgba(8,47,73,.78),rgba(2,6,23,.96))] shadow-[0_0_20px_rgba(34,211,238,.10)] ring-1 ring-white/5 hover:border-cyan-300/35"
          : "border-dashed border-white/15 bg-[#020617]/45 text-slate-400 hover:border-cyan-300/30 hover:bg-cyan-400/10"
      }`}
    >
      <div className={`mx-auto flex h-9 w-9 items-center justify-center rounded-[0.95rem] border text-xs font-black sm:h-10 sm:w-10 ${
        player
          ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,.12)]"
          : "border-white/15 bg-white/[.04] text-slate-300"
      }`}>
        {initials || slot.shortLabel}
      </div>

      <div className={`mt-1.5 min-h-[28px] break-words text-[9px] font-black uppercase leading-[1.15] sm:text-[10px] ${
        player ? "text-white" : "text-slate-400"
      }`}>
        {displayName}
      </div>

      <div className="mx-auto mt-1.5 max-w-full rounded-full border border-emerald-300/20 bg-emerald-400/10 px-1.5 py-1 text-[7px] font-black uppercase leading-tight tracking-[0.06em] text-emerald-100 sm:text-[8px]">
        {roleLabel}
      </div>
    </button>
  );
}

function PlayerStatsGroup({
  title,
  players,
  teamName,
  isOfficial,
  isCancelled,
  accountLocked,
  racketMatch,
  calcettoMatch,
  updatePlayerField,
  setMvpName,
}: {
  title: string;
  players: MatchPlayer[];
  teamName: string;
  isOfficial: boolean;
  isCancelled: boolean;
  accountLocked: boolean;
  racketMatch: boolean;
  calcettoMatch: boolean;
  updatePlayerField: (
    uid: string,
    field:
      | "goals"
      | "assists"
      | "isMvp"
      | "goalsConceded"
      | "cleanSheet"
      | "penaltiesSaved",
    value: number | boolean
  ) => void;
  setMvpName: React.Dispatch<React.SetStateAction<string>>;
}) {
  if (players.length === 0) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            {title}
          </div>

          <div className="mt-1 text-xl font-black">{teamName || title}</div>
        </div>

        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
          {players.length} {racketMatch ? "player" : "giocatori"}
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.uid}
            className={`grid gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 p-3 ${
              racketMatch
                ? "md:grid-cols-[1fr_90px]"
                : calcettoMatch && isGoalkeeper(player)
                ? "md:grid-cols-[1fr_80px_90px_90px_90px_90px_90px]"
                : "md:grid-cols-[1fr_80px_90px_90px]"
            }`}
          >
            <div>
              <div className="break-words font-black">{getPlayerDisplayName(player)}</div>

              <div className="text-xs uppercase text-slate-400">
                {getPlayerStatusLabel(player) || teamName || title}
                {!getPlayerStatusLabel(player) && calcettoMatch && player.role ? ` · ${normalizeCalcettoRole(player.role)}` : ""}
              </div>
            </div>

            {!racketMatch && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">
                    Gol
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={player.goals || 0}
                    disabled={isOfficial || isCancelled || accountLocked}
                    onChange={(e) =>
                      updatePlayerField(
                        player.uid,
                        "goals",
                        Number(e.target.value || 0)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-60"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">
                    Assist
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={player.assists || 0}
                    disabled={isOfficial || isCancelled || accountLocked}
                    onChange={(e) =>
                      updatePlayerField(
                        player.uid,
                        "assists",
                        Number(e.target.value || 0)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-60"
                  />
                </label>
              </>
            )}

            {calcettoMatch && isGoalkeeper(player) && (
              <>
                <label className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">
                    GS
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={player.goalsConceded || 0}
                    disabled={isOfficial || isCancelled || accountLocked}
                    onChange={(e) =>
                      updatePlayerField(
                        player.uid,
                        "goalsConceded",
                        Number(e.target.value || 0)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-60"
                  />
                </label>

                <label className="flex items-center gap-2 pt-6 text-sm font-black text-cyan-200">
                  <input
                    type="checkbox"
                    checked={Boolean(player.cleanSheet)}
                    disabled={isOfficial || isCancelled || accountLocked}
                    onChange={(e) =>
                      updatePlayerField(
                        player.uid,
                        "cleanSheet",
                        e.target.checked
                      )
                    }
                  />
                  CS
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-black text-slate-400">
                    RP
                  </span>

                  <input
                    type="number"
                    min="0"
                    value={player.penaltiesSaved || 0}
                    disabled={isOfficial || isCancelled || accountLocked}
                    onChange={(e) =>
                      updatePlayerField(
                        player.uid,
                        "penaltiesSaved",
                        Number(e.target.value || 0)
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none disabled:opacity-60"
                  />
                </label>
              </>
            )}

            <label className="flex items-center gap-2 pt-6 text-sm font-black text-yellow-200">
              <input
                type="checkbox"
                checked={Boolean(player.isMvp)}
                disabled={isOfficial || isCancelled || accountLocked}
                onChange={(e) => {
                  updatePlayerField(player.uid, "isMvp", e.target.checked);

                  if (e.target.checked) {
                    setMvpName(getPlayerDisplayName(player));
                  }
                }}
              />
              {racketMatch ? "POTM" : "MVP"}
            </label>
          </div>
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
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">
        {label}
      </span>

      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
        {children}
      </div>
    </label>
  );
}

function Info({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-cyan-300">{icon}</span>
      {text}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.04] p-4 text-center sm:p-5">
      <div className="break-words text-xl font-black leading-tight text-cyan-300 sm:text-2xl">
        {value}
      </div>

      <div className="mt-2 break-words text-[10px] font-black uppercase tracking-[.12em] text-slate-400 sm:text-xs sm:tracking-[.18em]">
        {label}
      </div>
    </div>
  );
}

function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <span className="text-cyan-300">{icon}</span>
        <h3 className="text-2xl font-black">{title}</h3>
      </div>

      <p className="leading-7 text-slate-300">{children}</p>
    </div>
  );
}