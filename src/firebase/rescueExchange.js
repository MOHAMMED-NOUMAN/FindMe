import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

const COL = "rescue_exchange";

export const EXCHANGE_STATUS = [
  "needs_help",
  "sighting",
  "verified",
  "rescued",
  "unresolved",
];

export const EXCHANGE_PRIORITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

export function subscribeRescueExchange(callback, onError) {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(80));
  return onSnapshot(
    q,
    (snap) => {
      callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError,
  );
}

export function subscribeOpenMissingPersonOptions(callback, onError) {
  const q = query(
    collection(db, "missing_persons"),
    where("status", "==", "missing"),
    orderBy("createdAt", "desc"),
    limit(60),
  );

  return onSnapshot(
    q,
    (snap) => {
      callback(
        snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            refId: data.refId || "",
            name: data.name || "Unknown",
            district: data.lastKnownLocation?.district || "",
            location: data.lastKnownLocation?.description || "",
          };
        }),
      );
    },
    onError,
  );
}

export async function addRescueExchangeUpdate(update, user) {
  if (!user || user.isAnonymous) {
    throw new Error("Rescue sign-in is required to share updates.");
  }

  const payload = {
    personName: update.personName?.trim() || "Unknown person",
    caseRef: update.caseRef?.trim() || null,
    missingPersonId: update.missingPersonId || null,
    status: update.status || "needs_help",
    priority: update.priority || "HIGH",
    sourceType: update.sourceType || "field",
    district: update.district?.trim() || null,
    location: update.location?.trim() || null,
    displacementZone: update.displacementZone?.trim() || null,
    teamName: update.teamName?.trim() || null,
    note: update.note?.trim() || null,
    actor: {
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

export async function addExchangeItemToSearchBoard(item, user) {
  if (!user || user.isAnonymous) {
    throw new Error("Rescue sign-in is required to add this to search.");
  }

  if (item.actor?.uid === user.uid) {
    throw new Error("Another rescuer must add your shared request.");
  }

  if (item.missingPersonId || item.adoptedMissingPersonId) {
    throw new Error("This update is already connected to the search board.");
  }

  const refId =
    item.caseRef ||
    "FM-" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const missingPayload = {
    refId,
    name: item.personName || "Unknown person",
    age: null,
    gender: null,
    relationship: "Rescue exchange",
    lastKnownLocation: {
      description: item.location || item.displacementZone || null,
      district: item.district || null,
      latitude: null,
      longitude: null,
      dateLastSeen: null,
      timeLastSeen: null,
    },
    description: item.note || "Added from rescuer shared exchange.",
    photoUrl: null,
    reporterContact: {
      phone: null,
      altPhone: null,
      email: user.email || null,
    },
    reporterUid: user.uid,
    status: "missing",
    confidence: null,
    matchedWith: null,
    sourceType: "rescue_exchange",
    sourceExchangeId: item.id,
    sourceSharedBy: item.actor || null,
    rescueStatus: item.status || null,
    priority: item.priority || "HIGH",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const missingRef = await addDoc(collection(db, "missing_persons"), missingPayload);

  await updateDoc(doc(db, COL, item.id), {
    adoptedMissingPersonId: missingRef.id,
    adoptedBy: {
      uid: user.uid,
      name: user.displayName || user.email || "Rescue operator",
      email: user.email || null,
    },
    adoptedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { id: missingRef.id, refId };
}
