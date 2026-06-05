"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  ChevronRight,
  Lock,
  Save,
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
  accountStatus?: string;
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

function isDeletionActive(profile?: UserProfile | null) {
  return Boolean(
    profile?.deletionRequested ||
      profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted"
  );
}

function formatDeletionDate(value: any) {
  if (!value) return "";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [requestingDeletion, setRequestingDeletion] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileNickname, setProfileNickname] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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
          const data = snap.data() as UserProfile;

          setProfile(data);
          setProfileName(data.name || "");
          setProfileNickname(data.nickname || "");
        }
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName =
    profile?.name || profile?.nickname || user?.displayName || "Rivalo Player";

  const cleanProfileName = profileName.trim();
  const cleanProfileNickname = profileNickname.trim();

  const profileEditDirty =
    cleanProfileName !== (profile?.name || "").trim() ||
    cleanProfileNickname !== (profile?.nickname || "").trim();

  const sport = profile?.mainSport || profile?.sport || "calcetto";
  const city = profile?.city || "Non impostata";
  const email = user?.email || "Email non disponibile";
  const rivalScore = profile?.rivalScore ?? 1000;
  const level = profile?.level ?? 1;
  const matchesPlayed = profile?.matchesPlayed ?? 0;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const mvp = profile?.mvp ?? 0;
  const deletionActive = isDeletionActive(profile);
  const deletionDate = formatDeletionDate(profile?.deletionRequestedAt);

  async function saveProfileIdentity() {
    if (!user || deletionActive) return;

    const nextName = cleanProfileName;
    const nextNickname = cleanProfileNickname;

    if (nextName.length < 2) {
      setMessage("Inserisci un nome di almeno 2 caratteri.");
      return;
    }

    if (nextNickname.length < 2) {
      setMessage("Inserisci un nickname di almeno 2 caratteri.");
      return;
    }

    setSavingProfile(true);
    setMessage("");

    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: nextName,
        nickname: nextNickname,
        updatedAt: serverTimestamp(),
      });

      setProfile((current) => ({
        ...(current || {}),
        name: nextName,
        nickname: nextNickname,
      }));

      setMessage("Profilo aggiornato.");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante il salvataggio del profilo.");
    } finally {
      setSavingProfile(false);
    }
  }

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
        actionLockedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setProfile((current) => ({
        ...(current || {}),
        deletionRequested: true,
        accountStatus: "deletion_requested",
        deletionRequestedAt: new Date(),
      }));

      setDeleteConfirmText("");
      setMessage(
        "Richiesta registrata. Il profilo è ora in stato non attivo."
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
    <main className="min-h-screen overflow-x-hidden bg-[#020617] px-3 py-8 text-white sm:px-5">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.14),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl min-w-0 overflow-hidden">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <header className="mt-8 min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur sm:rounded-[2.5rem] sm:p-9">
          <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-cyan-200">
                <Settings size={16} />
                Impostazioni
              </div>

              <h1 className="mt-5 break-words text-3xl font-black uppercase tracking-tight sm:text-5xl">
                Account Rivalo
              </h1>

              <p className="mt-4 max-w-3xl break-words leading-7 text-slate-300">
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

        {deletionActive && (
          <div className="mt-6 rounded-[2rem] border border-yellow-300/20 bg-yellow-400/10 p-5 text-yellow-100">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 shrink-0" size={22} />

              <div>
                <div className="text-lg font-black">
                  Richiesta eliminazione attiva
                </div>

                <p className="mt-2 text-sm font-bold leading-6">
                  Il profilo non può più creare o modificare match, eventi e gruppi.
                  {deletionDate ? ` Richiesta registrata il ${deletionDate}.` : ""}
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mt-7 grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,.9fr)]">
          <div className="min-w-0 space-y-6">
            <SettingsCard
              icon={<UserRound />}
              title="Profilo"
              text="Dati principali collegati alla tua card Rivalo."
            >
              <EditableField
                label="Nome"
                value={profileName}
                placeholder="Il tuo nome"
                disabled={deletionActive || savingProfile}
                onChange={setProfileName}
              />

              <EditableField
                label="Nickname"
                value={profileNickname}
                placeholder="Nickname Rivalo"
                disabled={deletionActive || savingProfile}
                onChange={setProfileNickname}
              />

              <InfoRow label="Email" value={email} />
              <InfoRow label="Città" value={city} />
              <InfoRow
                label="Stato profilo"
                value={deletionActive ? "Profilo non attivo" : "Attivo"}
              />

              {deletionActive ? (
                <div className="mt-5 rounded-2xl border border-slate-400/20 bg-slate-400/10 px-5 py-3 text-sm font-bold text-slate-200">
                  Le modifiche del profilo sono bloccate.
                </div>
              ) : (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={saveProfileIdentity}
                    disabled={
                      savingProfile ||
                      !profileEditDirty ||
                      cleanProfileName.length < 2 ||
                      cleanProfileNickname.length < 2
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200 transition hover:bg-cyan-400/20 disabled:opacity-60"
                  >
                    <Save size={18} />
                    {savingProfile ? "Salvataggio..." : "Salva modifiche"}
                  </button>

                  <Link
                    href="/profile"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] px-5 py-3 font-black text-slate-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
                  >
                    Apri profilo
                    <ChevronRight size={18} />
                  </Link>
                </div>
              )}
            </SettingsCard>

            <SettingsCard
              icon={<Trophy />}
              title="Sport e statistiche"
              text="Statistiche e ranking restano ordinati in base allo sport scelto."
            >
              <InfoRow label="Sport principale" value={sportLabel(sport)} />
              <InfoRow label="RivalScore" value={String(rivalScore)} />
              <InfoRow label="Livello" value={String(level)} />
              <InfoRow label="Partite" value={String(matchesPlayed)} />

              <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm leading-6 text-yellow-100">
                Il profilo sportivo mantiene card, ranking e statistiche sempre coerenti.
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

          <div className="min-w-0 space-y-6">
            <SettingsCard
              icon={<ShieldCheck />}
              title="Privacy"
              text="Controlli base sul profilo e sui contenuti visibili."
            >
              <InfoRow
                label="Profilo pubblico"
                value={deletionActive ? "Nascosto" : "Visibile"}
              />
              <InfoRow label="Ranking globale" value="Visibile" />
              <InfoRow label="Eventi pubblici" value="Disponibili" />
            </SettingsCard>

            <SettingsCard
              icon={<Lock />}
              title="Sicurezza account"
              text="Accesso, email e protezione dell’account Rivalo."
            >
              <InfoRow label="Email account" value={email} />
              <InfoRow label="Accesso" value="Email e password" />
              <InfoRow
                label="Sessione"
                value={deletionActive ? "Limitata" : "Attiva"}
              />
            </SettingsCard>

            <SettingsCard
              icon={<Trash2 />}
              title="Rimuovi profilo/account"
              text="Richiedi la rimozione sicura del tuo profilo Rivalo."
              danger
            >
              {deletionActive ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                    Richiesta già registrata. Il profilo è ora non attivo per nuove operazioni.
                  </div>

                  <InfoRow label="Stato account" value="Rimozione richiesta" />
                  <InfoRow
                    label="Azioni operative"
                    value="Bloccate"
                  />
                  <InfoRow
                    label="Storico sportivo"
                    value="Protetto"
                  />

                  <Link
                    href="/dashboard"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 font-black text-cyan-200 transition hover:bg-cyan-400/20"
                  >
                    Torna alla dashboard
                    <ChevronRight size={18} />
                  </Link>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm leading-6 text-red-100">
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <AlertTriangle size={18} />
                      Azione delicata
                    </div>

                    Dopo la richiesta, il profilo non potrà più creare o modificare
                    match, eventi e gruppi. Il tuo storico sportivo resterà protetto.
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
      className={`min-w-0 overflow-hidden rounded-[2rem] border p-5 shadow-2xl backdrop-blur sm:p-6 ${
        danger
          ? "border-red-400/20 bg-red-500/[.055]"
          : "border-white/10 bg-white/[.045]"
      }`}
    >
      <div className="mb-5 flex min-w-0 items-start gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border ${
            danger
              ? "border-red-400/20 bg-red-500/10 text-red-200"
              : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"
          }`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="break-words text-2xl font-black">{title}</h2>
          <p className="mt-1 break-words text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>

      <div className="min-w-0 space-y-3">{children}</div>
    </section>
  );
}

function EditableField({
  label,
  value,
  placeholder,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="mb-2 block break-words text-sm font-bold text-slate-400">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={32}
        className="w-full bg-transparent font-black text-white outline-none placeholder:text-slate-600 disabled:opacity-60"
      />
    </label>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="break-words text-sm font-bold text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-left font-black text-white sm:text-right">
        {value}
      </span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.045] p-5 text-center">
      <div className="break-words text-4xl font-black text-cyan-200">{value}</div>
      <div className="mt-2 break-words text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </div>
    </div>
  );
}
