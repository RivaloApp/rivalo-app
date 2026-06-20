"use client";

import FullScreenLoader from "../../components/FullScreenLoader";
import PlayerCard from "../../components/cards/PlayerCard";
import RivaloLogo from "../../components/RivaloLogo";
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
  where,
} from "firebase/firestore";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "../../lib/firebase";
import {
  Bell,
  Medal,
  Globe2,
  CalendarDays,
  Crown,
  Grid2X2,
  LogOut,
  MessageCircle,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  Trophy,
  UserRound,
  Users,
  CircleDot,
  ArrowRight,
  Swords,
  Radio,
  Search,
  PlayCircle,
  Menu,
  X,
} from "lucide-react";

type UserProfile = {
  uid?: string;
  name?: string;
  nickname?: string;
  mainSport?: string;
  rivalScore?: number;
  level?: number;
  xp?: number;
  wins?: number;
  losses?: number;
  draws?: number;
  matchesPlayed?: number;
  goals?: number;
  assists?: number;
  mvp?: number;
  winStreak?: number;
  role?: string;
  goalsConceded?: number;
  cleanSheets?: number;
  penaltiesSaved?: number;
  sport?: string;
  photoURL?: string;
  photoUrl?: string;
  onboardingCompleted?: boolean;
  profileCompleted?: boolean;
  accountStatus?: string;
  deletionRequested?: boolean;
};

type NavItem = {
  href: string;
  icon: React.ReactNode;
  text: string;
  subtitle?: string;
  sportOnly?: "calcetto";
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    icon: <Grid2X2 />,
    text: "Dashboard",
    subtitle: "Home privata Rivalo",
  },
  {
    href: "/leaderboard",
    icon: <Globe2 />,
    text: "Classifica",
    subtitle: "Ranking globale",
  },
  {
    href: "/goalkeepers",
    icon: <ShieldCheck />,
    text: "Portieri",
    subtitle: "Ranking portieri calcetto",
    sportOnly: "calcetto",
  },
  {
    href: "/match",
    icon: <CircleDot />,
    text: "Match",
    subtitle: "Crea e gestisci partite",
  },
  {
    href: "/groups",
    icon: <Users />,
    text: "Gruppi",
    subtitle: "Community e squadre",
  },
  {
    href: "/opponents",
    icon: <Search />,
    text: "Matchmaking",
    subtitle: "Trova match, player e avversari",
  },
  {
    href: "/messages",
    icon: <MessageCircle />,
    text: "Messaggi",
    subtitle: "Chat e organizzazione match",
  },
  {
    href: "/events",
    icon: <CalendarDays />,
    text: "Eventi",
    subtitle: "Tornei e campionati",
  },
  {
    href: "/seasons",
    icon: <Medal />,
    text: "Stagioni",
    subtitle: "Ranking stagionale",
  },
  {
    href: "/community",
    icon: <MessageCircle />,
    text: "Community",
    subtitle: "Feed e post",
  },
  {
    href: "/feed",
    icon: <Radio />,
    text: "Feed live",
    subtitle: "Attività Rivalo",
  },
  {
    href: "/tutorial",
    icon: <PlayCircle />,
    text: "Tutorial",
    subtitle: "Guida rapida Rivalo",
  },
  {
    href: "/rivalries",
    icon: <Swords />,
    text: "Rivalità",
    subtitle: "Sfide storiche",
  },
  {
    href: "/profile",
    icon: <UserRound />,
    text: "Profilo",
    subtitle: "Card e statistiche",
  },
  {
    href: "/notifications",
    icon: <Bell />,
    text: "Notifiche",
    subtitle: "Inviti e aggiornamenti",
  },
  {
    href: "/settings",
    icon: <Settings />,
    text: "Impostazioni",
    subtitle: "Account e preferenze",
  },
];

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

function isOperationalHref(href: string) {
  return (
    href === "/match" ||
    href === "/groups" ||
    href === "/opponents" ||
    href === "/events"
  );
}

function getPublicUserName(profile?: UserProfile | null) {
  if (isProfileDeletionRequested(profile)) return "Utente rimosso";

  return profile?.name || profile?.nickname || "Player";
}

function normalizeCalcettoRole(value?: string) {
  const role = (value || "").toLowerCase().trim();

  if (role.includes("port")) return "portiere";
  if (role.includes("dif")) return "difensore";
  if (role.includes("cent")) return "centrocampista";
  if (role.includes("att")) return "attaccante";
  if (role.includes("jolly")) return "jolly";

  return role;
}

