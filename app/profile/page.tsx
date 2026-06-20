"use client";

import FullScreenLoader from "../../components/FullScreenLoader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { Camera, Shield, Star, Trophy } from "lucide-react";
import RivaloLogo from "../../components/RivaloLogo";
import PlayerCard from "../../components/cards/PlayerCard";

type Sport = "calcetto" | "padel" | "tennis";

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

function normalizeCalcettoRole(value?: string) {
  const role = (value || "").toLowerCase().trim();

  if (role.includes("port")) return "portiere";
  if (role.includes("dif")) return "difensore";
  if (role.includes("cent")) return "centrocampista";
  if (role.includes("att")) return "attaccante";
  if (role.includes("jolly")) return "jolly";

  return role;
}

function calcettoRoleLabel(value?: string) {
  const role = normalizeCalcettoRole(value);

  if (role === "portiere") return "Portiere";
  if (role === "difensore") return "Difensore";
  if (role === "centrocampista") return "Centrocampista";
  if (role === "attaccante") return "Attaccante";
  if (role === "jolly") return "Jolly";

  return "Non impostato";
}

function getSportRolePlaceholder(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "Es. giocatore destro, sinistro, difensivo...";
  if (sport === "tennis") return "Es. fondocampista, servizio e volée...";

  return "Es. attaccante, difensore, portiere...";
}

function getSportStylePlaceholder(value?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") return "Es. controllo, bandeja, rete, difesa...";
  if (sport === "tennis") return "Es. aggressivo, regolare, potente, tecnico...";

  return "Es. tecnico, veloce, competitivo...";
}

