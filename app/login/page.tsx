"use client";

import { useState } from "react";
import Link from "next/link";
import {
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ChevronRight, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const loggedUser = userCredential.user;
if (!loggedUser.emailVerified) {
  await sendEmailVerification(loggedUser);
  await signOut(auth);

  setError(
    "Email non verificata. Ti abbiamo inviato un nuovo link di verifica. Controlla la posta, anche nello spam."
  );

  return;
}

      await setDoc(
        doc(db, "users", loggedUser.uid),
        {
          email: loggedUser.email || email.trim(),
          emailVerified: true,
          lastLoginAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
      setError("Email o password non corretti.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordReset() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Inserisci prima la tua email nel campo email.");
      return;
    }

    setResetLoading(true);

    try {
      await sendPasswordResetEmail(auth, email.trim());

      setMessage(
        "Email per reimpostare la password inviata. Controlla la tua casella di posta."
      );
    } catch (err) {
      console.error(err);
      setError("Non sono riuscito a inviare l'email di recupero password.");
    } finally {
      setResetLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_35%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5 py-10">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur lg:grid-cols-2">
          <div className="hidden bg-gradient-to-br from-cyan-500/20 via-blue-600/10 to-fuchsia-600/20 p-10 lg:block">
            <Link href="/" className="inline-flex">
              <RivaloLogo />
            </Link>

            <div className="mt-20">
              <div className="text-5xl font-black leading-tight">
                Entra nella tua arena competitiva.
              </div>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Accedi al tuo profilo, controlla ranking, partite, gruppi e
                progressi.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <Link
              href="/"
              className="mb-10 inline-block text-sm font-bold text-cyan-300"
            >
              ← Torna alla home
            </Link>

            <h1 className="text-4xl font-black">Accedi</h1>

            <p className="mt-3 text-slate-300">
              Continua con il tuo account Rivalo.
            </p>

            <form onSubmit={handleLogin} className="mt-10 space-y-5">
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                    placeholder="••••••••"
                  />
                </div>
              </label>

              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="text-sm font-black text-cyan-300 transition hover:text-cyan-200 disabled:opacity-60"
              >
                {resetLoading ? "Invio email..." : "Password dimenticata?"}
              </button>

              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-sm font-bold text-green-200">
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] disabled:opacity-60"
              >
                {loading ? "Accesso..." : "Entra in Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Non hai un account?{" "}
              <Link href="/signup" className="font-black text-cyan-300">
                Registrati
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function RivaloLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />

        <svg
          viewBox="0 0 120 120"
          className="relative h-full w-full"
          aria-label="Rivalo logo"
        >
          <defs>
            <linearGradient id="loginLogoEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter
              id="loginSoftGlow"
              x="-40%"
              y="-40%"
              width="180%"
              height="180%"
            >
              <feDropShadow
                dx="-3"
                dy="2"
                stdDeviation="4"
                floodColor="#22d3ee"
                floodOpacity=".65"
              />
              <feDropShadow
                dx="4"
                dy="4"
                stdDeviation="5"
                floodColor="#d946ef"
                floodOpacity=".5"
              />
            </filter>
          </defs>

          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
            filter="url(#loginSoftGlow)"
          />

          <path
            d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
            fill="#020617"
          />

          <path
            d="M21 100 L49 76 H61 L29 114 Z"
            fill="url(#loginLogoEdge)"
          />

          <path
            d="M73 78 L105 100 H76 L58 78 Z"
            fill="#d946ef"
            opacity=".55"
          />
        </svg>
      </div>

      <div>
        <div className="text-3xl font-black tracking-tight text-white">
          Rivalo
        </div>

        <div className="mt-1 text-xs font-black tracking-[.32em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}