function isGoalkeeperProfile(mainSport?: string, role?: string) {
  return normalizeSport(mainSport) === "calcetto" &&
    normalizeCalcettoRole(role) === "portiere";
}

function isUnreadMessageForUser(
  messageData: {
    createdBy?: string;
    readBy?: string[];
  },
  uid: string
) {
  if (!uid) return false;
  if (messageData.createdBy === uid) return false;

  return (
    !Array.isArray(messageData.readBy) ||
    !messageData.readBy.includes(uid)
  );
}

async function getUnreadMessagesCount(uid: string) {
  const conversationsQuery = query(
    collection(db, "conversations"),
    where("participantIds", "array-contains", uid)
  );

  const conversationsSnap = await getDocs(conversationsQuery);

  let nextUnreadMessagesCount = 0;

  for (const conversationSnap of conversationsSnap.docs) {
    const conversationData = conversationSnap.data() as {
      participantIds?: string[];
    };

    if (!conversationData.participantIds?.includes(uid)) continue;

    const messagesSnap = await getDocs(
      collection(db, "conversations", conversationSnap.id, "messages")
    );

    nextUnreadMessagesCount += messagesSnap.docs.filter((messageSnap) =>
      isUnreadMessageForUser(
        messageSnap.data() as {
          createdBy?: string;
          readBy?: string[];
        },
        uid
      )
    ).length;
  }

  return nextUnreadMessagesCount;
}

function getSportDashboardCopy(value?: string, role?: string) {
  const sport = normalizeSport(value);

  if (sport === "padel") {
    return {
      title: "Profilo padel",
      subtitle: "Ranking basato su vittorie, win rate, streak e costanza.",
      scoreLabel: "Padel Score",
      quickLabel: "Match padel",
    };
  }

  if (sport === "tennis") {
    return {
      title: "Profilo tennis",
      subtitle: "Ranking basato su vittorie, win rate, streak, livello e costanza.",
      scoreLabel: "Tennis Score",
      quickLabel: "Match tennis",
    };
  }

  if (isGoalkeeperProfile(sport, role)) {
    return {
      title: "Profilo portiere",
      subtitle: "Ranking basato su clean sheet, gol subiti, rigori parati, vittorie e RivalScore.",
      scoreLabel: "Goalkeeper Score",
      quickLabel: "Match calcetto",
    };
  }

  return {
    title: "Profilo calcetto",
    subtitle: "Ranking basato su vittorie, RivalScore, MVP, gol e assist.",
    scoreLabel: "Football Score",
    quickLabel: "Match calcetto",
  };
}

