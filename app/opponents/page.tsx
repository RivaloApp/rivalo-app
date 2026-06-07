"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createNotification } from "../../lib/createNotification";
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type OpponentGroup = {
  id: string;
  name?: string;
  city?: string;
  sport?: string;
  activeSport?: string;
  creatorSport?: string;
  sportProfileId?: string;
  mode?: string;
  privacy?: string;
  members?: string[];
  premiumPlan?: string;
  ownerId?: string;
  admins?: string[];
};

type JoinRequest = {
  id: string;
  groupId?: string;
  fromUid?: string;
  status?: string;
};

type MatchmakingTab = "groups" | "matches" | "players" | "opponents";

type UserProfile = {
  activeSport?: string;
  mainSport?: string;
  sport?: string;
  name?: string;
  nickname?: string;
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

function getGroupSport(group?: OpponentGroup) {
  return normalizeSport(group?.activeSport || group?.sport || "calcetto");
}

function isProfileDeletionRequested(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

export default function OpponentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<OpponentGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [userSport, setUserSport] = useState("calcetto");
  const [accountLocked, setAccountLocked] = useState(false);

  const [sportFilter, setSportFilter] = useState("calcetto");
  const [cityFilter, setCityFilter] = useState("");
  const [message, setMessage] = useState("");
const [requestingGroupId, setRequestingGroupId] = useState("");
const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
const [activeTab, setActiveTab] = useState<MatchmakingTab>("groups");

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
        profile?.activeSport || profile?.mainSport || profile?.sport || "calcetto"
      );

      setUserSport(currentUserSport);
      setSportFilter(currentUserSport);
      setAccountLocked(isProfileDeletionRequested(profile));

      await loadPublicGroups(currentUserSport);
      await loadSentRequests(currentUser.uid);
    });

    return () => unsubscribe();
  }, []);

  async function loadPublicGroups(currentUserSport = userSport) {
    setLoading(true);

    try {
      const publicGroupsQuery = query(
        collection(db, "groups"),
        where("privacy", "==", "pubblico")
      );

      const snap = await getDocs(publicGroupsQuery);

      const result = snap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<OpponentGroup, "id">),
        }))
        .filter((group) => getGroupSport(group) === normalizeSport(currentUserSport));

      setGroups(result);
    } catch (error) {
      console.error(error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadSentRequests(uid: string) {
  try {
    const requestsQuery = query(
      collection(db, "groupJoinRequests"),
      where("fromUid", "==", uid),
      where("status", "==", "pending")
    );

    const snap = await getDocs(requestsQuery);

    const result = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<JoinRequest, "id">),
    }));

    setSentRequests(result);
  } catch (error) {
    console.error(error);
    setSentRequests([]);
  }
}

  async function requestJoinGroup(group: OpponentGroup) {
  if (!user) return;

  if (accountLocked) {
    setMessage("Profilo non attivo: richiesta ingresso bloccata.");
    return;
  }

  const lockedSport = normalizeSport(userSport);
  const groupSport = getGroupSport(group);

  if (groupSport !== lockedSport) {
    setMessage("Puoi richiedere ingresso solo nei gruppi del tuo sport attivo.");
    return;
  }

  const alreadyRequested = sentRequests.some(
  (request) => request.groupId === group.id
);

if (alreadyRequested) {
  setMessage("Hai già inviato una richiesta per questo gruppo.");
  return;
}

  setRequestingGroupId(group.id);
  setMessage("");

  try {
    const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
    const freshProfile = freshProfileSnap.exists()
      ? (freshProfileSnap.data() as UserProfile)
      : null;

    if (isProfileDeletionRequested(freshProfile)) {
      setAccountLocked(true);
      setMessage("Profilo non attivo: richiesta ingresso bloccata.");
      setRequestingGroupId("");
      return;
    }

    const freshProfileSport = normalizeSport(
      freshProfile?.activeSport ||
        freshProfile?.mainSport ||
        freshProfile?.sport ||
        lockedSport
    );

    if (freshProfileSport !== lockedSport || groupSport !== freshProfileSport) {
      setUserSport(freshProfileSport);
      setSportFilter(freshProfileSport);
      setMessage("Lo sport attivo del profilo è cambiato. Riprova con lo sport corretto.");
      setRequestingGroupId("");
      return;
    }

    const requesterName =
      freshProfile?.name ||
      freshProfile?.nickname ||
      user.displayName ||
      "Rivalo Player";

    const requestRef = await addDoc(collection(db, "groupJoinRequests"), {
      groupId: group.id,
      groupName: group.name || "Gruppo Rivalo",
      groupOwnerId: group.ownerId || "",
      fromUid: user.uid,
      fromName: requesterName,
      activeSport: freshProfileSport,
      requesterSport: freshProfileSport,
      sportProfileId: `${user.uid}_${freshProfileSport}`,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    const notifyUserIds = Array.from(
      new Set([group.ownerId || "", ...(group.admins || [])].filter(Boolean))
    ).filter((uid) => uid !== user.uid);

    await Promise.all(
      notifyUserIds.map((uid) =>
        createNotification({
          uid,
          type: "group_request",
          title: "Nuova richiesta ingresso gruppo",
          message: `${requesterName} vuole entrare nel gruppo ${group.name || "Rivalo"}.`,
          link: "/groups/" + group.id,
          createdBy: user.uid,
          metadata: {
            groupId: group.id,
            groupName: group.name || "Gruppo Rivalo",
            requestId: requestRef.id,
            fromUid: user.uid,
            fromName: requesterName,
            activeSport: freshProfileSport,
            requesterSport: freshProfileSport,
            sportProfileId: `${user.uid}_${freshProfileSport}`,
          },
        })
      )
    );

    setMessage("Richiesta inviata al gruppo.");
    await loadSentRequests(user.uid);
  } catch (error) {
    console.error(error);
    setMessage("Errore durante l'invio della richiesta.");
  } finally {
    setRequestingGroupId("");
  }
}
  const filteredGroups = useMemo(() => {
    const cleanCity = cityFilter.trim().toLowerCase();
    const lockedSport = normalizeSport(userSport);

    return groups.filter((group) => {
      const sportOk = getGroupSport(group) === lockedSport;

      const cityOk =
        !cleanCity || (group.city || "").toLowerCase().includes(cleanCity);

      const notMine = user ? !(group.members || []).includes(user.uid) : true;

      return sportOk && cityOk && notMine;
    });
  }, [groups, cityFilter, user, userSport]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-7xl min-w-0 px-3 py-8 sm:px-5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] p-5 shadow-2xl backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                <Search size={16} />
                Rivalo Matchmaking
              </div>

              <h1 className="mt-5 break-words text-4xl font-black tracking-tight md:text-6xl">
                Matchmaking
              </h1>

              <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                Trova gruppi, match, player e avversari compatibili con il tuo sport attivo.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Stat value={String(groups.length)} label="Gruppi" />
              <Stat value={String(filteredGroups.length)} label="Risultati" />
              <Stat value={sportLabel(userSport)} label="Sport attivo" />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
          <div className="grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                <MapPin size={16} />
                Città / zona
              </div>

              <input
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                placeholder="Es. Lecce, Milano, Roma..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
              <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                Sport attivo
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="font-black text-cyan-200">
                  {sportLabel(userSport)}
                </div>

                <span className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                  Bloccato
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] p-3 shadow-2xl backdrop-blur sm:p-4">
          <div className="grid min-w-0 grid-cols-2 gap-2 md:grid-cols-4">
            <TabButton
              active={activeTab === "groups"}
              onClick={() => setActiveTab("groups")}
              title="Gruppi"
              text="Community pubbliche"
            />

            <TabButton
              active={activeTab === "matches"}
              onClick={() => setActiveTab("matches")}
              title="Match"
              text="Partite amichevoli"
            />

            <TabButton
              active={activeTab === "players"}
              onClick={() => setActiveTab("players")}
              title="Player"
              text="Completa squadra"
            />

            <TabButton
              active={activeTab === "opponents"}
              onClick={() => setActiveTab("opponents")}
              title="Avversari"
              text="Sfida altra parte"
            />
          </div>
        </section>

        {accountLocked && (
          <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
            Profilo non attivo: puoi consultare i gruppi pubblici, ma non puoi inviare richieste.
          </div>
        )}

        {message && (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
            {message}
          </div>
        )}

        <section className="mt-8">
          {activeTab === "groups" ? (
            loading ? (
              <EmptyBox text="Caricamento gruppi..." />
            ) : filteredGroups.length === 0 ? (
              <EmptyBox text="Nessun gruppo pubblico trovato con questi filtri." />
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredGroups.map((group) => (
                  <OpponentCard
                    key={group.id}
                    group={group}
                    onRequestJoin={requestJoinGroup}
                    requesting={requestingGroupId === group.id}
                    alreadyRequested={sentRequests.some(
                      (request) => request.groupId === group.id
                    )}
                    accountLocked={accountLocked}
                  />
                ))}
              </div>
            )
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {activeTab === "matches" && (
                <>
                  <MatchmakingInfoCard
                    icon={<Trophy />}
                    title="Trova match"
                    text="Per player, coppie o squadre che vogliono giocare un'amichevole non classificata."
                    sport={sportLabel(userSport)}
                    level="Livello ricercato"
                  />

                  <MatchmakingInfoCard
                    icon={<MapPin />}
                    title="Zona e distanza"
                    text="La ricerca userà città, zona e raggio km per mostrare solo richieste compatibili."
                    sport={cityFilter || "La tua zona"}
                    level="Km"
                  />
                </>
              )}

              {activeTab === "players" && (
                <>
                  <MatchmakingInfoCard
                    icon={<Users />}
                    title="Trova player"
                    text="Per completare una squadra, una coppia padel/tennis o trovare un avversario singolo."
                    sport={sportLabel(userSport)}
                    level="Posti mancanti"
                  />

                  <MatchmakingInfoCard
                    icon={<ShieldCheck />}
                    title="Livello cercato"
                    text="Ogni annuncio potrà indicare il livello desiderato per evitare match troppo sbilanciati."
                    sport="Principiante → Competitivo"
                    level="Filtro livello"
                  />
                </>
              )}

              {activeTab === "opponents" && (
                <>
                  <MatchmakingInfoCard
                    icon={<Trophy />}
                    title="Trova avversari"
                    text="Per squadre o coppie già complete che cercano l'altra parte per una partita amichevole."
                    sport={sportLabel(userSport)}
                    level="Avversari"
                  />

                  <MatchmakingInfoCard
                    icon={<Search />}
                    title="Annunci compatibili"
                    text="Gli annunci saranno filtrati per sport attivo, zona, formato, disponibilità e livello."
                    sport="Matchmaking"
                    level="Prossimo step"
                  />
                </>
              )}

              <EmptyBox text="Questa sezione è pronta per gli annunci matchmaking reali nel prossimo step." />
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

function TabButton({
  active,
  onClick,
  title,
  text,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-w-0 rounded-2xl border px-3 py-4 text-left transition ${
        active
          ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100"
          : "border-white/10 bg-black/20 text-slate-300 hover:border-cyan-400/25 hover:bg-cyan-400/10"
      }`}
    >
      <div className="truncate text-sm font-black uppercase tracking-[0.12em]">
        {title}
      </div>

      <div className="mt-1 truncate text-xs font-bold text-slate-400">
        {text}
      </div>
    </button>
  );
}

function MatchmakingInfoCard({
  icon,
  title,
  text,
  sport,
  level,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  sport: string;
  level: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061126]/80 p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 text-cyan-200">
          {icon}
        </div>

        <span className="min-w-0 truncate rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
          {sport}
        </span>
      </div>

      <h2 className="break-words text-2xl font-black sm:text-3xl">
        {title}
      </h2>

      <p className="mt-3 break-words text-sm font-semibold leading-6 text-slate-300">
        {text}
      </p>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-slate-200">
        {level}
      </div>
    </div>
  );
}

function OpponentCard({
  group,
  onRequestJoin,
  requesting,
  alreadyRequested,
  accountLocked,
}: {
  group: OpponentGroup;
  onRequestJoin: (group: OpponentGroup) => void;
  requesting: boolean;
  alreadyRequested: boolean;
  accountLocked: boolean;
}) {

  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061126]/80 p-5 shadow-2xl transition hover:-translate-y-1 hover:border-cyan-400/30 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-cyan-200">
          {sportLabel(group.activeSport || group.sport)}
        </div>

        <div className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-slate-300">
          {group.privacy || "pubblico"}
        </div>
      </div>

      <h2 className="break-words text-2xl font-black sm:text-3xl">{group.name || "Gruppo Rivalo"}</h2>

      <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
        <MapPin size={17} className="text-fuchsia-300" />
        {group.city || "Città non inserita"}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-center">
        <Mini value={String(group.members?.length || 0)} label="Membri" />
        <Mini value={group.mode || "mode"} label="Modalità" />
        <Mini value={group.premiumPlan || "free"} label="Piano" />
      </div>

      <div className="mt-5 grid gap-3">
        <Link
          href={`/groups/${group.id}`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 font-black text-cyan-200"
        >
          Apri gruppo
          <ChevronRight size={18} />
        </Link>
        <button
  type="button"
  onClick={() => onRequestJoin(group)}
 disabled={requesting || alreadyRequested || accountLocked}
  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black text-white disabled:opacity-60"
>
 {accountLocked
  ? "Richiesta bloccata"
  : alreadyRequested
  ? "Richiesta già inviata"
  : requesting
  ? "Invio richiesta..."
  : "Richiedi ingresso"}
</button>
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.04] p-4 text-center sm:p-5">
      <div className="truncate text-2xl font-black text-cyan-300">{value}</div>
      <div className="mt-2 truncate text-[10px] font-black uppercase tracking-[.12em] text-slate-400 sm:text-xs sm:tracking-[.18em]">
        {label}
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <div className="truncate text-sm font-black">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.03] p-6 text-slate-400">
      {text}
    </div>
  );
}