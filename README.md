<p align="center">
  <img src="public/icons/readme_logo.png" alt="FindMe logo" width="640" />
</p>

<h1 align="center">FindMe</h1>

<p align="center">
  A Google Solution Challenge project by RogueDevs for faster missing person reporting, safer disaster response, and coordinated rescue operations.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=061A23" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase-12-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="FastAPI ML" src="https://img.shields.io/badge/FastAPI-ML_Engine-009688?logo=fastapi&logoColor=white" />
</p>

## The Problem

During floods, landslides, crowd incidents, and other emergencies, missing person information often gets scattered across phone calls, social media posts, police desks, volunteer groups, relief camps, and handwritten lists. Families need a way to report quickly. Citizens need a trusted place to share sightings. Rescue teams need live information they can act on.

FindMe brings those pieces into one working disaster response platform. It turns a missing person report into a trackable case, checks it against found person records using a dedicated ML engine, gives families a reference number, and gives rescuers a live command workspace for decisions in the field.

## Google Solution Challenge Focus

FindMe is built around the spirit of the Google Solution Challenge: using technology to solve a real community problem with measurable social impact.

It supports these United Nations Sustainable Development Goals:

* SDG 3: Good Health and Well Being, by reducing the time between reporting, verification, medical attention, and reunification.
* SDG 11: Sustainable Cities and Communities, by helping communities respond during disasters and displacement.
* SDG 16: Peace, Justice and Strong Institutions, by giving families and responders a transparent case flow instead of fragmented updates.
* SDG 17: Partnerships for the Goals, by connecting citizens, NGOs, police, field teams, and technical systems in one shared loop.

## What FindMe Does

FindMe is not only a report form. It is a complete response pipeline:

1. A family member or citizen submits a missing person report.
2. The platform stores the report with a human readable reference ID like `FM-A3B9C1`.
3. The ML engine compares missing and found records by name, age, location, physical details, and face images.
4. The public can search active missing reports and subscribe for alerts.
5. A person who is safe can send an "I am safe" check-in.
6. Rescue operators can review live cases, safe reports, shared field updates, map activity, and AI match results.
7. When a person is verified as found, the case is resolved and the public tracking page updates in real time.

## Working Features

### Public Missing Person Reporting

* A guided four step flow captures identity, age, gender, relationship, last seen date and time, district, map picked location, photo, physical description, reporter phone, alternate phone, and consent.
* Duplicate warnings flag similar active reports before submission, while session rate limiting helps reduce spam during high traffic events.
* Firebase Storage handles report photos, anonymous Firebase Auth allows civilians to submit without an account, and every report receives a human readable `FM` reference ID.
* The confirmation screen gives families an immediate tracking link so the case can be followed without exposing internal database IDs.

### Found Person Reporting

* Citizens can report a found person with name, age, gender, physical tags, location details, and an optional photo.
* Uploaded photos are stored in Firebase Storage and found person records are saved separately for clean comparison against missing reports.
* Location text is geocoded through OpenStreetMap Nominatim, giving the ML and rescue layers better spatial context.
* After submission, the flow supports quickly submitting another found report when multiple people are discovered in the same area.

### Safe Check-In

* The "I am safe" flow lets people report safe, safe but needing help, at relief camp, or medical help status.
* It captures phone, district, location, browser GPS, optional missing report reference, relative phone, relative message, and rescue context.
* Each submission receives a `SAFE` reference ID and is stored as a live safe report.
* Safe check-ins automatically create rescue tasks so operators can verify, contact families, and close active missing cases.

### Public Search

* The public can search active missing reports and filter by district and gender.
* Expandable result cards show photo, name, age, gender, reference ID, district, last known location, and description.
* Confidence states make high, possible, and low signal records easier to scan.
* The "Notify me" action stores phone based alert subscriptions in Firestore, while location and contact actions help citizens respond responsibly.

### Live Case Tracking

* Families can track any case by reference number, including direct links through `/track/:refId`.
* Reference input is normalized, so users can enter codes with or without the `FM` prefix.
* Real time Firestore updates show active, found, and closed states with last checked time, reported date, updated date, last seen date, district, and location.
* A clear timeline shows report received, AI review, rescue response, and resolution, with verifier details once a person is found.

### AI Match Analysis

