import {
  addDoc,
  collection,
  getFirestore,
  getDocs,
  limit,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import app, { db, storage } from "./config";

const COL = "rescuerRequests";
const firestoreDb = db || getFirestore(app);

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export async function getRescuerRequestByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const snap = await getDocs(
    query(
      collection(firestoreDb, COL),
      where("email", "==", normalizedEmail),
      limit(1),
    ),
  );

  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
}

async function uploadIdProof(file, normalizedEmail) {
  if (!file) return null;
  const ext = file.name?.split(".").pop() || "jpg";
  const safeEmail = normalizedEmail.replace(/[^a-z0-9@._-]/gi, "_");
  const path = `rescuer_requests/${safeEmail}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file, { contentType: file.type || undefined });
  return getDownloadURL(storageRef);
}

export async function submitRescuerRequest(formData) {
  const normalizedEmail = normalizeEmail(formData.email);
  if (!normalizedEmail) throw new Error("Official email is required.");

  let idProofUrl = null;
  if (formData.idProofFile) {
    try {
      idProofUrl = await uploadIdProof(formData.idProofFile, normalizedEmail);
    } catch {
      // Optional upload: registration should still continue if upload fails.
      idProofUrl = null;
    }
  }

  const payload = {
    name: formData.name?.trim() || "Unknown",
    orgType: formData.orgType || "NGO",
    orgName: formData.orgName?.trim() || null,
    email: normalizedEmail,
    phone: formData.phone?.trim() || null,
    idProofUrl,
    status: "approved",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(firestoreDb, COL), payload);
  return { id: docRef.id, ...payload };
}

