"use client";

import { useState } from "react";
import Link from "next/link";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ChevronRight, LockKeyhole, Mail, Trophy } from "lucide-react";

type Sport = "calcetto" | "padel" | "tennis";

function normalizeSport(value?: string): Sport {
  const sport = (value || "").toLowerCase().trim();

  if (sport === "padel") return "padel";
  if (sport === "tennis") return "tennis";

  return "calcetto";
}

function sportDescription(value: Sport) {
  if (value === "padel") {
    return "Profilo padel: ranking su vittorie, win rate, streak e costanza.";
  }

  if (value === "tennis") {
    return "Profilo tennis: ranking su vittorie, win rate, livello e costanza.";
  }

  return "Profilo calcetto: ranking su vittorie, MVP, gol, assist e RivalScore.";
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [sport, setSport] = useState<Sport>("calcetto");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const lockedSport = normalizeSport(sport);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const createdUser = userCredential.user;

      const defaultName = cleanEmail.split("@")[0] || "Player";

      await setDoc(
        doc(db, "users", createdUser.uid),
        {
          uid: createdUser.uid,
          email: cleanEmail,
          emailVerified: false,

          name: defaultName,
          nickname: "Rivalo Player",
          mainSport: lockedSport,
          sport: lockedSport,

          photoUrl: "",
          photoURL: "",

          rivalScore: 1000,
          level: 1,
          xp: 100,

          wins: 0,
          losses: 0,
          draws: 0,
          matchesPlayed: 0,

          goals: 0,
          assists: 0,
          mvp: 0,
          winStreak: 0,
          bestStreak: 0,

          onboardingCompleted: false,
          profileCompleted: false,

          accountStatus: "active",
          deletionRequested: false,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await sendEmailVerification(createdUser);

      await signOut(auth);

      setSuccess(
        "Account creato. Ti abbiamo inviato un'email di verifica. Conferma l'email prima di accedere."
      );

      setEmail("");
      setPassword("");
      setSport("calcetto");
    } catch (err: any) {
      console.error(err);

      if (err?.code === "auth/email-already-in-use") {
        setError("Questa email è già registrata.");
      } else if (err?.code === "auth/weak-password") {
        setError("La password deve contenere almeno 6 caratteri.");
      } else if (err?.code === "auth/invalid-email") {
        setError("Inserisci un indirizzo email valido.");
      } else {
        setError("Errore durante la registrazione. Riprova.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_35%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-white/[.04] p-8 shadow-2xl backdrop-blur">
          <Link
            href="/"
            className="mb-8 inline-block text-sm font-bold text-cyan-300"
          >
            ← Torna alla home
          </Link>

          <h1 className="text-4xl font-black">
            Registrazione Rivalo
          </h1>

          <p className="mt-3 text-slate-300">
            Crea il tuo account e scegli lo sport principale. Le statistiche resteranno separate per sport.
          </p>

          <form onSubmit={handleSignup} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                Email
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                <Mail className="text-cyan-300" size={20} />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  placeholder="nome@email.com"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                Password
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                <LockKeyhole className="text-cyan-300" size={20} />

                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  placeholder="Minimo 6 caratteri"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-300">
                Sport principale
              </span>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                <Trophy className="text-cyan-300" size={20} />

                <select
                  value={sport}
                  onChange={(e) => setSport(normalizeSport(e.target.value))}
                  className="w-full bg-[#020617] text-white outline-none"
                >
                  <option className="bg-[#020617] text-white" value="calcetto">
                    Calcetto
                  </option>
                  <option className="bg-[#020617] text-white" value="padel">
                    Padel
                  </option>
                  <option className="bg-[#020617] text-white" value="tennis">
                    Tennis
                  </option>
                </select>
              </div>

              <div className="mt-3 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold leading-6 text-cyan-100">
                {sportDescription(sport)}
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] disabled:opacity-60"
            >
              {loading ? "Creazione..." : "Crea account"}
              <ChevronRight className="transition group-hover:translate-x-1" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-400">
            Hai già un account?{" "}
            <Link href="/login" className="font-black text-cyan-300">
              Accedi
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