* The ML match screen checks service health, runs refreshable analysis, and ranks potential matches with composite confidence.
* Score breakdowns show name, age, location, physical tag, and estimated distance signals when returned by the backend.
* A comparison modal places found and missing records side by side, including photos, locations, tags, and identity details.
* Face verification calls the ML face endpoint, and confirmed matches write the found person ID and score back to Firestore for rescue review.

### Rescue Operator Access

* The rescue dashboard is protected behind operator access, with registration for NGO, Police, NDRF, and SDRF personnel.
* Registration captures name, organization type, organization name, official email, phone, and optional ID proof.
* Approved rescuers can use Google Sign-In or email and password authentication.
* Dashboard entry verifies the signed in email against the registered rescuer record and shows operator identity with sign out.

### Live Rescue Dashboard

* The command workspace uses a split screen layout with an operations panel beside a live map.
* Mobile rescuers can switch between the search board and command map without losing context.
* Tabs organize the core workflows: Search Board, Safe Reports, Field Exchange, Comms, and AI analysis.
* Every panel listens to live Firebase data so new reports, updates, and matches appear without manual refresh.

### Emergency Search Board

* Active missing cases stream from Firestore into two operational columns: Missing and Confirmed Match.
* Strong ML signals move cases into the confirmed match column with critical priority styling.
* Task cards are generated from missing person reports, giving rescuers the name, photo, location, district, description, and case age.
* The resolve as found flow captures location, district, verifier, contact phone, notes, and resolver identity, then writes the resolution into missing and found person records.

### Safe Reports Review

* Operators see a live safe report queue with counters for total, new, linked, and medical cases.
* Search supports name, phone, reference, district, and location, while status chips highlight safe, needs help, relief camp, and medical help reports.
* Each card can show relative contact, relative message, GPS coordinates, safety message, and missing reference details.
* Rescuers can find matching missing cases, mark reports reviewed, or confirm safe links that create found records and mark missing cases as found.

### Shared Field Exchange

* Rescuers can share field updates linked to a missing person case or created manually for new sightings.
* Updates include status, priority, source type, district, displacement zone, exact location, team name, reference ID, and notes.
* Filters cover search text, status, and priority, with stats for total updates, critical items, rescued items, and active teams.
* Other operators can convert a shared request into a searchable missing person case on the search board.

### Field Information Exchange

* The live rescue communication room supports roadblock, danger, medical, shelter, supply, rescue needed, and general message categories.
* Messages include priority, district, zone, landmark or route, and full field notes.
* Operators can search messages, roads, camps, districts, zones, and locations, then filter by category, priority, and status.
* Acknowledge and resolve actions keep the room operational, with mobile friendly filters and composer controls.

### Command Map

* The Leaflet command map streams missing and found person markers from Firestore.
* State and district filters let operators narrow the field view quickly.
* Marker popups show report type, name, age, location, and district.
* The map defaults to an India wide view, zooms by state, and includes a live legend with visible missing and found counts.

### Home And Public Awareness

* The public homepage gives immediate actions for Search, Report Missing, Report Found, Safe Check-In, and Rescue Teams.
* A live navbar ticker shows urgent reports, active missing reports, missing children, safe check-ins, and emergency helpline information.
* Quick stats display missing, found, active camps, and active teams, while the bulletin board highlights recent missing notices with all, children, and adult filters.
* The relief camp finder uses browser location, checks verified Firestore camps first, falls back to OpenStreetMap Overpass, and opens results in Google Maps or OpenStreetMap.

### Localization

* The app uses i18next and react-i18next for multilingual UI.
* English, Hindi, and Telugu translation files cover public flows, alerts, form labels, rescue screens, and navigation.
* Browser language detection improves first load comfort for local users.
* A navbar language selector lets users switch language at any time.

### Security And Data Handling

* Firebase Authentication separates anonymous civilian submissions from signed in rescue operations.
* Firestore and Storage rules protect report creation, public reads, uploaded images, rescuer documents, and sensitive updates.
* Public tracking uses reference based lookup so users rely on case IDs like `FM-A3B9C1` instead of internal document IDs.
* Rescue actions such as linking, reviewing, resolving, exchange updates, and communications require authenticated operators.

## ML Model Repository

FindMe uses a dedicated ML backend that lives in a separate repository:

