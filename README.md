# FindMe

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061A23)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=111827)
![Firestore](https://img.shields.io/badge/Cloud%20Firestore-Database-FFCA28?logo=firebase&logoColor=111827)
![Firebase Auth](https://img.shields.io/badge/Firebase%20Auth-Authentication-FFCA28?logo=firebase&logoColor=111827)
![Firebase Hosting](https://img.shields.io/badge/Firebase%20Hosting-Deploy-FFCA28?logo=firebase&logoColor=111827)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=111827)
![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer%20Motion-Animations-0055FF?logo=framer&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-Maps-199900?logo=leaflet&logoColor=white)
![i18next](https://img.shields.io/badge/i18next-Localization-26A69A?logo=i18next&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white)

FindMe is a crisis-response missing persons platform built for fast reporting, public search, rescue coordination, and reference-number progress tracking. It helps families submit missing-person reports, lets responders manage live rescue tasks, and gives users a simple way to check case progress using the report reference number.

## Highlights

- Public missing-person report flow with photo upload, location details, reporter contact, and duplicate checks.
- Human-readable reference IDs such as `FM-A3B9C1` for every submitted report.
- Progress checker at `/track` so users can follow a case by reference number.
- Searchable missing-person database with filters for location, gender, and age group.
- Rescue dashboard with live task board, map view, task assignment, and case resolution workflow.
- AI match analysis page for comparing reports against found-person records.
- Multilingual-ready UI powered by i18next resource bundles.
- Firebase-backed storage, authentication, Firestore rules, hosting, and emulator configuration.

## Tech Stack

| Layer | Tools |
| --- | --- |
| UI | ![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061A23) ![React DOM](https://img.shields.io/badge/React%20DOM-19-61DAFB?logo=react&logoColor=061A23) |
| Build | ![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white) |
| Styling | ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-06B6D4?logo=tailwindcss&logoColor=white) |
| Routing | ![React Router](https://img.shields.io/badge/React%20Router-7-CA4245?logo=reactrouter&logoColor=white) |
| Animation | ![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-0055FF?logo=framer&logoColor=white) |
| Maps | ![Leaflet](https://img.shields.io/badge/Leaflet-1.9-199900?logo=leaflet&logoColor=white) ![React Leaflet](https://img.shields.io/badge/React%20Leaflet-5-199900?logo=leaflet&logoColor=white) |
| Backend | ![Firebase](https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=111827) ![Firestore](https://img.shields.io/badge/Firestore-Realtime%20DB-FFCA28?logo=firebase&logoColor=111827) |
| Auth | ![Firebase Auth](https://img.shields.io/badge/Firebase%20Auth-Anonymous%20%2B%20Google-FFCA28?logo=firebase&logoColor=111827) |
| Hosting | ![Firebase Hosting](https://img.shields.io/badge/Firebase%20Hosting-SPA-FFCA28?logo=firebase&logoColor=111827) |
| Localization | ![i18next](https://img.shields.io/badge/i18next-26-26A69A?logo=i18next&logoColor=white) ![react-i18next](https://img.shields.io/badge/react--i18next-17-26A69A?logo=i18next&logoColor=white) |
| Icons | ![Lucide](https://img.shields.io/badge/Lucide%20React-Icons-111827?logo=lucide&logoColor=white) |
| Quality | ![ESLint](https://img.shields.io/badge/ESLint-10-4B32C3?logo=eslint&logoColor=white) |

## Core Routes

| Route | Purpose |
| --- | --- |
| `/` | Home page with hero, quick stats, and public bulletin board. |
| `/report` | Missing-person report submission flow. |
| `/track` | Reference-number progress checker. |
| `/track/:refId` | Direct progress view for a specific reference number. |
| `/search` | Public missing-person search page. |
| `/results/:reportId` | Live AI match analysis for a submitted report. |
| `/report-found` | Found-person reporting flow. |
| `/rescue` | Auth-gated rescue command dashboard. |

## Project Structure

```text
RogueDevs/
  public/
    locales/              # Translation JSON files
  src/
    components/           # Shared UI and rescue dashboard components
    data/                 # India states and districts dataset
    firebase/             # Firestore, auth, stats, tasks, report services
    pages/                # App pages and route screens
    services/             # ML and external service clients
    App.jsx               # Route wiring
    main.jsx              # React entry point
  functions/              # Firebase Functions seed scripts
  firestore.rules         # Firestore security rules
  firestore.indexes.json  # Firestore indexes
  firebase.json           # Hosting, Firestore, emulator config
```

## Reference Tracking Flow

1. A user submits a missing-person report.
2. Firestore stores the report with a generated reference ID such as `FM-A3B9C1`.
3. The user opens `/track` and enters the reference number.
4. The tracker subscribes to the matching Firestore record in realtime.
5. The UI shows report status, last update time, case location, and progress steps.

## Security Notes

- Public users can read missing-person records for search and tracking.
- Anonymous authenticated users can create reports.
- Rescue dashboard actions are restricted to Google-authenticated or role-based rescue users.
- Admin-only operations are protected in `firestore.rules`.

## Team

Built by RogueDevs for rapid missing-person reporting, field coordination, and family-facing progress visibility.
