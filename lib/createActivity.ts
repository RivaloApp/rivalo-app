import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebase";

type ActivityType =
  | "match_win"
  | "mvp"
  | "rivalscore"
  | "streak"
  | "badge"
  | "rivalry"
  | "event";

export async function createActivity({
  uid,
  type,
  text,
  value,
}: {
  uid: string;
  type: ActivityType;
  text: string;
  value?: number;
}) {
  try {
    await addDoc(
      collection(db, "activities"),
      {
        uid,
        type,
        text,
        value: value || 0,
        createdAt: serverTimestamp(),
      }
    );
  } catch (err) {
    console.error(err);
  }
}