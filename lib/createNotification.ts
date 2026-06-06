import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export type NotificationType =
  | "team_invite"
  | "group_request"
  | "group_request_accepted"
  | "group_request_rejected"
  | "result_proposed"
  | "result_confirmed"
  | "result_disputed"
  | "new_match"
  | "event_full"
  | "tournament_ready"
  | "league_ready"
  | "profile_completed"
  | "generic";

type CreateNotificationInput = {
  uid: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  createdBy?: string;
  metadata?: Record<string, any>;
};

function isProfileDeletionRequested(profile?: any) {
  return Boolean(
    profile?.accountStatus === "deletion_requested" ||
      profile?.accountStatus === "deleted" ||
      profile?.deletionRequested
  );
}

const OPERATIONAL_NOTIFICATION_TYPES = new Set<NotificationType>([
  "team_invite",
  "group_request",
  "group_request_accepted",
  "group_request_rejected",
  "result_proposed",
  "result_disputed",
  "new_match",
  "event_full",
  "tournament_ready",
  "league_ready",
]);

export async function createNotification({
  uid,
  type,
  title,
  message,
  link = "",
  createdBy = "",
  metadata = {},
}: CreateNotificationInput) {
  if (!uid) return null;

  try {
    const userSnap = await getDoc(doc(db, "users", uid));
    const userProfile = userSnap.exists() ? userSnap.data() : null;

    if (
      isProfileDeletionRequested(userProfile) &&
      OPERATIONAL_NOTIFICATION_TYPES.has(type)
    ) {
      return null;
    }
  } catch {
    // Se il controllo profilo non riesce, non blocchiamo le notifiche.
  }

  const notificationRef = await addDoc(collection(db, "notifications"), {
    uid,
    type,
    title,
    message,
    link,
    createdBy,
    metadata,
    read: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return notificationRef.id;
}
