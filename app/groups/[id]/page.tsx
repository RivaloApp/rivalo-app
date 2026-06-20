"use client";

import FullScreenLoader from "../../../components/FullScreenLoader";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc,
  arrayUnion,
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
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../../lib/firebase";
import { createNotification } from "../../../lib/createNotification";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

type RivaloGroup = {
  name: string;
  city: string;
  sport: string;
  mode: string;
  privacy: string;
  premiumPlan?: string;
  members?: string[];
  ownerId?: string;
  admins?: string[];
};

type MemberProfile = {
  uid: string;
  name?: string;
  nickname?: string;
  email?: string;
  photoUrl?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
  rivalScore?: number;
  wins?: number;
  mvp?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
};

type GroupMatch = {
  id: string;
  name?: string;
  sport?: string;
  city?: string;
  field?: string;
  date?: string;
  time?: string;
  status?: string;
  resultStatus?: string;
  homeScore?: number | null;
  awayScore?: number | null;
};

type GroupTeam = {
  id: string;
  name?: string;
  city?: string;
  sport?: string;
  createdBy?: string;
  captainId?: string;
  captainName?: string;
  members?: string[];
  wins?: number;
  losses?: number;
  draws?: number;
  matchesPlayed?: number;
  goalsFor?: number;
  goalsAgainst?: number;
};

type JoinRequest = {
  id: string;
  groupId?: string;
  groupName?: string;
  groupOwnerId?: string;
  fromUid?: string;
  fromName?: string;
  status?: string;
};

