"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";

import {
  ArrowLeft,
  Crown,
  Flame,
  MessageCircle,
  Radio,
  Search,
  Send,
  Swords,
  Trophy,
  Users,
  CalendarDays,
  Zap,
} from "lucide-react";

type Post = {
  id: string;
  text?: string;
  type?: string;
  city?: string;
  sport?: string;
  authorName?: string;
};

type ActivityItem = {
  id: string;
  uid?: string;
  type?: string;
  text?: string;
  title?: string;
  description?: string;
  value?: number;
  createdAt?: any;
};

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [text, setText] = useState("");
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [type, setType] = useState("cerco_giocatore");

  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      await Promise.all([
        loadPosts(),
        loadActivities(),
      ]);
    });

    return () => unsub();
  }, []);

  async function loadPosts() {
    setLoading(true);

    try {
      const q = query(
        collection(db, "communityPosts"),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(q);

      setPosts(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Post, "id">),
        }))
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities() {
    setActivitiesLoading(true);

    try {
      const q = query(
        collection(db, "activities"),
        orderBy("createdAt", "desc"),
        limit(30)
      );

      const snap = await getDocs(q);

      setActivities(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ActivityItem, "id">),
        }))
      );
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function publishPost(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !text.trim()) return;

    await addDoc(collection(db, "communityPosts"), {
      text,
      city,
      sport,
      type,
      authorId: user.uid,
      authorName: user.displayName || "Rivalo Player",
      reactions: 0,
      comments: 0,
      createdAt: serverTimestamp(),
    });

    setText("");
    await loadPosts();
  }

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <section className="mx-auto max-w-7xl">

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <div className="mt-8 grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">

          <form
            onSubmit={publishPost}
            className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl"
          >
            <div className="mb-6 flex items-center gap-3">
              <MessageCircle className="text-cyan-300" />

              <div>
                <h1 className="text-3xl font-black">
                  Community
                </h1>

                <p className="mt-1 text-slate-400">
                  Trova giocatori, squadre e sfide nella tua città.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <Field label="Tipo richiesta">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-transparent outline-none"
                >
                  <option value="cerco_giocatore">
                    Cerco giocatore
                  </option>

                  <option value="cerco_squadra">
                    Cerco squadra avversaria
                  </option>

                  <option value="cerco_match">
                    Cerco match
                  </option>

                  <option value="post">
                    Post community
                  </option>
                </select>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Città">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Milano, Lecce..."
                    className="w-full bg-transparent outline-none placeholder:text-slate-500"
                  />
                </Field>

                <Field label="Sport">
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="w-full bg-transparent outline-none"
                  >
                    <option value="calcetto">
                      Calcetto
                    </option>

                    <option value="padel">
                      Padel
                    </option>

                    <option value="tennis">
                      Tennis
                    </option>
                  </select>
                </Field>
              </div>

              <Field label="Messaggio">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Esempio: siamo in 5, cerchiamo squadra avversaria stasera..."
                  className="min-h-[140px] w-full resize-none bg-transparent outline-none placeholder:text-slate-500"
                />
              </Field>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black"
              >
                Pubblica
                <Send size={18} />
              </button>
            </div>
          </form>

          <div className="space-y-6">

            <section className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/[.05] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                    <Radio size={17} />
                    Live Feed
                  </div>

                  <h2 className="mt-2 text-3xl font-black">
                    Attività Rivalo
                  </h2>
                </div>

                <Zap className="text-yellow-300" />
              </div>

              {activitiesLoading ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                  Caricamento attività...
                </div>
              ) : activities.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                  Nessuna attività live ancora. Conferma un match per generare il feed automatico.
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                    Feed Rivalo
                  </div>

                  <h2 className="mt-2 text-3xl font-black">
                    Richieste e post
                  </h2>
                </div>

                <Search className="text-cyan-300" />
              </div>

              {loading ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                  Caricamento...
                </div>
              ) : posts.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-400">
                  Nessun post ancora.
                </div>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="rounded-2xl border border-white/10 bg-[#071126] p-5"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge>
                          {post.type}
                        </Badge>

                        <Badge>
                          {post.sport}
                        </Badge>

                        <Badge>
                          {post.city || "Italia"}
                        </Badge>
                      </div>

                      <div className="text-lg font-bold">
                        {post.text}
                      </div>

                      <div className="mt-4 flex items-center gap-3 text-sm text-slate-400">
                        <Users size={16} />
                        {post.authorName || "Rivalo Player"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

          </div>

        </div>
      </section>
    </main>
  );
}

function ActivityCard({
  activity,
}: {
  activity: ActivityItem;
}) {
  const style = getActivityStyle(activity.type);

  const text =
    activity.text ||
    activity.title ||
    activity.description ||
    "Nuova attività Rivalo";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-5 ${style.wrapper}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_60%)]" />

      <div className="relative flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border bg-black/30 ${style.iconColor}`}>
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-lg font-black">
            {text}
          </div>

          <div className="mt-1 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {activity.type || "activity"}
          </div>
        </div>

        {typeof activity.value === "number" && activity.value !== 0 && (
          <div
            className={`text-2xl font-black ${
              activity.value > 0
                ? "text-lime-300"
                : "text-red-300"
            }`}
          >
            {activity.value > 0 ? "+" : ""}
            {activity.value}
          </div>
        )}
      </div>
    </div>
  );
}

function getActivityStyle(type?: string) {
  if (type === "mvp") {
    return {
      icon: <Crown size={20} />,
      iconColor: "border-yellow-300/20 text-yellow-300",
      wrapper:
        "border-yellow-300/20 bg-gradient-to-br from-yellow-500/20 to-orange-500/10",
    };
  }

  if (type === "match_win") {
    return {
      icon: <Trophy size={20} />,
      iconColor: "border-lime-300/20 text-lime-300",
      wrapper:
        "border-lime-300/20 bg-gradient-to-br from-lime-500/20 to-cyan-500/10",
    };
  }

  if (type === "streak") {
    return {
      icon: <Flame size={20} />,
      iconColor: "border-orange-300/20 text-orange-300",
      wrapper:
        "border-orange-300/20 bg-gradient-to-br from-orange-500/20 to-red-500/10",
    };
  }

  if (type === "rivalry") {
    return {
      icon: <Swords size={20} />,
      iconColor: "border-red-300/20 text-red-300",
      wrapper:
        "border-red-300/20 bg-gradient-to-br from-red-500/20 to-orange-500/10",
    };
  }

  if (type === "event") {
    return {
      icon: <CalendarDays size={20} />,
      iconColor: "border-fuchsia-300/20 text-fuchsia-300",
      wrapper:
        "border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/10",
    };
  }

  return {
    icon: <Zap size={20} />,
    iconColor: "border-cyan-300/20 text-cyan-300",
    wrapper:
      "border-cyan-300/20 bg-gradient-to-br from-cyan-500/20 to-blue-500/10",
  };
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-black text-slate-300">
        {label}
      </span>

      <div className="rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-4">
        {children}
      </div>
    </label>
  );
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