function getProfileStats(mainSport: string, {
  rivalScore,
  wins,
  losses,
  matchesPlayed,
  mvp,
  goals,
  assists,
  xp,
  level,
  winStreak,
  bestStreak,
  role,
  goalsConceded,
  cleanSheets,
  penaltiesSaved,
}: {
  rivalScore: number;
  wins: number;
  losses: number;
  matchesPlayed: number;
  mvp: number;
  goals: number;
  assists: number;
  xp: number;
  level: number;
  winStreak: number;
  bestStreak: number;
  role: string;
  goalsConceded: number;
  cleanSheets: number;
  penaltiesSaved: number;
}) {
  const sport = normalizeSport(mainSport);
  const winRate =
    matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  const base = [
    { label: "Livello", value: String(level) },
    { label: "Partite", value: String(matchesPlayed) },
    { label: "Vittorie", value: String(wins) },
    { label: "XP", value: String(xp) },
  ];

  if (sport === "padel" || sport === "tennis") {
    return [
      ...base,
      { label: "Win Rate", value: `${winRate}%` },
      { label: "Serie vitt.", value: String(winStreak) },
      { label: "Miglior serie", value: String(bestStreak) },
      { label: "MVP", value: String(mvp) },
      { label: "Sconfitte", value: String(losses) },
    ];
  }

  if (normalizeCalcettoRole(role) === "portiere") {
    const goalsConcededAverage =
      matchesPlayed > 0 ? (goalsConceded / matchesPlayed).toFixed(1) : "0.0";

    return [
      ...base,
      { label: "Ruolo", value: "POR" },
      { label: "Gol subiti", value: String(goalsConceded) },
      { label: "Media GS", value: goalsConcededAverage },
      { label: "Clean sheet", value: String(cleanSheets) },
      { label: "Rigori parati", value: String(penaltiesSaved) },
      { label: "MVP", value: String(mvp) },
      { label: "Serie vitt.", value: String(winStreak) },
      { label: "Miglior serie", value: String(bestStreak) },
    ];
  }

  return [
    ...base,
    { label: "Ruolo", value: calcettoRoleLabel(role) },
    { label: "Gol", value: String(goals) },
    { label: "Assist", value: String(assists) },
    { label: "MVP", value: String(mvp) },
    { label: "Sconfitte", value: String(losses) },
    { label: "Serie vitt.", value: String(winStreak) },
    { label: "Miglior serie", value: String(bestStreak) },
  ];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [sport, setSport] = useState("calcetto");
const [city, setCity] = useState("");
const [role, setRole] = useState("");
const [playStyle, setPlayStyle] = useState("");
const [availability, setAvailability] = useState("");
const [photoUrl, setPhotoUrl] = useState("");
const [message, setMessage] = useState("");
const [accountStatus, setAccountStatus] = useState("");
const [deletionRequested, setDeletionRequested] = useState(false);

  const [rivalScore, setRivalScore] = useState(1000);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [matchesPlayed, setMatchesPlayed] = useState(0);
  const [mvp, setMvp] = useState(0);
  const [goals, setGoals] = useState(0);
  const [assists, setAssists] = useState(0);
  const [winStreak, setWinStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [goalsConceded, setGoalsConceded] = useState(0);
  const [cleanSheets, setCleanSheets] = useState(0);
  const [penaltiesSaved, setPenaltiesSaved] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        localStorage.removeItem("rivaloProfilePhoto");
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          const data = snap.data();

          setName(data.name || currentUser.displayName || "");
          setNickname(data.nickname || "Rivalo Player");
          setSport(normalizeSport(data.mainSport || data.sport || "calcetto"));
          setCity(data.city || "");
setRole(data.role || "");
setPlayStyle(data.playStyle || "");
setAvailability(data.availability || "");
setAccountStatus(data.accountStatus || "");
setDeletionRequested(Boolean(data.deletionRequested));

          setPhotoUrl(
            data.photoUrl ||
              data.photoURL ||
              localStorage.getItem(`rivaloProfilePhoto:${currentUser.uid}`) ||
              ""
          );

          setRivalScore(Number(data.rivalScore || 1000));
          setLevel(Number(data.level || 1));
          setXp(Number(data.xp || 0));
          setWins(Number(data.wins || 0));
          setLosses(Number(data.losses || 0));
          setMatchesPlayed(Number(data.matchesPlayed || 0));
          setMvp(Number(data.mvp || 0));
          setGoals(Number(data.goals || 0));
          setAssists(Number(data.assists || 0));
          setWinStreak(Number(data.winStreak || 0));
          setBestStreak(Number(data.bestStreak || 0));
          setGoalsConceded(Number(data.goalsConceded || 0));
          setCleanSheets(Number(data.cleanSheets || 0));
          setPenaltiesSaved(Number(data.penaltiesSaved || 0));
        } else {
          setName(currentUser.displayName || "");
          setNickname("Rivalo Player");
          setSport("calcetto");
          setCity("");
setRole("");
setPlayStyle("");
setAvailability("");
setAccountStatus("");
setDeletionRequested(false);
          setRivalScore(1000);
          setLevel(1);
          setXp(0);
          setWins(0);
          setLosses(0);
          setMatchesPlayed(0);
          setMvp(0);
          setGoals(0);
          setAssists(0);
          setWinStreak(0);
          setBestStreak(0);
          setGoalsConceded(0);
          setCleanSheets(0);
          setPenaltiesSaved(0);
          setPhotoUrl("");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function uploadPhoto(file: File) {
    if (!file) return;

    try {
      setSaving(true);
      setMessage("");

      const optimizedPhoto = await resizeImageToDataUrl(file, 640);

      setPhotoUrl(optimizedPhoto);
      if (user?.uid) {
        localStorage.setItem(`rivaloProfilePhoto:${user.uid}`, optimizedPhoto);
      }
      setMessage("Foto caricata. Premi Salva profilo per confermare.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante il caricamento della foto.");
    } finally {
      setSaving(false);
    }
  }

  function resizeImageToDataUrl(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const source = reader.result;

        if (typeof source !== "string") {
          reject(new Error("File non valido."));
          return;
        }

        const image = new Image();

        image.onload = () => {
          const canvas = document.createElement("canvas");
          const size = maxSize;

          canvas.width = size;
          canvas.height = size;

          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("Canvas non supportato."));
            return;
          }

          const side = Math.min(image.width, image.height);
          const sx = (image.width - side) / 2;
          const sy = (image.height - side) / 2;

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(image, sx, sy, side, side, 0, 0, size, size);

          resolve(canvas.toDataURL("image/jpeg", 0.86));
        };

        image.onerror = () => {
          reject(new Error("Impossibile leggere la foto."));
        };

        image.src = source;
      };

      reader.onerror = () => {
        reject(new Error("Impossibile leggere il file."));
      };

      reader.readAsDataURL(file);
    });
  }

  async function saveProfile() {
    try {
      setSaving(true);

      if (!user) return;

      if (accountStatus === "deletion_requested" || deletionRequested) {
        setMessage("Profilo non attivo: modifiche bloccate.");
        setSaving(false);
        return;
      }

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const oldData = snap.exists() ? snap.data() : {};
      const oldSport = normalizeSport(oldData.mainSport || oldData.sport || sport);
      const nextSport = normalizeSport(sport);
      const hasPlayedMatches = Number(oldData.matchesPlayed || 0) > 0;

      if (hasPlayedMatches && nextSport !== oldSport) {
        setSport(oldSport);
        setMessage(
          `Sport bloccato su ${sportLabel(oldSport)} perché hai già statistiche collegate.`
        );
        setSaving(false);
        return;
      }

      const finalSport = hasPlayedMatches ? oldSport : nextSport;
      const finalRole =
        finalSport === "calcetto" ? normalizeCalcettoRole(role) : role.trim();

      await setDoc(
        userRef,
        {
          name: name.trim(),
          nickname: nickname.trim(),
          mainSport: finalSport,
          sport: finalSport,
          city: city.trim(),
          role: finalRole,
          playStyle: playStyle.trim(),
          availability: availability.trim(),
          photoUrl,
          onboardingCompleted: true,
          profileCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      setMessage("Profilo aggiornato.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante il salvataggio del profilo.");
    }

    setSaving(false);
  }

  if (loading) {
    return <FullScreenLoader />;
  }

  const profileStats = getProfileStats(sport, {
    rivalScore,
    wins,
    losses,
    matchesPlayed,
    mvp,
    goals,
    assists,
    xp,
    level,
    winStreak,
    bestStreak,
    role,
    goalsConceded,
    cleanSheets,
    penaltiesSaved,
  });

  const sportLockedByStats = matchesPlayed > 0;
  const isCalcettoProfile = normalizeSport(sport) === "calcetto";
  const isGoalkeeper = isCalcettoProfile && normalizeCalcettoRole(role) === "portiere";

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <Link href="/dashboard" className="flex items-center gap-4">
  <RivaloLogo />
</Link>

          <Link
            href="/dashboard"
            className="inline-block rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-cyan-300 transition hover:bg-white/10"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        {(accountStatus === "deletion_requested" || deletionRequested) && (
          <div className="mb-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
            Profilo non attivo. Le modifiche sono bloccate e i dati pubblici verranno mostrati come “Profilo non attivo”.
          </div>
        )}

        <div className="grid min-w-0 gap-8 xl:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#071120] p-3 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,.18),transparent_30%)]" />

            <div className="relative z-10">
              <PlayerCard
                name={name || "Player"}
                nickname={nickname || "Rivalo Player"}
                rivalScore={rivalScore}
                mainSport={sport}
                photo={photoUrl}
                level={level}
                xp={xp}
                wins={wins}
                mvp={mvp}
                matchesPlayed={matchesPlayed}
                goals={goals}
                assists={assists}
                winStreak={winStreak}
                role={role}
                goalsConceded={goalsConceded}
                cleanSheets={cleanSheets}
                penaltiesSaved={penaltiesSaved}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-[#071120] p-5 sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <Field
                label="Nome"
                value={name}
                setValue={setName}
                placeholder="Antonio"
                disabled={
                  accountStatus === "deletion_requested" ||
                  deletionRequested ||
                  sportLockedByStats
                }
              />

              <Field
                label="Nickname"
                value={nickname}
                setValue={setNickname}
                placeholder="Tony10"
                disabled={accountStatus === "deletion_requested" || deletionRequested}
              />
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
                Sport principale
              </label>

              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                disabled={
                  accountStatus === "deletion_requested" ||
                  deletionRequested ||
                  sportLockedByStats
                }
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400 disabled:opacity-60"
              >
                <option value="calcetto">Calcetto</option>
                <option value="padel">Padel</option>
                <option value="tennis">Tennis</option>
              </select>

              {sportLockedByStats && (
                <div className="mt-3 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  Sport bloccato su {sportLabel(sport)} perché questo profilo ha già statistiche collegate.
                  Per usare un altro sport è necessario un profilo sportivo separato.
                </div>
              )}
            </div>
<div className="mt-5 grid gap-5 md:grid-cols-2">
  <Field
    label="Città / zona"
    disabled={accountStatus === "deletion_requested" || deletionRequested}
    value={city}
    setValue={setCity}
    placeholder="Es. Lecce"
  />

  {isCalcettoProfile ? (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
        Ruolo calcetto
      </label>

      <select
        value={normalizeCalcettoRole(role)}
        onChange={(e) => setRole(e.target.value)}
        disabled={accountStatus === "deletion_requested" || deletionRequested}
        className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400 disabled:opacity-60"
      >
        <option value="">Seleziona ruolo</option>
        <option value="portiere">Portiere</option>
        <option value="difensore">Difensore</option>
        <option value="centrocampista">Centrocampista</option>
        <option value="attaccante">Attaccante</option>
        <option value="jolly">Jolly</option>
      </select>

      {normalizeCalcettoRole(role) === "portiere" && (
        <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold leading-6 text-cyan-100">
          Card portiere attiva: i valori premiano riflessi, presa, piazzamento e clean sheet.
        </div>
      )}
    </div>
  ) : (
    <Field
      label="Ruolo o posizione"
      disabled={accountStatus === "deletion_requested" || deletionRequested}
      value={role}
      setValue={setRole}
      placeholder={getSportRolePlaceholder(sport)}
    />
  )}
</div>

<div className="mt-5 grid gap-5 md:grid-cols-2">
  <Field
    label="Stile di gioco"
    disabled={accountStatus === "deletion_requested" || deletionRequested}
    value={playStyle}
    setValue={setPlayStyle}
    placeholder={getSportStylePlaceholder(sport)}
  />

  <Field
    label="Disponibilità"
    disabled={accountStatus === "deletion_requested" || deletionRequested}
    value={availability}
    setValue={setAvailability}
    placeholder="Es. sera, weekend, 2 volte a settimana..."
  />
</div>
            {isGoalkeeper && (
              <div className="mt-7 rounded-[1.5rem] border border-lime-300/20 bg-lime-400/10 p-5 sm:p-6">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">
                  Focus portiere
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat label="Gol subiti" value={String(goalsConceded)} />
                  <MiniStat
                    label="Media GS"
                    value={
                      matchesPlayed > 0
                        ? (goalsConceded / matchesPlayed).toFixed(1)
                        : "0.0"
                    }
                  />
                  <MiniStat label="Clean sheet" value={String(cleanSheets)} />
                  <MiniStat label="Rigori parati" value={String(penaltiesSaved)} />
                </div>

                <p className="mt-4 text-sm font-bold leading-6 text-lime-100/90">
                  Il portiere non viene valutato sui gol segnati: RivalScore e card tengono conto di clean sheet, gol subiti, rigori parati, partite e risultati.
                </p>
              </div>
            )}

            <div className="mt-7 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Camera size={22} />
                </div>

                <div className="min-w-0">
                  <div className="font-black uppercase">
                    Foto profilo
                  </div>

                  <div className="text-sm leading-5 text-slate-400">
                    La foto viene usata nella card e nel profilo.
                  </div>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl border border-cyan-400/20 bg-black/25 px-5 py-4 text-center font-black text-cyan-200 transition hover:bg-cyan-400/10">
                Scegli foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={accountStatus === "deletion_requested" || deletionRequested}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>
            </div>

            <div className="mt-7">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Statistiche {sportLabel(sport)}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<Shield />}
                  label={normalizeSport(sport) === "calcetto" ? "RivalScore" : `${sportLabel(sport)} Score`}
                  value={String(rivalScore)}
                />

                <StatBox
                  icon={<Trophy />}
                  label="Vittorie"
                  value={String(wins)}
                />

                <StatBox
                  icon={<Star />}
                  label={isGoalkeeper ? "Clean sheet" : normalizeSport(sport) === "calcetto" ? "MVP" : "Streak"}
                  value={isGoalkeeper ? String(cleanSheets) : normalizeSport(sport) === "calcetto" ? String(mvp) : String(winStreak)}
                />

                {profileStats.map((stat) => (
                  <MiniStat
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                  />
                ))}
              </div>
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-200">
                {message}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={saving || accountStatus === "deletion_requested" || deletionRequested}
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-base font-black uppercase transition hover:scale-[1.02] disabled:opacity-60 sm:text-lg"
            >
              {saving ? "Salvataggio..." : "Salva profilo"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  value,
  setValue,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400 disabled:opacity-60"
        placeholder={placeholder}
      />
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-cyan-400/15 bg-cyan-400/[.045] p-3 text-center sm:p-4">
      <div className="mb-2 flex justify-center text-cyan-300 [&>svg]:h-5 [&>svg]:w-5">
        {icon}
      </div>

      <div className="truncate text-[22px] font-black leading-none text-white sm:text-3xl">
        {value}
      </div>

      <div className="mt-2 truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs">
        {label}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 p-3 text-center sm:p-4">
      <div className="truncate text-[22px] font-black leading-none text-cyan-200 sm:text-2xl">
        {value}
      </div>

      <div className="mt-2 truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-400 sm:text-xs sm:tracking-[0.12em]">
        {label}
      </div>
    </div>
  );
}