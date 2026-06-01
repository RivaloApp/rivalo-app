import { addDoc, collection, serverTimestamp } from "firebase/firestore";
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