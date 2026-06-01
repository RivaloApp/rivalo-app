"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, serverTimestamp, setDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import { createNotification } from "../../lib/createNotification";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  UserRound,
} from "lucide-react";

type Sport = "calcetto" | "padel" | "tennis";

export default function OnboardingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [mainSport, setMainSport] = useState<Sport>("calcetto");
  const [city, setCity] = useState("");
  const [role, setRole] = useState("");
  const [playStyle, setPlayStyle] = useState("");
  const [availability, setAvailability] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

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

          if (data.onboardingCompleted) {
            window.location.href = "/dashboard";
            return;
          }

          setName(data.name || currentUser.displayName || "");
          setNickname(data.nickname || "");
          setMainSport(data.mainSport || "calcetto");
          setCity(data.city || "");
          setRole(data.role || "");
          setPlayStyle(data.playStyle || "");
          setAvailability(data.availability || "");
          setPhotoUrl(data.photoUrl || data.photoURL || currentUser.photoURL || "");
        } else {
          setName(currentUser.displayName || "");
          setPhotoUrl(currentUser.photoURL || "");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  function calculateBonus() {
    let bonus = 0;

    if (name.trim()) bonus += 25;
    if (nickname.trim()) bonus += 25;
    if (mainSport) bonus += 25;
    if (city.trim()) bonus += 25;
    if (role.trim()) bonus += 25;
    if (playStyle.trim()) bonus += 25;
    if (availability.trim()) bonus += 25;
    if (photoUrl.trim()) bonus += 25;

    return Math.min(bonus, 200);
  }

  async function completeProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (!name.trim()) {
      setMessage("Inserisci il tuo nome.");
      return;
    }

    if (!nickname.trim()) {
      setMessage("Inserisci un nickname.");
      return;
    }

    if (!city.trim()) {
      setMessage("Inserisci città o zona.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      const oldData = snap.exists() ? snap.data() : {};
      const oldXp = Number(oldData.xp || 0);
      const oldRivalScore = Number(oldData.rivalScore || 1000);
      const alreadyClaimedBonus = Boolean(oldData.profileBonusClaimed);

      const profileBonusXp = alreadyClaimedBonus ? 0 : calculateBonus();
      const nextXp = oldXp + profileBonusXp;
      const nextLevel = Math.floor(nextXp / 1000) + 1;

      await setDoc(
        userRef,
        {
          uid: user.uid,
          email: user.email || "",

          name: name.trim(),
          nickname: nickname.trim(),
          mainSport,
          city: city.trim(),
          role: role.trim(),
          playStyle: playStyle.trim(),
          availability: availability.trim(),
          photoUrl: photoUrl.trim(),

          rivalScore: oldRivalScore,
          xp: nextXp,
          level: nextLevel,

          wins: Number(oldData.wins || 0),
          losses: Number(oldData.losses || 0),
          draws: Number(oldData.draws || 0),
          matchesPlayed: Number(oldData.matchesPlayed || 0),
          goals: Number(oldData.goals || 0),
          assists: Number(oldData.assists || 0),
          mvp: Number(oldData.mvp || 0),

          onboardingCompleted: true,
          profileCompleted: true,
          profileBonusClaimed: true,
          profileBonusXp,

          updatedAt: serverTimestamp(),
          createdAt: oldData.createdAt || Timestamp.now(),
        },
        { merge: true }
      );

      await createNotification({
        uid: user.uid,
        type: "profile_completed",
        title: "Profilo completato",
        message:
          "La tua card Rivalo è pronta. Ora puoi iniziare a giocare, entrare nei gruppi e scalare il ranking.",
        link: "/dashboard",
        createdBy: user.uid,
        metadata: {
          profileBonusXp,
          mainSport,
          city: city.trim(),
        },
      });

      window.location.href = "/dashboard";
    } catch (error) {
      console.error(error);
      setMessage("Errore durante il salvataggio del profilo.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Preparazione profilo...
      </main>
    );
  }

  const bonus = calculateBonus();

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_35%)]" />

      <section className="relative z-10 mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                  <ShieldCheck size={16} />
                  Primo accesso Rivalo
                </div>

                <h1 className="mt-5 text-5xl font-black uppercase">
                  Crea profilo
                </h1>

                <p className="mt-3 max-w-2xl text-slate-300">
                  Completa i dati base per attivare card, ranking, match e statistiche.
                </p>
              </div>

              <div className="rounded-[2rem] border border-yellow-300/20 bg-yellow-400/10 p-5 text-center">
                <Trophy className="mx-auto text-yellow-300" />
                <div className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-yellow-200">
                  Bonus profilo
                </div>
                <div className="mt-1 text-4xl font-black text-yellow-100">
                  +{bonus} XP
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={completeProfile} className="grid gap-6 p-8 lg:grid-cols-[1fr_320px]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Es. Antonio"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                <Field label="Nickname">
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Es. Tony"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Sport principale">
                  <select
                    value={mainSport}
                    onChange={(e) => setMainSport(e.target.value as Sport)}
                    className="w-full bg-transparent outline-none"
                  >
                    <option className="bg-[#020617]" value="calcetto">
                      Calcetto
                    </option>
                    <option className="bg-[#020617]" value="padel">
                      Padel
                    </option>
                    <option className="bg-[#020617]" value="tennis">
                      Tennis
                    </option>
                  </select>
                </Field>

                <Field label="Città / zona">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Es. Lecce"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Ruolo o posizione">
                  <input
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Es. Attaccante, difensore, giocatore destro..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                <Field label="Stile di gioco">
                  <input
                    value={playStyle}
                    onChange={(e) => setPlayStyle(e.target.value)}
                    placeholder="Es. competitivo, tecnico, veloce..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>
              </div>

              <Field label="Disponibilità">
                <input
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Es. sera, weekend, 2 volte a settimana..."
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <Field label="Foto profilo URL opzionale">
                <input
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Incolla URL immagine, oppure lascia vuoto"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              {message && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {saving ? "Salvataggio..." : "Completa profilo"}
                <ArrowRight className="transition group-hover:translate-x-1" />
              </button>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-black/20 p-6">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-cyan-400/20 bg-cyan-400/10">
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt="Profilo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-12 w-12 text-cyan-200" />
                )}
              </div>

              <div className="mt-5 text-2xl font-black">
                {name || "Player"}
              </div>

              <div className="mt-1 text-cyan-300">
                {nickname || "Rivalo Player"}
              </div>

              <div className="mt-5 space-y-3">
                <CheckItem active={Boolean(name.trim())} text="Nome inserito" />
                <CheckItem active={Boolean(nickname.trim())} text="Nickname inserito" />
                <CheckItem active={Boolean(mainSport)} text="Sport selezionato" />
                <CheckItem active={Boolean(city.trim())} text="Zona inserita" />
                <CheckItem active={Boolean(role.trim())} text="Ruolo inserito" />
                <CheckItem active={Boolean(playStyle.trim())} text="Stile inserito" />
                <CheckItem active={Boolean(availability.trim())} text="Disponibilità inserita" />
                <CheckItem active={Boolean(photoUrl.trim())} text="Foto opzionale" />
              </div>
            </aside>
          </form>
        </div>
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

function CheckItem({ active, text }: { active: boolean; text: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
        active
          ? "border-lime-400/20 bg-lime-400/10 text-lime-200"
          : "border-white/10 bg-white/[.03] text-slate-400"
      }`}
    >
      <CheckCircle2 size={18} />
      {text}
    </div>
  );
}