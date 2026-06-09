"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { createNotification } from "../../lib/createNotification";
import { ArrowLeft, Send } from "lucide-react";

type UserProfile = {
  name?: string;
  nickname?: string;
  photoUrl?: string;
  photoURL?: string;
  accountStatus?: string;
  deletionRequested?: boolean;
};

type Conversation = {
  id: string;
  participantIds?: string[];
  participantNames?: Record<string, string>;
  sourceType?: string;
  requestId?: string;
  matchId?: string;
  lastMessage?: string;
  lastMessageBy?: string;
  updatedAt?: any;
  unreadCount?: number;
};

type Message = {
  id: string;
  text?: string;
  createdBy?: string;
  createdAt?: any;
  readBy?: string[];
  requestId?: string;
};

function isRemovedProfile(user?: UserProfile | null) {
  return Boolean(
    user?.accountStatus === "deletion_requested" ||
      user?.accountStatus === "deleted" ||
      user?.deletionRequested
  );
}

function getDisplayName(profile?: UserProfile | null, fallback = "Rivalo Player") {
  if (!profile || isRemovedProfile(profile)) return fallback;

  return profile.name || profile.nickname || fallback;
}

function getConversationId(uidA: string, uidB: string, contextId = "") {
  const baseId = [uidA, uidB].sort().join("_");
  const cleanContextId = contextId.replace(/[^a-zA-Z0-9_-]/g, "");

  return cleanContextId ? `${baseId}_${cleanContextId}` : baseId;
}

function getTimestampValue(value: any) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.seconds === "number") return value.seconds * 1000;
  return 0;
}

