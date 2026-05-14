"use client";

import { useState } from "react";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { ChevronRight, LockKeyhole, Mail } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "/dashboard";
    } catch {
      setError("Email o password non corretti.");
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
            <Link href="/" className="inline-flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-300/40 bg-white/10 text-5xl font-black italic shadow-[0_0_35px_rgba(34,211,238,.25)]">R</div>
              <div>
                <div className="text-3xl font-black">Rivalo</div>
                <div className="text-xs font-black tracking-[.32em] text-cyan-300">OWN THE GAME</div>
              </div>
            </Link>

            <div className="mt-20">
              <div className="text-5xl font-black leading-tight">Entra nella tua arena competitiva.</div>
              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                Accedi al tuo profilo, controlla ranking, partite, gruppi e progressi.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12">
            <Link href="/" className="mb-10 inline-block text-sm font-bold text-cyan-300">← Torna alla home</Link>

            <h1 className="text-4xl font-black">Accedi</h1>
            <p className="mt-3 text-slate-300">Continua con il tuo account Rivalo.</p>

            <form onSubmit={handleLogin} className="mt-10 space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Email</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                  <Mail className="text-cyan-300" size={20} />
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder="nome@email.com" />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-300">Password</span>
                <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                  <LockKeyhole className="text-cyan-300" size={20} />
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent outline-none placeholder:text-slate-500" placeholder="••••••••" />
                </div>
              </label>

              {error && <div className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200">{error}</div>}

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] disabled:opacity-60">
                {loading ? "Accesso..." : "Entra in Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-400">
              Non hai un account? <Link href="/signup" className="font-black text-cyan-300">Registrati</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
