"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
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
  matchPlace?: string;
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
  completedAt?: any;
  closedAt?: any;
  linkedMatchId?: string;
};

type MatchmakingApplication = {
  id: string;
  requestId?: string;
  requestOwnerId?: string;
  fromUid?: string;
  fromName?: string;
  activeSport?: string;
  status?: string;
  selectedBy?: string;
  decidedAt?: any;
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
  if (type === "player") return "Ricerca giocatori";
  if (type === "opponent") return "Ricerca avversari";
  return "Ricerca match";
}

function getRequestActionLabel(type?: MatchmakingRequestType) {
  if (type === "player") return "Pubblica ricerca giocatori";
  if (type === "opponent") return "Pubblica ricerca avversari";
  return "Pubblica ricerca match";
}

function getTabFromRequestType(type?: string): MatchmakingTab {
  if (type === "player") return "players";
  if (type === "opponent") return "opponents";
  return "matches";
}

function getFormatOptions(sport?: string) {
  const normalizedSport = normalizeSport(sport);

  if (normalizedSport === "padel" || normalizedSport === "tennis") {
    return [
      { value: "singolo", label: "Singolo" },
      { value: "doppio", label: "Doppio" },
    ];
  }

  return [
    { value: "amichevole", label: "Amichevole" },
    { value: "player", label: "Cerco player" },
    { value: "squadra", label: "Cerco squadra avversaria" },
  ];
}

function getMissingPlayersLimit(sport?: string, format?: string) {
  const normalizedSport = normalizeSport(sport);

  if (normalizedSport === "padel" || normalizedSport === "tennis") {
    return format === "doppio" ? 3 : 1;
  }

  return format === "squadra" ? 5 : 10;
}

function clampMissingPlayers(value: string, sport?: string, format?: string) {
  const max = getMissingPlayersLimit(sport, format);
  const numericValue = Math.max(1, Number(value || 1));

  return String(Math.min(max, numericValue));
}

function getMissingPlayersOptions(sport?: string, format?: string) {
  const max = getMissingPlayersLimit(sport, format);

  return Array.from({ length: max }, (_, index) => String(index + 1));
}

function getMissingPlayersHelp(sport?: string, format?: string) {
  const normalizedSport = normalizeSport(sport);

  if (normalizedSport === "padel" || normalizedSport === "tennis") {
    if (format === "doppio") {
      return "Doppio: puoi cercare da 1 a 3 giocatori. Con te il totale arriva a 4.";
    }

    return "Singolo: puoi cercare 1 avversario. Con te il totale arriva a 2.";
  }

  return "Calcetto: puoi cercare da 1 a 9 giocatori. Con te il totale arriva fino a 10.";
}

function getAcceptedApplicationsCount(applications: MatchmakingApplication[]) {
  return applications.filter((application) => application.status === "accepted").length;
}

function getRemainingSpots(request: MatchmakingRequest, applications: MatchmakingApplication[]) {
  const totalSpots = Math.max(1, Number(request.missingPlayers || 1));
  const acceptedCount = getAcceptedApplicationsCount(applications);

  return Math.max(0, totalSpots - acceptedCount);
}