[DarkSire7/find-me](https://github.com/DarkSire7/find-me)

That service powers the matching intelligence used by this frontend. The frontend calls it through `VITE_ML_API_URL`, then writes useful match results back into Firebase so rescue operators see them inside the dashboard.

The ML service supports:

* String and profile matching through `/match/strings`.
* Face comparison through `/match/faces`.
* Health checks through `/health`.
* Composite scoring across identity and context signals.
* Per signal breakdown for name, age, location, and physical tags.

## System Architecture

FindMe is organized as four connected layers:

### Citizen Layer

Families, citizens, and found persons use the public app to report missing people, report found people, search active cases, subscribe for alerts, and submit safe check-ins.

### Intelligence Layer

The ML service ranks possible matches between missing and found records. It can compare structured profile information and face images, then returns confidence scores that the frontend turns into actionable rescue states.

### Operations Layer

Rescue teams use the authenticated dashboard to review live cases, verify safe check-ins, share sightings, coordinate field messages, confirm matches, and resolve cases.

### Data Layer

Firebase powers realtime data, authentication, media uploads, hosting, rules, indexes, and operational collections for missing persons, found persons, safe reports, rescue activity, communications, tasks, subscriptions, camps, teams, and stats.

## Tech Stack

### Frontend

<p>
  <img alt="React 19" src="https://img.shields.io/badge/React_19-61DAFB?logo=react&logoColor=061A23" />
  <img alt="React DOM" src="https://img.shields.io/badge/React_DOM-61DAFB?logo=react&logoColor=061A23" />
  <img alt="Vite 8" src="https://img.shields.io/badge/Vite_8-646CFF?logo=vite&logoColor=white" />
  <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript_ES_Modules-F7DF1E?logo=javascript&logoColor=111827" />
  <img alt="React Router 7" src="https://img.shields.io/badge/React_Router_7-CA4245?logo=reactrouter&logoColor=white" />
  <img alt="Tailwind CSS 4" src="https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Framer Motion" src="https://img.shields.io/badge/Framer_Motion-0055FF?logo=framer&logoColor=white" />
  <img alt="Lucide React" src="https://img.shields.io/badge/Lucide_React-111827?logo=lucide&logoColor=white" />
  <img alt="i18next" src="https://img.shields.io/badge/i18next-26A69A?logo=i18next&logoColor=white" />
  <img alt="react i18next" src="https://img.shields.io/badge/react_i18next-26A69A?logo=i18next&logoColor=white" />
</p>

FindMe's interface is built with React, Vite, route based screens, Tailwind utility styling, Framer Motion transitions, Lucide icons, and i18next localization for English, Hindi, and Telugu.

### Maps And Location

<p>
  <img alt="Leaflet" src="https://img.shields.io/badge/Leaflet_Maps-199900?logo=leaflet&logoColor=white" />
  <img alt="React Leaflet" src="https://img.shields.io/badge/React_Leaflet-199900?logo=leaflet&logoColor=white" />
  <img alt="OpenStreetMap" src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?logo=openstreetmap&logoColor=white" />
  <img alt="Nominatim" src="https://img.shields.io/badge/Nominatim_Geocoding-7EBC6F?logo=openstreetmap&logoColor=white" />
  <img alt="Overpass API" src="https://img.shields.io/badge/Overpass_API-7EBC6F?logo=openstreetmap&logoColor=white" />
  <img alt="Google Maps Links" src="https://img.shields.io/badge/Google_Maps_Links-4285F4?logo=googlemaps&logoColor=white" />
  <img alt="Browser Geolocation" src="https://img.shields.io/badge/Browser_Geolocation_API-0F172A?logo=googlechrome&logoColor=white" />
</p>

Location features use Leaflet and React Leaflet for the command map, OpenStreetMap data for geocoding and relief camp discovery, browser GPS for safe check-ins and nearby camp lookup, and Google Maps deep links for navigation.

### Google Cloud And Firebase

<p>
  <img alt="Google" src="https://img.shields.io/badge/Google_Solution_Challenge-4285F4?logo=google&logoColor=white" />
  <img alt="Firebase" src="https://img.shields.io/badge/Firebase_Platform-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase App" src="https://img.shields.io/badge/Firebase_App-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Cloud Firestore" src="https://img.shields.io/badge/Cloud_Firestore-Realtime_DB-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase Auth" src="https://img.shields.io/badge/Firebase_Auth-Anonymous_Google_Email-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase Storage" src="https://img.shields.io/badge/Firebase_Storage-Uploads-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase Hosting" src="https://img.shields.io/badge/Firebase_Hosting-Web_App-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase Analytics" src="https://img.shields.io/badge/Firebase_Analytics-Events-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firestore Rules" src="https://img.shields.io/badge/Firestore_Rules-Security-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Storage Rules" src="https://img.shields.io/badge/Storage_Rules-Security-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firestore Indexes" src="https://img.shields.io/badge/Firestore_Indexes-Queries-FFCA28?logo=firebase&logoColor=111827" />
  <img alt="Firebase Emulator Suite" src="https://img.shields.io/badge/Firebase_Emulator_Suite-Local_Testing-FFCA28?logo=firebase&logoColor=111827" />
</p>

Firebase is the live backbone of the project: Firestore stores cases and rescue activity, Auth separates anonymous public submissions from signed in rescue operators, Storage handles report photos and ID proof uploads, Hosting serves the app, Analytics is initialized for product visibility, and rules plus indexes keep the data model usable and protected.

### Machine Learning

<p>
  <img alt="FastAPI" src="https://img.shields.io/badge/FastAPI_ML_Service-009688?logo=fastapi&logoColor=white" />
  <img alt="Python" src="https://img.shields.io/badge/Python_ML_Backend-3776AB?logo=python&logoColor=white" />
  <img alt="Profile Matching" src="https://img.shields.io/badge/Profile_Matching-0F172A" />
  <img alt="Face Matching" src="https://img.shields.io/badge/Face_Matching-0F172A" />
  <img alt="Health Endpoint" src="https://img.shields.io/badge/Health_Check_API-16A34A" />
  <img alt="ML Repository" src="https://img.shields.io/badge/ML_Repo-DarkSire7_find_me-181717?logo=github&logoColor=white" />
</p>

The matching engine lives in [DarkSire7/find-me](https://github.com/DarkSire7/find-me). This app connects to it through `VITE_ML_API_URL` for profile matching, face verification, match health checks, and composite confidence scores that rescue teams can act on.

### Quality

<p>
  <img alt="ESLint" src="https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white" />
  <img alt="Modular Services" src="https://img.shields.io/badge/Modular_Services-0F172A" />
  <img alt="Realtime Listeners" src="https://img.shields.io/badge/Realtime_Listeners-0F172A" />
  <img alt="Responsive UI" src="https://img.shields.io/badge/Responsive_UI-0F172A" />
  <img alt="Security Rules" src="https://img.shields.io/badge/Security_Rules-0F172A" />
</p>

The codebase is organized around pages, shared components, Firebase service modules, ML service adapters, realtime listener cleanup, and focused security rules for public and rescue workflows.

## Main Routes

`/`  
Public landing, live stats, alerts, bulletin board, relief camp lookup, and action entry points.

`/report`  
Missing person report flow.

`/report-found`  
Found person report flow.

`/safe`  
Safe check-in flow.

`/search`  
Public searchable missing person database.

`/track`  
Reference based case tracking.

`/track/:refId`  
Direct link to a specific case status page.

`/results/:reportId`  
ML match analysis page.

`/rescue`  
Authenticated rescue command dashboard.

## Data Collections

FindMe uses these Firebase collections across the working app:

* `missing_persons` for missing reports and case status.
* `found_persons` for found reports and verified resolutions.
* `safe_reports` for safe check-ins.
* `tasks` for rescue tasks created from missing reports and safe reports.
* `rescue_exchange` for shared inter-team field updates.
* `rescue_comms` for live field communications.
* `rescue_activity` for resolution and linking events.
* `rescuer_requests` for rescue operator registration.
* `notification_subscriptions` for alert subscriptions.
* `stats` for global counters.
* `camps` for verified relief camp records.
* `teams` for active team counts and assignment support.

## Why It Matters

In an emergency, every repeated question costs time. FindMe reduces that delay by giving every report a clear reference, every safe check-in a place to land, every potential match a confidence trail, and every rescue operator a shared view of what is happening.

The goal is simple: make the path from "someone is missing" to "someone is found" shorter, clearer, and easier to coordinate.

## Built By

RogueDevs for Google Solution Challenge.
