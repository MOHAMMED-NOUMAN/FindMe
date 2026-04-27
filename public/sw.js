const APP_CACHE = "find-me-app-v1";
const DATA_CACHE = "find-me-data-v1";
const QUEUE_DB = "find-me-background-sync";
const QUEUE_STORE = "failed-requests";
const SYNC_TAG = "replay-failed-requests";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/icons.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/locales/en/translation.json",
  "/locales/hi/translation.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_CACHE, DATA_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    event.respondWith(networkOrQueue(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(navigationFallback(request));
    return;
  }

  event.respondWith(cacheFirstWithRefresh(request));
});

self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(replayQueuedRequests());
  }
});

async function navigationFallback(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(APP_CACHE);
    cache.put("/index.html", response.clone());
    return response;
  } catch {
    return caches.match("/index.html");
  }
}

async function cacheFirstWithRefresh(request) {
  const cached = await caches.match(request);
  const cacheName = isCriticalDataRequest(request) ? DATA_CACHE : APP_CACHE;

  const fetchPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok && response.type !== "opaque") {
        const cache = await caches.open(cacheName);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise || Response.error();
}

async function networkOrQueue(request) {
  try {
    return await fetch(request.clone());
  } catch (err) {
    if (!shouldQueueRequest(request)) {
      throw err;
    }

    await queueRequest(request);
    await registerBackgroundSync();

    return new Response(
      JSON.stringify({
        queued: true,
        message: "Request saved offline and will retry when connectivity returns.",
      }),
      {
        status: 202,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

function isCriticalDataRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith("/locales/") ||
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("identitytoolkit.googleapis.com") ||
    url.hostname.includes("securetoken.googleapis.com") ||
    url.hostname.includes("overpass-api.de") ||
    url.hostname.includes("nominatim.openstreetmap.org")
  );
}

function shouldQueueRequest(request) {
  const url = new URL(request.url);

  if (!["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    return false;
  }

  if (url.origin === self.location.origin) {
    return true;
  }

  const isFirestoreWrite =
    url.hostname.includes("firestore.googleapis.com") &&
    (url.pathname.includes(":commit") ||
      url.pathname.includes(":batchWrite") ||
      url.pathname.includes("/Write/channel"));

  const isStorageWrite =
    url.hostname.includes("firebasestorage.googleapis.com") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);

  return (
    isFirestoreWrite ||
    isStorageWrite
  );
}

async function queueRequest(request) {
  const body = await request.clone().arrayBuffer();
  const headers = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  const db = await openQueueDb();
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).add({
    url: request.url,
    method: request.method,
    headers,
    body,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer,
    createdAt: Date.now(),
  });

  return transactionDone(tx);
}

async function replayQueuedRequests() {
  const db = await openQueueDb();
  const queued = await getQueuedRequests(db);

  for (const item of queued) {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: item.headers,
        body: item.body,
        mode: item.mode,
        credentials: item.credentials,
        cache: item.cache,
        redirect: item.redirect,
        referrer: item.referrer,
      });

      if (response.ok) {
        await deleteQueuedRequest(db, item.id);
      }
    } catch {
      await registerBackgroundSync();
      throw new Error("Queued requests still need connectivity.");
    }
  }
}

async function registerBackgroundSync() {
  if ("sync" in self.registration) {
    await self.registration.sync.register(SYNC_TAG);
  }
}

function openQueueDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(QUEUE_DB, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getQueuedRequests(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, "readonly");
    const request = tx.objectStore(QUEUE_STORE).getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteQueuedRequest(db, id) {
  const tx = db.transaction(QUEUE_STORE, "readwrite");
  tx.objectStore(QUEUE_STORE).delete(id);
  return transactionDone(tx);
}

function transactionDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}
