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
  updateDoc,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { applyMatchStats } from "../../../lib/rivaloStats";
import { updatePlayerStats } from "../../../lib/updatePlayerStats";
import { updateTeamEventStats } from "../../../lib/updateTeamEventStats";
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
  players?: MatchPlayer[];
  eventId?: string;
  eventTitle?: string;
  competitionFormat?: string;
};

export default function MatchDetailsPage() {
  const params = useParams();
  const matchId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [loading, setLoading] = useState(true);

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
      await loadMatch();
    });

    return () => unsubscribe();
  }, [matchId]);

  async function loadMatch() {
    setLoading(true);

    try {
      const snap = await getDoc(doc(db, "matches", matchId));

      if (snap.exists()) {
        const data = snap.data() as MatchDoc;

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

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi modificare il risultato.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
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
        resultProposedAt: serverTimestamp(),
      });

      await loadMatch();
      setMessage("Risultato proposto. Ora puoi confermarlo.");
    } catch {
      setMessage("Errore durante il salvataggio del risultato.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmResult() {
    if (!user || !match) return;

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

        if (freshMatch.statsApplied) {
          throw new Error("STATS_ALREADY_APPLIED");
        }

        if (freshMatch.statsApplying) {
          throw new Error("STATS_IN_PROGRESS");
        }

        transaction.update(matchRef, {
          confirmedBy: arrayUnion(user.uid),
          status: "ufficiale",
          resultStatus: "confermato",
          fairPlayStatus: "confermato",
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

      await loadMatch();
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

    if (match.status === "ufficiale" || match.resultStatus === "confermato") {
      setMessage("Match già ufficiale. Non puoi contestarlo da qui.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "matches", matchId), {
        disputedBy: arrayUnion(user.uid),
        status: "contestato",
        resultStatus: "contestato",
        fairPlayStatus: "contestato",
        disputedAt: serverTimestamp(),
      });

      await loadMatch();
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
                  {match.sport}
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
                  Conferma risultato
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
              Risultato proposto → conferma → match ufficiale → statistiche
              aggiornate.
            </Panel>

            <Panel icon={<Users />} title="Conferme">
              La contestazione mette il match in revisione.
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