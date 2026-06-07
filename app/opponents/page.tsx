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
type MatchmakingRequestType = "match" | "player" | "opponent";

type MatchmakingRequest = {
  id: string;
  type?: MatchmakingRequestType;
  activeSport?: string;
  creatorSport?: string;
  sportProfileId?: string;
  city?: string;
  zone?: string;
  radiusKm?: number;
  levelWanted?: string;
  format?: string;
  missingPlayers?: number;
  date?: string;
  time?: string;
  notes?: string;
  status?: string;
  createdBy?: string;
  createdByName?: string;
};

type UserProfile = {
  uid?: string;
  activeSport?: string;
  mainSport?: string;
  sport?: string;
  city?: string;
  level?: number;
  skillLevel?: string;
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

function getRequestTypeFromTab(tab: MatchmakingTab): MatchmakingRequestType {
  if (tab === "players") return "player";
  if (tab === "opponents") return "opponent";
  return "match";
}

function getRequestTitle(type?: MatchmakingRequestType) {
  if (type === "player") return "Trova player";
  if (type === "opponent") return "Trova avversari";
  return "Trova match";
}

function getRequestActionLabel(type?: MatchmakingRequestType) {
  if (type === "player") return "Crea annuncio player";
  if (type === "opponent") return "Crea annuncio avversari";
  return "Crea annuncio match";
}

const TIME_OPTIONS = [
  "08:00",
  "08:30",
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
  "22:30",
  "23:00",
];

const LEVEL_ORDER = [
  "principiante",
  "amatoriale",
  "intermedio",
  "avanzato",
  "competitivo",
];

function normalizeLevel(value?: string) {
  const level = (value || "").toLowerCase().trim();

  if (level.includes("princip")) return "principiante";
  if (level.includes("amat")) return "amatoriale";
  if (level.includes("inter")) return "intermedio";
  if (level.includes("avanz")) return "avanzato";
  if (level.includes("compet")) return "competitivo";
  return "qualsiasi";
}

function getProfileLevel(profile?: UserProfile) {
  const explicitLevel = normalizeLevel(profile?.skillLevel);

  if (explicitLevel !== "qualsiasi") return explicitLevel;

  const numericLevel = Number(profile?.level || 1);

  if (numericLevel >= 20) return "competitivo";
  if (numericLevel >= 12) return "avanzato";
  if (numericLevel >= 6) return "intermedio";
  if (numericLevel >= 2) return "amatoriale";
  return "principiante";
}

function isLevelCompatible(profile?: UserProfile, wantedLevel?: string) {
  const wanted = normalizeLevel(wantedLevel);

  if (!wanted || wanted === "qualsiasi") return true;

  const profileLevel = getProfileLevel(profile);
  const wantedIndex = LEVEL_ORDER.indexOf(wanted);
  const profileIndex = LEVEL_ORDER.indexOf(profileLevel);

  if (wantedIndex < 0 || profileIndex < 0) return true;

  return Math.abs(profileIndex - wantedIndex) <= 1;
}

function isCityCompatible(profileCity?: string, requestCity?: string) {
  const cleanProfileCity = (profileCity || "").toLowerCase().trim();
  const cleanRequestCity = (requestCity || "").toLowerCase().trim();

  if (!cleanRequestCity) return true;
  if (!cleanProfileCity) return false;

  return (
    cleanProfileCity.includes(cleanRequestCity) ||
    cleanRequestCity.includes(cleanProfileCity)
  );
}

async function notifyCompatibleMatchmakingUsers({
  creatorUid,
  creatorName,
  requestId,
  requestType,
  sport,
  city,
  zone,
  levelWanted,
}: {
  creatorUid: string;
  creatorName: string;
  requestId: string;
  requestType: MatchmakingRequestType;
  sport: string;
  city: string;
  zone: string;
  levelWanted: string;
}) {
  try {
    const usersSnap = await getDocs(collection(db, "users"));

    const compatibleUsers = usersSnap.docs
      .map((userDoc) => ({
        uid: userDoc.id,
        ...(userDoc.data() as UserProfile),
      }))
      .filter((profile) => {
        if (!profile.uid || profile.uid === creatorUid) return false;
        if (isProfileDeletionRequested(profile)) return false;

        const profileSport = normalizeSport(
          profile.activeSport || profile.mainSport || profile.sport || "calcetto"
        );

        return (
          profileSport === sport &&
          isCityCompatible(profile.city, city) &&
          isLevelCompatible(profile, levelWanted)
        );
      })
      .slice(0, 20);

    await Promise.all(
      compatibleUsers.map((profile) =>
        createNotification({
          uid: profile.uid || "",
          type: "generic",
          title: "Nuovo annuncio matchmaking",
          message: `${creatorName} ha pubblicato: ${getRequestTitle(requestType)}${city ? ` · ${city}` : ""}${zone ? ` · ${zone}` : ""}.`,
          link: "/opponents",
          createdBy: creatorUid,
          metadata: {
            requestId,
            requestType,
            activeSport: sport,
            city,
            zone,
            levelWanted,
          },
        })
      )
    );
  } catch (error) {
    console.error(error);
  }
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

const [matchmakingRequests, setMatchmakingRequests] = useState<MatchmakingRequest[]>([]);
const [loadingRequests, setLoadingRequests] = useState(false);
const [savingRequest, setSavingRequest] = useState(false);
const [zone, setZone] = useState("");
const [radiusKm, setRadiusKm] = useState("10");
const [levelWanted, setLevelWanted] = useState("qualsiasi");
const [format, setFormat] = useState("amichevole");
const [missingPlayers, setMissingPlayers] = useState("1");
const [requestDate, setRequestDate] = useState("");
const [requestTime, setRequestTime] = useState("");
const [notes, setNotes] = useState("");

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
      await loadMatchmakingRequests(currentUserSport);
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

  async function loadMatchmakingRequests(currentUserSport = userSport) {
    setLoadingRequests(true);

    try {
      const requestsQuery = query(
        collection(db, "matchmakingRequests"),
        where("activeSport", "==", normalizeSport(currentUserSport))
      );

      const snap = await getDocs(requestsQuery);

      const result = snap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<MatchmakingRequest, "id">),
        }))
        .filter((request) => (request.status || "open") === "open");

      setMatchmakingRequests(result);
    } catch (error) {
      console.error(error);
      setMatchmakingRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  }

  async function createMatchmakingRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!user) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: annuncio matchmaking bloccato.");
      return;
    }

    if (activeTab === "groups") return;

    const lockedSport = normalizeSport(userSport);
    const requestType = getRequestTypeFromTab(activeTab);

    setSavingRequest(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: annuncio matchmaking bloccato.");
        setSavingRequest(false);
        return;
      }

      const freshProfileSport = normalizeSport(
        freshProfile?.activeSport ||
          freshProfile?.mainSport ||
          freshProfile?.sport ||
          lockedSport
      );

      if (freshProfileSport !== lockedSport) {
        setUserSport(freshProfileSport);
        setSportFilter(freshProfileSport);
        setMessage("Lo sport attivo del profilo è cambiato. Riprova con lo sport corretto.");
        setSavingRequest(false);
        return;
      }

      const creatorName =
        freshProfile?.name ||
        freshProfile?.nickname ||
        user.displayName ||
        "Rivalo Player";

      const cleanCity = cityFilter.trim();
      const cleanZone = zone.trim();

      const requestRef = await addDoc(collection(db, "matchmakingRequests"), {
        type: requestType,
        activeSport: freshProfileSport,
        creatorSport: freshProfileSport,
        sportProfileId: `${user.uid}_${freshProfileSport}`,
        city: cleanCity,
        zone: cleanZone,
        radiusKm: Number(radiusKm || 0),
        levelWanted,
        format,
        missingPlayers: Number(missingPlayers || 0),
        date: requestDate,
        time: requestTime,
        notes: notes.trim(),
        status: "open",
        createdBy: user.uid,
        createdByName: creatorName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await notifyCompatibleMatchmakingUsers({
        creatorUid: user.uid,
        creatorName,
        requestId: requestRef.id,
        requestType,
        sport: freshProfileSport,
        city: cleanCity,
        zone: cleanZone,
        levelWanted,
      });

      setZone("");
      setRadiusKm("10");
      setLevelWanted("qualsiasi");
      setFormat("amichevole");
      setMissingPlayers("1");
      setRequestDate("");
      setRequestTime("");
      setNotes("");

      setMessage("Annuncio matchmaking creato.");
      await loadMatchmakingRequests(freshProfileSport);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione dell'annuncio.");
    } finally {
      setSavingRequest(false);
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

  const filteredMatchmakingRequests = useMemo(() => {
    const cleanCity = cityFilter.trim().toLowerCase();
    const requestType = getRequestTypeFromTab(activeTab);

    return matchmakingRequests.filter((request) => {
      const typeOk = request.type === requestType;
      const cityOk =
        !cleanCity || (request.city || "").toLowerCase().includes(cleanCity);

      return typeOk && cityOk;
    });
  }, [matchmakingRequests, activeTab, cityFilter]);

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
            <div className="space-y-5">
              <MatchmakingRequestForm
                activeTab={activeTab}
                userSport={userSport}
                cityFilter={cityFilter}
                zone={zone}
                radiusKm={radiusKm}
                levelWanted={levelWanted}
                format={format}
                missingPlayers={missingPlayers}
                requestDate={requestDate}
                requestTime={requestTime}
                notes={notes}
                saving={savingRequest}
                accountLocked={accountLocked}
                onZoneChange={setZone}
                onRadiusKmChange={setRadiusKm}
                onLevelWantedChange={setLevelWanted}
                onFormatChange={setFormat}
                onMissingPlayersChange={setMissingPlayers}
                onRequestDateChange={setRequestDate}
                onRequestTimeChange={setRequestTime}
                onNotesChange={setNotes}
                onSubmit={createMatchmakingRequest}
              />

              {loadingRequests ? (
                <EmptyBox text="Caricamento annunci matchmaking..." />
              ) : filteredMatchmakingRequests.length === 0 ? (
                <EmptyBox text="Nessun annuncio matchmaking trovato con questi filtri." />
              ) : (
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredMatchmakingRequests.map((request) => (
                    <MatchmakingRequestCard
                      key={request.id}
                      request={request}
                    />
                  ))}
                </div>
              )}
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

function MatchmakingRequestForm({
  activeTab,
  userSport,
  cityFilter,
  zone,
  radiusKm,
  levelWanted,
  format,
  missingPlayers,
  requestDate,
  requestTime,
  notes,
  saving,
  accountLocked,
  onZoneChange,
  onRadiusKmChange,
  onLevelWantedChange,
  onFormatChange,
  onMissingPlayersChange,
  onRequestDateChange,
  onRequestTimeChange,
  onNotesChange,
  onSubmit,
}: {
  activeTab: MatchmakingTab;
  userSport: string;
  cityFilter: string;
  zone: string;
  radiusKm: string;
  levelWanted: string;
  format: string;
  missingPlayers: string;
  requestDate: string;
  requestTime: string;
  notes: string;
  saving: boolean;
  accountLocked: boolean;
  onZoneChange: (value: string) => void;
  onRadiusKmChange: (value: string) => void;
  onLevelWantedChange: (value: string) => void;
  onFormatChange: (value: string) => void;
  onMissingPlayersChange: (value: string) => void;
  onRequestDateChange: (value: string) => void;
  onRequestTimeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  const requestType = getRequestTypeFromTab(activeTab);

  return (
    <form
      onSubmit={onSubmit}
      className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061126]/80 p-5 shadow-2xl sm:p-6"
    >
      <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            Nuovo annuncio
          </div>

          <h2 className="mt-2 break-words text-2xl font-black sm:text-3xl">
            {getRequestTitle(requestType)}
          </h2>
        </div>

        <span className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
          {sportLabel(userSport)}
        </span>
      </div>

      <fieldset disabled={saving || accountLocked} className="grid gap-4 disabled:opacity-60 md:grid-cols-2">
        <SmallField label="Zona">
          <input
            value={zone}
            onChange={(event) => onZoneChange(event.target.value)}
            placeholder={cityFilter || "Zona / campo"}
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </SmallField>

        <SmallField label="Km">
          <input
            type="number"
            min="1"
            value={radiusKm}
            onChange={(event) => onRadiusKmChange(event.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </SmallField>

        <SmallField label="Livello cercato">
          <select
            value={levelWanted}
            onChange={(event) => onLevelWantedChange(event.target.value)}
            className="w-full bg-[#061126] text-white outline-none"
          >
            <option value="qualsiasi">Qualsiasi livello</option>
            <option value="principiante">Principiante</option>
            <option value="amatoriale">Amatoriale</option>
            <option value="intermedio">Intermedio</option>
            <option value="avanzato">Avanzato</option>
            <option value="competitivo">Competitivo</option>
          </select>
        </SmallField>

        <SmallField label="Formato">
          <select
            value={format}
            onChange={(event) => onFormatChange(event.target.value)}
            className="w-full bg-[#061126] text-white outline-none"
          >
            <option value="amichevole">Amichevole</option>
            <option value="singolo">Singolo</option>
            <option value="doppio">Doppio</option>
            <option value="squadra">Squadra</option>
          </select>
        </SmallField>

        <SmallField label="Posti mancanti">
          <input
            type="number"
            min="1"
            value={missingPlayers}
            onChange={(event) => onMissingPlayersChange(event.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </SmallField>

        <SmallField label="Data">
          <input
            type="date"
            value={requestDate}
            onChange={(event) => onRequestDateChange(event.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </SmallField>

        <SmallField label="Ora">
          <select
            value={requestTime}
            onChange={(event) => onRequestTimeChange(event.target.value)}
            className="w-full bg-[#061126] text-white outline-none"
          >
            <option value="">Seleziona ora</option>
            {TIME_OPTIONS.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </SmallField>

        <SmallField label="Note">
          <input
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Info brevi per chi vuole unirsi"
            maxLength={90}
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </SmallField>

        <button
          type="submit"
          disabled={saving || accountLocked}
          className="rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-4 font-black text-white disabled:opacity-60 md:col-span-2"
        >
          {accountLocked
            ? "Creazione bloccata"
            : saving
            ? "Creazione..."
            : getRequestActionLabel(requestType)}
        </button>
      </fieldset>
    </form>
  );
}

function MatchmakingRequestCard({ request }: { request: MatchmakingRequest }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-[#061126]/80 p-5 shadow-2xl sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
          {getRequestTitle(request.type)}
        </span>

        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-slate-300">
          {sportLabel(request.activeSport)}
        </span>
      </div>

      <h2 className="break-words text-2xl font-black">
        {request.createdByName || "Rivalo Player"}
      </h2>

      <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-300">
        <div className="break-words">
          Zona: {request.city || "Città"} {request.zone ? `· ${request.zone}` : ""}
        </div>

        <div>
          Entro {request.radiusKm || 0} km · {request.format || "amichevole"}
        </div>

        <div>
          Livello: {request.levelWanted || "qualsiasi"} · Posti: {request.missingPlayers || 1}
        </div>

        {(request.date || request.time) && (
          <div>
            Quando: {request.date || "Data"} {request.time ? `· ${request.time}` : ""}
          </div>
        )}
      </div>

      {request.notes && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold leading-6 text-slate-200">
          {request.notes}
        </div>
      )}
    </div>
  );
}

function SmallField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <span className="mb-2 block truncate text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </span>

      {children}
    </label>
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