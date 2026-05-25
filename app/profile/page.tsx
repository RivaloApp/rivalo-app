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
          photoUrl,
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
    <main className="min-h-screen bg-[#020617] px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-4">
            <RivaloLogo />
          </Link>

          <Link
            href="/dashboard"
            className="inline-block rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-cyan-300 transition hover:bg-white/10"
          >
            ← Torna alla dashboard
          </Link>
        </div>

        <div className="grid gap-8 xl:grid-cols-[360px_1fr]">
          <div className="relative overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-[#071120] p-6">
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

          <div className="rounded-[2rem] border border-white/10 bg-[#071120] p-8">
            <div className="grid gap-6 md:grid-cols-2">
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
                className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
              >
                <option value="calcetto">Calcetto</option>
                <option value="padel">Padel</option>
                <option value="tennis">Tennis</option>
              </select>
            </div>

            <div className="mt-8 rounded-[1.5rem] border border-cyan-400/20 bg-cyan-400/5 p-6">
              <div className="flex items-center gap-3">
                <Camera className="text-cyan-300" />

                <div>
                  <div className="font-black uppercase">
                    Carica foto card
                  </div>

                  <div className="text-sm text-slate-400">
                    La dashboard si aggiorna automaticamente.
                  </div>
                </div>
              </div>

              <input
                type="file"
                accept="image/*"
                className="mt-5 block w-full rounded-2xl border border-white/10 bg-black/20 p-4"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadPhoto(file);
                }}
              />
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
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
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <MiniStat label="Livello" value={String(level)} />
              <MiniStat label="Partite" value={String(matchesPlayed)} />
              <MiniStat label="Gol" value={String(goals)} />
              <MiniStat label="Assist" value={String(assists)} />
              <MiniStat label="Sconfitte" value={String(losses)} />
              <MiniStat label="XP" value={String(xp)} />
              <MiniStat label="Serie vittorie" value={String(winStreak)} />
              <MiniStat label="Miglior serie" value={String(bestStreak)} />
            </div>

            {message && (
              <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-cyan-200">
                {message}
              </div>
            )}

            <button
              onClick={saveProfile}
              disabled={saving}
              className="mt-8 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-8 py-4 text-lg font-black uppercase transition hover:scale-[1.02] disabled:opacity-60"
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
    <div>
      <label className="mb-2 block text-sm font-bold uppercase text-slate-400">
        {label}
      </label>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 outline-none transition focus:border-cyan-400"
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
    <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-center">
      <div className="mb-3 flex justify-center text-cyan-300">
        {icon}
      </div>

      <div className="text-3xl font-black text-white">
        {value}
      </div>

      <div className="mt-1 text-sm font-bold uppercase text-slate-400">
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
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
      <div className="text-2xl font-black text-cyan-200">
        {value}
      </div>

      <div className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
    </div>
  );
}