"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import {
  ArrowLeft,
  Crown,
  Flame,
  Swords,
  Trophy,
} from "lucide-react";

type Activity = {
  id: string;
  uid?: string;
  userId?: string;
  createdBy?: string;
  playerId?: string;
  authorId?: string;
  type?: string;
  title?: string;
  description?: string;
  text?: string;
  sport?: string;
  city?: string;
  userIds?: string[];
  players?: any[];
  participants?: any[];
  createdAt?: any;
};

type UserProfile = {
  name?: string;
  nickname?: string;
  city?: string;
  mainSport?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

function normalize(value?: string) {
  return (value || "").toLowerCase().trim();
}

function isRemovedProfile(profile?: UserProfile | null) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

function getActivityOwnerId(activity: Activity) {
  return (
    activity.uid ||
    activity.userId ||
    activity.createdBy ||
    activity.playerId ||
    activity.authorId ||
    ""
  );
}

function sanitizeRemovedText(value?: string, profile?: UserProfile | null) {
  if (!value || !isRemovedProfile(profile)) return value || "";

  const names = [profile?.name, profile?.nickname]
    .filter(Boolean)
    .map((item) => String(item));

  return names.reduce((current, name) => {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return current.replace(new RegExp(escaped, "gi"), "Utente rimosso");
  }, value);
}

function includesCurrentUser(activity: Activity, uid: string) {
  if (!uid) return false;

  if (
    activity.uid === uid ||
    activity.userId === uid ||
    activity.createdBy === uid ||
    activity.playerId === uid ||
    activity.authorId === uid
  ) {
    return true;
  }

  if (Array.isArray(activity.userIds) && activity.userIds.includes(uid)) {
    return true;
  }

  const possibleArrays = [activity.players, activity.participants];

  return possibleArrays.some((items) =>
    Array.isArray(items)
      ? items.some((item) => {
          if (typeof item === "string") return item === uid;

          return (
            item?.uid === uid ||
            item?.id === uid ||
            item?.userId === uid ||
            item?.playerId === uid
          );
        })
      : false
  );
}

export default function FeedPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadFeed(currentUser.uid);
    });

    return () => unsub();
  }, []);

  async function loadFeed(uid: string) {
    setLoading(true);

    try {
      const userSnap = await getDoc(doc(db, "users", uid));

      const userProfile = userSnap.exists()
        ? (userSnap.data() as UserProfile)
        : null;

      setProfile(userProfile);

      const q = query(
        collection(db, "activities"),
        orderBy("createdAt", "desc"),
        limit(80)
      );

      const snap = await getDocs(q);

      const allActivities = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Activity, "id">),
      }));

      const personalActivities = allActivities.filter((activity) =>
        includesCurrentUser(activity, uid)
      );

      const enrichedActivities = await Promise.all(
        personalActivities.map(async (activity) => {
          const ownerId = getActivityOwnerId(activity) || uid;

          try {
            const ownerSnap = await getDoc(doc(db, "users", ownerId));
            const ownerProfile = ownerSnap.exists()
              ? (ownerSnap.data() as UserProfile)
              : userProfile;

            return {
              ...activity,
              title: sanitizeRemovedText(activity.title, ownerProfile),
              text: sanitizeRemovedText(activity.text, ownerProfile),
              description: sanitizeRemovedText(activity.description, ownerProfile),
            };
          } catch {
            return activity;
          }
        })
      );

      setActivities(enrichedActivities);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={18} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04]">
          <div className="relative overflow-hidden border-b border-white/10 p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative">
              <div className="text-sm font-black uppercase tracking-[0.35em] text-cyan-300">
                Rivalo Activity
              </div>

              <h1 className="mt-3 text-5xl font-black">
                Feed Live
              </h1>

              <p className="mt-4 max-w-2xl text-slate-300">
                Attività competitive collegate al tuo profilo, ai tuoi match e ai tuoi gruppi.
              </p>

              {profile && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <Badge>{profile.mainSport || "Sport"}</Badge>
                  <Badge>{profile.city || "Zona non inserita"}</Badge>
                  {isRemovedProfile(profile) && <Badge>Profilo non attivo</Badge>}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento feed...
              </div>
            ) : activities.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                <Trophy className="mx-auto text-cyan-300" size={36} />

                <div className="mt-4 text-2xl font-black">
                  Nessuna attività personale
                </div>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                  Quando giocherai match, riceverai MVP, entrerai in gruppi o parteciperai a eventi,
                  le tue attività compariranno qui.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {activities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function ActivityCard({
  activity,
}: {
  activity: Activity;
}) {
  const style = getActivityStyle(activity.type);
  const title = activity.title || activity.text || "Nuova attività Rivalo";
  const description = activity.description || "Evento competitivo registrato";

  return (
    <div
      className={`
        relative overflow-hidden rounded-[2rem]
        border bg-gradient-to-br p-6
        transition duration-300 hover:scale-[1.01]
        ${style.color}
      `}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-black/20">
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="break-words text-xl font-black">
            {title}
          </div>

          <div className="mt-2 break-words text-sm text-slate-300">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}

function getActivityStyle(type?: string) {
  if (type === "mvp") {
    return {
      icon: <Crown size={22} />,
      color:
        "from-yellow-500/20 to-amber-500/10 border-yellow-300/20 text-yellow-200",
    };
  }

  if (type === "streak") {
    return {
      icon: <Flame size={22} />,
      color:
        "from-orange-500/20 to-red-500/10 border-orange-400/20 text-orange-300",
    };
  }

  if (type === "rivalry") {
    return {
      icon: <Swords size={22} />,
      color:
        "from-red-500/20 to-pink-500/10 border-red-400/20 text-red-300",
    };
  }

  if (type === "match_confirmed") {
    return {
      icon: <Trophy size={22} />,
      color:
        "from-cyan-500/20 to-blue-500/10 border-cyan-400/20 text-cyan-300",
    };
  }

  return {
    icon: <Trophy size={22} />,
    color:
      "from-cyan-500/20 to-blue-500/10 border-cyan-400/20 text-cyan-300",
  };
}

function Badge({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-black uppercase text-cyan-200">
      {children}
    </span>
  );
}
