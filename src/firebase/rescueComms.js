import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "./config";

const COL = "rescue_comms";

export const COMMS_CATEGORIES = [
  "roadblock",
  "danger",
  "medical",
  "shelter",
  "supply",
  "rescue_needed",
  "general",
];

export const COMMS_PRIORITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function subscribeRescueComms(callback, onError) {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(120));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function postCommsUpdate(update, user) {
  if (!user || user.isAnonymous) {
    throw new Error("Rescue sign-in is required to post field comms.");
  }

  const payload = {
    title: update.title?.trim() || "Field update",
    message: update.message?.trim() || null,
    category: update.category || "general",
    priority: update.priority || "HIGH",
    district: update.district?.trim() || null,
    location: update.location?.trim() || null,
    zone: update.zone?.trim() || null,
    status: "active",
    acknowledgements: [],
    postedBy: {
      uid: user.uid,
      name: user.displayName || user.email || "Rescue operator",
      email: user.email || null,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

export async function acknowledgeCommsUpdate(item, user) {
  if (!user || user.isAnonymous) {
    throw new Error("Rescue sign-in is required to acknowledge updates.");
  }

  await updateDoc(doc(db, COL, item.id), {
    acknowledgements: arrayUnion({
      uid: user.uid,
      name: user.displayName || user.email || "Rescue operator",
      at: new Date().toISOString(),
    }),
    updatedAt: serverTimestamp(),
  });
}

export async function resolveCommsUpdate(item, user) {
  if (!user || user.isAnonymous) {
    throw new Error("Rescue sign-in is required to resolve updates.");
  }

  await updateDoc(doc(db, COL, item.id), {
    status: "resolved",
    resolvedBy: {
      uid: user.uid,
      name: user.displayName || user.email || "Rescue operator",
      email: user.email || null,
    },
    resolvedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
