// ============================================================
// DisasterIQ — Missing Persons Service
// No Cloud Functions — all logic runs client-side on Firestore
// ============================================================

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  onSnapshot,
  increment,
  writeBatch,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./config";
import { ensureAnonymousAuth } from "./authService";
import { callMLMatchingAPI } from "../services/mlService";

const COL = "missing_persons";

// ── Generate a human-readable reference ID (e.g. FM-A3B9C1) ─────────────
export function generateRefId() {
  return "FM-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

// ── Check for possible duplicate reports (replaces deduplicateReport CF) ──
// Returns up to 5 existing records with similar names (basic prefix filter;
// deeper fuzzy dedup is handled server-side by the ML engine).
export async function checkDuplicates(name) {
  if (!name || name.length < 3) return [];
  const snap = await getDocs(
    query(collection(db, COL), where("status", "==", "missing"), limit(200)),
  );
  const term = name.toLowerCase();
  const matches = [];
  snap.forEach((d) => {
    const data = d.data();
    const candidate = (data.name || "").toLowerCase();
    // Keep candidates that share at least the first 3 characters
    if (candidate.startsWith(term.slice(0, 3))) {
      matches.push({
        id: d.id,
        name: data.name,
        district: data.lastKnownLocation?.district,
        age: data.age,
      });
    }
  });
  return matches.slice(0, 5);
}

// ── Map a Firestore found-person document to a ML API PersonRecord ─────────
function toPersonRecord(id, data) {
  // Build a GeoPoint only when both lat/lng are valid numbers
  let location = null;
  const lat = parseFloat(
    data.location?.latitude ?? data.lastKnownLocation?.latitude,
  );
  const lng = parseFloat(
    data.location?.longitude ?? data.lastKnownLocation?.longitude,
  );
  if (!isNaN(lat) && !isNaN(lng)) {
    location = { latitude: lat, longitude: lng };
  }

  return {
    id,
    name: data.name || null,
    age: parseInt(data.age) || null,
    gender: data.gender || null,
    location,
    physical_tags: Array.isArray(data.physicalTags) ? data.physicalTags : [],
    photo_url: data.photoUrl || null,
  };
}

// ── Run matching engine — delegates scoring to the FastAPI ML backend ──────
async function runMatchingEngine(docId, reportData) {
  try {
    // 1. Fetch all found-person candidates from Firestore
    const foundSnap = await getDocs(collection(db, "found_persons"));
    if (foundSnap.empty) {
      console.info(
        "[DisasterIQ] No found-person candidates; skipping ML match.",
      );
      // Still create a rescue task and update stats when there are no candidates
      await _createRescueTask(docId, reportData, null, 0);
      await _updateStats();
      return;
    }

    // 2. Shape the "found" subject (the newly submitted missing-person report)
    //    into a PersonRecord the API understands.
    const subjectRecord = toPersonRecord(docId, reportData);

    // 3. Shape every found-person Firestore document into a PersonRecord array
    const candidatesList = foundSnap.docs.map((d) =>
      toPersonRecord(d.id, d.data()),
    );

    // 4. Call the ML API
    let topScore = 0;
    let topMatchId = null;
    try {
      const apiResponse = await callMLMatchingAPI(
        subjectRecord,
        candidatesList,
      );
      const topMatch = apiResponse.matches?.[0];
      if (topMatch) {
        topScore = topMatch.composite_score; // float [0, 1] from the API
        topMatchId = topMatch.missing_person_id;
      }
    } catch (apiErr) {
      console.warn(
        "[DisasterIQ] ML API call failed (falling back to no-match):",
        apiErr,
      );
      // Non-fatal — continue to create task and write stats
    }

    // 5. Create a rescue task when no confident match was found
    //    (API composite_score threshold: 0.40 mirrors the old 40/100 threshold)
    await _createRescueTask(docId, reportData, topMatchId, topScore);

    // 6. Persist composite_score and matched found-person id back to Firestore
    try {
      await updateDoc(doc(db, COL, docId), {
        composite_score: topScore,
        found_person_id: topScore >= 0.4 ? topMatchId : null,
        updatedAt: serverTimestamp(),
      });
    } catch (updateErr) {
      console.warn(
        "[DisasterIQ] Score update error (non-critical):",
        updateErr,
      );
    }

    // 7. Increment global stats
    await _updateStats();
  } catch (err) {
    console.warn("[DisasterIQ] Matching engine error (non-critical):", err);
  }
}

// ── Internal: create a rescue task when no match clears the threshold ──────
async function _createRescueTask(docId, reportData, matchId, score) {
  if (score >= 0.4) return; // confident match found — no rescue task needed
  try {
    await addDoc(collection(db, "tasks"), {
      name: reportData.name || "Unknown",
      priority: "HIGH",
      location:
        reportData.lastKnownLocation?.description ||
        reportData.lastKnownLocation?.district ||
        "Unknown",
      district: reportData.lastKnownLocation?.district || null,
      team: "Unassigned",
      status: "open",
      missingPersonId: docId,
      photoUrl: reportData.photoUrl || null,
      description: reportData.description || null,
      notes: "Auto-created: no confident ML match found.",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (taskErr) {
    console.warn("[DisasterIQ] Task creation error:", taskErr);
  }
}

// ── Internal: bump global missing-person counter ──────────────────────────
async function _updateStats() {
  try {
    await setDoc(
      doc(db, "stats", "global"),
      { missing: increment(1), updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (statsErr) {
    console.warn("[DisasterIQ] Stats update error (non-critical):", statsErr);
  }
}

// ── Client-side rate limit: max 3 reports per session ────────────────────
const sessionReportCount = { count: 0, resetAt: Date.now() + 3600000 };

function checkRateLimit() {
  if (Date.now() > sessionReportCount.resetAt) {
    sessionReportCount.count = 0;
    sessionReportCount.resetAt = Date.now() + 3600000;
  }
  if (sessionReportCount.count >= 3) {
    throw new Error(
      "Too many reports submitted. Please wait before submitting again.",
    );
  }
  sessionReportCount.count++;
}

// ── Submit a new missing person report ──────────────────────────────────
export async function submitMissingPersonReport(formData) {
  await ensureAnonymousAuth();
  checkRateLimit();

  let lat = null,
    lng = null;
  const locStr = [
    formData.location?.trim(),
    formData.district === "Other" ? formData.customDistrict : formData.district,
    formData.state,
    "India",
  ]
    .filter(Boolean)
    .join(", ");
  if (locStr) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locStr)}&limit=1`,
        { headers: { "Accept-Language": "en" } },
      );
      const data = await res.json();
      if (data && data.length > 0) {
        lat = parseFloat(data[0].lat);
        lng = parseFloat(data[0].lon);
      }
    } catch (err) {
      console.warn("Geocoding error", err);
    }
  }

  const refId = generateRefId();

  let photoUrl = null;
  if (formData.photoFile) {
    try {
      const fileExt = formData.photoFile.name.split(".").pop() || "jpg";
      const fileName = `missing_persons/${refId}/photo_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      const metadata = { contentType: formData.photoFile.type };
      storage.maxUploadRetryTime = 3000;
      await uploadBytes(storageRef, formData.photoFile, metadata);
      photoUrl = await getDownloadURL(storageRef);
    } catch (storageErr) {
      console.warn(
        "Storage upload failed, proceeding without photo:",
        storageErr,
      );
    }
  }

  const payload = {
    refId,
    name: formData.name?.trim() || "Unknown",
    age: formData.age || null,
    gender: formData.gender || null,
    relationship: formData.relationship || null,
    lastKnownLocation: {
      description: formData.location?.trim() || null,
      district: formData.district || null,
      latitude: lat,
      longitude: lng,
      dateLastSeen: formData.date || null,
      timeLastSeen: formData.time || null,
    },
    description: formData.description?.trim() || null,
    photoUrl: photoUrl,
    reporterContact: {
      phone: formData.phone?.trim() || null,
      altPhone: formData.altPhone?.trim() || null,
    },
    reporterUid: auth.currentUser?.uid || null, // ← needed for owner-based rule checks
    status: "missing",
    confidence: null,
    matchedWith: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, COL), payload);

  // Run matching engine async — don't await, don't block the UI
  runMatchingEngine(docRef.id, payload);

  return { id: docRef.id, refId };
}

// ── Fetch a single report by Firestore doc ID ────────────────────────────
export async function getMissingPersonById(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

function normalizeRefId(refId) {
  const cleaned = String(refId || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase();
  if (!cleaned) return "";
  return cleaned.startsWith("FM-") ? cleaned : `FM-${cleaned}`;
}

export async function getMissingPersonByReference(refId) {
  const normalizedRefId = normalizeRefId(refId);
  if (!normalizedRefId) return null;

  const snap = await getDocs(
    query(collection(db, COL), where("refId", "==", normalizedRefId), limit(1)),
  );

  if (snap.empty) return null;
  const result = snap.docs[0];
  return { id: result.id, ...result.data() };
}

export function subscribeMissingPersonByReference(refId, callback, onError) {
  const normalizedRefId = normalizeRefId(refId);
  if (!normalizedRefId) {
    callback(null);
    return () => {};
  }

  const q = query(
    collection(db, COL),
    where("refId", "==", normalizedRefId),
    limit(1),
  );

  return onSnapshot(
    q,
    (snap) => {
      if (snap.empty) {
        callback(null);
        return;
      }
      const result = snap.docs[0];
      callback({ id: result.id, ...result.data() });
    },
    onError,
  );
}

function normalizeAge(value) {
  if (value == null) return null;
  const num = Number(value);
  if (!Number.isNaN(num)) return num;
  if (typeof value === "string") {
    const extracted = Number(value.match(/\d+/)?.[0]);
    return Number.isNaN(extracted) ? null : extracted;
  }
  return null;
}

// ── Search missing persons ────────────────────────────────────────────────
export async function searchMissingPersons(searchTerm = "", filters = {}) {
  const snap = await getDocs(
    query(
      collection(db, COL),
      where("status", "==", "missing"),
      orderBy("createdAt", "desc"),
      limit(300),
    ),
  );
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const term = searchTerm.toLowerCase();
  return all
    .filter((p) => {
      const nameMatch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.lastKnownLocation?.description?.toLowerCase().includes(term);
      const districtMatch =
        !filters.district ||
        p.lastKnownLocation?.district
          ?.toLowerCase()
          .includes(filters.district.toLowerCase());
      const genderMatch = !filters.gender || p.gender === filters.gender;
      const age = normalizeAge(p.age);
      const ageGroupMatch =
        !filters.ageGroup ||
        filters.ageGroup === "all" ||
        (filters.ageGroup === "children" && age != null && age < 18) ||
        (filters.ageGroup === "adults" && age != null && age >= 18);
      return nameMatch && districtMatch && genderMatch && ageGroupMatch;
    })
    .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));
}

// ── Real-time listener for a specific report ─────────────────────────────
export function subscribeMissingPerson(id, callback) {
  return onSnapshot(doc(db, COL, id), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// ── Update status ────────────────────────────────────────────────────────
export async function updateMissingPersonStatus(id, status) {
  await ensureAnonymousAuth();
  await updateDoc(doc(db, COL, id), {
    status,
    updatedAt: serverTimestamp(),
  });
  // Update global stats counter
  if (status === "found") {
    await updateDoc(doc(db, "stats", "global"), {
      missing: increment(-1),
      found: increment(1),
      updatedAt: serverTimestamp(),
    });
  }
}

// ── Resolve a missing-person case as found (rescue workflow) ─────────────
export async function resolveMissingPersonAsFound({
  missingPersonId,
  locationDescription,
  district,
  verifiedBy,
  contactPhone,
  notes,
  resolverUid,
  resolverName,
}) {
  if (!missingPersonId) throw new Error("Missing person ID is required.");
  if (!locationDescription?.trim())
    throw new Error("Found location is required.");
  if (!verifiedBy?.trim()) throw new Error("Verifier name is required.");

  const missingRef = doc(db, COL, missingPersonId);
  const missingSnap = await getDoc(missingRef);
  if (!missingSnap.exists())
    throw new Error("Missing person record not found.");

  const missing = missingSnap.data();
  if (missing.status === "found")
    throw new Error("This case is already marked as found.");

  const resolvedBy = {
    uid: resolverUid || auth.currentUser?.uid || null,
    name:
      resolverName ||
      auth.currentUser?.displayName ||
      auth.currentUser?.email ||
      "Unknown operator",
  };

  const foundRef = doc(collection(db, "found_persons"));
  const now = serverTimestamp();
  const sourceDistrict =
    district?.trim() || missing.lastKnownLocation?.district || null;
  const sourceLocation =
    locationDescription.trim() ||
    missing.lastKnownLocation?.description ||
    null;
  const physicalTags = Array.isArray(missing.physicalTags)
    ? missing.physicalTags
    : Array.isArray(missing.physical_tags)
      ? missing.physical_tags
      : [];

  const foundPayload = {
    name: missing.name || null,
    age: missing.age || null,
    gender: missing.gender || null,
    physicalTags,
    physical_tags: physicalTags,
    location: {
      description: sourceLocation,
      district: sourceDistrict,
      latitude: missing.lastKnownLocation?.latitude ?? null,
      longitude: missing.lastKnownLocation?.longitude ?? null,
    },
    photoUrl: missing.photoUrl || null,
    photo_url: missing.photoUrl || null,
    status: "found",
    source: "rescue_resolution",
    linkedMissingPersonId: missingPersonId,
    verifiedBy: verifiedBy.trim(),
    contactPhone: contactPhone?.trim() || null,
    resolutionNotes: notes?.trim() || null,
    resolvedBy,
    createdAt: now,
    updatedAt: now,
  };

  const taskSnap = await getDocs(
    query(
      collection(db, "tasks"),
      where("missingPersonId", "==", missingPersonId),
    ),
  );

  const batch = writeBatch(db);

  batch.set(foundRef, foundPayload);

  batch.update(missingRef, {
    status: "found",
    found_person_id: foundRef.id,
    resolvedAt: now,
    resolvedBy,
    updatedAt: now,
  });

  taskSnap.forEach((taskDoc) => {
    batch.update(taskDoc.ref, {
      status: "completed",
      resolution: "found",
      resolvedAt: now,
      updatedAt: now,
    });
  });

  batch.set(
    doc(db, "stats", "global"),
    {
      missing: increment(-1),
      found: increment(1),
      updatedAt: now,
    },
    { merge: true },
  );

  batch.set(doc(collection(db, "rescue_activity")), {
    type: "case_resolved_found",
    missingPersonId,
    foundPersonId: foundRef.id,
    summary: `Case resolved as found by ${resolvedBy.name}`,
    verifiedBy: verifiedBy.trim(),
    notes: notes?.trim() || null,
    location: {
      description: sourceLocation,
      district: sourceDistrict,
    },
    actor: resolvedBy,
    createdAt: now,
  });

  await batch.commit();
  return { foundPersonId: foundRef.id };
}
