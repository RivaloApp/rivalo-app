"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  ChevronRight,
  Lock,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Trophy,
} from "lucide-react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";

type UserProfile = {
  name?: string;
  nickname?: string;
  mainSport?: string;
  sport?: string;
  city?: string;
  rivalScore?: number;
  level?: number;
  xp?: number;
  matchesPlayed?: number;
  wins?: number;
  losses?: number;
  mvp?: number;
  photoURL?: string;
  photoUrl?: string;
  deletionRequested?: boolean;
  deletionRequestedAt?: any;
};

function normalizeSport(value?: string) {
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

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [requestingDeletion, setRequestingDeletion] = useState(false);

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
          setProfile(snap.data() as UserProfile);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName =
    profile?.name || profile?.nickname || user?.displayName || "Rivalo Player";

  const sport = profile?.mainSport || profile?.sport || "calcetto";
  const city = profile?.city || "Non impostata";
  const email = user?.email || "Email non disponibile";
  const rivalScore = profile?.rivalScore ?? 1000;
  const level = profile?.level ?? 1;
  const matchesPlayed = profile?.matchesPlayed ?? 0;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const mvp = profile?.mvp ?? 0;

  async function requestAccountDeletion() {
    if (!user) return;

    if (deleteConfirmText.trim().toUpperCase() !== "ELIMINA") {
      setMessage("Per confermare devi scrivere ELIMINA nel campo dedicato.");
      return;
    }

    setRequestingDeletion(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        deletionRequested: true,
        deletionRequestedAt: serverTimestamp(),
        deletionRequestedBy: user.uid,
        accountStatus: "deletion_requested",
        updatedAt: serverTimestamp(),
      });

      setProfile((current) => ({
        ...(current || {}),
        deletionRequested: true,
      }));

      setDeleteConfirmText("");
      setMessage(
        "Richiesta di eliminazione registrata. Il profilo è segnato per rimozione sicura."
      );
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la richiesta di eliminazione account.");
    } finally {
      setRequestingDeletion(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        Caricamento impostazioni...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.14),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <header className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] p-7 shadow-2xl backdrop-blur sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                <Settings size={16} />
                Impostazioni
              </div>

              <h1 className="mt-5 text-4xl font-black uppercase tracking-tight sm:text-5xl">
                Account Rivalo
              </h1>

              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                Gestisci profilo, sport, privacy, notifiche e sicurezza account.
              </p>
            </div>

            <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-6 py-4">
              <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                Profilo attivo
              </div>

              <div className="mt-1 text-2xl font-black text-cyan-100">
                {sportLabel(sport)}
              </div>
            </div>
          </div>
        </header>

        {message && (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm font-bold text-cyan-100">
            {message}
          </div>
        )}

        <section className="mt-7 grid gap-6 lg:grid-cols-[1fr_.9fr]">
          <div className="space-y-6">
            <SettingsCard
              icon={<UserRound />}
              title="Profilo"
              text="Dati principali collegati alla tua card Rivalo."
            >
              <InfoRow label="Nome" value={displayName} />
              <InfoRow label="Email" value={email} />
              <InfoRow label="Città" value={city} />

              <Link
                href="/profile"
                className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Apri profilo
                <ChevronRight size={18} />
              </Link>
            </SettingsCard>

            <SettingsCard
              icon={<Trophy />}
              title="Sport e statistiche"
              text="Lo sport attivo protegge statistiche, ranking, eventi e match."
            >
              <InfoRow label="Sport principale" value={sportLabel(sport)} />
              <InfoRow label="RivalScore" value={String(rivalScore)} />
              <InfoRow label="Livello" value={String(level)} />
              <InfoRow label="Partite" value={String(matchesPlayed)} />

              <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                Le statistiche restano separate per sport, così ranking e card
                rimangono coerenti con il profilo attivo.
              </div>
            </SettingsCard>

            <SettingsCard
              icon={<Bell />}
              title="Notifiche"
              text="Inviti, risultati, gruppi, tornei e aggiornamenti."
            >
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200 transition hover:bg-cyan-400/20"
              >
                Apri notifiche
                <ChevronRight size={18} />
              </Link>
            </SettingsCard>
          </div>

          <div className="space-y-6">
            <SettingsCard
              icon={<ShieldCheck />}
              title="Privacy"
              text="Controlli base sul profilo e sui contenuti visibili."
            >
              <InfoRow label="Profilo pubblico" value="In preparazione" />
              <InfoRow label="Ranking globale" value="Attivo" />
              <InfoRow label="Eventi pubblici" value="Filtrati per sport/zona" />
            </SettingsCard>

            <SettingsCard
              icon={<Lock />}
              title="Sicurezza account"
              text="Accesso, email e protezione dell’account Rivalo."
            >
              <InfoRow label="Email account" value={email} />
              <InfoRow label="Provider" value="Firebase Auth" />
              <InfoRow label="Sessione" value="Attiva" />
            </SettingsCard>

            <SettingsCard
              icon={<Trash2 />}
              title="Rimuovi profilo/account"
              text="Richiedi la rimozione sicura del tuo profilo Rivalo."
              danger
            >
              {profile?.deletionRequested ? (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  Richiesta di eliminazione già registrata. Il profilo è segnato
                  per rimozione sicura.
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <AlertTriangle size={18} />
                      Azione delicata
                    </div>

                    Questa richiesta non cancella automaticamente match, eventi
                    o statistiche storiche già collegate. Serve a segnare il profilo
                    per una rimozione sicura senza rompere classifiche e dati esistenti.
                  </div>

                  <label className="mt-4 block">
                    <span className="mb-2 block text-sm font-black text-slate-300">
                      Scrivi ELIMINA per confermare
                    </span>

                    <input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="ELIMINA"
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-black text-white outline-none placeholder:text-slate-500"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={requestAccountDeletion}
                    disabled={
                      requestingDeletion ||
                      deleteConfirmText.trim().toUpperCase() !== "ELIMINA"
                    }
                    className="mt-5 w-full rounded-2xl border border-red-300/30 bg-red-500/10 px-5 py-4 font-black text-red-100 transition hover:bg-red-500/20 disabled:opacity-60"
                  >
                    {requestingDeletion
                      ? "Registrazione richiesta..."
                      : "Richiedi eliminazione profilo"}
                  </button>
                </>
              )}
            </SettingsCard>
          </div>
        </section>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <MiniStat label="Vittorie" value={wins} />
          <MiniStat label="Sconfitte" value={losses} />
          <MiniStat label="MVP" value={mvp} />
        </section>
      </section>
    </main>
  );
}

function SettingsCard({
  icon,
  title,
  text,
  children,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={`rounded-[2rem] border p-6 shadow-2xl backdrop-blur ${
        danger
          ? "border-red-400/20 bg-red-500/[.055]"
          : "border-white/10 bg-white/[.045]"
      }`}
    >
      <div className="mb-5 flex items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            danger
              ? "border-red-400/20 bg-red-500/10 text-red-200"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          }`}
        >
          {icon}
        </div>

        <div>
          <h2 className="text-2xl font-black">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>

      <div className="space-y-3">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <span className="min-w-0 truncate text-right font-black text-white">
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.045] p-5 text-center">
      <div className="text-4xl font-black text-cyan-200">{value}</div>
      <div className="mt-2 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
    </div>
  );
}
