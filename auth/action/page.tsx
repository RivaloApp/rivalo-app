"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from "firebase/auth";
import { auth } from "../../../lib/firebase";
import { CheckCircle2, LockKeyhole, Mail, ShieldAlert } from "lucide-react";

type ActionMode = "verifyEmail" | "resetPassword" | string | null;

export default function AuthActionPage() {
  const [mode, setMode] = useState<ActionMode>(null);
  const [oobCode, setOobCode] = useState("");
  const [email, setEmail] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function run() {
      try {
        const params = new URLSearchParams(window.location.search);

        const currentMode = params.get("mode");
        const currentCode = params.get("oobCode") || "";

        setMode(currentMode);
        setOobCode(currentCode);

        if (!currentCode) {
          setStatus("error");
          setMessage("Link non valido o incompleto.");
          return;
        }

        if (currentMode === "verifyEmail") {
          await applyActionCode(auth, currentCode);

          setStatus("success");
          setMessage("Email verificata con successo. Ora puoi accedere a Rivalo.");
          return;
        }

        if (currentMode === "resetPassword") {
          const verifiedEmail = await verifyPasswordResetCode(auth, currentCode);

          setEmail(verifiedEmail);
          setStatus("idle");
          setMessage("Inserisci una nuova password per completare il reset.");
          return;
        }

        setStatus("error");
        setMessage("Azione non riconosciuta.");
      } catch (error) {
        console.error(error);
        setStatus("error");
        setMessage("Link scaduto o non valido. Richiedi un nuovo link da Rivalo.");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, []);

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();

    if (!oobCode) return;

    setMessage("");

    if (newPassword.length < 6) {
      setStatus("error");
      setMessage("La password deve contenere almeno 6 caratteri.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus("error");
      setMessage("Le password non coincidono.");
      return;
    }

    setSaving(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      setStatus("success");
      setMessage("Password aggiornata con successo. Ora puoi accedere.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("Non sono riuscito ad aggiornare la password. Richiedi un nuovo link.");
    } finally {
      setSaving(false);
    }
  }

  const title =
    mode === "resetPassword"
      ? "Reimposta password"
      : mode === "verifyEmail"
      ? "Verifica email"
      : "Azione account";

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(217,70,239,.18),transparent_35%),linear-gradient(180deg,#020617_0%,#030712_52%,#020617_100%)]" />

      <section className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10">
        <div className="w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.045] shadow-2xl backdrop-blur">
          <div className="border-b border-white/10 bg-gradient-to-br from-cyan-500/10 via-blue-600/10 to-fuchsia-600/10 p-8">
            <Link href="/" className="inline-flex">
              <RivaloLogo />
            </Link>

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                <Mail size={15} />
                Rivalo Account
              </div>

              <h1 className="mt-5 text-4xl font-black">
                {title}
              </h1>

              <p className="mt-3 leading-7 text-slate-300">
                Completa l’azione in modo sicuro e torna nella tua dashboard Rivalo.
              </p>
            </div>
          </div>

          <div className="p-8">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-300">
                Controllo link in corso...
              </div>
            ) : mode === "resetPassword" && status !== "success" ? (
              <form onSubmit={handleResetPassword} className="space-y-5">
                {email && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm text-cyan-100">
                    Account: <span className="font-black">{email}</span>
                  </div>
                )}

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Nuova password
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                    <LockKeyhole className="text-cyan-300" size={20} />

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-transparent outline-none placeholder:text-slate-500"
                      placeholder="Minimo 6 caratteri"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-300">
                    Conferma password
                  </span>

                  <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
                    <LockKeyhole className="text-cyan-300" size={20} />

                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-transparent outline-none placeholder:text-slate-500"
                      placeholder="Ripeti la password"
                    />
                  </div>
                </label>

                {message && (
                  <StatusBox status={status} message={message} />
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] transition hover:scale-[1.01] disabled:opacity-60"
                >
                  {saving ? "Aggiornamento..." : "Aggiorna password"}
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <StatusBox status={status} message={message} />

                <Link
                  href="/login"
                  className="block rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 text-center font-black text-white shadow-[0_0_30px_rgba(34,211,238,.2)] transition hover:scale-[1.01]"
                >
                  Vai al login
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusBox({
  status,
  message,
}: {
  status: "idle" | "success" | "error";
  message: string;
}) {
  const isSuccess = status === "success";
  const isError = status === "error";

  return (
    <div
      className={`rounded-2xl border p-5 ${
        isSuccess
          ? "border-green-400/30 bg-green-500/10 text-green-100"
          : isError
          ? "border-red-400/30 bg-red-500/10 text-red-100"
          : "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
      }`}
    >
      <div className="flex items-start gap-3">
        {isSuccess ? (
          <CheckCircle2 className="mt-0.5 shrink-0 text-green-300" />
        ) : isError ? (
          <ShieldAlert className="mt-0.5 shrink-0 text-red-300" />
        ) : (
          <Mail className="mt-0.5 shrink-0 text-cyan-300" />
        )}

        <div className="font-bold leading-7">
          {message}
        </div>
      </div>
    </div>
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
            <linearGradient id="actionLogoEdge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="52%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>

            <filter
              id="actionSoftGlow"
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
            filter="url(#actionSoftGlow)"
          />

          <path
            d="M49 36 H67 C75 36 80 40 80 47 C80 54 75 58 67 58 H49 Z"
            fill="#020617"
          />

          <path
            d="M21 100 L49 76 H61 L29 114 Z"
            fill="url(#actionLogoEdge)"
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