type UserProfile = {
  mainSport?: string;
  sport?: string;
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

function formatModeLabel(value?: string) {
  const mode = (value || "").toLowerCase().trim();

  if (mode === "campionato") return "Campionato";
  if (mode === "torneo") return "Torneo";
  return "Amichevole";
}

function formatPrivacyLabel(value?: string) {
  const privacy = (value || "").toLowerCase().trim();

  if (privacy === "pubblico" || privacy === "public") return "Pubblico";
  if (privacy === "su-invito") return "Solo su invito";
  return "Privato";
}

function isProfileDeletionRequested(profile?: UserProfile | MemberProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function getAccountLockedMessage() {
  return "Profilo non attivo: puoi consultare il gruppo, ma non puoi eseguire nuove azioni.";
}

function getProfileName(profile?: MemberProfile) {
  if (isProfileDeletionRequested(profile)) return "Utente rimosso";

  return profile?.name || profile?.nickname || "Rivalo Player";
}

function getProfileSubtitle(profile?: MemberProfile) {
  if (isProfileDeletionRequested(profile)) return "Profilo non attivo";

  return profile?.nickname || profile?.email || "Membro gruppo";
}

function getProfilePhoto(profile?: MemberProfile) {
  if (isProfileDeletionRequested(profile)) return "";

  return profile?.photoUrl || "";
}

function canManageTeam({
  userId,
  group,
  team,
}: {
  userId?: string;
  group: RivaloGroup;
  team: GroupTeam;
}) {
  if (!userId) return false;

  if (userId === group.ownerId) return true;
  if (Boolean(group.admins?.includes(userId))) return true;
  if (userId === team.captainId) return true;
  if (!team.captainId && userId === team.createdBy) return true;

  return false;
}

export default function GroupDetailsPage() {
  const params = useParams();

  const groupId =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  const [group, setGroup] = useState<RivaloGroup | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userSport, setUserSport] = useState("calcetto");
  const [sportMismatch, setSportMismatch] = useState(false);
  const [accountLocked, setAccountLocked] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<MemberProfile[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [groupMatches, setGroupMatches] = useState<GroupMatch[]>([]);
  const [groupTeams, setGroupTeams] = useState<GroupTeam[]>([]);
  const [teamName, setTeamName] = useState("");
  const [creatingTeam, setCreatingTeam] = useState(false);
const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      if (groupId) {
        await loadGroup(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, [groupId]);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function loadGroup(currentUserId = user?.uid || "") {
    setLoading(true);
    setSportMismatch(false);
    setAccountLocked(false);

    try {
      const ref = doc(db, "groups", groupId);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        setGroup(null);
        return;
      }

      const data = snap.data();
      const members = Array.isArray(data.members) ? data.members : [];

      const loadedGroup: RivaloGroup = {
        name: data.name || "Gruppo Rivalo",
        city: data.city || "Nessuna città",
        sport: normalizeSport(data.sport || "calcetto"),
        mode: data.mode || "amichevole",
        privacy: data.privacy || "pubblico",
        premiumPlan: data.premiumPlan || "free",
        members,
        ownerId: data.ownerId || "",
        admins: Array.isArray(data.admins) ? data.admins : [],
      };

      const profileSnap = currentUserId
        ? await getDoc(doc(db, "users", currentUserId))
        : null;

      const profile = profileSnap?.exists()
        ? (profileSnap.data() as UserProfile)
        : null;

      const currentUserSport = normalizeSport(
        profile?.mainSport || profile?.sport || "calcetto"
      );

      setUserSport(currentUserSport);
      setAccountLocked(isProfileDeletionRequested(profile));
      setGroup(loadedGroup);

      if (normalizeSport(loadedGroup.sport) !== currentUserSport) {
        setSportMismatch(true);
        setMemberProfiles([]);
        setGroupMatches([]);
        setGroupTeams([]);
        setJoinRequests([]);
        return;
      }

      const profiles: MemberProfile[] = [];

      for (const uid of members) {
        const userSnap = await getDoc(doc(db, "users", uid));

        if (userSnap.exists()) {
          const userData = userSnap.data();

          profiles.push({
            uid,
            name: userData.name || "Rivalo Player",
            nickname: userData.nickname || "",
            email: userData.email || "",
            photoUrl: userData.photoUrl || userData.photoURL || "",
            accountStatus: userData.accountStatus || "",
            deletionRequested: Boolean(userData.deletionRequested),
            rivalScore: Number(userData.rivalScore || 1000),
            wins: Number(userData.wins || 0),
            mvp: Number(userData.mvp || 0),
            matchesPlayed: Number(userData.matchesPlayed || 0),
            goals: Number(userData.goals || 0),
            assists: Number(userData.assists || 0),
          });
        } else {
          profiles.push({
            uid,
            name: "Rivalo Player",
            rivalScore: 1000,
            wins: 0,
            mvp: 0,
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
          });
        }
      }

      setMemberProfiles(profiles);

      const matchesQuery = query(
        collection(db, "matches"),
        where("groupId", "==", groupId),
        where("participants", "array-contains", currentUserId)
      );

      const matchesSnap = await getDocs(matchesQuery);

      const matchesResult = matchesSnap.docs
        .map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<GroupMatch, "id">),
        }))
        .sort((a, b) => {
          const dateA = `${a.date || ""} ${a.time || ""}`;
          const dateB = `${b.date || ""} ${b.time || ""}`;
          return dateB.localeCompare(dateA);
        });

      setGroupMatches(matchesResult);

      const teamsQuery = query(
        collection(db, "groupTeams"),
        where("groupId", "==", groupId)
      );

      const teamsSnap = await getDocs(teamsQuery);

      const teamsResult = teamsSnap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<GroupTeam, "id">),
      }));

      setGroupTeams(teamsResult);
      const requestsQuery = query(
  collection(db, "groupJoinRequests"),
  where("groupId", "==", groupId),
  where("status", "==", "pending")
);

const requestsSnap = await getDocs(requestsQuery);

const requestsResult = requestsSnap.docs.map((docSnap) => ({
  id: docSnap.id,
  ...(docSnap.data() as Omit<JoinRequest, "id">),
}));