function buildMapsSearchQuery({
  matchPlace,
  zone,
  city,
}: {
  matchPlace?: string;
  zone?: string;
  city?: string;
}) {
  return [matchPlace, zone, city]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function buildMapsSearchUrl({
  matchPlace,
  zone,
  city,
}: {
  matchPlace?: string;
  zone?: string;
  city?: string;
}) {
  const mapsQuery = buildMapsSearchQuery({ matchPlace, zone, city });

  if (!mapsQuery) return "";

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`;
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
  matchPlace,
  levelWanted,
}: {
  creatorUid: string;
  creatorName: string;
  requestId: string;
  requestType: MatchmakingRequestType;
  sport: string;
  city: string;
  zone: string;
  matchPlace: string;
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
          message: `${creatorName} ha pubblicato: ${getRequestTitle(requestType)}${city ? ` · ${city}` : ""}${zone ? ` · ${zone}` : ""}${matchPlace ? ` · ${matchPlace}` : ""}.`,
          link: `/opponents?tab=${getTabFromRequestType(requestType)}&requestId=${requestId}`,
          createdBy: creatorUid,
          metadata: {
            requestId,
            requestType,
            activeSport: sport,
            city,
            zone,
            matchPlace,
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
  const [groupSearch, setGroupSearch] = useState("");
  const [message, setMessage] = useState("");
const [requestingGroupId, setRequestingGroupId] = useState("");
const [sentRequests, setSentRequests] = useState<JoinRequest[]>([]);
const [activeTab, setActiveTab] = useState<MatchmakingTab>("groups");

const [matchmakingRequests, setMatchmakingRequests] = useState<MatchmakingRequest[]>([]);
const [matchmakingApplications, setMatchmakingApplications] = useState<MatchmakingApplication[]>([]);
const [loadingRequests, setLoadingRequests] = useState(false);
const [savingRequest, setSavingRequest] = useState(false);
const [applyingRequestId, setApplyingRequestId] = useState("");
const [selectedRequestId, setSelectedRequestId] = useState("");
const [zone, setZone] = useState("");
const [matchPlace, setMatchPlace] = useState("");
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
      setFormat(getFormatOptions(currentUserSport)[0]?.value || "amichevole");
      setAccountLocked(isProfileDeletionRequested(profile));

      await loadPublicGroups(currentUserSport, currentUser.uid);
      await loadSentRequests(currentUser.uid);
      await loadMatchmakingRequests(currentUserSport, currentUser.uid);

      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab") as MatchmakingTab | null;
      const requestIdParam = params.get("requestId") || "";

      if (
        tabParam === "matches" ||
        tabParam === "players" ||
        tabParam === "opponents"
      ) {
        setActiveTab(tabParam);
      }

      if (requestIdParam) {
        setSelectedRequestId(requestIdParam);
      }
    });

    return () => unsubscribe();
  }, []);

  async function loadPublicGroups(currentUserSport = userSport, currentUid = user?.uid || "") {
    setLoading(true);

    try {
      const publicGroupsQuery = query(
        collection(db, "groups"),
        where("privacy", "==", "pubblico")
      );

      const publicSnap = await getDocs(publicGroupsQuery);
      const ownSnap = currentUid
        ? await getDocs(
            query(
              collection(db, "groups"),
              where("members", "array-contains", currentUid)
            )
          )
        : null;

      const groupsById = new Map<string, OpponentGroup>();

      publicSnap.docs.forEach((docSnap) => {
        groupsById.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<OpponentGroup, "id">),
        });
      });

      ownSnap?.docs.forEach((docSnap) => {
        groupsById.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<OpponentGroup, "id">),
        });
      });

      const result = Array.from(groupsById.values()).filter(
        (group) => getGroupSport(group) === normalizeSport(currentUserSport)
      );

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

  async function loadMatchmakingRequests(currentUserSport = userSport, currentUid = user?.uid || "") {
    setLoadingRequests(true);

    try {
      const requestsQuery = query(
        collection(db, "matchmakingRequests"),
        where("activeSport", "==", normalizeSport(currentUserSport))
      );

      const snap = await getDocs(requestsQuery);

      const result = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<MatchmakingRequest, "id">),
      }));

      setMatchmakingRequests(result);

      if (!currentUid) {
        setMatchmakingApplications([]);
        return;
      }

      const ownApplicationsQuery = query(
        collection(db, "matchmakingApplications"),
        where("fromUid", "==", currentUid)
      );

      const receivedApplicationsQuery = query(
        collection(db, "matchmakingApplications"),
        where("requestOwnerId", "==", currentUid)
      );

      const [ownApplicationsSnap, receivedApplicationsSnap] = await Promise.all([
        getDocs(ownApplicationsQuery),
        getDocs(receivedApplicationsQuery),
      ]);

      const applicationsMap = new Map<string, MatchmakingApplication>();

      [...ownApplicationsSnap.docs, ...receivedApplicationsSnap.docs].forEach((docSnap) => {
        applicationsMap.set(docSnap.id, {
          id: docSnap.id,
          ...(docSnap.data() as Omit<MatchmakingApplication, "id">),
        });
      });

      const applicationsResult = Array.from(applicationsMap.values()).filter((application) =>
        result.some((request) => request.id === application.requestId)
      );

      setMatchmakingApplications(applicationsResult);
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
      const cleanMatchPlace = matchPlace.trim();
      const requestRef = await addDoc(collection(db, "matchmakingRequests"), {
        type: requestType,
        activeSport: freshProfileSport,
        creatorSport: freshProfileSport,
        sportProfileId: `${user.uid}_${freshProfileSport}`,
        city: cleanCity,
        zone: cleanZone,
        matchPlace: cleanMatchPlace,
        radiusKm: Number(radiusKm || 0),
        levelWanted,
        format,
        missingPlayers: Number(clampMissingPlayers(missingPlayers, freshProfileSport, format)),
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
        matchPlace: cleanMatchPlace,
        levelWanted,
      });

      setZone("");
      setMatchPlace("");
      setRadiusKm("10");
      setLevelWanted("qualsiasi");
      setFormat(getFormatOptions(freshProfileSport)[0]?.value || "amichevole");
      setMissingPlayers("1");
      setRequestDate("");
      setRequestTime("");
      setNotes("");

      setMessage("Annuncio matchmaking creato.");
      await loadMatchmakingRequests(freshProfileSport, user.uid);
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
  async function applyToMatchmakingRequest(request: MatchmakingRequest) {
    if (!user) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: candidatura bloccata.");
      return;
    }

    const requestApplications = matchmakingApplications.filter(
      (application) => application.requestId === request.id
    );

    if (request.status === "closed") {
      setMessage("Annuncio chiuso.");
      return;
    }

    if (getRemainingSpots(request, requestApplications) <= 0 || request.status === "completed") {
      setMessage("Annuncio già completo.");
      return;
    }

    if (request.createdBy === user.uid) {
      setMessage("Questo annuncio è tuo.");
      return;
    }

    const alreadyApplied = matchmakingApplications.some(
      (application) =>
        application.requestId === request.id &&
        application.fromUid === user.uid &&
        application.status !== "rejected" &&
        application.status !== "cancelled"
    );

    if (alreadyApplied) {
      setMessage("Ti sei già proposto per questo annuncio.");
      return;
    }

    setApplyingRequestId(request.id);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: candidatura bloccata.");
        setApplyingRequestId("");
        return;
      }

      const freshProfileSport = normalizeSport(
        freshProfile?.activeSport ||
          freshProfile?.mainSport ||
          freshProfile?.sport ||
          userSport
      );

      if (freshProfileSport !== normalizeSport(request.activeSport)) {
        setMessage("Puoi proporti solo per annunci del tuo sport attivo.");
        setApplyingRequestId("");
        return;
      }

      const applicantName =
        freshProfile?.name ||
        freshProfile?.nickname ||
        user.displayName ||
        "Rivalo Player";

      const applicationRef = await addDoc(collection(db, "matchmakingApplications"), {
        requestId: request.id,
        requestOwnerId: request.createdBy || "",
        fromUid: user.uid,
        fromName: applicantName,
        activeSport: freshProfileSport,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (request.createdBy) {
        await createNotification({
          uid: request.createdBy,
          type: "generic",
          title: "Nuova candidatura matchmaking",
          message: `${applicantName} si è proposto per il tuo annuncio.`,
          link: `/opponents?tab=${getTabFromRequestType(request.type)}&requestId=${request.id}`,
          createdBy: user.uid,
          metadata: {
            requestId: request.id,
            applicationId: applicationRef.id,
            requestType: request.type || "match",
            activeSport: freshProfileSport,
          },
        });
      }

      setMessage("Candidatura inviata.");
      await loadMatchmakingRequests(freshProfileSport, user.uid);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'invio della candidatura.");
    } finally {
      setApplyingRequestId("");
    }
  }

  async function cancelMatchmakingApplication(request: MatchmakingRequest) {
    if (!user) return;

    const application = matchmakingApplications.find(
      (item) =>
        item.requestId === request.id &&
        item.fromUid === user.uid &&
        item.status === "pending"
    );

    if (!application) {
      setMessage("Nessuna candidatura in attesa da annullare.");
      return;
    }

    try {
      await updateDoc(doc(db, "matchmakingApplications", application.id), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      if (request.createdBy) {
        await createNotification({
          uid: request.createdBy,
          type: "generic",
          title: "Candidatura annullata",
          message: `${application.fromName || "Rivalo Player"} ha annullato la candidatura.`,
          link: `/opponents?tab=${getTabFromRequestType(request.type)}&requestId=${request.id}`,
          createdBy: user.uid,
          metadata: {
            requestId: request.id,
            applicationId: application.id,
            requestType: request.type || "match",
            activeSport: request.activeSport || userSport,
            status: "cancelled",
          },
        });
      }

      setMessage("Candidatura annullata.");
      await loadMatchmakingRequests(userSport, user.uid);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'annullamento della candidatura.");
    }
  }

  async function decideMatchmakingApplication({
    request,
    application,
    status,
  }: {
    request: MatchmakingRequest;
    application: MatchmakingApplication;
    status: "accepted" | "rejected";
  }) {
    if (!user) return;

    if (request.createdBy !== user.uid) {
      setMessage("Solo il creator dell'annuncio può gestire le candidature.");
      return;
    }

    if (status === "accepted") {
      const acceptedApplications = matchmakingApplications.filter(
        (item) =>
          item.requestId === request.id &&
          item.status === "accepted" &&
          item.id !== application.id
      );

      const requiredSpots = Math.max(1, Number(request.missingPlayers || 1));

      if (acceptedApplications.length >= requiredSpots) {
        setMessage("Annuncio già completo: non puoi accettare altri player.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "matchmakingApplications", application.id), {
        status,
        selectedBy: user.uid,
        decidedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      if (status === "accepted") {
        const nextAcceptedCount =
          matchmakingApplications.filter(
            (item) =>
              item.requestId === request.id &&
              item.status === "accepted" &&
              item.id !== application.id
          ).length + 1;

        const requiredSpots = Math.max(1, Number(request.missingPlayers || 1));

        if (nextAcceptedCount >= requiredSpots) {
          await updateDoc(doc(db, "matchmakingRequests", request.id), {
            status: "completed",
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      }

      if (application.fromUid) {
        await createNotification({
          uid: application.fromUid,
          type: "generic",
          title:
            status === "accepted"
              ? "Candidatura accettata"
              : "Candidatura non selezionata",
          message:
            status === "accepted"
              ? "La tua candidatura matchmaking è stata accettata."
              : "La tua candidatura matchmaking non è stata selezionata.",
          link: `/opponents?tab=${getTabFromRequestType(request.type)}&requestId=${request.id}`,
          createdBy: user.uid,
          metadata: {
            requestId: request.id,
            applicationId: application.id,
            requestType: request.type || "match",
            activeSport: request.activeSport || userSport,
            status,
          },
        });
      }

      const acceptedAfterDecision =
        status === "accepted"
          ? matchmakingApplications.filter(
              (item) =>
                item.requestId === request.id &&
                item.status === "accepted" &&
                item.id !== application.id
            ).length + 1
          : matchmakingApplications.filter(
              (item) =>
                item.requestId === request.id &&
                item.status === "accepted"
            ).length;

      const requestCompleted =
        status === "accepted" &&
        acceptedAfterDecision >= Math.max(1, Number(request.missingPlayers || 1));

      setMessage(
        requestCompleted
          ? "Candidatura accettata. Annuncio completato."
          : status === "accepted"
          ? "Candidatura accettata."
          : "Candidatura rifiutata."
      );

      await loadMatchmakingRequests(userSport, user.uid);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la gestione della candidatura.");
    }
  }

  async function updateMatchmakingRequestStatus({
    request,
    status,
  }: {
    request: MatchmakingRequest;
    status: "open" | "closed";
  }) {
    if (!user) return;

    if (request.createdBy !== user.uid) {
      setMessage("Solo il creator può gestire questo annuncio.");
      return;
    }

    const requestApplications = matchmakingApplications.filter(
      (application) => application.requestId === request.id
    );

    if (status === "open" && getRemainingSpots(request, requestApplications) <= 0) {
      setMessage("Annuncio già completo: non può essere riaperto.");
      return;
    }

    try {
      await updateDoc(doc(db, "matchmakingRequests", request.id), {
        status,
        closedAt: status === "closed" ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });

      setMessage(status === "closed" ? "Annuncio chiuso." : "Annuncio riaperto.");
      await loadMatchmakingRequests(userSport, user.uid);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la gestione dell'annuncio.");
    }
  }

  async function deleteMatchmakingRequest(request: MatchmakingRequest) {
    if (!user) return;

    if (request.createdBy !== user.uid) {
      setMessage("Solo il creator può eliminare questo annuncio.");
      return;
    }

    const requestApplications = matchmakingApplications.filter(
      (application) => application.requestId === request.id
    );

    if (requestApplications.length > 0) {
      setMessage("Puoi eliminare solo annunci senza candidature.");
      return;
    }

    try {
      await deleteDoc(doc(db, "matchmakingRequests", request.id));

      setMessage("Annuncio eliminato.");
      await loadMatchmakingRequests(userSport, user.uid);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'eliminazione dell'annuncio.");
    }
  }

  const filteredGroups = useMemo(() => {
    const cleanSearch = groupSearch.trim().toLowerCase();
    const lockedSport = normalizeSport(userSport);

    return groups.filter((group) => {
      const sportOk = getGroupSport(group) === lockedSport;

      const searchTarget = [
        group.name,
        group.city,
        group.mode,
        group.privacy,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const searchOk = !cleanSearch || searchTarget.includes(cleanSearch);

      return sportOk && searchOk;
    });
  }, [groups, groupSearch, userSport]);

  const filteredMatchmakingRequests = useMemo(() => {
    const cleanCity = cityFilter.trim().toLowerCase();
    const requestType = getRequestTypeFromTab(activeTab);

    return matchmakingRequests.filter((request) => {
      const typeOk = request.type === requestType;
      const cityOk =
        !cleanCity || (request.city || "").toLowerCase().includes(cleanCity);

      const requestStatus = request.status || "open";
      const visibleStatus =
        requestStatus === "open" ||
        request.id === selectedRequestId ||
        request.createdBy === user?.uid;

      return typeOk && cityOk && visibleStatus;
    });
  }, [matchmakingRequests, activeTab, cityFilter, selectedRequestId, user?.uid]);

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
                Trova gruppi, partite, giocatori e avversari compatibili con il tuo sport attivo.
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
                {activeTab === "groups" ? (
                  <Users size={16} />
                ) : (
                  <MapPin size={16} />
                )}
                {activeTab === "groups" ? "Cerca gruppo" : "Città / zona"}
              </div>

              <input
                value={activeTab === "groups" ? groupSearch : cityFilter}
                onChange={(e) =>
                  activeTab === "groups"
                    ? setGroupSearch(e.target.value)
                    : setCityFilter(e.target.value)
                }
                placeholder={
                  activeTab === "groups"
                    ? "Nome gruppo, città o modalità..."
                    : "Es. Lecce, Milano, Roma..."
                }
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
              title="Giocatori"
              text="Cerca giocatori"
            />

            <TabButton
              active={activeTab === "opponents"}
              onClick={() => setActiveTab("opponents")}
              title="Avversari"
              text="Cerca avversari"
            />
          </div>
        </section>

        {accountLocked && (
          <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
            Profilo non attivo: puoi consultare matchmaking e gruppi, ma non puoi creare annunci, candidarti o inviare richieste.
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
              <EmptyBox text="Caricamento gruppi…" />
            ) : filteredGroups.length === 0 ? (
              <EmptyBox text="Nessun gruppo trovato con questa ricerca." />
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
                    isMember={user ? (group.members || []).includes(user.uid) : false}
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
                matchPlace={matchPlace}
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
                onMatchPlaceChange={setMatchPlace}
                onRadiusKmChange={setRadiusKm}
                onLevelWantedChange={setLevelWanted}
                onFormatChange={setFormat}
                onMissingPlayersChange={(value) =>
                  setMissingPlayers(clampMissingPlayers(value, userSport, format))
                }
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
                  {[...filteredMatchmakingRequests]
                    .sort((a, b) =>
                      a.id === selectedRequestId
                        ? -1
                        : b.id === selectedRequestId
                        ? 1
                        : 0
                    )
                    .map((request) => (
                      <MatchmakingRequestCard
                        key={request.id}
                        request={request}
                        currentUid={user?.uid || ""}
                        selected={request.id === selectedRequestId}
                        applying={applyingRequestId === request.id}
                        alreadyApplied={matchmakingApplications.some(
                          (application) =>
                            application.requestId === request.id &&
                            application.fromUid === user?.uid &&
                            application.status !== "rejected" &&
                            application.status !== "cancelled"
                        )}
                        applications={matchmakingApplications.filter(
                          (application) => application.requestId === request.id
                        )}
                        onApply={applyToMatchmakingRequest}
                        onCancelApplication={cancelMatchmakingApplication}
                        onDecideApplication={decideMatchmakingApplication}
                        onUpdateRequestStatus={updateMatchmakingRequestStatus}
                        onDeleteRequest={deleteMatchmakingRequest}
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
  matchPlace,
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
  onMatchPlaceChange,
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
  matchPlace: string;
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
  onMatchPlaceChange: (value: string) => void;
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
            Nuova ricerca
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
            placeholder={cityFilter || "Zona"}
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </SmallField>

        <SmallField label="Luogo match">
          <input
            value={matchPlace}
            onChange={(event) => onMatchPlaceChange(event.target.value)}
            placeholder="Nome campo, club o indirizzo"
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />

          <div className="mt-2 break-words text-xs leading-5 text-slate-500">
            {buildMapsSearchQuery({
              matchPlace,
              zone,
              city: cityFilter,
            })
              ? `Maps cercherà: ${buildMapsSearchQuery({
                  matchPlace,
                  zone,
                  city: cityFilter,
                })}`
              : "Inserisci campo, club o indirizzo per rendere il link Maps più preciso."}
          </div>
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
            onChange={(event) => {
              const nextFormat = event.target.value;

              onFormatChange(nextFormat);
              onMissingPlayersChange(clampMissingPlayers(missingPlayers, userSport, nextFormat));
            }}
            className="w-full bg-[#061126] text-white outline-none"
          >
            {getFormatOptions(userSport).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </SmallField>

        <SmallField label="Posti mancanti">
          <select
            value={clampMissingPlayers(missingPlayers, userSport, format)}
            onChange={(event) => onMissingPlayersChange(event.target.value)}
            className="w-full bg-[#061126] text-white outline-none"
          >
            {getMissingPlayersOptions(userSport, format).map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <div className="mt-2 text-xs leading-5 text-slate-500">
            {getMissingPlayersHelp(userSport, format)}
          </div>
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
            placeholder="Info brevi per organizzarsi"
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

function MatchmakingRequestCard({
  request,
  currentUid,
  selected,
  applying,
  alreadyApplied,
  applications,
  onApply,
  onCancelApplication,
  onDecideApplication,
  onUpdateRequestStatus,
  onDeleteRequest,
}: {
  request: MatchmakingRequest;
  currentUid: string;
  selected: boolean;
  applying: boolean;
  alreadyApplied: boolean;
  applications: MatchmakingApplication[];
  onApply: (request: MatchmakingRequest) => void;
  onCancelApplication: (request: MatchmakingRequest) => void;
  onDecideApplication: (input: {
    request: MatchmakingRequest;
    application: MatchmakingApplication;
    status: "accepted" | "rejected";
  }) => void;
  onUpdateRequestStatus: (input: {
    request: MatchmakingRequest;
    status: "open" | "closed";
  }) => void;
  onDeleteRequest: (request: MatchmakingRequest) => void;
}) {
  const isOwner = request.createdBy === currentUid;
  const ownApplication = applications.find(
    (application) => application.fromUid === currentUid
  );
  const pendingOwnApplication =
    ownApplication?.status === "pending" ? ownApplication : undefined;
  const acceptedCount = getAcceptedApplicationsCount(applications);
  const remainingSpots = getRemainingSpots(request, applications);
  const isClosed = request.status === "closed";
  const isCompleted =
    remainingSpots <= 0 ||
    request.status === "completed" ||
    request.status === "match_created" ||
    Boolean(request.linkedMatchId);

  const canAcceptMore = !isCompleted && !isClosed && remainingSpots > 0;

  return (
    <div
      className={`min-w-0 overflow-hidden rounded-[2rem] border bg-[#061126]/80 p-5 shadow-2xl sm:p-6 ${
        selected ? "border-cyan-300/50" : "border-white/10"
      }`}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-cyan-200">
          {getRequestTitle(request.type)}
        </span>

        <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1 text-xs font-bold text-slate-300">
          {request.linkedMatchId
            ? "Match creato"
            : isClosed
            ? "Chiuso"
            : isCompleted
            ? "Completo"
            : sportLabel(request.activeSport)}
        </span>
      </div>

      <h2 className="break-words text-2xl font-black">
        {request.createdByName || "Rivalo Player"}
      </h2>

      <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-300">
        <div className="break-words">
          Zona: {request.city || "Città"} {request.zone ? `· ${request.zone}` : ""}
        </div>

        {request.matchPlace && (
          <div className="break-words">
            Luogo: {request.matchPlace}
          </div>
        )}

        {buildMapsSearchUrl({
          matchPlace: request.matchPlace,
          zone: request.zone,
          city: request.city,
        }) && (
          <a
            href={buildMapsSearchUrl({
              matchPlace: request.matchPlace,
              zone: request.zone,
              city: request.city,
            })}
            target="_blank"
            rel="noreferrer"
            className="inline-flex max-w-full items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase text-cyan-200"
          >
            Apri luogo su Maps
          </a>
        )}

        <div>
          Entro {request.radiusKm || 0} km · {request.format || "amichevole"}
        </div>

        <div>
          Livello: {request.levelWanted || "qualsiasi"} · Posti liberi: {remainingSpots}
        </div>

        <div>
          Accettati: {acceptedCount}/{request.missingPlayers || 1}
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

      {isOwner ? (
        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4">
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            {isClosed ? (
              <button
                type="button"
                onClick={() =>
                  onUpdateRequestStatus({
                    request,
                    status: "open",
                  })
                }
                disabled={isCompleted}
                className="rounded-xl border border-green-300/20 bg-green-400/10 px-3 py-2 text-xs font-black uppercase text-green-100 disabled:opacity-50"
              >
                Riapri annuncio
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  onUpdateRequestStatus({
                    request,
                    status: "closed",
                  })
                }
                disabled={isCompleted}
                className="rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-xs font-black uppercase text-yellow-100 disabled:opacity-50"
              >
                Chiudi annuncio
              </button>
            )}

            <button
              type="button"
              onClick={() => onDeleteRequest(request)}
              disabled={applications.length > 0}
              className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black uppercase text-red-100 disabled:opacity-50"
            >
              Elimina annuncio
            </button>
          </div>

          {isClosed && (
            <div className="mb-4 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-xs font-black uppercase text-yellow-100">
              Annuncio chiuso
            </div>
          )}

          <div className="text-xs font-black uppercase tracking-[0.14em] text-cyan-200">
            Candidature
          </div>

          {isCompleted && (
            <div className="mt-3 grid gap-3">
              <div className="rounded-xl border border-green-300/20 bg-green-400/10 px-3 py-2 text-xs font-black uppercase text-green-100">
                {request.linkedMatchId ? "Match creato" : "Annuncio completo"}
              </div>

              {request.linkedMatchId ? (
                <Link
                  href={`/match/${request.linkedMatchId}`}
                  className="flex items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-3 text-xs font-black uppercase text-cyan-100"
                >
                  Apri match
                </Link>
              ) : (
                <Link
                  href={`/match?matchmakingRequestId=${request.id}`}
                  className="flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-3 py-3 text-xs font-black uppercase text-white"
                >
                  Crea match amichevole
                </Link>
              )}
            </div>
          )}

          {applications.length === 0 ? (
            <div className="mt-2 text-sm font-semibold text-slate-300">
              Nessuna candidatura ancora.
            </div>
          ) : (
            <div className="mt-3 grid gap-3">
              {applications.map((application) => {
                const applicationStatus = application.status || "pending";
                const decided = applicationStatus !== "pending";

                return (
                  <div
                    key={application.id}
                    className="min-w-0 rounded-xl border border-white/10 bg-black/20 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center justify-between gap-3">
                      {application.fromUid ? (
                        <Link
                          href={`/public/${application.fromUid}?from=matchmaking&tab=${getTabFromRequestType(request.type)}&requestId=${request.id}`}
                          className="min-w-0 truncate text-sm font-black text-cyan-200 underline-offset-4 hover:underline"
                        >
                          {application.fromName || "Rivalo Player"}
                        </Link>
                      ) : (
                        <span className="min-w-0 truncate text-sm font-black text-white">
                          {application.fromName || "Rivalo Player"}
                        </span>
                      )}

                      <span
                        className={`shrink-0 rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${
                          applicationStatus === "accepted"
                            ? "border-green-300/20 bg-green-400/10 text-green-100"
                            : applicationStatus === "rejected" ||
                              applicationStatus === "cancelled"
                            ? "border-red-300/20 bg-red-400/10 text-red-100"
                            : "border-yellow-300/20 bg-yellow-400/10 text-yellow-100"
                        }`}
                      >
                        {applicationStatus === "accepted"
                          ? "Accettata"
                          : applicationStatus === "rejected"
                          ? "Rifiutata"
                          : applicationStatus === "cancelled"
                          ? "Annullata"
                          : "Da valutare"}
                      </span>
                    </div>

                    {application.fromUid && (
                      <Link
                        href={`/messages?with=${application.fromUid}&requestId=${request.id}`}
                        className="mt-3 flex items-center justify-center rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-black uppercase text-cyan-100"
                      >
                        Chat
                      </Link>
                    )}

                    {!decided && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onDecideApplication({
                              request,
                              application,
                              status: "accepted",
                            })
                          }
                          disabled={!canAcceptMore}
                          className="rounded-xl border border-green-300/20 bg-green-400/10 px-3 py-2 text-xs font-black uppercase text-green-100 disabled:opacity-50"
                        >
                          {canAcceptMore ? "Accetta" : "Completo"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            onDecideApplication({
                              request,
                              application,
                              status: "rejected",
                            })
                          }
                          className="rounded-xl border border-red-300/20 bg-red-400/10 px-3 py-2 text-xs font-black uppercase text-red-100"
                        >
                          Rifiuta
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-2">
          {ownApplication && (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                ownApplication.status === "accepted"
                  ? "border-green-300/20 bg-green-400/10 text-green-100"
                  : ownApplication.status === "rejected"
                  ? "border-red-300/20 bg-red-400/10 text-red-100"
                  : ownApplication.status === "cancelled"
                  ? "border-slate-300/20 bg-slate-400/10 text-slate-200"
                  : "border-yellow-300/20 bg-yellow-400/10 text-yellow-100"
              }`}
            >
              {ownApplication.status === "accepted"
                ? "La tua candidatura è stata accettata"
                : ownApplication.status === "rejected"
                ? "La tua candidatura non è stata selezionata"
                : ownApplication.status === "cancelled"
                ? "Candidatura annullata"
                : "Candidatura in attesa"}
            </div>
          )}

          {ownApplication?.status === "accepted" && (
            <div className="grid gap-2">
              {request.createdBy && (
                <Link
                  href={`/messages?with=${request.createdBy}&requestId=${request.id}`}
                  className="flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black uppercase text-cyan-100"
                >
                  Chat creator
                </Link>
              )}

              {request.linkedMatchId && (
                <Link
                  href={`/match/${request.linkedMatchId}`}
                  className="flex items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-5 py-3 text-sm font-black uppercase text-cyan-100"
                >
                  Apri match
                </Link>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => onApply(request)}
            disabled={applying || alreadyApplied || isCompleted || isClosed}
            className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black text-white disabled:opacity-60"
          >
            {isClosed
              ? "Annuncio chiuso"
              : isCompleted
              ? "Annuncio completo"
              : alreadyApplied
              ? "Candidatura inviata"
              : applying
              ? "Invio candidatura..."
              : "Proponiti"}
          </button>

          {pendingOwnApplication && (
            <button
              type="button"
              onClick={() => onCancelApplication(request)}
              className="w-full rounded-2xl border border-red-300/20 bg-red-400/10 px-5 py-3 text-sm font-black uppercase text-red-100"
            >
              Annulla candidatura
            </button>
          )}
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
  isMember,
  accountLocked,
}: {
  group: OpponentGroup;
  onRequestJoin: (group: OpponentGroup) => void;
  requesting: boolean;
  alreadyRequested: boolean;
  isMember: boolean;
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
 disabled={requesting || alreadyRequested || isMember || accountLocked}
  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-5 py-3 font-black text-white disabled:opacity-60"
>
 {accountLocked
  ? "Richiesta bloccata"
  : isMember
  ? "Sei già nel gruppo"
  : alreadyRequested
  ? "Richiesta già inviata"
  : requesting
  ? "Invio richiesta…"
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