function getDashboardMetrics({
  mainSport,
  matchesPlayed,
  wins,
  losses,
  draws,
  goals,
  assists,
  mvp,
  winStreak,
  role,
  goalsConceded,
  cleanSheets,
  penaltiesSaved,
}: {
  mainSport: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  mvp: number;
  winStreak: number;
  role: string;
  goalsConceded: number;
  cleanSheets: number;
  penaltiesSaved: number;
}) {
  const sport = normalizeSport(mainSport);
  const winRate =
    matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;

  if (isGoalkeeperProfile(mainSport, role)) {
    const goalsConcededAverage =
      matchesPlayed > 0 ? (goalsConceded / matchesPlayed).toFixed(1) : "0.0";

    return [
      { label: "Partite", value: String(matchesPlayed) },
      { label: "Media GS", value: goalsConcededAverage },
      { label: "Clean Sheet", value: String(cleanSheets) },
      { label: "Rigori parati", value: String(penaltiesSaved) },
    ];
  }

  if (sport === "padel" || sport === "tennis") {
    return [
      { label: "Partite", value: String(matchesPlayed) },
      { label: "Win Rate", value: `${winRate}%` },
      { label: "Streak", value: String(winStreak) },
      { label: sport === "padel" ? "MVP" : "Livello gara", value: String(mvp) },
    ];
  }

  return [
    { label: "Partite", value: String(matchesPlayed) },
    { label: "Sconfitte", value: String(losses) },
    { label: "Gol", value: String(goals) },
    { label: "Assist", value: String(assists) },
  ];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [leaders, setLeaders] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

          if (!data.onboardingCompleted) {
            window.location.href = "/onboarding";
            return;
          }

          setProfile({
            uid: currentUser.uid,
            ...data,
          });
        } else {
          window.location.href = "/onboarding";
          return;
        }

        const q = query(
          collection(db, "users"),
          orderBy("rivalScore", "desc"),
          limit(5)
        );

        const qs = await getDocs(q);

        setLeaders(
          qs.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as UserProfile),
          }))
        );

        const notificationsQuery = query(
          collection(db, "notifications"),
          where("uid", "==", currentUser.uid),
          where("read", "==", false)
        );

        const notificationsSnap = await getDocs(notificationsQuery);

        setUnreadNotificationsCount(notificationsSnap.size);

        setUnreadMessagesCount(await getUnreadMessagesCount(currentUser.uid));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const uid = user.uid;
    let active = true;

    function refreshUnreadMessages() {
      getUnreadMessagesCount(uid)
        .then((count) => {
          if (active) {
            setUnreadMessagesCount(count);
          }
        })
        .catch(() => {
          // Badge best-effort: non blocca la dashboard.
        });
    }

    refreshUnreadMessages();

    window.addEventListener("focus", refreshUnreadMessages);
    window.addEventListener("pageshow", refreshUnreadMessages);

    return () => {
      active = false;
      window.removeEventListener("focus", refreshUnreadMessages);
      window.removeEventListener("pageshow", refreshUnreadMessages);
    };
  }, [user]);

  const displayName = isProfileDeletionRequested(profile)
    ? "Profilo non attivo"
    : profile?.name || user?.displayName || "Player";
  const nickname = isProfileDeletionRequested(profile)
    ? "Storico consultabile"
    : profile?.nickname || "Rivalo Player";
  const rivalScore = profile?.rivalScore ?? 1000;
  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 100;
  const wins = profile?.wins ?? 0;
  const losses = profile?.losses ?? 0;
  const draws = profile?.draws ?? 0;
  const mvp = profile?.mvp ?? 0;
  const matchesPlayed = profile?.matchesPlayed ?? 0;
  const goals = profile?.goals ?? 0;
  const assists = profile?.assists ?? 0;
  const winStreak = profile?.winStreak ?? 0;
  const role = profile?.role || "";
  const goalsConceded = profile?.goalsConceded ?? 0;
  const cleanSheets = profile?.cleanSheets ?? 0;
  const penaltiesSaved = profile?.penaltiesSaved ?? 0;
  const mainSport = profile?.mainSport || profile?.sport || "calcetto";
  const isCalcettoProfile = normalizeSport(mainSport) === "calcetto";
  const photo = isProfileDeletionRequested(profile)
    ? ""
    : profile?.photoURL || profile?.photoUrl || "";
  const goalkeeperProfile = isGoalkeeperProfile(mainSport, role);
  const accountLocked = isProfileDeletionRequested(profile);

  const sportCopy = getSportDashboardCopy(mainSport, role);
  const dashboardMetrics = getDashboardMetrics({
    mainSport,
    matchesPlayed,
    wins,
    losses,
    draws,
    goals,
    assists,
    mvp,
    winStreak,
    role,
    goalsConceded,
    cleanSheets,
    penaltiesSaved,
  });

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#020617] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,.16),transparent_30%),radial-gradient(circle_at_80%_20%,rgba(217,70,239,.14),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_55%,#020617_100%)]" />

        <div className="relative z-10 text-center">
          <div className="text-[42px] font-black uppercase leading-none tracking-[-0.04em] text-white drop-shadow-[0_0_22px_rgba(34,211,238,.22)] sm:text-6xl">
            Rivalo
          </div>

          <div className="mt-3 text-xs font-black uppercase tracking-[0.38em] text-cyan-300 sm:text-sm">
            Own the game
          </div>

          <div className="mx-auto mt-7 h-1.5 w-44 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-2/3 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,.7)]" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <Background />

      <section className="relative z-10 flex min-h-screen">
        <Sidebar accountLocked={accountLocked} mainSport={mainSport} />

        <MobileMenu
          open={mobileMenuOpen}
          accountLocked={accountLocked}
          mainSport={mainSport}
          onClose={() => setMobileMenuOpen(false)}
        />

        <div className="min-w-0 flex-1 overflow-hidden px-3 py-5 sm:px-5 lg:px-8 xl:px-10">
          <div className="mb-6 lg:mb-3">
            <div className="lg:hidden">
              <Link href="/dashboard" className="block w-fit">
                <RivaloLogo />
              </Link>
            </div>

            <div className="mt-4 flex justify-end lg:mt-0">
              <TopIcons
                unreadNotificationsCount={unreadNotificationsCount}
                unreadMessagesCount={unreadMessagesCount}
                onOpenMenu={() => setMobileMenuOpen(true)}
              />
            </div>
          </div>

          <section className="grid min-w-0 gap-7 xl:grid-cols-[1fr_330px] 2xl:grid-cols-[1fr_360px]">
            <div className="grid min-w-0 items-start gap-6 overflow-hidden xl:grid-cols-[310px_1fr] xl:gap-8 2xl:grid-cols-[330px_1fr]">
              <PlayerCard
                name={displayName}
                nickname={nickname}
                rivalScore={rivalScore}
                mainSport={mainSport}
                photo={photo}
                level={level}
                xp={xp}
                wins={wins}
                mvp={mvp}
                matchesPlayed={matchesPlayed}
                goals={goals}
                assists={assists}
                winStreak={winStreak}
                role={role}
                goalsConceded={goalsConceded}
                cleanSheets={cleanSheets}
                penaltiesSaved={penaltiesSaved}
              />

              <div className="min-w-0 overflow-hidden pt-3 sm:pt-5">
                <div className="text-xl font-medium text-white/90 sm:text-2xl">
                  Bentornato,
                </div>

                <h1 className="mt-2 max-w-full break-words text-[2.45rem] font-black uppercase leading-none tracking-tight text-white sm:text-5xl md:text-6xl">
                  {displayName}
                </h1>

                <div className="mt-3 max-w-full break-words text-2xl font-black uppercase text-cyan-300 sm:text-3xl">
                  {nickname}
                </div>

                <div className="mt-3 max-w-[620px] rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold leading-6 text-cyan-100">
                  {sportCopy.title} · {sportCopy.subtitle}
                </div>

                <div className="mt-6 grid max-w-[520px] grid-cols-3 gap-3 sm:mt-9 sm:gap-5">
                  <StatShield
                    tone="purple"
                    value={String(level)}
                    label="Livello"
                    icon={<Star />}
                  />

                  <StatShield
                    tone="cyan"
                    value={String(wins)}
                    label="Vittorie"
                    icon={<Trophy />}
                  />

                  <StatShield
                    tone="orange"
                    value={
                      goalkeeperProfile
                        ? String(cleanSheets)
                        : normalizeSport(mainSport) === "calcetto"
                        ? String(mvp)
                        : String(winStreak)
                    }
                    label={
                      goalkeeperProfile
                        ? "Clean Sheet"
                        : normalizeSport(mainSport) === "calcetto"
                        ? "MVP"
                        : "Streak"
                    }
                    icon={
                      goalkeeperProfile
                        ? <ShieldCheck />
                        : normalizeSport(mainSport) === "calcetto"
                        ? <Crown />
                        : <Star />
                    }
                  />
                </div>

                <div className="mt-6 grid max-w-[680px] grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  {dashboardMetrics.map((metric) => (
                    <SmallMetric
                      key={metric.label}
                      label={metric.label}
                      value={metric.value}
                    />
                  ))}
                </div>
              </div>
            </div>

            <aside className="space-y-5">
              <ScorePanel rivalScore={rivalScore} mainSport={mainSport} role={role} />
              <LevelPanel level={level} xp={xp} mainSport={mainSport} />
            </aside>
          </section>

          <section className="mt-8 border-t border-white/10 pt-6">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              Azioni rapide
            </h2>

            {accountLocked && (
              <div className="mt-5 rounded-2xl border border-yellow-300/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold leading-6 text-yellow-100">
                Profilo non attivo: puoi consultare storico, ranking, profilo e notifiche. Le nuove azioni sono bloccate.
              </div>
            )}

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
              <QuickAction
                href="/leaderboard"
                tone="cyan"
                icon={<Globe2 />}
                title="Classifica mondiale"
                text="Ranking globale Rivalo"
              />

              {isCalcettoProfile && (
                <QuickAction
                  href="/goalkeepers"
                  tone="green"
                  icon={<ShieldCheck />}
                  title="Portieri"
                  text="Classifica portieri calcetto"
                />
              )}

              <QuickAction
                href="/seasons"
                tone="orange"
                icon={<Medal />}
                title="Stagione"
                text="Classifica stagionale"
              />

              <QuickAction
                href="/groups"
                tone="green"
                icon={<Users />}
                title="Gruppi"
                text={accountLocked ? "Azione bloccata" : "Amici e classifiche gruppo"}
                disabled={accountLocked}
              />

              <QuickAction
                href="/opponents"
                tone="green"
                icon={<Search />}
                title="Matchmaking"
                text={accountLocked ? "Azione bloccata" : "Trova match, player e avversari"}
                disabled={accountLocked}
              />

              <QuickAction
                href="/messages"
                tone="blue"
                icon={<MessageCircle />}
                title="Messaggi"
                text="Chat e organizzazione match"
              />

              <QuickAction
                href="/events"
                tone="purple"
                icon={<CalendarDays />}
                title="Eventi"
                text={accountLocked ? "Azione bloccata" : "Tornei e classifiche evento"}
                disabled={accountLocked}
              />

              <QuickAction
                href="/community"
                tone="blue"
                icon={<MessageCircle />}
                title="Community"
                text="Feed, post e sfide"
              />

              <QuickAction
                href="/tutorial"
                tone="purple"
                icon={<PlayCircle />}
                title="Tutorial"
                text="Guida rapida Rivalo"
              />

              <QuickAction
                href="/match"
                tone="cyan"
                icon={<CircleDot />}
                title="Match"
                text={accountLocked ? "Azione bloccata" : sportCopy.quickLabel}
                disabled={accountLocked}
              />

              <QuickAction
                href="/profile"
                tone="blue"
                icon={<UserRound />}
                title="Profilo"
                text="Foto, card e statistiche"
              />

              <QuickAction
                href="/settings"
                tone="cyan"
                icon={<Settings />}
                title="Impostazioni"
                text="Account, privacy e preferenze"
              />

              <QuickAction
                href="/notifications"
                tone="cyan"
                icon={<Bell />}
                title="Notifiche"
                text="Inviti, risultati e aggiornamenti"
              />

              <QuickAction
                href="/feed"
                tone="orange"
                icon={<Radio />}
                title="Feed live"
                text="Risultati e attività"
              />

              <QuickAction
                href="/rivalries"
                tone="purple"
                icon={<Swords />}
                title="Rivalità"
                text="Sfide storiche"
              />
            </div>
          </section>

          <section className="mt-8 grid gap-5 xl:grid-cols-[1fr_390px]">
            <Leaderboard
              leaders={leaders}
              currentUid={user?.uid || ""}
              fallbackName={displayName}
              fallbackScore={rivalScore}
              fallbackWins={wins}
              fallbackMvp={mvp}
            />

            <ProgressPanel
              matchesPlayed={matchesPlayed}
              wins={wins}
              mvp={mvp}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function MobileMenu({
  open,
  accountLocked,
  mainSport,
  onClose,
}: {
  open: boolean;
  accountLocked: boolean;
  mainSport: string;
  onClose: () => void;
}) {
  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Chiudi menu"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="absolute left-1/2 top-0 flex h-full w-[92%] max-w-[420px] -translate-x-1/2 flex-col border-x border-cyan-400/15 bg-[#020617]/96 p-5 shadow-[0_0_50px_rgba(34,211,238,.16)]">
        <div className="flex items-center justify-between gap-4">
          <Link href="/dashboard" onClick={onClose} className="block min-w-0">
            <RivaloLogo />
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[.04] text-slate-200"
            aria-label="Chiudi menu"
          >
            <X size={23} />
          </button>
        </div>

        <div className="mt-6 text-xs font-black uppercase tracking-[.28em] text-cyan-300">
          Menu rapido
        </div>

        <nav className="mt-4 grid min-w-0 gap-3 overflow-y-auto pr-1">
          {NAV_ITEMS.filter(
            (item) => item.sportOnly !== "calcetto" || normalizeSport(mainSport) === "calcetto"
          ).map((item) => {
            const locked = accountLocked && isOperationalHref(item.href);

            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-200 [&>svg]:h-5 [&>svg]:w-5">
                  {item.icon}
                </span>

                <span className="min-w-0 overflow-hidden">
                  <span className="block truncate text-base font-black text-white">
                    {item.text}
                  </span>

                  <span className="mt-0.5 block truncate text-xs font-medium text-slate-400">
                    {locked ? "Azione bloccata" : item.subtitle}
                  </span>
                </span>
              </>
            );

            if (locked) {
              return (
                <div
                  key={item.href}
                  className="flex min-w-0 cursor-not-allowed items-center gap-4 rounded-2xl border border-white/10 bg-white/[.025] p-4 opacity-55"
                >
                  {content}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-white/[.035] p-4 transition hover:border-cyan-400/30 hover:bg-cyan-400/10"
              >
                {content}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 font-black text-red-100 transition hover:bg-red-500/20"
        >
          <LogOut size={21} />
          Esci
        </button>
      </div>
    </div>
  );
}

function Sidebar({ accountLocked, mainSport }: { accountLocked: boolean; mainSport: string }) {
  return (
    <aside className="hidden w-[270px] shrink-0 border-r border-white/10 bg-[#020617]/82 px-4 py-7 backdrop-blur-xl lg:flex lg:flex-col">
      <Link href="/dashboard" className="mb-9 block px-2">
        <RivaloLogo />
      </Link>

      <div className="space-y-2">
        <SideLink href="/dashboard" icon={<Grid2X2 />} text="Dashboard" active />
        <SideLink href="/leaderboard" icon={<Globe2 />} text="Globale" />
        {normalizeSport(mainSport) === "calcetto" && (
          <SideLink href="/goalkeepers" icon={<ShieldCheck />} text="Portieri" />
        )}
        <SideLink href="/seasons" icon={<Medal />} text="Stagione" />
        <SideLink href="/groups" icon={<Users />} text="Gruppi" locked={accountLocked} />
        <SideLink href="/opponents" icon={<Search />} text="Matchmaking" locked={accountLocked} />
        <SideLink href="/messages" icon={<MessageCircle />} text="Messaggi" />
        <SideLink href="/match" icon={<CircleDot />} text="Match" locked={accountLocked} />
        <SideLink href="/community" icon={<MessageCircle />} text="Community" />
        <SideLink href="/tutorial" icon={<PlayCircle />} text="Tutorial" />
        <SideLink href="/events" icon={<CalendarDays />} text="Eventi" locked={accountLocked} />
        <SideLink href="/rivalries" icon={<Swords />} text="Rivalità" />
        <SideLink href="/profile" icon={<UserRound />} text="Profilo" />
        <SideLink href="/settings" icon={<Settings />} text="Impostazioni" />
      </div>

      <button
        onClick={async () => {
          await signOut(auth);
          window.location.href = "/login";
        }}
        className="mt-auto flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold text-slate-300 transition hover:bg-white/[.05] hover:text-white"
      >
        <LogOut size={20} />
        Esci
      </button>
    </aside>
  );
}

function SideLink({
  href,
  icon,
  text,
  active,
  locked,
}: {
  href: string;
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  locked?: boolean;
}) {
  const className = `flex items-center gap-4 rounded-2xl px-4 py-4 text-base font-semibold transition ${
    active
      ? "bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-[0_0_25px_rgba(79,70,229,.35)]"
      : locked
      ? "cursor-not-allowed text-slate-500 opacity-55"
      : "text-slate-300 hover:bg-white/[.05] hover:text-white"
  }`;

  if (locked) {
    return (
      <div className={className} title="Profilo non attivo">
        {icon}
        {text}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {icon}
      {text}
    </Link>
  );
}

function TopIcons({
  unreadNotificationsCount,
  unreadMessagesCount,
  onOpenMenu,
}: {
  unreadNotificationsCount: number;
  unreadMessagesCount: number;
  onOpenMenu: () => void;
}) {
  async function handleLogout() {
    await signOut(auth);
    window.location.href = "/login";
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-100 transition hover:bg-cyan-400/20 lg:hidden"
        title="Menu"
        aria-label="Apri menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex shrink-0 items-center justify-end gap-3 sm:gap-4">
        <Link
          href="/messages"
          className="relative rounded-2xl border border-white/10 bg-white/[.04] p-3 text-slate-200 transition hover:bg-white/[.08]"
          title="Messaggi"
          aria-label="Messaggi"
        >
          <MessageCircle size={22} />

          {unreadMessagesCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-500 px-1 text-[10px] font-black text-white">
              {unreadMessagesCount > 9 ? "9+" : unreadMessagesCount}
            </span>
          )}
        </Link>

        <Link
          href="/notifications"
          className="relative rounded-2xl border border-white/10 bg-white/[.04] p-3 text-slate-200 transition hover:bg-white/[.08]"
          title="Notifiche"
        >
          <Bell size={22} />

          {unreadNotificationsCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-black text-white">
              {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
            </span>
          )}
        </Link>

        <Link
          href="/settings"
          className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-slate-200 transition hover:bg-white/[.08]"
          title="Impostazioni"
          aria-label="Impostazioni"
        >
          <Settings size={22} />
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-2xl border border-red-400/20 bg-red-500/10 p-3 text-red-100 transition hover:bg-red-500/20 lg:hidden"
          title="Esci"
        >
          <LogOut size={22} />
        </button>
      </div>
    </div>
  );
}

function StatShield({
  tone,
  value,
  label,
  icon,
}: {
  tone: "purple" | "cyan" | "orange";
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  const styles = {
    purple: "from-purple-500 to-purple-950",
    cyan: "from-cyan-400 to-blue-950",
    orange: "from-orange-400 to-orange-950",
  }[tone];

  return (
    <div className={`rounded-[1.25rem] bg-gradient-to-b ${styles} p-[2px] shadow-2xl sm:rounded-[1.7rem]`}>
      <div className="rounded-[1.15rem] bg-black/40 px-3 py-4 text-center sm:rounded-[1.6rem] sm:p-5">
        <div className="text-4xl font-black leading-none sm:text-5xl">
          {value}
        </div>

        <div className="mt-2 whitespace-nowrap text-[10px] font-black uppercase sm:mt-3 sm:text-sm">
          {label}
        </div>

        <div className="mt-2 flex justify-center text-cyan-200 sm:mt-3">
          <span className="[&>svg]:h-5 [&>svg]:w-5 sm:[&>svg]:h-6 sm:[&>svg]:w-6">
            {icon}
          </span>
        </div>
      </div>
    </div>
  );
}

function SmallMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="break-words text-3xl font-black text-cyan-200">{value}</div>

      <div className="mt-1 text-xs font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
    </div>
  );
}

function ScorePanel({
  rivalScore,
  mainSport,
  role,
}: {
  rivalScore: number;
  mainSport: string;
  role: string;
}) {
  const sportCopy = getSportDashboardCopy(mainSport, role);

  return (
    <div className="rounded-[1.7rem] border border-cyan-300/20 bg-[#071126]/80 p-6 shadow-2xl">
      <div className="text-sm font-black uppercase">{sportCopy.scoreLabel}</div>

      <div className="mt-2 text-5xl font-black text-blue-400">
        {rivalScore}
      </div>

      <div className="mt-4 flex items-center gap-3 text-slate-300">
        <Shield className="text-cyan-300" />
        Ranking {sportLabel(mainSport)} attivo
      </div>
    </div>
  );
}

function LevelPanel({
  level,
  xp,
  mainSport,
}: {
  level: number;
  xp: number;
  mainSport: string;
}) {
  const maxXp = 500;
  const pct = Math.min(100, Math.round((xp / maxXp) * 100));

  return (
    <div className="rounded-[1.7rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl">
      <div className="text-xl font-black uppercase">Livello {level}</div>

      <div className="mt-6 h-4 overflow-hidden rounded-full bg-blue-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-blue-500 to-purple-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-5 text-lg font-medium text-white">
        {xp} / {maxXp} XP
      </div>

      <div className="mt-2 text-sm font-bold text-slate-400">
        Progressione {sportLabel(mainSport)}
      </div>
    </div>
  );
}

function QuickAction({
  href,
  tone,
  icon,
  title,
  text,
  disabled,
}: {
  href: string;
  tone: "green" | "cyan" | "purple" | "orange" | "blue";
  icon: React.ReactNode;
  title: string;
  text: string;
  disabled?: boolean;
}) {
  const colors = {
    green: "border-green-400/50 from-green-500/20 text-green-300",
    cyan: "border-cyan-400/50 from-cyan-500/20 text-cyan-300",
    purple: "border-purple-400/50 from-purple-500/20 text-purple-300",
    orange: "border-orange-400/50 from-orange-500/20 text-orange-300",
    blue: "border-blue-400/50 from-blue-500/20 text-cyan-300",
  }[tone];

  const className = `group relative min-h-[190px] overflow-hidden rounded-[1.6rem] border bg-gradient-to-br ${colors} to-transparent p-5 transition ${
    disabled ? "cursor-not-allowed opacity-55" : "hover:-translate-y-1"
  }`;

  const content = (
    <>
      <div className="relative flex h-15 w-15 items-center justify-center rounded-3xl border border-current/35 bg-black/20 p-4">
        {icon}
      </div>

      <div className="relative mt-7 break-words text-[17px] font-black uppercase leading-tight">
        {title}
      </div>

      <div className="relative mt-3 text-sm font-medium text-white">
        {text}
      </div>

      <div className="relative mt-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-current/35 bg-black/20 transition group-hover:translate-x-1">
        <ArrowRight size={22} />
      </div>
    </>
  );

  if (disabled) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}

function Leaderboard({
  leaders,
  currentUid,
  fallbackName,
  fallbackScore,
  fallbackWins,
  fallbackMvp,
}: {
  leaders: UserProfile[];
  currentUid: string;
  fallbackName: string;
  fallbackScore: number;
  fallbackWins: number;
  fallbackMvp: number;
}) {
  const rows =
    leaders.length > 0
      ? leaders
      : [
          {
            uid: currentUid,
            name: fallbackName,
            rivalScore: fallbackScore,
            wins: fallbackWins,
            mvp: fallbackMvp,
          },
        ];

  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black uppercase">
          Top globale
        </h2>

        <Link
          href="/leaderboard"
          className="rounded-xl bg-cyan-500/20 px-4 py-2 text-sm font-bold text-cyan-200"
        >
          Classifica mondiale
        </Link>
      </div>

      <div className="space-y-2">
        {rows.map((row, i) => (
          <div
            key={row.uid || row.name || i}
            className={`grid grid-cols-[44px_1fr_70px_56px] items-center gap-3 rounded-2xl border px-4 py-3 ${
              row.uid === currentUid
                ? "border-blue-500 bg-blue-600/15"
                : "border-white/5 bg-white/[.025]"
            }`}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-400/10 text-lg font-black text-yellow-300">
              {i + 1}
            </div>

            <div className="min-w-0">
              <div className="truncate text-lg font-bold">
                {getPublicUserName(row)}
              </div>

              <div className="text-sm text-slate-400">
                Rival Score: {row.rivalScore || 1000}
              </div>
            </div>

            <div className="text-center">
              <div className="text-xs text-slate-400">Vittorie</div>
              <div className="font-black">{row.wins || 0}</div>
            </div>

            <div className="text-center">
              <div className="text-xs text-slate-400">MVP</div>
              <div className="font-black">{row.mvp || 0}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressPanel({
  matchesPlayed,
  wins,
  mvp,
}: {
  matchesPlayed: number;
  wins: number;
  mvp: number;
}) {
  return (
    <div className="rounded-[1.8rem] border border-white/10 bg-[#071126]/80 p-6 shadow-2xl">
      <h2 className="text-2xl font-black uppercase">Progressi profilo</h2>

      <div className="mt-5 rounded-2xl border border-purple-500 bg-purple-700/20 p-5">
        <div className="text-xl font-black">Fai crescere la tua card</div>

        <div className="mt-2 leading-6 text-slate-300">
          Gioca match confermati, vinci partite e conquista MVP per migliorare il tuo profilo Rivalo.
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Goal icon={<ShieldCheck />} text="Gioca 5 match" value={`${Math.min(matchesPlayed, 5)}/5`} />
        <Goal icon={<Trophy />} text="Vinci 3 match" value={`${Math.min(wins, 3)}/3`} />
        <Goal icon={<Star />} text="Ottieni 1 MVP" value={`${Math.min(mvp, 1)}/1`} />
      </div>
    </div>
  );
}

function Goal({
  icon,
  text,
  value,
}: {
  icon: React.ReactNode;
  text: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.03] p-4">
      <div className="flex items-center gap-3">
        <span className="text-yellow-300">{icon}</span>
        <span>{text}</span>
      </div>

      <span className="font-bold">{value}</span>
    </div>
  );
}

function Background() {
  return (
    <div className="pointer-events-none fixed inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_8%,rgba(59,130,246,.13),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(124,58,237,.14),transparent_30%),linear-gradient(180deg,#020617_0%,#030712_48%,#020617_100%)]" />
    </div>
  );
}
