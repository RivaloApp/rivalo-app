"use client";

import { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ChevronRight, LockKeyhole, Mail, UserRound } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });

      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        name,
        nickname,
        email,
        mainSport: sport,
        role: "Player",
        rivalScore: 50,
        level: 1,
        xp: 0,
        wins: 0,
        losses: 0,
        mvp: 0,
        createdAt: serverTimestamp(),
      });

      window.location.href = "/dashboard";
    } catch {
      setError("Registrazione non riuscita. Controlla email e password.");
    } finally {
      setLoading(false);
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
                Crea la tua identità sportiva.
              </div>
              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Il tuo profilo sarà la base per ranking, gruppi, partite e tornei.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <Link href="/" className="mb-8 inline-block text-sm font-bold text-cyan-300">
              ← Torna alla home
            </Link>

            <h1 className="text-4xl font-black">Crea account</h1>
            <p className="mt-3 text-slate-300">Entra nella beta di Rivalo.</p>

            <form onSubmit={handleSignup} className="mt-8 space-y-4">
              <Input icon={<UserRound size={20} />} label="Nome" value={name} setValue={setName} placeholder="Antonio" />
              <Input icon={<UserRound size={20} />} label="Nickname" value={nickname} setValue={setNickname} placeholder="Tony10" />
              <Input icon={<Mail size={20} />} label="Email" value={email} setValue={setEmail} placeholder="nome@email.com" type="email" />
              <Input icon={<LockKeyhole size={20} />} label="Password" value={password} setValue={setPassword} placeholder="Minimo 6 caratteri" type="password" />

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Sport principale</span>
                <select
                  value={sport}
                  onChange={(e) => setSport(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4 font-bold outline-none"
                >
                  <option value="calcetto">Calcetto</option>
                  <option value="padel">Padel</option>
                  <option value="tennis">Tennis</option>
                </select>
              </label>

              {error && (
                <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] disabled:opacity-60"
              >
                {loading ? "Creazione..." : "Crea profilo Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-400">
              Hai già un account?{" "}
              <Link href="/login" className="font-black text-cyan-300">
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function Input({
  icon,
  label,
  value,
  setValue,
  placeholder,
  type = "text",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  setValue: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-300">{label}</span>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
        <span className="text-cyan-300">{icon}</span>
        <input
          type={type}
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full bg-transparent outline-none placeholder:text-slate-500"
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}

function RivaloLogo() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-16 w-16 shrink-0">
        <div className="absolute inset-0 rounded-2xl bg-cyan-400/25 blur-xl" />

        <svg viewBox="0 0 120 120" className="relative h-full w-full" aria-label="Rivalo logo">
          <defs>
            <linearGradient id="signupLogoEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter id="signupSoftGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="-3" dy="2" stdDeviation="4" floodColor="#22d3ee" floodOpacity=".65" />
              <feDropShadow dx="4" dy="4" stdDeviation="5" floodColor="#d946ef" floodOpacity=".5" />
            </filter>
          </defs>

          <path
            d="M20 100 L20 13 H71 C93 13 106 27 106 46 C106 61 97 72 83 77 L105 100 H74 L56 76 H49 L49 100 Z"
            fill="white"
            filter="url(#signupSoftGlow)"
          />

          <path d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z" fill="#020617" />
          <path d="M21 100 L49 76 H61 L29 114 Z" fill="url(#signupLogoEdge)" />
          <path d="M73 78 L105 100 H76 L58 78 Z" fill="#d946ef" opacity=".55" />
        </svg>
      </div>

      <div>
        <div className="text-3xl font-black tracking-tight text-white">Rivalo</div>
        <div className="mt-1 text-xs font-black tracking-[.32em] text-cyan-300">
          OWN THE GAME
        </div>
      </div>
    </div>
  );
}
