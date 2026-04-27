import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import { ensureAnonymousAuth } from "./authService";

const COL = "safe_reports";

export const SAFE_STATUSES = [
  "safe",
  "safe_needs_help",
  "at_relief_camp",
  "medical_help",
];

export function generateSafeRefId() {
  return "SAFE-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function buildSafePayload(formData, reporterUid, refId) {
  const missingReportRef = normalizeMissingRefId(formData.missingReportRef);
  return {
    refId,
    name: formData.name?.trim() || "Unknown",
    phone: formData.phone?.trim() || null,
    missingReportRef,
    status: formData.status || "safe",
    district: formData.district?.trim() || null,
    location: formData.location?.trim() || null,
    message: formData.message?.trim() || null,
    relativeContact:
      formData.relativePhone?.trim() || formData.relativeMessage?.trim()
        ? {
            phone: formData.relativePhone?.trim() || null,
            message: formData.relativeMessage?.trim() || null,
          }
        : null,
    coordinates:
      formData.latitude != null && formData.longitude != null
        ? {
            latitude: Number(formData.latitude),
            longitude: Number(formData.longitude),
          }
        : null,
    reporterUid,
    reviewStatus: "new",
    linkedMissingPersonId: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function normalizeMissingRefId(value) {
  const cleaned = String(value || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!cleaned) return null;
  return cleaned.startsWith("FM-") ? cleaned : `FM-${cleaned}`;
}

async function createSafeAlertTask(payload, safeReportId) {
  const linkedMissingPersonId = await resolveMissingPersonIdByRef(
    payload.missingReportRef,
  );

  await addDoc(collection(db, "tasks"), {
    name: payload.name || "Safe report",
    priority: payload.status === "medical_help" ? "CRITICAL" : "HIGH",
    status: "open",
    location: payload.location || payload.district || "Unknown",
    district: payload.district || null,
    team: "Unassigned",
    source: "safe_report",
    safeReportId,
    safeReportRef: payload.refId,
    linkedMissingPersonId,
    linkedMissingRef: payload.missingReportRef || null,
    relativePhone: payload.relativeContact?.phone || null,
    relativeMessage: payload.relativeContact?.message || null,
    notes:
      payload.message ||
      "Citizen reported safe. Verify and close any active missing case.",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

async function resolveMissingPersonIdByRef(refId) {
  if (!refId) return null;
  try {
    const snap = await getDocs(
      query(
        collection(db, "missing_persons"),
        where("refId", "==", refId),
        where("status", "==", "missing"),
        limit(1),
      ),
    );
    return snap.empty ? null : snap.docs[0].id;
  } catch {
    return null;
  }
}

function mapSafeSubmitError(error) {
  const code = error?.code || "";
  if (code === "auth/admin-restricted-operation") {
    return "Anonymous sign-in is disabled in Firebase Authentication. Enable it in the Firebase console.";
  }
  if (code === "permission-denied") {
    return "Permission denied while saving safe status. Please publish latest Firestore rules and try again.";
  }
  if (code === "unavailable") {
    return "Could not reach the backend right now. Check your internet and try again.";
  }
  if (code === "unauthenticated") {
    return "Authentication failed while submitting. Please try again.";
  }
  return error?.message || "Could not submit safe status.";
}

export async function submitSafeReport(formData) {
  const user = await ensureAnonymousAuth();
  // Ensure the freshly signed-in user has a valid token before first write.
  await user.getIdToken();
  const refId = generateSafeRefId();
  const payload = buildSafePayload(formData, user.uid, refId);

  try {
    const docRef = await addDoc(collection(db, COL), payload);
    // Notify rescuer board so teams can quickly verify and close missing cases.
    await createSafeAlertTask(payload, docRef.id);
    return { id: docRef.id, refId };
  } catch (error) {
    // Retry once after refreshing auth; helps when auth state lags write request.
    const retryable =
      error?.code === "permission-denied" || error?.code === "unauthenticated";
    if (retryable) {
      try {
        const refreshed = await ensureAnonymousAuth();
        await refreshed.getIdToken(true);
        const retryPayload = buildSafePayload(formData, refreshed.uid, refId);
        const retryRef = await addDoc(collection(db, COL), retryPayload);
        await createSafeAlertTask(retryPayload, retryRef.id);
        return { id: retryRef.id, refId };
      } catch (retryError) {
        throw new Error(mapSafeSubmitError(retryError));
      }
    }

    throw new Error(mapSafeSubmitError(error));
  }
}

export function subscribeSafeReports(callback, onError) {
  const q = query(collection(db, COL), orderBy("createdAt", "desc"), limit(100));
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError,
  );
}

export async function findMissingPersonMatches(safeReport) {
  const refId = normalizeMissingRefId(safeReport.missingReportRef);
  if (refId) {
    const exact = await getDocs(
      query(
        collection(db, "missing_persons"),
        where("refId", "==", refId),
        where("status", "==", "missing"),
        limit(1),
      ),
    );
    if (!exact.empty) {
      return exact.docs.map((d) => ({ id: d.id, ...d.data() }));
    }
  }

  const name = safeReport.name?.trim();
  if (!name || name === "Unknown") return [];

  const snap = await getDocs(
    query(
      collection(db, "missing_persons"),
      where("status", "==", "missing"),
      orderBy("createdAt", "desc"),
      limit(150),
    ),
  );

  const term = name.toLowerCase();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((person) => {
      const candidate = person.name?.toLowerCase() || "";
      const phoneMatch =
        safeReport.phone &&
        [person.reporterContact?.phone, person.reporterContact?.altPhone]
          .filter(Boolean)
          .some((phone) => phone.includes(safeReport.phone));
      return (
        candidate.includes(term) ||
        term.includes(candidate) ||
        Boolean(phoneMatch)
      );
    })
    .slice(0, 6);
}

export async function markSafeReportReviewed(reportId, user) {
  await updateDoc(doc(db, COL, reportId), {
    reviewStatus: "reviewed",
    reviewedBy: {
      uid: user.uid,
      name: user.displayName || user.email || "Rescue operator",
      email: user.email || null,
    },
    reviewedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function confirmSafeReportMatch(safeReport, missingPerson, user) {
  const batch = writeBatch(db);
  const now = serverTimestamp();
  const foundRef = doc(collection(db, "found_persons"));
  const safeRef = doc(db, COL, safeReport.id);
  const missingRef = doc(db, "missing_persons", missingPerson.id);

  const actor = {
    uid: user.uid,
    name: user.displayName || user.email || "Rescue operator",
    email: user.email || null,
  };

  batch.set(foundRef, {
    name: safeReport.name || missingPerson.name || null,
    age: missingPerson.age || null,
    gender: missingPerson.gender || null,
    physical_tags: [],
    location: {
      description: safeReport.location || null,
      district: safeReport.district || null,
      latitude: safeReport.coordinates?.latitude ?? null,
      longitude: safeReport.coordinates?.longitude ?? null,
    },
    photo_url: null,
    status: "safe",
    source: "safe_report",
    linkedMissingPersonId: missingPerson.id,
    linkedSafeReportId: safeReport.id,
    verifiedBy: actor.name,
    contactPhone: safeReport.phone || null,
    resolutionNotes: safeReport.message || null,
    createdAt: now,
    updatedAt: now,
  });

  batch.update(missingRef, {
    status: "found",
    found_person_id: foundRef.id,
    safeReportId: safeReport.id,
    resolvedAt: now,
    resolvedBy: actor,
    updatedAt: now,
  });

  batch.update(safeRef, {
    reviewStatus: "linked",
    linkedMissingPersonId: missingPerson.id,
    linkedFoundPersonId: foundRef.id,
    linkedBy: actor,
    linkedAt: now,
    updatedAt: now,
  });

  batch.set(doc(collection(db, "rescue_activity")), {
    type: "safe_report_linked",
    missingPersonId: missingPerson.id,
    foundPersonId: foundRef.id,
    safeReportId: safeReport.id,
    summary: `${safeReport.name || "Person"} marked safe from self-report`,
    actor,
    createdAt: now,
  });

  await batch.commit();
  return { foundPersonId: foundRef.id };
}
