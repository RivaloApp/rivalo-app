"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  ArrowLeft,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Swords,
  Trophy,
  Users,
} from "lucide-react";
import { auth, db } from "../../lib/firebase";

type NotificationItem = {
  id: string;
  uid?: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  createdAt?: any;
  link?: string;
};

function getNotificationIcon(type?: string) {
  if (type === "team_invite" || type === "group_request") {
    return <Users size={20} />;
  }

  if (type === "result_proposed" || type === "result_confirmed") {
    return <Swords size={20} />;
  }

  if (type === "tournament_ready" || type === "league_ready") {
    return <Trophy size={20} />;
  }

  if (type === "event_full" || type === "new_match") {
    return <CalendarDays size={20} />;
  }

  return <Bell size={20} />;
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadNotifications(currentUser.uid);
    });

    return () => unsub();
  }, []);

  async function loadNotifications(uid: string) {
    setLoading(true);

    try {
      const notificationsQuery = query(
        collection(db, "notifications"),
        where("uid", "==", uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(notificationsQuery);

      const result = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<NotificationItem, "id">),
      }));

      setNotifications(result);
    } catch (error) {
      console.error(error);
      setMessage("Non sono riuscito a caricare le notifiche.");
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: serverTimestamp(),
      });

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      console.error(error);
      setMessage("Non sono riuscito ad aggiornare la notifica.");
    }
  }

  async function markAllAsRead() {
    if (!user) return;

    try {
      const unreadNotifications = notifications.filter(
        (notification) => !notification.read
      );

      await Promise.all(
        unreadNotifications.map((notification) =>
          updateDoc(doc(db, "notifications", notification.id), {
            read: true,
            readAt: serverTimestamp(),
          })
        )
      );

      setNotifications((current) =>
        current.map((notification) => ({ ...notification, read: true }))
      );

      setMessage("Notifiche segnate come lette.");
    } catch (error) {
      console.error(error);
      setMessage("Non sono riuscito ad aggiornare tutte le notifiche.");
    }
  }

  const unreadCount = notifications.filter((notification) => !notification.read)
    .length;

  return (
    <main className="min-h-screen bg-[#020617] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          Torna alla dashboard
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[.04] shadow-2xl">
          <div className="relative border-b border-white/10 px-8 py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.18),transparent_60%)]" />

            <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-cyan-200">
                  <Bell size={16} />
                  Centro notifiche
                </div>

                <h1 className="mt-5 text-5xl font-black">Notifiche</h1>

                <p className="mt-3 max-w-2xl text-slate-300">
                  Qui trovi inviti, richieste, risultati, eventi e aggiornamenti
                  importanti.
                </p>
              </div>

              <div className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-6 py-4">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
                  Non lette
                </div>

                <div className="mt-1 text-4xl font-black text-cyan-100">
                  {unreadCount}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {message && (
              <div className="mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-100">
                {message}
              </div>
            )}

            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="text-sm font-bold text-slate-400">
                {loading
                  ? "Caricamento..."
                  : notifications.length === 0
                  ? "Nessuna notifica."
                  : `${notifications.length} notifiche totali`}
              </div>

              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="rounded-2xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm font-black text-lime-200 transition hover:bg-lime-400/20 disabled:opacity-50"
              >
                Segna tutte come lette
              </button>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-slate-300">
                Caricamento notifiche...
              </div>
            ) : notifications.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-8 text-center">
                <Bell className="mx-auto text-cyan-300" size={36} />

                <div className="mt-4 text-2xl font-black">
                  Nessuna notifica
                </div>

                <p className="mt-2 text-sm text-slate-400">
                  Quando riceverai inviti, richieste o aggiornamenti evento,
                  compariranno qui.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const content = (
                    <div
                      className={`rounded-2xl border p-4 transition ${
                        notification.read
                          ? "border-white/10 bg-white/[.03]"
                          : "border-cyan-400/30 bg-cyan-400/10"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
                            notification.read
                              ? "border-white/10 bg-black/20 text-slate-300"
                              : "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                          }`}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="font-black text-white">
                              {notification.title || "Notifica Rivalo"}
                            </div>

                            <div className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                              <Clock size={13} />
                              {notification.read ? "Letta" : "Nuova"}
                            </div>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-slate-300">
                            {notification.message ||
                              "Hai un nuovo aggiornamento Rivalo."}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {!notification.read && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.preventDefault();
                                  markAsRead(notification.id);
                                }}
                                className="inline-flex items-center gap-2 rounded-xl border border-lime-400/20 bg-lime-400/10 px-3 py-2 text-xs font-black text-lime-200"
                              >
                                <CheckCircle2 size={14} />
                                Segna letta
                              </button>
                            )}

                            {notification.link && (
                              <span className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-xs font-black text-cyan-200">
                                Apri
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );

                  return notification.link ? (
                    <Link key={notification.id} href={notification.link}>
                      {content}
                    </Link>
                  ) : (
                    <div key={notification.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}