"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  addDoc,
  collection,
  doc,
  getDoc,
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
  authorId?: string;
  authorName?: string;
  authorPhotoUrl?: string;
  authorAccountStatus?: string;
  authorDeletionRequested?: boolean;
};

type ActivityItem = {
  id: string;
  uid?: string;
  userId?: string;
  createdBy?: string;
  playerId?: string;
  authorId?: string;
  type?: string;
  text?: string;
  title?: string;
  description?: string;
  value?: number;
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

function isRemovedPostAuthor(post: Post) {
  return Boolean(
    post.authorAccountStatus === "deletion_requested" ||
      post.authorAccountStatus === "deleted" ||
      post.authorDeletionRequested
  );
}

function getPostAuthorName(post: Post) {
  if (isRemovedPostAuthor(post)) return "Utente rimosso";

  return post.authorName || "Rivalo Player";
}

function includesCurrentUser(activity: ActivityItem, uid: string) {
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

function isRelevantCommunityPost(post: Post, uid: string, profile: UserProfile | null) {
  if (post.authorId === uid) return true;

  const profileCity = normalize(profile?.city);
  const profileSport = normalize(profile?.mainSport);
  const postCity = normalize(post.city);
  const postSport = normalize(post.sport);

  const cityOk = !profileCity || !postCity || postCity === profileCity;
  const sportOk = !profileSport || !postSport || postSport === profileSport;

  return cityOk && sportOk;
}

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  const [text, setText] = useState("");
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("calcetto");
  const [type, setType] = useState("cerco_giocatore");

  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [accountLocked, setAccountLocked] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);

      const loadedProfile = await loadUserProfile(currentUser.uid);
      setProfile(loadedProfile);
      setAccountLocked(isRemovedProfile(loadedProfile));
      setCity(loadedProfile?.city || "");
      setSport(loadedProfile?.mainSport || "calcetto");

      await Promise.all([
        loadPosts(currentUser.uid, loadedProfile),
        loadActivities(currentUser.uid),
      ]);
    });

    return () => unsub();
  }, []);

  async function loadUserProfile(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));

    if (!snap.exists()) return null;

    return snap.data() as UserProfile;
  }

  async function loadPosts(uid: string, userProfile: UserProfile | null) {
    setLoading(true);

    try {
      const q = query(
        collection(db, "communityPosts"),
        orderBy("createdAt", "desc"),
        limit(80)
      );

      const snap = await getDocs(q);

      const allPosts = await Promise.all(
        snap.docs.map(async (d) => {
          const post = {
            id: d.id,
            ...(d.data() as Omit<Post, "id">),
          };

          if (!post.authorId) return post;

          try {
            const authorSnap = await getDoc(doc(db, "users", post.authorId));

            if (!authorSnap.exists()) return post;

            const authorData = authorSnap.data() as UserProfile & {
              photoUrl?: string;
              photoURL?: string;
            };

            const removedAuthor = isRemovedProfile(authorData);

            return {
              ...post,
              authorName: removedAuthor
                ? "Utente rimosso"
                : authorData.nickname ||
                  authorData.name ||
                  post.authorName ||
                  "Rivalo Player",
              authorPhotoUrl: removedAuthor
                ? ""
                : authorData.photoUrl || authorData.photoURL || post.authorPhotoUrl || "",
              authorAccountStatus: authorData.accountStatus || post.authorAccountStatus || "",
              authorDeletionRequested: Boolean(
                authorData.deletionRequested || post.authorDeletionRequested
              ),
            };
          } catch {
            return post;
          }
        })
      );

      setPosts(
        allPosts.filter((post) =>
          isRelevantCommunityPost(post, uid, userProfile)
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadActivities(uid: string) {
    setActivitiesLoading(true);

    try {
      const q = query(
        collection(db, "activities"),
        orderBy("createdAt", "desc"),
        limit(80)
      );

      const snap = await getDocs(q);

      const allActivities = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<ActivityItem, "id">),
      }));

      setActivities(
        allActivities.filter((activity) =>
          includesCurrentUser(activity, uid)
        )
      );
    } finally {
      setActivitiesLoading(false);
    }
  }

  async function publishPost(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !text.trim()) return;

    if (accountLocked) {
      setMessage("Profilo non attivo: pubblicazione bloccata.");
      return;
    }

    const freshProfile = await loadUserProfile(user.uid);

    if (isRemovedProfile(freshProfile)) {
      setAccountLocked(true);
      setMessage("Profilo non attivo: pubblicazione bloccata.");
      return;
    }

    await addDoc(collection(db, "communityPosts"), {
      text,
      city,
      sport,
      type,
      authorId: user.uid,
      authorName:
        freshProfile?.nickname ||
        freshProfile?.name ||
        user.displayName ||
        "Rivalo Player",
      authorAccountStatus: freshProfile?.accountStatus || "active",
      authorDeletionRequested: Boolean(freshProfile?.deletionRequested),
      reactions: 0,
      comments: 0,
      createdAt: serverTimestamp(),
    });

    setText("");
    await loadPosts(user.uid, profile);
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

            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{profile?.mainSport || sport}</Badge>
              <Badge>{profile?.city || city || "Zona non inserita"}</Badge>
            </div>

            <div className="space-y-4">
              {accountLocked && (
                <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-4 text-sm font-bold leading-6 text-yellow-100">
                  Profilo non attivo: puoi leggere la community, ma non pubblicare nuovi post.
                </div>
              )}

              {message && (
                <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-4 text-sm font-bold leading-6 text-cyan-100">
                  {message}
                </div>
              )}

              <fieldset disabled={accountLocked} className="space-y-4 disabled:opacity-60">
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
                disabled={accountLocked}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-6 py-4 font-black disabled:opacity-60"
              >
                Pubblica
                <Send size={18} />
              </button>
              </fieldset>
            </div>
          </form>

          <div className="space-y-6">
            <section className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/[.05] p-6 shadow-2xl">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-sm font-black uppercase tracking-[.25em] text-cyan-300">
                    <Radio size={17} />
                    Live Feed personale
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
                  Nessuna attività personale ancora. Quando giocherai match o parteciperai a eventi, comparirà qui.
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
                  Nessun post compatibile con la tua zona o il tuo sport.
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
                        {getPostAuthorName(post)}
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
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border bg-black/30 ${style.iconColor}`}>
          {style.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="break-words text-lg font-black">
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