setJoinRequests(requestsResult);
    } finally {
      setLoading(false);
    }
  }

  async function addMemberToGroup(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !group) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: aggiunta membri bloccata.");
      return;
    }

    const search = memberSearch.trim();

    if (!search) {
      setMessage("Inserisci email, nickname o nome utente.");
      return;
    }

    setAddingMember(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: aggiunta membri bloccata.");
        setAddingMember(false);
        return;
      }

      const usersRef = collection(db, "users");
      const searchLower = search.toLowerCase();

      const possibleQueries = [
        query(usersRef, where("email", "==", searchLower)),
        query(usersRef, where("nickname", "==", search)),
        query(usersRef, where("name", "==", search)),
      ];

      let foundUser: MemberProfile | null = null;

      for (const q of possibleQueries) {
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();

          foundUser = {
            uid: docSnap.id,
            name: data.name || "Rivalo Player",
            nickname: data.nickname || "",
            email: data.email || "",
            photoUrl: data.photoUrl || data.photoURL || "",
          };

          break;
        }
      }

      if (!foundUser) {
        setMessage("Utente non trovato. Deve avere un account Rivalo.");
        return;
      }

      const foundUserSnap = await getDoc(doc(db, "users", foundUser.uid));
      const foundUserData = foundUserSnap.exists()
        ? (foundUserSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(foundUserData)) {
        setMessage("Utente non disponibile.");
        return;
      }

      const foundUserSport = normalizeSport(
        foundUserData?.mainSport || foundUserData?.sport || "calcetto"
      );

      if (foundUserSport !== normalizeSport(group.sport)) {
        setMessage(
          `Non puoi aggiungere un utente ${sportLabel(foundUserSport)} a un gruppo ${sportLabel(group.sport)}.`
        );
        return;
      }

      if (group.members?.includes(foundUser.uid)) {
        setMessage("Questo utente è già nel gruppo.");
        return;
      }

      await updateDoc(doc(db, "groups", groupId), {
        members: arrayUnion(foundUser.uid),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        uid: foundUser.uid,
        type: "team_invite",
        title: "Sei stato aggiunto a un gruppo",
        message: `Sei entrato nel gruppo ${group.name || "Rivalo"}.`,
        link: "/groups/" + groupId,
        createdBy: user.uid,
        metadata: {
          groupId,
          groupName: group.name || "Gruppo Rivalo",
          addedBy: user.uid,
        },
      });

      setMemberSearch("");
      setMessage("Membro aggiunto al gruppo.");

      await loadGroup(user?.uid || "");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'aggiunta del membro.");
    } finally {
      setAddingMember(false);
    }
  }

  async function createGroupTeam(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !group) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: creazione squadra bloccata.");
      return;
    }

    if (sportMismatch || normalizeSport(group.sport) !== userSport) {
      setMessage("Non puoi creare squadre in un gruppo di un altro sport.");
      return;
    }

    const cleanName = teamName.trim();

    if (!cleanName) {
      setMessage("Inserisci il nome della squadra.");
      return;
    }

    setCreatingTeam(true);
    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: creazione squadra bloccata.");
        setCreatingTeam(false);
        return;
      }

      const creatorProfile = memberProfiles.find(
        (member) => member.uid === user.uid
      );

      await addDoc(collection(db, "groupTeams"), {
        groupId,
        name: cleanName,
        city: group.city || "",
        sport: group.sport || "calcetto",
        createdBy: user.uid,
        captainId: user.uid,
        captainName: getProfileName(creatorProfile),
        members: [user.uid],
        wins: 0,
        losses: 0,
        draws: 0,
        matchesPlayed: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setTeamName("");
      setMessage("Squadra creata nel gruppo.");

      await loadGroup(user?.uid || "");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante la creazione della squadra.");
    } finally {
      setCreatingTeam(false);
    }
  }

  async function addMemberToTeam(teamId: string, memberUid: string) {
    if (!user || !group) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: modifica squadra bloccata.");
      return;
    }

    if (sportMismatch || normalizeSport(group.sport) !== userSport) {
      setMessage("Non puoi modificare squadre in un gruppo di un altro sport.");
      return;
    }

    if (!memberUid) {
      setMessage("Seleziona un membro da aggiungere alla squadra.");
      return;
    }

    setMessage("");

    try {
      const freshProfileSnap = await getDoc(doc(db, "users", user.uid));
      const freshProfile = freshProfileSnap.exists()
        ? (freshProfileSnap.data() as UserProfile)
        : null;

      if (isProfileDeletionRequested(freshProfile)) {
        setAccountLocked(true);
        setMessage("Profilo non attivo: modifica squadra bloccata.");
        return;
      }

      const teamRef = doc(db, "groupTeams", teamId);
      const selectedTeam = groupTeams.find((team) => team.id === teamId);

      if (!selectedTeam) {
        setMessage("Squadra non trovata.");
        return;
      }

      if (!canManageTeam({ userId: user.uid, group, team: selectedTeam })) {
        setMessage("Solo capitano, proprietario o admin del gruppo possono modificare questa squadra.");
        return;
      }

      const selectedMember = memberProfiles.find((member) => member.uid === memberUid);

      if (selectedMember && isProfileDeletionRequested(selectedMember)) {
        setMessage("Utente non disponibile.");
        return;
      }

      if (selectedTeam.members?.includes(memberUid)) {
        setMessage("Questo membro è già nella squadra.");
        return;
      }

      await updateDoc(teamRef, {
        members: arrayUnion(memberUid),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        uid: memberUid,
        type: "team_invite",
        title: "Sei stato aggiunto a una squadra",
        message: `Sei entrato nella squadra ${
          selectedTeam?.name || "Rivalo"
        } del gruppo ${group.name || "Rivalo"}.`,
        link: "/groups/" + groupId,
        createdBy: user.uid,
        metadata: {
          groupId,
          groupName: group.name || "Gruppo Rivalo",
          teamId,
          teamName: selectedTeam?.name || "Squadra Rivalo",
          addedBy: user.uid,
        },
      });

      setMessage("Membro aggiunto alla squadra.");

      await loadGroup(user?.uid || "");
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'aggiunta del membro alla squadra.");
    }
  }

  async function acceptJoinRequest(request: JoinRequest) {
  if (accountLocked) {
    setMessage("Profilo non attivo: gestione richieste bloccata.");
    return;
  }

  if (!request.fromUid) {
    setMessage("Richiesta non valida.");
    return;
  }

  setMessage("");

  try {
    const freshProfileSnap = user?.uid
      ? await getDoc(doc(db, "users", user.uid))
      : null;

    const freshProfile = freshProfileSnap?.exists()
      ? (freshProfileSnap.data() as UserProfile)
      : null;

    if (isProfileDeletionRequested(freshProfile)) {
      setAccountLocked(true);
      setMessage("Profilo non attivo: gestione richieste bloccata.");
      return;
    }

    const requestUserSnap = await getDoc(doc(db, "users", request.fromUid));
    const requestUserData = requestUserSnap.exists()
      ? (requestUserSnap.data() as UserProfile)
      : null;

    if (isProfileDeletionRequested(requestUserData)) {
      setMessage("Utente non disponibile.");
      return;
    }

    const requestUserSport = normalizeSport(
      requestUserData?.mainSport || requestUserData?.sport || "calcetto"
    );

    if (group && requestUserSport !== normalizeSport(group.sport)) {
      setMessage(
        `Richiesta bloccata: utente ${sportLabel(requestUserSport)} non compatibile con gruppo ${sportLabel(group.sport)}.`
      );
      return;
    }

    await updateDoc(doc(db, "groups", groupId), {
      members: arrayUnion(request.fromUid),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, "groupJoinRequests", request.id), {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      acceptedBy: user?.uid || "",
    });

    await createNotification({
      uid: request.fromUid,
      type: "group_request_accepted",
      title: "Richiesta gruppo accettata",
      message: `La tua richiesta per entrare nel gruppo ${
        group?.name || request.groupName || "Rivalo"
      } è stata accettata.`,
      link: `/groups/${groupId}`,
      createdBy: user?.uid || "",
      metadata: {
        groupId,
        groupName: group?.name || request.groupName || "",
        requestId: request.id,
      },
    });

    setMessage("Richiesta accettata. Membro aggiunto al gruppo.");

    await loadGroup(user?.uid || "");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante l'accettazione della richiesta.");
  }
}

