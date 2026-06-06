"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
  import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  Crown,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type RivaloGroup = {
  id: string;
  name: string;
  city: string;
  sport: string;
  mode: string;
  privacy: string;
  members?: string[];
  rankingEnabled?: boolean;
  fairPlayEnabled?: boolean;
  premiumPlan?: string;
};

type UserProfile = {
  mainSport?: string;
  sport?: string;
  city?: string;
  cityZone?: string;
  zone?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
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

function isProfileDeletionRequested(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function getAccountLockedMessage() {
  return "Profilo non attivo: puoi consultare i gruppi, ma non puoi crearne di nuovi.";
}

export default function GroupsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [userCity, setUserCity] = useState("");
  const [groups, setGroups] = useState<RivaloGroup[]>([]);
  const [groupName, setGroupName] = useState("");
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [mode, setMode] = useState("amichevole");
  const [privacy, setPrivacy] = useState("privato");
  const [saving, setSaving] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const profile = profileSnap.exists()
        ? (profileSnap.data() as UserProfile)
        : null;

      const currentUserSport = normalizeSport(
        profile?.mainSport || profile?.sport || "calcetto"
      );

      const currentUserCity =
        profile?.city || profile?.cityZone || profile?.zone || "";

      setUserSport(currentUserSport);
      setUserCity(currentUserCity);
      setAccountLocked(isProfileDeletionRequested(profile));
      setSport(currentUserSport);
      setCity(currentUserCity);

      await loadGroups(currentUser.uid, currentUserSport);
    });

    return () => unsubscribe();
  }, []);

  async function loadGroups(uid: string, currentUserSport = userSport) {
    setLoadingGroups(true);

    try {
      const q = query(collection(db, "groups"), where("members", "array-contains", uid));
      const snap = await getDocs(q);

      const list = snap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<RivaloGroup, "id">),
        }))
        .filter(
          (group) =>
            !group.sport || normalizeSport(group.sport) === normalizeSport(currentUserSport)
        );

      setGroups(list);
    } catch {
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: creazione gruppo bloccata.");
      return;
    }

    const lockedSport = normalizeSport(userSport);

    if (sport !== lockedSport) {
      setSport(lockedSport);
    }

    setSaving(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: creazione gruppo bloccata.");
        setSaving(false);
        return;
      }

      await addDoc(collection(db, "groups"), {
        name: groupName,
        city,
        sport: userSport,
        mode,
        privacy,
        ownerId: user.uid,
        members: [user.uid],
        admins: [user.uid],
        createdAt: serverTimestamp(),
        rankingEnabled: true,
        fairPlayEnabled: true,
        seasonActive: false,
        premiumPlan: "free",
      });

      setGroupName("");
      setCity(userCity);
      setSport(userSport);
      setMode("amichevole");
      setPrivacy("privato");
      setMessage("Gruppo creato e salvato.");

      await loadGroups(user.uid, userSport);
    } catch {
      setMessage("Errore durante la creazione del gruppo.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-5 sm:py-8">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-cyan-300">
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-6 grid gap-6 lg:mt-8 lg:grid-cols-[1fr_.9fr]">
          <div>
            <div className="text-xs font-black uppercase tracking-[.28em] text-cyan-300 sm:text-sm sm:tracking-[.3em]">
              Rivalo Groups
            </div>

            <h1 className="mt-3 text-[42px] font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
              Crea il tuo gruppo competitivo.
            </h1>

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:mt-5 sm:text-lg sm:leading-8">
              Il gruppo è la base di Rivalo: da qui partono partite, ranking,
              campionati, eventi, conferme risultati e classifiche singoli/squadre.
            </p>

            <div className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 sm:gap-4">
              <Feature icon={<Trophy />} title="Classifiche" text="Squadre e singoli per ogni gruppo." />
              <Feature icon={<ShieldCheck />} title="FairPlay" text="Risultati ufficiali solo dopo conferma." />
              <Feature icon={<CalendarDays />} title="Campionati" text="Season da 3 mesi con premi." />
              <Feature icon={<Crown />} title="Premium" text="Badge, coppe, eventi e boost futuri." />
            </div>
          </div>

          <form onSubmit={createGroup} className="rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <Users className="text-cyan-300" size={30} />
              <div>
                <h2 className="text-[28px] font-black leading-tight sm:text-2xl">Nuovo gruppo</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  Crea la tua community Rivalo per {sportLabel(userSport)}.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {accountLocked && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  {getAccountLockedMessage()}
                </div>
              )}

              <fieldset disabled={accountLocked || saving} className="space-y-4 disabled:opacity-60">
              <Field label="Nome gruppo">
                <input
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Esempio: Solo Serie A"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <Field label="Città">
                <div className="flex items-center gap-3">
                  <MapPin className="text-cyan-300" size={20} />
                  <input
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Milano, Lecce, Roma..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </div>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sport profilo">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-black text-cyan-200">
                      {sportLabel(userSport)}
                    </div>

                    <span className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                      Bloccato
                    </span>
                  </div>

                  <div className="mt-2 text-xs leading-5 text-slate-400">
                    Per creare gruppi in un altro sport servirà un profilo sport separato.
                  </div>
                </Field>

                <Select label="Modalità" value={mode} setValue={setMode}>
                  <option value="amichevole">Amichevole</option>
                  <option value="campionato">Campionato</option>
                  <option value="torneo">Torneo</option>
                </Select>
              </div>

              <Select label="Privacy gruppo" value={privacy} setValue={setPrivacy}>
                <option value="privato">Privato</option>
                <option value="pubblico">Pubblico</option>
                <option value="su-invito">Solo su invito</option>
              </Select>

              <button
                type="submit"
                disabled={saving || accountLocked}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black shadow-[0_0_30px_rgba(34,211,238,.18)] disabled:opacity-60"
              >
                {accountLocked ? "Creazione bloccata" : saving ? "Creazione..." : "Crea gruppo Rivalo"}
                <ChevronRight className="transition group-hover:translate-x-1" />
              </button>
              </fieldset>

              {message && (
                <div className="rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 text-sm font-bold text-slate-200">
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.045] p-4 shadow-2xl backdrop-blur sm:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[.28em] text-cyan-300">
                I tuoi gruppi
              </div>
              <h2 className="mt-2 text-[34px] font-black leading-tight sm:text-3xl">
                Community attive · {sportLabel(userSport)}
              </h2>
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-black text-cyan-200">
              {groups.length} gruppi
            </div>
          </div>

          {loadingGroups ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#020617]/60 p-5 text-slate-300">
              Caricamento gruppi...
            </div>
          ) : groups.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-[#020617]/60 p-5 text-slate-300">
              Non hai ancora gruppi per {sportLabel(userSport)}. Creane uno per iniziare a usare ranking, partite e campionati.
            </div>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-8 rounded-[2rem] border border-fuchsia-400/25 bg-fuchsia-500/[.06] p-5 sm:p-6">
          <div className="text-sm font-black uppercase tracking-[.28em] text-fuchsia-300">
            Monetizzazione futura
          </div>
          <h2 className="mt-3 text-[32px] font-black leading-tight sm:text-3xl">Gruppi premium e campionati con premi</h2>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Da qui potremo aggiungere quote evento, coppe, badge premium, tornei sponsorizzati,
            campi affiliati e pacchetti per centri sportivi.
          </p>
        </div>
      </section>
    </main>
  );
}

function GroupCard({ group }: { group: RivaloGroup }) {
  const membersCount = String(group.members?.length || 1);
  const modeLabel =
    group.mode === "campionato"
      ? "Campionato"
      : group.mode === "torneo"
      ? "Torneo"
      : "Amichevole";

  const planLabel = group.premiumPlan || "Free";

  return (
    <div className="relative overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#061126]/80 p-4 transition hover:-translate-y-1 hover:border-cyan-400/30 sm:rounded-[1.8rem] sm:p-5">
      <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-cyan-400/10 blur-2xl" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0 truncate rounded-full border border-cyan-300/25 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[.16em] text-cyan-200">
            {group.sport}
          </div>

          <div className="shrink-0 rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-slate-300">
            {group.privacy}
          </div>
        </div>

        <h3 className="break-words text-[28px] font-black leading-tight sm:text-2xl">
          {group.name}
        </h3>

        <div className="mt-3 flex min-w-0 items-center gap-2 text-base font-semibold text-slate-300">
          <MapPin size={17} className="shrink-0 text-fuchsia-300" />
          <span className="min-w-0 truncate">{group.city}</span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 text-center sm:gap-3">
          <Mini value={membersCount} label="Membri" />
          <Mini value={modeLabel} label="Modalità" />
          <Mini value={planLabel} label="Piano" />
        </div>

        <Link
          href={`/groups/${group.id}`}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200"
        >
          Apri gruppo
          <ChevronRight size={18} />
        </Link>
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[.04] px-2 py-3 sm:p-3">
      <div className="truncate text-[13px] font-black leading-tight sm:text-sm">
        {value}
      </div>

      <div className="mt-1 truncate text-[9px] font-black uppercase tracking-[.12em] text-slate-500 sm:text-[10px] sm:tracking-[.16em]">
        {label}
      </div>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
      <div className="absolute right-[-250px] top-[130px] h-[650px] w-[650px] rounded-full border border-cyan-400/10" />
      <div className="absolute left-[-150px] bottom-[-140px] h-[360px] w-[360px] rounded-full bg-fuchsia-500/10 blur-3xl" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-3 text-base sm:py-4">
        {children}
      </div>
    </label>
  );
}

function Select({
  label,
  value,
  setValue,
  children,
}: {
  label: string;
  value: string;
  setValue: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-3 font-bold outline-none sm:py-4"
      >
        {children}
      </select>
    </label>
  );
}

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-4 backdrop-blur sm:rounded-[1.7rem] sm:p-5">
      <div className="text-cyan-300">{icon}</div>
      <h3 className="mt-4 text-xl font-black leading-tight">{title}</h3>
      <p className="mt-2 text-base leading-7 text-slate-300">{text}</p>
    </div>
  );
}
