"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { Camera, Shield, Star, Trophy } from "lucide-react";
import RivaloLogo from "../../components/RivaloLogo";
import PlayerCard from "../../components/cards/PlayerCard";

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          const data = snap.data();

          setName(data.name || currentUser.displayName || "");
          setNickname(data.nickname || "Rival Player");
          setSport(data.mainSport || "calcetto");
          setCity(data.city || "");
setRole(data.role || "");
setPlayStyle(data.playStyle || "");
setAvailability(data.availability || "");

          setPhotoUrl(
            localStorage.getItem("rivaloProfilePhoto") ||
              data.photoUrl ||
              data.photoURL ||
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
        } else {
          setName(currentUser.displayName || "");
          setNickname("Rival Player");
          setSport("calcetto");
          setCity("");
setRole("");
setPlayStyle("");
setAvailability("");
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
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  async function uploadPhoto(file: File) {
    if (!file) return;

    setSaving(true);
    setMessage("");

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result === "string") {
        setPhotoUrl(result);
        localStorage.setItem("rivaloProfilePhoto", result);
        setMessage("Foto caricata. Ora premi Salva profilo.");
      } else {
        setMessage("Errore caricamento foto.");
      }

      setSaving(false);
    };

    reader.onerror = () => {
      setMessage("Errore caricamento foto.");
      setSaving(false);
    };

    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    try {
      setSaving(true);

      if (!user) return;

      await setDoc(
  doc(db, "users", user.uid),
  {
    name,
    nickname,
    mainSport: sport,
    city,
    role,
    playStyle,
    availability,
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
      setMessage("Errore salvataggio.");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento...
      </main>
    );
  }

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

        <div className="grid min-w-0 gap-8 xl:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#071120] p-3 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.22),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(249,115,22,.18),transparent_30%)]" />

            <div className="relative z-10">
              <PlayerCard
                name={name || "Player"}
                nickname={nickname || "Rival Player"}
                rivalScore={rivalScore}
                mainSport={sport}
                photo={photoUrl}
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
              />

              <Field
                label="Nickname"
                value={nickname}
                setValue={setNickname}
                placeholder="Tony10"
              />
            </div>

            <div className="mt-6">
              <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
                Sport principale
              </label>

              <select
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
              >
                <option value="calcetto">Calcetto</option>
                <option value="padel">Padel</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>
<div className="mt-5 grid gap-5 md:grid-cols-2">
  <Field
    label="Città / zona"
    value={city}
    setValue={setCity}
    placeholder="Es. Lecce"
  />

  <Field
    label="Ruolo o posizione"
    value={role}
    setValue={setRole}
    placeholder="Es. Attaccante, difensore, destro..."
  />
</div>

<div className="mt-5 grid gap-5 md:grid-cols-2">
  <Field
    label="Stile di gioco"
    value={playStyle}
    setValue={setPlayStyle}
    placeholder="Es. tecnico, veloce, competitivo..."
  />

  <Field
    label="Disponibilità"
    value={availability}
    setValue={setAvailability}
    placeholder="Es. sera, weekend, 2 volte a settimana..."
  />
</div>
            <div className="mt-7 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-300">
                  <Camera size={22} />
                </div>

                <div className="min-w-0">
                  <div className="font-black uppercase">
                    Carica foto card
                  </div>

                  <div className="text-sm leading-5 text-slate-400">
                    La dashboard si aggiorna automaticamente.
                  </div>
                </div>
              </div>

              <label className="mt-5 flex cursor-pointer items-center justify-center rounded-2xl border border-cyan-400/20 bg-black/25 px-5 py-4 text-center font-black text-cyan-200 transition hover:bg-cyan-400/10">
                Scegli nuova foto
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto(file);
                  }}
                />
              </label>
            </div>

            <div className="mt-7">
              <div className="mb-4 text-xs font-black uppercase tracking-[0.28em] text-cyan-300">
                Statistiche Rivalo
              </div>

              <div className="grid grid-cols-3 gap-3">
                <StatBox
                  icon={<Shield />}
                  label="Rival Score"
                  value={String(rivalScore)}
                />

                <StatBox
                  icon={<Trophy />}
                  label="Vittorie"
                  value={String(wins)}
                />

                <StatBox
                  icon={<Star />}
                  label="MVP"
                  value={String(mvp)}
                />

                <MiniStat label="Livello" value={String(level)} />
                <MiniStat label="Partite" value={String(matchesPlayed)} />
                <MiniStat label="Gol" value={String(goals)} />
                <MiniStat label="Assist" value={String(assists)} />
                <MiniStat label="Sconfitte" value={String(losses)} />
                <MiniStat label="XP" value={String(xp)} />
                <MiniStat label="Serie vitt." value={String(winStreak)} />
                <MiniStat label="Miglior serie" value={String(bestStreak)} />
              </div>
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-200">
                {message}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
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
}: {
  label: string;
  value: string;
  setValue: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full min-w-0 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
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