function formatConversationTime(value: any) {
  const timestamp = getTimestampValue(value);

  if (!timestamp) return "";

  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function formatMessageDay(value: any) {
  const timestamp = getTimestampValue(value);

  if (!timestamp) return "";

  return new Intl.DateTimeFormat("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(timestamp));
}

function formatMessageTime(value: any) {
  const timestamp = getTimestampValue(value);

  if (!timestamp) return "";

  return new Intl.DateTimeFormat("it-IT", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function getMessageRequestLabel(messageRequestId?: string, currentRequestId?: string) {
  if (!messageRequestId) return "Conversazione precedente";
  if (currentRequestId && messageRequestId === currentRequestId) {
    return "Annuncio matchmaking corrente";
  }

  return "Altro annuncio matchmaking";
}

function canAccessConversation(conversation: Conversation | undefined, uid: string) {
  return Boolean(uid && conversation?.participantIds?.includes(uid));
}

function isUnreadForUser(message: Message, uid: string) {
  if (!uid) return false;
  if (message.createdBy === uid) return false;

  return !Array.isArray(message.readBy) || !message.readBy.includes(uid);
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#020617] text-white">
          Caricamento chat...
        </main>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const targetUid = searchParams.get("with") || "";
  const requestId = searchParams.get("requestId") || "";

  const [user, setUser] = useState<User | null>(null);
  const [currentName, setCurrentName] = useState("Rivalo Player");
  const [targetName, setTargetName] = useState("Rivalo Player");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId),
    [conversations, activeConversationId]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        window.location.href = "/login";
        return;
      }

      setUser(currentUser);
      await loadInitialData(currentUser);
    });

    return () => unsubscribe();
  }, [targetUid, requestId]);

  async function loadInitialData(currentUser: User) {
    setLoading(true);
    setMessage("");

    try {
      const currentProfileSnap = await getDoc(doc(db, "users", currentUser.uid));
      const currentProfile = currentProfileSnap.exists()
        ? (currentProfileSnap.data() as UserProfile)
        : null;

      const resolvedCurrentName = getDisplayName(
        currentProfile,
        currentUser.displayName || "Rivalo Player"
      );

      setCurrentName(resolvedCurrentName);

      let createdConversationId = "";

      if (targetUid && targetUid !== currentUser.uid) {
        const targetProfileSnap = await getDoc(doc(db, "users", targetUid));
        const targetProfile = targetProfileSnap.exists()
          ? (targetProfileSnap.data() as UserProfile)
          : null;

        if (!targetProfileSnap.exists() || isRemovedProfile(targetProfile)) {
          setMessage("Profilo non disponibile per la chat.");
        } else {
          const resolvedTargetName = getDisplayName(targetProfile);
          setTargetName(resolvedTargetName);

          createdConversationId = getConversationId(currentUser.uid, targetUid, requestId);
          const conversationRef = doc(db, "conversations", createdConversationId);
          const conversationSnap = await getDoc(conversationRef);

          if (!conversationSnap.exists()) {
            await setDoc(conversationRef, {
              participantIds: [currentUser.uid, targetUid],
              participantNames: {
                [currentUser.uid]: resolvedCurrentName,
                [targetUid]: resolvedTargetName,
              },
              sourceType: requestId ? "matchmaking" : "direct",
              requestId,
              matchId: "",
              lastMessage: "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          } else {
            const existingConversation = conversationSnap.data() as Conversation;

            if (!existingConversation.participantIds?.includes(currentUser.uid)) {
              setMessage("Non puoi accedere a questa conversazione.");
              return;
            }
          }

          setActiveConversationId(createdConversationId);
          setChatOpen(true);
        }
      }

      await loadConversations(currentUser.uid, createdConversationId);
    } catch (error) {
      console.error(error);
      setMessage("Errore nel caricamento della chat.");
    } finally {
      setLoading(false);
    }
  }

  async function loadConversations(uid: string, preferredConversationId = "") {
    const conversationsQuery = query(
      collection(db, "conversations"),
      where("participantIds", "array-contains", uid)
    );

    const conversationsSnap = await getDocs(conversationsQuery);

    const visibleConversations = conversationsSnap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Conversation, "id">),
    }));

    const result = await Promise.all(
      visibleConversations.map(async (conversation) => {
        const messagesSnap = await getDocs(
          collection(db, "conversations", conversation.id, "messages")
        );

        const unreadCount = messagesSnap.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<Message, "id">),
          }))
          .filter((chatMessage) => isUnreadForUser(chatMessage, uid)).length;

        return {
          ...conversation,
          unreadCount,
        };
      })
    );

    result.sort((a, b) => getTimestampValue(b.updatedAt) - getTimestampValue(a.updatedAt));

    setConversations(result);

    const nextConversationId =
      preferredConversationId || activeConversationId || result[0]?.id || "";

    setActiveConversationId(nextConversationId);

    if (nextConversationId) {
      const selectedConversation = result.find(
        (conversation) => conversation.id === nextConversationId
      );

      if (canAccessConversation(selectedConversation, uid)) {
        await loadMessages(nextConversationId, uid);
      } else {
        setActiveConversationId("");
        setMessages([]);
      }
    }
  }

  async function loadMessages(conversationId: string, uid = user?.uid || "") {
    const conversationSnap = await getDoc(doc(db, "conversations", conversationId));

    if (!conversationSnap.exists()) {
      setMessages([]);
      return;
    }

    const conversation = {
      id: conversationSnap.id,
      ...(conversationSnap.data() as Omit<Conversation, "id">),
    };

    if (!canAccessConversation(conversation, uid)) {
      setMessage("Non puoi accedere a questa conversazione.");
      setActiveConversationId("");
      setMessages([]);
      return;
    }

    const messagesSnap = await getDocs(
      collection(db, "conversations", conversationId, "messages")
    );

    await Promise.all(
      messagesSnap.docs.map(async (docSnap) => {
        const chatMessage = {
          id: docSnap.id,
          ...(docSnap.data() as Omit<Message, "id">),
        };

        if (isUnreadForUser(chatMessage, uid)) {
          await updateDoc(doc(db, "conversations", conversationId, "messages", docSnap.id), {
            readBy: arrayUnion(uid),
          });
        }
      })
    );

    const refreshedMessagesSnap = await getDocs(
      collection(db, "conversations", conversationId, "messages")
    );

    const result = refreshedMessagesSnap.docs
      .map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Message, "id">),
      }))
      .sort((a, b) => getTimestampValue(a.createdAt) - getTimestampValue(b.createdAt));

    setMessages(result);
  }

  async function selectConversation(conversationId: string) {
    if (!user) return;

    const conversation = conversations.find((item) => item.id === conversationId);

    if (!canAccessConversation(conversation, user.uid)) {
      setMessage("Non puoi accedere a questa conversazione.");
      return;
    }

    setActiveConversationId(conversationId);
    setChatOpen(true);
    await loadMessages(conversationId, user.uid);
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!user || !activeConversationId || !text.trim()) return;

    const cleanText = text.trim().slice(0, 500);
    const conversation = conversations.find((item) => item.id === activeConversationId);

    if (!conversation || !canAccessConversation(conversation, user.uid)) {
      setMessage("Non puoi inviare messaggi in questa conversazione.");
      return;
    }

    const recipientUid =
      conversation.participantIds?.find((participantId) => participantId !== user.uid) || "";

    if (!recipientUid) return;

    setSending(true);
    setMessage("");

    try {
      const messageRequestId = requestId || conversation.requestId || "";

      await addDoc(collection(db, "conversations", activeConversationId, "messages"), {
        text: cleanText,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        readBy: [user.uid],
        requestId: messageRequestId,
      });

      await updateDoc(doc(db, "conversations", activeConversationId), {
        lastMessage: cleanText,
        lastMessageBy: user.uid,
        ...(messageRequestId
          ? {
              sourceType: "matchmaking",
              requestId: messageRequestId,
            }
          : {}),
        updatedAt: serverTimestamp(),
      });

      await createNotification({
        uid: recipientUid,
        type: "generic",
        title: "Nuovo messaggio",
        message: `${currentName}: ${cleanText}`,
        link: `/messages?with=${user.uid}${conversation.requestId ? `&requestId=${conversation.requestId}` : ""}`,
        createdBy: user.uid,
        metadata: {
          conversationId: activeConversationId,
          requestId: conversation.requestId || "",
          sourceType: conversation.sourceType || "direct",
        },
      });

      setText("");
      await loadConversations(user.uid, activeConversationId);
    } catch (error) {
      console.error(error);
      setMessage("Errore durante l'invio del messaggio.");
    } finally {
      setSending(false);
    }
  }

  function getOtherName(conversation: Conversation) {
    if (!user) return "Chat";

    const otherUid =
      conversation.participantIds?.find((participantId) => participantId !== user.uid) || "";

    return conversation.participantNames?.[otherUid] || "Rivalo Player";
  }

  function getOtherUid(conversation: Conversation) {
    if (!user) return "";

    return (
      conversation.participantIds?.find((participantId) => participantId !== user.uid) || ""
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#020617] text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_12%_6%,rgba(34,211,238,.17),transparent_28%),radial-gradient(circle_at_88%_10%,rgba(217,70,239,.15),transparent_32%),linear-gradient(180deg,#020617_0%,#030712_50%,#020617_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-6xl px-3 py-7 sm:px-5 sm:py-8">
        <Link
          href={requestId ? `/opponents?requestId=${requestId}` : "/dashboard"}
          className="inline-flex items-center gap-2 text-sm font-black text-cyan-300"
        >
          <ArrowLeft size={17} />
          {requestId ? "Torna al matchmaking" : "Torna alla dashboard"}
        </Link>

        <div className="mt-7 min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[.04] shadow-2xl backdrop-blur sm:rounded-[2.5rem]">
          <div className="border-b border-white/10 p-5 sm:p-7">
            <div className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">
              Rivalo Chat
            </div>

            <h1 className="mt-2 break-words text-4xl font-black sm:text-5xl">
              Messaggi
            </h1>

            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              Organizzati con gli utenti del matchmaking e prepara il match.
            </p>
          </div>

          {message && (
            <div className="m-5 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm font-bold text-cyan-100">
              {message}
            </div>
          )}

          {loading ? (
            <div className="p-5 text-slate-300">Caricamento chat...</div>
          ) : (
            <div className="grid min-h-[620px] min-w-0 gap-0 overflow-hidden lg:grid-cols-[360px_minmax(0,1fr)]">
              <aside
                className={`min-w-0 overflow-hidden border-white/10 p-4 lg:block lg:border-r ${
                  chatOpen ? "hidden" : "block"
                }`}
              >
                <div className="mb-4">
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300">
                    Conversazioni
                  </div>

                  <div className="mt-1 text-sm font-semibold text-slate-400">
                    Ordinate per ultimo messaggio.
                  </div>
                </div>

                {conversations.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm font-semibold text-slate-300">
                    Nessuna conversazione ancora.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conversations.map((conversation) => {
                      const otherUid = getOtherUid(conversation);

                      return (
                        <button
                          key={conversation.id}
                          type="button"
                          onClick={() => selectConversation(conversation.id)}
                          className={`w-full min-w-0 rounded-2xl border p-4 text-left transition ${
                            conversation.id === activeConversationId
                              ? "border-cyan-300/40 bg-cyan-400/10"
                              : "border-white/10 bg-black/20 hover:border-cyan-300/20"
                          }`}
                        >
                          <div className="flex min-w-0 items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="truncate text-base font-black text-white">
                                {getOtherName(conversation)}
                              </div>

                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {otherUid && (
                                  <Link
                                    href={`/public/${otherUid}`}
                                    onClick={(event) => event.stopPropagation()}
                                    className="inline-block text-[11px] font-black uppercase tracking-[0.12em] text-cyan-300"
                                  >
                                    Apri profilo
                                  </Link>
                                )}

                                {conversation.requestId && (
                                  <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100">
                                    Matchmaking
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="shrink-0 text-right">
                              {Number(conversation.unreadCount || 0) > 0 && (
                                <div className="mb-1 ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-fuchsia-500 px-2 text-[10px] font-black text-white">
                                  {Number(conversation.unreadCount || 0) > 9
                                    ? "9+"
                                    : conversation.unreadCount}
                                </div>
                              )}

                              <div className="text-[11px] font-bold text-slate-500">
                                {formatConversationTime(conversation.updatedAt)}
                              </div>
                            </div>
                          </div>

                          <div className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                            Tocca per aprire la chat
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </aside>

              <section
                className={`min-w-0 max-w-full flex-col overflow-hidden lg:flex ${
                  chatOpen ? "flex" : "hidden"
                }`}
              >
                <div className="border-b border-white/10 p-4">
                  <button
                    type="button"
                    onClick={() => setChatOpen(false)}
                    className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.14em] text-cyan-300 lg:hidden"
                  >
                    <ArrowLeft size={16} />
                    Conversazioni
                  </button>

                  <div className="min-w-0 truncate text-lg font-black text-white">
                    {activeConversation ? getOtherName(activeConversation) : targetName}
                  </div>

                  <div className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">
                    Chat 1-to-1
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-3 overflow-y-auto overflow-x-hidden p-4">
                  {!activeConversationId ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-semibold text-slate-300">
                      Seleziona una conversazione dalla lista.
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5 text-sm font-semibold text-slate-300">
                      Nessun messaggio. Scrivi il primo.
                    </div>
                  ) : (
                    messages.map((chatMessage, index) => {
                      const mine = chatMessage.createdBy === user?.uid;
                      const previousMessage = messages[index - 1];

                      const currentDay = formatMessageDay(chatMessage.createdAt);
                      const previousDay = previousMessage
                        ? formatMessageDay(previousMessage.createdAt)
                        : "";

                      const currentRequest = chatMessage.requestId || "";
                      const previousRequest = previousMessage?.requestId || "";

                      const showDayDivider = currentDay && currentDay !== previousDay;
                      const showRequestDivider =
                        index === 0 || currentRequest !== previousRequest;

                      return (
                        <div key={chatMessage.id} className="space-y-3">
                          {showDayDivider && (
                            <div className="flex justify-center">
                              <span className="rounded-full border border-white/10 bg-white/[.06] px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-300">
                                {currentDay}
                              </span>
                            </div>
                          )}

                          {showRequestDivider && (
                            <div className="flex justify-center">
                              <span className="max-w-full rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-center text-[10px] font-black uppercase tracking-[0.12em] text-cyan-200">
                                {getMessageRequestLabel(currentRequest, requestId)}
                              </span>
                            </div>
                          )}

                          <div
                            className={`flex ${mine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`min-w-0 max-w-[92%] overflow-hidden whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm font-semibold leading-6 sm:max-w-[82%] ${
                                mine
                                  ? "bg-cyan-400/20 text-cyan-50"
                                  : "bg-white/[.07] text-slate-100"
                              }`}
                            >
                              <div>{chatMessage.text}</div>

                              <div
                                className={`mt-2 text-right text-[10px] font-bold ${
                                  mine ? "text-cyan-100/60" : "text-slate-400"
                                }`}
                              >
                                {formatMessageTime(chatMessage.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <form onSubmit={sendMessage} className="min-w-0 border-t border-white/10 p-4">
                  <div className="flex min-w-0 gap-2">
                    <input
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      placeholder="Scrivi un messaggio..."
                      maxLength={500}
                      className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-slate-500"
                    />

                    <button
                      type="submit"
                      disabled={sending || !text.trim() || !activeConversationId}
                      className="shrink-0 rounded-2xl bg-gradient-to-r from-cyan-400 to-fuchsia-500 px-4 py-3 font-black text-white disabled:opacity-50"
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
