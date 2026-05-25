"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "../../lib/firebase";

import {
  ArrowLeft,
  Crown,
  Flame,
  Swords,
  Trophy,
} from "lucide-react";

type Activity = {
  id: string;
  type?: string;
  title?: string;
  description?: string;
  createdAt?: any;
};

export default function FeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const q = query(
          collection(db, "activities"),
          orderBy("createdAt", "desc"),
          limit(50)
        );

        const snap = await getDocs(q);

        setActivities(
          snap.docs.map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Activity, "id">),
          }))
        );
      } finally {
        setLoading(false);
      }
    }

    loadFeed();
  }, []);

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
                Attività competitive reali generate automaticamente dai match.
              </p>

            </div>

          </div>

          <div className="p-6">

            {loading ? (

              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Caricamento feed...
              </div>

            ) : activities.length === 0 ? (

              <div className="rounded-2xl border border-white/10 bg-black/20 p-6 text-slate-300">
                Nessuna attività ancora.
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

        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/10 bg-black/20">
          {style.icon}
        </div>

        <div className="flex-1">

          <div className="text-xl font-black">
            {activity.title || "Nuova attività Rivalo"}
          </div>

          <div className="mt-2 text-sm text-slate-300">
            {activity.description || "Evento competitivo registrato"}
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