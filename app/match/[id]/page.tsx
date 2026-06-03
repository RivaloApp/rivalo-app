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
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type MatchPlayer = {
  uid: string;
  name: string;
  team?: "home" | "away";
  goals?: number;
  assists?: number;
  isMvp?: boolean;
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
sourceType?: string;
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
  participants?: string[];
  players?: MatchPlayer[];
  eventId?: string;
  eventTitle?: string;
  competitionFormat?: string;
};

type UserProfile = {
  mainSport?: string;
  sport?: string;
};

function normalizeSport(value?: string) {
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

function isSameUserSport(match: MatchDoc, userSport: string) {
  return normalizeSport(match.sport) === normalizeSport(userSport);
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

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [sportMismatch, setSportMismatch] = useState(false);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [mvpName, setMvpName] = useState("");
  const [notes, setNotes] = useState("");
  const [players, setPlayers] = useState<MatchPlayer[]>([]);

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
        setPlayers(Array.isArray(data.players) ? data.players : []);
      }
    } finally {
      setLoading(false);
    }
  }

  function updatePlayerField(
    uid: string,
    field: "goals" | "assists" | "isMvp",
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

      const currentMatch = nextBracket.find(
        (bracketMatch: any) => bracketMatch.matchId === matchId
      );

      const currentRound = Number(currentMatch?.round || 1);

      const roundMatches = nextBracket.filter(
        (bracketMatch: any) => Number(bracketMatch.round || 1) === currentRound
      );

      const allRoundCompleted =
        roundMatches.length > 0 &&
        roundMatches.every(
          (bracketMatch: any) =>
            bracketMatch.resultStatus === "confermato" &&
            Boolean(bracketMatch.winnerTeamId)
        );

      const nextRoundAlreadyExists = nextBracket.some(
        (bracketMatch: any) =>
          Number(bracketMatch.round || 1) === currentRound + 1
      );

      if (allRoundCompleted && !nextRoundAlreadyExists) {
        const winners = roundMatches
          .map((bracketMatch: any) => ({
            teamId: bracketMatch.winnerTeamId,
            name:
              bracketMatch.winnerTeamId === bracketMatch.homeTeamId
                ? bracketMatch.homeName
                : bracketMatch.awayName,
          }))
          .filter((winner: any) => Boolean(winner.teamId));

        if (winners.length === 1) {
          updatePayload.status = "torneo completato";
          updatePayload.winnerTeamId = winners[0].teamId;
          updatePayload.winnerTeamName = winners[0].name;
        }

        if (winners.length > 1) {
          const nextRoundMatches: any[] = [];

          for (let i = 0; i < winners.length; i += 2) {
            const homeWinner = winners[i];
            const awayWinner = winners[i + 1];

            nextRoundMatches.push({
              round: currentRound + 1,
              matchNumber: nextBracket.length + nextRoundMatches.length + 1,
              homeTeamId: homeWinner?.teamId || "",
              awayTeamId: awayWinner?.teamId || "",
              homeName: homeWinner?.name || "Da definire",
              awayName: awayWinner?.name || "Riposo",
              winnerTeamId: awayWinner ? "" : homeWinner?.teamId || "",
              matchId: "",
              status: awayWinner ? "programmato" : "riposo",
              resultStatus: awayWinner ? "da_creare" : "confermato",
              homeScore: null,
              awayScore: null,
            });
          }

          nextBracket = [...nextBracket, ...nextRoundMatches];

          updatePayload.status =
            winners.length === 2
              ? "finale generata"
              : `round ${currentRound + 1} generato`;
        }
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

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi modificare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    const userTeam = getUserTeam(match, user.uid);
    const requiredTeam = match.resultConfirmRequiredTeam || "";

    if (match.resultStatus === "proposto" && (!userTeam || userTeam !== requiredTeam)) {
      setMessage(
        `Solo ${getTeamName(match, requiredTeam)} può contestare questa proposta.`
      );
      return;
    }

    if (match.resultProposedBy === user.uid) {
      setMessage("Chi propone il risultato non può contestare la propria proposta.");
      return;
    }

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi modificare il risultato.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const proposerTeam = getUserTeam(match, user.uid);

      if (!proposerTeam) {
        setMessage("Per proporre il risultato devi essere assegnato a Squadra 1 o Squadra 2.");
        setSaving(false);
        return;
      }

      const requiredTeam = getOpponentTeam(proposerTeam);
      const expiresAt = Timestamp.fromDate(
        new Date(Date.now() + 24 * 60 * 60 * 1000)
      );

      await updateDoc(doc(db, "matches", matchId), {
        homeTeam,
        awayTeam,
        homeScore: Number(homeScore),
        awayScore: Number(awayScore),
        mvpName,
        notes,
        players,
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

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi confermare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Non puoi confermare né applicare statistiche.");
      return;
    }

    if (match.resultStatus !== "proposto") {
      setMessage("Prima deve essere proposto un risultato.");
      return;
    }

    const userTeam = getUserTeam(match, user.uid);
    const requiredTeam = match.resultConfirmRequiredTeam || "";
    const autoConfirmAllowed = isProposalExpired(match);

    if (!autoConfirmAllowed && (!userTeam || userTeam !== requiredTeam)) {
      setMessage(
        `Solo ${getTeamName(match, requiredTeam)} può confermare questo risultato.`
      );
      return;
    }

    if (!autoConfirmAllowed && match.resultProposedBy === user.uid) {
      setMessage("Chi propone il risultato non può confermarlo da solo.");
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

        if (!canUseMatch(freshMatch, user.uid, userSport)) {
          throw new Error("SPORT_MISMATCH");
        }

        const freshUserTeam = getUserTeam(freshMatch, user.uid);
        const freshRequiredTeam = freshMatch.resultConfirmRequiredTeam || "";
        const freshAutoConfirmAllowed = isProposalExpired(freshMatch);

       if (freshMatch.resultStatus === "contestato") {
  throw new Error("RESULT_DISPUTED");
}

if (freshMatch.resultStatus !== "proposto") {
  throw new Error("NO_RESULT_PROPOSAL");
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
        ? safeMatch.players
        : [];

      if (matchPlayers.length > 0) {
        const cleanPlayers = matchPlayers.map((player) => ({
          uid: player.uid,
          name: player.name || "Rivalo Player",
          team: player.team,
          goals: Number(player.goals || 0),
          assists: Number(player.assists || 0),
          isMvp:
            Boolean(player.isMvp) ||
            player.name?.toLowerCase().trim() === mvpName.toLowerCase().trim(),
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
        setMessage("Solo la squadra avversaria può confermare questo risultato.");
      } else if (error?.message === "PROPOSER_CANNOT_CONFIRM") {
        setMessage("Chi propone il risultato non può confermarlo da solo.");
      } else if (error?.message === "RESULT_DISPUTED") {
        setMessage("Il risultato è contestato. Serve revisione prima della conferma.");
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

    if (!canAccessMatch(match, user.uid)) {
      setMessage("Non puoi contestare un match in cui non sei coinvolto.");
      return;
    }

    if (!canUseMatch(match, user.uid, userSport)) {
      setMessage("Questo match appartiene a un altro sport. Usa un profilo sport compatibile.");
      return;
    }

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi contestarlo da qui.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "matches", matchId), {
        disputedBy: arrayUnion(user.uid),
        disputedTeam: getUserTeam(match, user.uid),
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
setMessage("Risultato contestato. Servirà revisione.");
    } catch {
      setMessage("Errore durante la contestazione.");
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
              Per usare un altro sport servirà un profilo sport separato.
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

  const isOfficial =
    match.status === "ufficiale" || match.resultStatus === "confermato";

  const statsLocked = Boolean(match.statsApplied || match.statsApplying);

  const homePlayers = players.filter((player) => player.team === "home");
  const awayPlayers = players.filter((player) => player.team === "away");
  const otherPlayers = players.filter(
    (player) => player.team !== "home" && player.team !== "away"
  );

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-7xl px-5 py-8">
        <Link
          href="/match"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna ai match
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden p-8 md:p-10">
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                  {sportLabel(match.sport)}
                </div>

                <h1 className="mt-5 text-5xl font-black tracking-tight md:text-6xl">
                  {match.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
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

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
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
          <section className="mt-6 rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-5">
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

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <form
            onSubmit={proposeResult}
            className="rounded-[2rem] border border-white/10 bg-white/[.045] p-6 shadow-2xl backdrop-blur"
          >
            <div className="mb-6 flex items-center gap-3">
              <Trophy className="text-cyan-300" size={30} />

              <div>
                <h2 className="text-2xl font-black">Risultato e FairPlay</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Il risultato diventa ufficiale solo dopo conferma.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Squadra 1">
                  <input
                    required
                    disabled={isOfficial}
                    value={homeTeam}
                    onChange={(e) => setHomeTeam(e.target.value)}
                    placeholder="Es. Rival Team"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />
                </Field>

                <Field label="Squadra 2">
                  <input
                    required
                    disabled={isOfficial}
                    value={awayTeam}
                    onChange={(e) => setAwayTeam(e.target.value)}
                    placeholder="Es. Black Sharks"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Gol squadra 1">
                  <input
                    required
                    disabled={isOfficial}
                    type="number"
                    min="0"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="w-full bg-transparent outline-none disabled:opacity-60"
                  />
                </Field>

                <Field label="Gol squadra 2">
                  <input
                    required
                    disabled={isOfficial}
                    type="number"
                    min="0"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="w-full bg-transparent outline-none disabled:opacity-60"
                  />
                </Field>
              </div>

              <Field label="MVP partita">
                <input
                  disabled={isOfficial}
                  value={mvpName}
                  onChange={(e) => setMvpName(e.target.value)}
                  placeholder="Nome MVP"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                />
              </Field>

              {players.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-[#020617]/70 p-4">
                  <div className="mb-4 text-sm font-black uppercase tracking-[0.16em] text-cyan-300">
                    Statistiche giocatori
                  </div>

                  <div className="space-y-4">
                    <PlayerStatsGroup
                      title="Squadra 1"
                      players={homePlayers}
                      teamName={homeTeam}
                      isOfficial={isOfficial}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />

                    <PlayerStatsGroup
                      title="Squadra 2"
                      players={awayPlayers}
                      teamName={awayTeam}
                      isOfficial={isOfficial}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />

                    <PlayerStatsGroup
                      title="Altri giocatori"
                      players={otherPlayers}
                      teamName="Non assegnati"
                      isOfficial={isOfficial}
                      updatePlayerField={updatePlayerField}
                      setMvpName={setMvpName}
                    />
                  </div>
                </div>
              )}

              <Field label="Note statistiche">
                <textarea
                  disabled={isOfficial}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gol, assist, note o dettagli partita..."
                  className="min-h-[120px] w-full resize-none bg-transparent outline-none placeholder:text-slate-500 disabled:opacity-60"
                />
              </Field>

              {match.resultStatus === "proposto" && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100">
                  Proposta inviata da {getTeamName(match, match.resultProposedTeam || "")}. Deve confermare o contestare {getTeamName(match, match.resultConfirmRequiredTeam || "")}
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
                      Squadra 1
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
                      Risultato
                    </div>
                  </div>

                  <div className="rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4 text-center">
                    <div className="text-xs font-black uppercase tracking-[0.14em] text-fuchsia-300">
                      Squadra 2
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
                  </div>
                </div>
              </div>

              {isOfficial && (
                <div className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-black text-lime-200">
                  Match ufficiale. Risultato e statistiche non sono più
                  modificabili.
                </div>
              )}

              <button
                type="submit"
                disabled={saving || isOfficial}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {saving
                  ? "Salvataggio..."
                  : isOfficial
                  ? "Risultato ufficiale"
                  : "Proponi risultato"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={confirmResult}
                  disabled={saving || isOfficial || statsLocked}
                  className="rounded-2xl border border-lime-300/30 bg-lime-400/10 px-6 py-4 font-black text-lime-200 disabled:opacity-60"
                >
                  {match.resultStatus === "proposto" && isProposalExpired(match)
                    ? "Conferma automatica 24h"
                    : "Conferma risultato"}
                </button>

                <button
                  type="button"
                  onClick={disputeResult}
                  disabled={saving || isOfficial || statsLocked}
                  className="rounded-2xl border border-red-300/30 bg-red-500/10 px-6 py-4 font-black text-red-200 disabled:opacity-60"
                >
                  Contesta
                </button>
              </div>
            </div>
          </form>

          <div className="space-y-5">
            <Panel icon={<ShieldCheck />} title="Sistema anti-fake">
              Una squadra propone il risultato. Solo la squadra avversaria può confermare o contestare.
            </Panel>

            <Panel icon={<Users />} title="Conferme">
              Se nessuno contesta entro 24 ore, la proposta può diventare ufficiale con conferma automatica.
            </Panel>

            <Panel icon={<Trophy />} title="Ranking">
              Solo i match confermati aggiornano RivalScore, XP, vittorie e MVP.
            </Panel>
          </div>
        </section>
      </section>
    </main>
  );
}

function PlayerStatsGroup({
  title,
  players,
  teamName,
  isOfficial,
  updatePlayerField,
  setMvpName,
}: {
  title: string;
  players: MatchPlayer[];
  teamName: string;
  isOfficial: boolean;
  updatePlayerField: (
    uid: string,
    field: "goals" | "assists" | "isMvp",
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
          {players.length} giocatori
        </div>
      </div>

      <div className="space-y-3">
        {players.map((player) => (
          <div
            key={player.uid}
            className="grid gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 p-3 md:grid-cols-[1fr_80px_90px_90px]"
          >
            <div>
              <div className="font-black">{player.name || "Rivalo Player"}</div>

              <div className="text-xs uppercase text-slate-400">
                {teamName || title}
              </div>
            </div>

            <label className="block">
              <span className="mb-1 block text-xs font-black text-slate-400">
                Gol
              </span>

              <input
                type="number"
                min="0"
                value={player.goals || 0}
                disabled={isOfficial}
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
                disabled={isOfficial}
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

            <label className="flex items-center gap-2 pt-6 text-sm font-black text-yellow-200">
              <input
                type="checkbox"
                checked={Boolean(player.isMvp)}
                disabled={isOfficial}
                onChange={(e) => {
                  updatePlayerField(player.uid, "isMvp", e.target.checked);

                  if (e.target.checked) {
                    setMvpName(player.name || "Rivalo Player");
                  }
                }}
              />
              MVP
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
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="max-w-[130px] truncate text-2xl font-black text-cyan-300">
        {value}
      </div>

      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
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