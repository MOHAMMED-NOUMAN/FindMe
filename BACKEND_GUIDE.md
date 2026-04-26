# DisasterIQ — Backend Architecture & Setup Guide

## What Was Built

A complete Firebase backend was implemented for every frontend feature currently present in the app. All previously hardcoded mock data has been replaced with live Firestore reads/writes.

---

## File Structure Created

```
RogueDevs/
├── .env.example                    ← Copy to .env.local and fill in credentials
├── .firebaserc                     ← Firebase project alias (update project ID)
├── firebase.json                   ← Full project config (hosting, functions, rules, emulators)
├── firestore.rules                 ← Production Firestore security rules
├── firestore.indexes.json          ← All composite indexes
├── storage.rules                   ← Firebase Storage rules
│
├── src/firebase/                   ← Frontend service layer
│   ├── config.js                   ← Firebase app initialization (reads .env.local)
│   ├── missingPersons.js           ← Submit report, search, real-time listener
│   ├── tasks.js                    ← Task CRUD + real-time Kanban board
│   ├── stats.js                    ← Live stats (QuickStats, KPIBar)
│   ├── notifications.js            ← Notify Me subscriptions
│   └── authService.js              ← Phone OTP auth flow
│
└── functions/                      ← Firebase Cloud Functions (Node 20, asia-south1)
    ├── index.js                    ← All 6 Cloud Functions
    ├── seed.js                     ← Firestore seed script with test data
    └── package.json
```

---

## Firestore Collections

| Collection | Purpose | Who Writes |
|---|---|---|
| `missing_persons` | Core registry of missing people | Frontend (authenticated) + CF |
| `found_persons` | Registry of found/rescued people | Rescue teams |
| `tasks` | Kanban tasks for rescue coordination | Coordinators + CF auto-create |
| `teams` | Rescue team registry + status | Coordinator / Admin |
| `camps` | Relief camp locations + capacity | Coordinator / Admin |
| `stats/global` | Aggregated counters for banners | Cloud Functions only |
| `notification_subscriptions` | "Notify Me" alert registrations | Authenticated users |
| `ivr_reports` | IVR phone call records | Cloud Functions webhook |
| `conflicts` | Duplicate/conflict detection queue | Cloud Functions |
| `disasters` | Active disaster registry | Admin |
| `users` | Role assignments (civilian/rescue/admin) | Admin |

---

## Cloud Functions (6 total, region: asia-south1)

| Function | Trigger | What It Does |
|---|---|---|
| `onMissingPersonCreated` | Firestore write | Runs matching engine against `found_persons`, sets confidence score, auto-creates task if no match |
| `onMissingPersonUpdated` | Firestore write | When status → `found`, notifies all subscribers via SMS/FCM |
| `autoAssignTask` | HTTPS Callable | Finds nearest available rescue team and assigns to task |
| `getQuickStats` | HTTPS REST | Public endpoint returning `stats/global` for homepage banner |
| `submitReport` | HTTPS Callable | Rate-limited (3/hour per phone) wrapper for report submission |
| `deduplicateReport` | HTTPS Callable | Levenshtein fuzzy name match — powers live duplicate warning in Step 1 of ReportPage |

---

## Frontend → Backend Wiring

| Component | Before | After |
|---|---|---|
| `SearchPage.jsx` | Mock array | `searchMissingPersons()` → Firestore query |
| `ReportPage.jsx` | `console.log` | `submitMissingPersonReport()` → Firestore + Storage photo upload |
| `ReportPage Step 1` | Static matches | `deduplicateReport` Cloud Function |
| `QuickStats.jsx` | Hardcoded numbers | `subscribeGlobalStats()` + camps + teams real-time listeners |
| `KPIBar.jsx` | Hardcoded numbers | `subscribeGlobalStats()` real-time listener |
| `TaskBoard.jsx` | Static mock data | `subscribeTaskBoard()` real-time + drag-and-drop writes to Firestore |
| `RescueDashboard.jsx` | Hardcoded SLA alerts | `subscribeCriticalAlerts()` + `subscribeUnassignedCount()` live |
| Notify Me button | `setNotified(true)` | `subscribeToPersonAlerts()` → `notification_subscriptions` collection |

---

## Setup Steps

### 1. Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Create project (e.g. `disasteriq`)
3. Enable: **Firestore**, **Storage**, **Authentication** (Phone provider), **Functions**, **Hosting**

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
# Open .env.local and paste in your Firebase config values
# (Firebase Console > Project Settings > Your Apps > SDK setup)
```

### 3. Set Your Project ID
```bash
firebase login
firebase use --add
# OR manually edit .firebaserc and replace 'your-firebase-project-id'
```

### 4. Deploy Firestore Rules & Indexes
```bash
firebase deploy --only firestore
```

### 5. Deploy Cloud Functions
```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

### 6. Seed Test Data
```bash
# Production Firestore:
cd functions && node seed.js

# OR local emulator:
firebase emulators:start
cd functions && USE_EMULATOR=true node seed.js
```

### 7. Start Frontend
```bash
npm run dev
```

---

## Local Emulator Workflow

```bash
firebase emulators:start      # UI at http://localhost:4000
# In .env.local: VITE_USE_EMULATOR=true
cd functions && USE_EMULATOR=true node seed.js
npm run dev
```

| Service | Port |
|---|---|
| Emulator UI | 4000 |
| Firestore | 8080 |
| Auth | 9099 |
| Functions | 5001 |
| Storage | 9199 |

---

## Matching Engine Algorithm

Scores each new missing person report against `found_persons`:

| Signal | Max Points |
|---|---|
| Name similarity (Levenshtein) | 50 |
| Same district | 20 |
| Same gender | 15 |
| Age proximity | 15 |
| **Total** | **100** |

- **≥ 85** → High Match — auto-notifies subscribers
- **60–84** → Possible Match
- **< 60** → Low Match — auto-creates rescue task

---

## Security Model

| Role | Access |
|---|---|
| Unauthenticated | Read missing_persons, camps, stats, disasters |
| Civilian (phone OTP) | Create missing_persons, manage own subscriptions |
| Rescue Team | Read/update tasks, create found_persons |
| Coordinator | All rescue + create/delete tasks, write camps/teams |
| Admin | Full access |

> Roles are stored in `users/{uid}.role` — set via Firebase Console for rescue members.

---

## Phase 2 Roadmap (Blueprint)

| Feature | Service |
|---|---|
| Real map + heatmap | Google Maps JS API |
| Location text → lat/lng | Geocoding API |
| Photo validation | Cloud Vision API |
| Analytics dashboard | BigQuery |
| Displacement prediction | Vertex AI AutoML |
| Multilingual name matching | text-embedding-gecko |