async function rejectJoinRequest(request: JoinRequest) {
  if (accountLocked) {
    setMessage("Profilo non attivo: gestione richieste bloccata.");
    return;
  }

  if (!request.fromUid) {
    setMessage("Richiesta non valida.");
    return;
  }

  setMessage("");

  try {
    const freshProfileSnap = user?.uid
      ? await getDoc(doc(db, "users", user.uid))
      : null;

    const freshProfile = freshProfileSnap?.exists()
      ? (freshProfileSnap.data() as UserProfile)
      : null;

    if (isProfileDeletionRequested(freshProfile)) {
      setAccountLocked(true);
      setMessage("Profilo non attivo: gestione richieste bloccata.");
      return;
    }

    await updateDoc(doc(db, "groupJoinRequests", request.id), {
      status: "rejected",
      rejectedAt: serverTimestamp(),
      rejectedBy: user?.uid || "",
    });

    await createNotification({
      uid: request.fromUid,
      type: "group_request_rejected",
      title: "Richiesta gruppo rifiutata",
      message: `La tua richiesta per entrare nel gruppo ${
        group?.name || request.groupName || "Rivalo"
      } è stata rifiutata.`,
      link: "/groups",
      createdBy: user?.uid || "",
      metadata: {
        groupId,
        groupName: group?.name || request.groupName || "",
        requestId: request.id,
      },
    });

    setMessage("Richiesta rifiutata.");

    await loadGroup(user?.uid || "");
  } catch (error) {
    console.error(error);
    setMessage("Errore durante il rifiuto della richiesta.");
  }
}

  if (!mounted) {
    return null;
  }

  if (loading) {
    return <FullScreenLoader />;
  }

  if (!group) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
        <div className="rounded-3xl border border-red-400/20 bg-red-500/10 px-8 py-5 font-black text-red-200">
          Gruppo non trovato.
        </div>
      </main>
    );
  }

  if (sportMismatch) {
    return (
      <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
        <Background />

        <section className="relative z-10 mx-auto max-w-2xl">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
          >
            <ArrowLeft size={17} />
            Torna ai gruppi
          </Link>

          <div className="mt-8 rounded-[2rem] border border-red-400/20 bg-red-500/10 p-7 text-center">
            <div className="text-3xl font-black text-red-100">
              Gruppo non compatibile
            </div>

            <p className="mt-4 leading-7 text-slate-300">
              Questo gruppo è dedicato a {sportLabel(group.sport)}, mentre il tuo profilo attivo è {sportLabel(userSport)}.
              Per usare questo sport è necessario un profilo sportivo separato.
            </p>
          </div>
        </section>
      </main>
    );
  }

 const rankedMembers = [...memberProfiles].sort((a, b) => {
  const matchesA = Number(a.matchesPlayed || 0);
  const matchesB = Number(b.matchesPlayed || 0);

  const hasPlayedA = matchesA > 0 ? 1 : 0;
  const hasPlayedB = matchesB > 0 ? 1 : 0;

  return (
    hasPlayedB - hasPlayedA ||
    Number(b.rivalScore || 1000) - Number(a.rivalScore || 1000) ||
    Number(b.wins || 0) - Number(a.wins || 0) ||
    Number(b.mvp || 0) - Number(a.mvp || 0) ||
    matchesB - matchesA ||
    Number(b.goals || 0) - Number(a.goals || 0) ||
    Number(b.assists || 0) - Number(a.assists || 0)
  );
});

  const rankedGroupTeams = [...groupTeams].sort((a, b) => {
    const pointsA = Number(a.wins || 0) * 3 + Number(a.draws || 0);
    const pointsB = Number(b.wins || 0) * 3 + Number(b.draws || 0);

    const goalDiffA = Number(a.goalsFor || 0) - Number(a.goalsAgainst || 0);
    const goalDiffB = Number(b.goalsFor || 0) - Number(b.goalsAgainst || 0);

    return (
      pointsB - pointsA ||
      goalDiffB - goalDiffA ||
      Number(b.goalsFor || 0) - Number(a.goalsFor || 0) ||
      Number(b.wins || 0) - Number(a.wins || 0)
    );
  });

  const officialGroupMatches = groupMatches.filter(
    (match) =>
      match.status === "ufficiale" || match.resultStatus === "confermato"
  ).length;

  const pendingGroupMatches = groupMatches.filter(
    (match) =>
      match.status === "in_attesa_conferma" ||
      match.resultStatus === "proposto"
  ).length;
  const canManageGroup =
  !accountLocked &&
  (user?.uid === group.ownerId || Boolean(group.admins?.includes(user?.uid || "")));

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 mx-auto w-full max-w-7xl min-w-0 px-3 py-8 sm:px-5">
        <Link
          href="/groups"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna ai gruppi
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur">
          <div className="relative overflow-hidden p-8 md:p-10">
            <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute bottom-[-120px] left-[-100px] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[.22em] text-cyan-200">
                  {sportLabel(group.sport)}
                </div>

                <h1 className="mt-5 break-words text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
                  {group.name}
                </h1>

                <div className="mt-5 flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-300">
                  <div className="flex items-center gap-2">
                    <MapPin size={17} className="text-fuchsia-300" />
                    {group.city}
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {formatModeLabel(group.mode)}
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[.04] px-4 py-2">
                    {formatPrivacyLabel(group.privacy)}
                  </div>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat value={String(group.members?.length || 0)} label="Membri" />
                <Stat value={String(groupMatches.length)} label="Partite" />
                <Stat value={String(officialGroupMatches)} label="Ufficiali" />
                <Stat value={String(pendingGroupMatches)} label="Da confermare" />
              </div>
            </div>
          </div>
        </section>

        {accountLocked && (
          <div className="mt-6 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
            {getAccountLockedMessage()}
          </div>
        )}

        <section className="mt-8 grid gap-5 lg:grid-cols-4">
          <ActionCard
            href={accountLocked ? undefined : `/match?groupId=${groupId}`}
            icon={<CalendarDays />}
            title="Crea partita"
            text={accountLocked ? "Azione non disponibile per profilo non attivo." : "Organizza match del gruppo."}
          />

          <ActionCard
            href="#classifica-gruppo"
            icon={<Trophy />}
            title="Classifica"
            text="Ranking squadre e singoli."
          />

          <ActionCard
            href="#match-gruppo"
            icon={<ShieldCheck />}
            title="FairPlay"
            text="Conferma risultati ufficiali."
          />

          <ActionCard
            href="#aggiungi-membro"
            icon={<Users />}
            title="Invita amici"
            text="Espandi la community."
          />
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <div id="classifica-gruppo">
            <Panel
              title="Classifica gruppo"
              subtitle="Ranking interno dei membri basato su RivalScore, vittorie e MVP."
            >
              <div className="space-y-3">
                {rankedMembers.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5 text-slate-300">
                    Nessun membro visibile.
                  </div>
                ) : (
                  rankedMembers.map((member, index) => (
                    <div
                      key={member.uid}
                      className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-[#061126]/80 p-4 xl:flex-row xl:items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/20 bg-cyan-400/10 text-sm font-black text-cyan-200">
                          #{index + 1}
                        </div>

                        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-cyan-400/10">
                          {getProfilePhoto(member) ? (
                            <img
                              src={getProfilePhoto(member)}
                              alt="Membro"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <Users className="text-cyan-200" size={20} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate font-black">
                            {getProfileName(member)}
                          </div>

                          <div className="truncate text-xs text-slate-400">
                            {getProfileSubtitle(member)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6 xl:ml-auto">
                        <MiniRankStat label="RS" value={member.rivalScore || 1000} />
                        <MiniRankStat label="V" value={member.wins || 0} />
                        <MiniRankStat label="MVP" value={member.mvp || 0} />
                        <MiniRankStat label="G" value={member.matchesPlayed || 0} />
                        <MiniRankStat label="Gol" value={member.goals || 0} />
                        <MiniRankStat label="Ast" value={member.assists || 0} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>
          </div>
          { canManageGroup && (
          <div id="aggiungi-membro">
            <Panel
              title="Aggiungi membro"
              subtitle="Cerca un utente Rivalo tramite email, nickname o nome."
            >
              <form onSubmit={addMemberToGroup} className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
                  <input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Email, nickname o nome utente"
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={addingMember || accountLocked}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
                >
                  {addingMember ? "Aggiunta..." : "Aggiungi al gruppo"}
                  <ChevronRight size={20} />
                </button>

                {message && (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-200">
                    {message}
                  </div>
                )}
              </form>
          </Panel>
  </div>
)}
        </section>

        {canManageGroup && (
  <section className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
    <div className="mb-5">
      <div className="text-sm font-black uppercase tracking-[.25em] text-cyan-300">
        Richieste ingresso
      </div>

      <h2 className="mt-2 text-3xl font-black">
        Utenti in attesa
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        Accetta o rifiuta le richieste inviate dai gruppi pubblici.
      </p>
    </div>

    {joinRequests.length === 0 ? (
      <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5 text-slate-300">
        Nessuna richiesta in attesa.
      </div>
    ) : (
      <div className="space-y-3">
        {joinRequests.map((request) => (
          <div
            key={request.id}
            className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-[#061126]/80 p-5 sm:flex-row sm:items-center"
          >
            <div>
              <div className="text-xl font-black">
                {request.fromName || "Rivalo Player"}
              </div>

              <div className="mt-1 text-sm text-slate-400">
                Vuole entrare nel gruppo.
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => acceptJoinRequest(request)}
                disabled={accountLocked}
                className="rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-200 disabled:opacity-60"
              >
                Accetta
              </button>

              <button
                type="button"
                onClick={() => rejectJoinRequest(request)}
                disabled={accountLocked}
                className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-sm font-black text-red-200 disabled:opacity-60"
              >
                Rifiuta
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
)}

        <section
          id="match-gruppo"
          className="mt-8 rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur"
        >
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                Match gruppo
              </div>

              <h2 className="mt-2 text-3xl font-black">Partite collegate</h2>

              <p className="mt-2 text-sm text-slate-400">
                Qui trovi solo i match collegati a questo gruppo.
              </p>
            </div>

            {accountLocked ? (
              <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-5 py-3 text-sm font-black text-yellow-100">
                Creazione match bloccata
              </div>
            ) : (
              <Link
                href={`/match?groupId=${groupId}`}
                className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-black text-cyan-200"
              >
                Crea match gruppo
              </Link>
            )}
          </div>

          {groupMatches.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5 text-slate-300">
              Nessun match collegato a questo gruppo.
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {groupMatches.map((match) => (
                <Link
                  key={match.id}
                  href={`/match/${match.id}`}
                  className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5 transition hover:border-cyan-400/30"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="truncate text-xl font-black">
                        {match.name || "Match Rivalo"}
                      </div>

                      <div className="mt-2 text-sm text-slate-400">
                        {match.city || "Città non inserita"} ·{" "}
                        {match.field || "Campo non inserito"}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        {match.date || "Data"} · {match.time || "Ora"}
                      </div>
                    </div>

                    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                      {match.resultStatus || match.status || "programmata"}
                    </div>
                  </div>

                  {typeof match.homeScore === "number" &&
                    typeof match.awayScore === "number" && (
                      <div className="mt-4 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-2 text-sm font-black text-lime-200">
                        Risultato: {match.homeScore} - {match.awayScore}
                      </div>
                    )}
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <Panel
            title="Squadre del gruppo"
            subtitle="Crea squadre stabili da usare nei match, tornei e campionati."
          >
            <div className="space-y-3">
              {rankedGroupTeams.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5 text-slate-300">
                  Nessuna squadra creata.
                </div>
              ) : (
                rankedGroupTeams.map((team, index) => {
                  const teamMembers = memberProfiles.filter((member) =>
                    team.members?.includes(member.uid)
                  );

                  const captainProfile = memberProfiles.find(
                    (member) => member.uid === team.captainId
                  );

                  const displayCaptain =
                    team.captainName || getProfileName(captainProfile);

                  const canManageSelectedTeam =
                    !accountLocked &&
                    canManageTeam({
                      userId: user?.uid,
                      group,
                      team,
                    });

                  const availableTeamMembers = memberProfiles.filter(
                    (member) =>
                      !team.members?.includes(member.uid) &&
                      !isProfileDeletionRequested(member)
                  );

                  const points =
                    Number(team.wins || 0) * 3 + Number(team.draws || 0);

                  const goalDifference =
                    Number(team.goalsFor || 0) -
                    Number(team.goalsAgainst || 0);

                  return (
                    <div
                      key={team.id}
                      className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5"
                    >
                      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-lime-400/20 bg-lime-400/10 text-sm font-black text-lime-200">
                              #{index + 1}
                            </div>

                            <div className="text-xl font-black">
                              {team.name || "Squadra Rivalo"}
                            </div>
                          </div>

                          <div className="mt-2 text-sm text-slate-400">
                            {team.sport || group.sport} ·{" "}
                            {team.members?.length || 0} membri · {points} punti
                          </div>

                          <div className="mt-2 inline-flex rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-1 text-xs font-black text-yellow-100">
                            Capitano: {displayCaptain}
                          </div>
                        </div>

                        <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                          {team.matchesPlayed || 0} match
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-7">
                        <MiniRankStat label="G" value={team.matchesPlayed || 0} />
                        <MiniRankStat label="V" value={team.wins || 0} />
                        <MiniRankStat label="N" value={team.draws || 0} />
                        <MiniRankStat label="P" value={team.losses || 0} />
                        <MiniRankStat label="GF" value={team.goalsFor || 0} />
                        <MiniRankStat label="GS" value={team.goalsAgainst || 0} />
                        <MiniRankStat label="DR" value={goalDifference} />
                      </div>

                      <div className="mt-5 space-y-2">
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                          Rosa squadra
                        </div>

                        {teamMembers.length === 0 ? (
                          <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-400">
                            Nessun membro nella squadra.
                          </div>
                        ) : (
                          teamMembers.map((member) => (
                            <div
                              key={member.uid}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold"
                            >
                              <span>{getProfileName(member)}</span>

                              {member.uid === team.captainId && (
                                <span className="rounded-lg border border-yellow-300/20 bg-yellow-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100">
                                  Capitano
                                </span>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {canManageSelectedTeam && (
  <div className="mt-5">
    <div className="mb-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
      Aggiungi membro
    </div>

    {availableTeamMembers.length === 0 ? (
      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-400">
        Tutti i membri del gruppo sono già in questa squadra.
      </div>
    ) : (
      <select
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) {
            addMemberToTeam(team.id, e.target.value);
            e.target.value = "";
          }
        }}
        className="w-full rounded-2xl border border-white/10 bg-[#020617] px-4 py-3 text-white outline-none"
      >
        <option value="" className="bg-[#020617] text-white">
          Seleziona membro
        </option>

        {availableTeamMembers.map((member) => (
          <option
            key={member.uid}
            value={member.uid}
            className="bg-[#020617] text-white"
          >
            {getProfileName(member)}
          </option>
        ))}
      </select>
    )}
  </div>
)}

                      {!canManageSelectedTeam && (
                        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-slate-400">
                          Solo capitano, proprietario o admin del gruppo possono modificare questa squadra.
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Panel>

          {canManageGroup && (
  <Panel
    title="Crea squadra"
    subtitle="Chi crea la squadra diventa capitano e può gestire la rosa."
  >
            <form onSubmit={createGroupTeam} className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#061126]/80 px-4 py-4">
                <input
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Nome squadra"
                  className="w-full bg-transparent outline-none placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={creatingTeam || accountLocked}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {creatingTeam ? "Creazione..." : "Crea squadra"}
                <ChevronRight size={20} />
              </button>
            </form>
          </Panel>
)}
        </section>

        <section className="mt-8 grid gap-5 lg:grid-cols-[1fr_.9fr]">
          <Panel
            title="Campionato del gruppo"
            subtitle="Stagioni competitive, premi e ranking."
          >
            <div className="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-500/[.06] p-5">
              <div className="text-sm font-black uppercase tracking-[.22em] text-fuchsia-300">
                Stagione gruppo
              </div>

              <h3 className="mt-3 text-3xl font-black">Campionato Rivalo</h3>

              <p className="mt-3 max-w-2xl leading-7 text-slate-300">
                Gestisci il campionato del gruppo con ranking, premi, MVP e statistiche dedicate.
              </p>

              <button
                disabled={accountLocked}
                className="mt-5 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                {accountLocked ? "Azione bloccata" : "Gestisci campionato"}
                <ChevronRight size={20} />
              </button>
            </div>
          </Panel>

          <Panel title="Attività gruppo" subtitle="Partite, risultati e notifiche.">
            <div className="space-y-4">
              <Activity
                title={
                  groupMatches.length === 0
                    ? "Nessuna partita ancora"
                    : `${groupMatches.length} partite collegate`
                }
                text={
                  groupMatches.length === 0
                    ? "Crea il primo match del gruppo."
                    : "I match del gruppo sono visibili nella sezione dedicata."
                }
              />

              <Activity
                title="Classifica pronta"
                text="Il ranking si aggiorna dopo le prime partite confermate."
              />

              <Activity
                title="FairPlay attivo"
                text="Risultati ufficiali solo dopo conferma."
              />
            </div>
          </Panel>
        </section>
      </section>
    </main>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_4%,rgba(34,211,238,.16),transparent_28%),radial-gradient(circle_at_88%_8%,rgba(217,70,239,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[.04] p-5 text-center">
      <div className="text-3xl font-black text-cyan-300">{value}</div>

      <div className="mt-2 text-xs font-black uppercase tracking-[.18em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function ActionCard({
  href,
  icon,
  title,
  text,
}: {
  href?: string;
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  const content = (
    <>
      <div className="text-cyan-300">{icon}</div>

      <h3 className="mt-5 text-2xl font-black">{title}</h3>

      <p className="mt-3 leading-7 text-slate-300">{text}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-[1.8rem] border border-white/10 bg-white/[.04] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/30"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className="rounded-[1.8rem] border border-white/10 bg-white/[.04] p-6 text-left transition hover:-translate-y-1 hover:border-cyan-300/30"
    >
      {content}
    </button>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl backdrop-blur">
      <div className="mb-5">
        <h2 className="text-3xl font-black">{title}</h2>
        <p className="mt-2 text-slate-300">{subtitle}</p>
      </div>

      {children}
    </div>
  );
}

function MiniRankStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-2 py-2">
      <div className="font-black text-cyan-200">{value}</div>
      <div className="mt-1 text-[10px] font-black uppercase text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Activity({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#061126]/80 p-5">
      <div className="font-black">{title}</div>
      <div className="mt-2 leading-7 text-slate-300">{text}</div>
    </div>
  );
}