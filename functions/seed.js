#!/usr/bin/env node
// ============================================================
// DisasterIQ — Firestore Seed Script
// Run: node functions/seed.js
// Requires GOOGLE_APPLICATION_CREDENTIALS env var or
// Firebase emulator running (set USE_EMULATOR=true).
//
// Populates: missing_persons, tasks, camps, teams, stats/global
// ============================================================

const admin = require('firebase-admin')

// ── Init ─────────────────────────────────────────────────────
const useEmulator = process.env.USE_EMULATOR === 'true'
if (useEmulator) {
  process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
  console.log('🔧 Using Firestore Emulator at localhost:8080')
}

if (!admin.apps.length) {
  admin.initializeApp(
    useEmulator
      ? { projectId: 'disasteriq-demo' }
      : undefined
  )
}

const db = admin.firestore()
const FieldValue = admin.firestore.FieldValue

// ─────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────

const missingPersons = [
  {
    refId: 'FM-A3B9C1',
    name: 'Sarah Jenkins',
    age: '34',
    gender: 'Female',
    relationship: 'Spouse',
    lastKnownLocation: {
      description: 'Near River Bridge, Calicut',
      district: 'Kozhikode',
      dateLastSeen: '2024-08-14',
      timeLastSeen: '14:30',
    },
    description: 'Wearing a blue kurta. Slightly built, shoulder-length hair. Last seen near the riverbank during evacuation.',
    photoUrl: null,
    reporterContact: { phone: '+919876543210', altPhone: null },
    status: 'missing',
    confidence: 92,
    matchedWith: null,
  },
  {
    refId: 'FM-D7E2F4',
    name: 'Rajan Kumar',
    age: '62',
    gender: 'Male',
    relationship: 'Parent',
    lastKnownLocation: {
      description: 'Flood shelter, Town Hall',
      district: 'Kozhikode',
      dateLastSeen: '2024-08-13',
      timeLastSeen: '09:00',
    },
    description: 'Elderly man. Grey hair, white shirt. Arrived alone. Does not recall family contact.',
    photoUrl: null,
    reporterContact: { phone: '+919123456789', altPhone: null },
    status: 'missing',
    confidence: 41,
    matchedWith: null,
  },
  {
    refId: 'FM-G1H5I8',
    name: 'Emma Mathew',
    age: '28',
    gender: 'Female',
    relationship: 'Sibling',
    lastKnownLocation: {
      description: 'Westside Community Clinic',
      district: 'Malappuram',
      dateLastSeen: '2024-08-14',
      timeLastSeen: '11:15',
    },
    description: 'Similar name reported. Physical description partially matches. Wearing green saree.',
    photoUrl: null,
    reporterContact: { phone: '+919988776655', altPhone: null },
    status: 'missing',
    confidence: 54,
    matchedWith: null,
  },
  {
    refId: 'FM-J2K6L9',
    name: 'Mohammed Fasil',
    age: '40',
    gender: 'Male',
    relationship: 'Friend / Neighbour',
    lastKnownLocation: {
      description: 'Kozhikode Bridge, Sector 2',
      district: 'Kozhikode',
      dateLastSeen: '2024-08-15',
      timeLastSeen: '07:45',
    },
    description: 'Medium build, brown kurta. Was last seen assisting elderly residents near the bridge.',
    photoUrl: null,
    reporterContact: { phone: '+919111222333', altPhone: null },
    status: 'missing',
    confidence: 78,
    matchedWith: null,
  },
  {
    refId: 'FM-M3N7O0',
    name: 'Priya Nair',
    age: '29',
    gender: 'Female',
    relationship: 'Parent',
    lastKnownLocation: {
      description: 'Wayanad, Sector 3 Main Road',
      district: 'Wayanad',
      dateLastSeen: '2024-08-15',
      timeLastSeen: '06:00',
    },
    description: 'Short height, dark hair, wearing a red dupatta. Last seen boarding an evacuation vehicle.',
    photoUrl: null,
    reporterContact: { phone: '+919444555666', altPhone: null },
    status: 'missing',
    confidence: 85,
    matchedWith: null,
  },
]

const tasks = [
  { name: 'Priya Nair', priority: 'CRITICAL', location: 'Wayanad, Sector 3', district: 'Wayanad', team: 'Unassigned', status: 'open', notes: '' },
  { name: 'Mohammed Fasil', priority: 'HIGH', location: 'Kozhikode Bridge', district: 'Kozhikode', team: 'Unassigned', status: 'open', notes: '' },
  { name: 'Lakshmi Devi', priority: 'MEDIUM', location: 'Malappuram South', district: 'Malappuram', team: 'Unassigned', status: 'open', notes: '' },
  { name: 'Rajan Pillai', priority: 'CRITICAL', location: 'Calicut Riverbank', district: 'Kozhikode', team: 'Alpha-7', status: 'assigned', notes: '' },
  { name: 'Aisha Begum', priority: 'HIGH', location: 'Wayanad Relief Rd', district: 'Wayanad', team: 'Bravo-3', status: 'assigned', notes: '' },
  { name: 'Thomas Kurian', priority: 'HIGH', location: 'Sector 5, Hilltop', district: 'Kozhikode', team: 'Delta-1', status: 'enroute', notes: '' },
  { name: 'Deepa Menon', priority: 'CRITICAL', location: 'Flood Zone A', district: 'Wayanad', team: 'Alpha-2', status: 'onscene', notes: '' },
  { name: 'Suresh Kumar', priority: 'MEDIUM', location: 'Town Hall Camp', district: 'Kozhikode', team: 'Charlie-4', status: 'onscene', notes: '' },
  { name: 'Anita George', priority: 'HIGH', location: 'Sector 2 School', district: 'Ernakulam', team: 'Bravo-1', status: 'completed', notes: '' },
]

const teams = [
  { name: 'Alpha-2', status: 'active', currentTaskId: null, members: 4, district: 'Wayanad' },
  { name: 'Alpha-7', status: 'active', currentTaskId: null, members: 3, district: 'Kozhikode' },
  { name: 'Bravo-1', status: 'active', currentTaskId: null, members: 5, district: 'Ernakulam' },
  { name: 'Bravo-3', status: 'active', currentTaskId: null, members: 4, district: 'Wayanad' },
  { name: 'Charlie-4', status: 'active', currentTaskId: null, members: 4, district: 'Kozhikode' },
  { name: 'Delta-1', status: 'active', currentTaskId: null, members: 3, district: 'Kozhikode' },
]

const camps = [
  { name: 'Town Hall Relief Camp', district: 'Kozhikode', capacity: 500, current: 342, status: 'active', lat: 11.2588, lng: 75.7804 },
  { name: 'Government School, Sector 4', district: 'Wayanad', capacity: 300, current: 289, status: 'active', lat: 11.6854, lng: 76.1320 },
  { name: 'Malappuram Community Centre', district: 'Malappuram', capacity: 400, current: 156, status: 'active', lat: 11.0510, lng: 76.0711 },
]

// ─────────────────────────────────────────────────────────────
// SEED FUNCTIONS
// ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding DisasterIQ Firestore...\n')
  const now = FieldValue.serverTimestamp()

  // Missing Persons
  console.log('📋 Writing missing_persons...')
  for (const p of missingPersons) {
    await db.collection('missing_persons').add({ ...p, createdAt: now, updatedAt: now })
    process.stdout.write('.')
  }
  console.log(` ✅ ${missingPersons.length} records`)

  // Tasks
  console.log('📋 Writing tasks...')
  for (const t of tasks) {
    await db.collection('tasks').add({ ...t, missingPersonId: null, createdAt: now, updatedAt: now })
    process.stdout.write('.')
  }
  console.log(` ✅ ${tasks.length} records`)

  // Teams
  console.log('📋 Writing teams...')
  for (const team of teams) {
    await db.collection('teams').doc(team.name).set({ ...team, createdAt: now })
    process.stdout.write('.')
  }
  console.log(` ✅ ${teams.length} records`)

  // Camps
  console.log('📋 Writing camps...')
  for (const camp of camps) {
    await db.collection('camps').add({ ...camp, createdAt: now })
    process.stdout.write('.')
  }
  console.log(` ✅ ${camps.length} records`)

  // Global Stats (initial snapshot)
  console.log('📊 Writing stats/global...')
  await db.doc('stats/global').set({
    missing: missingPersons.filter((p) => p.status === 'missing').length,
    found: missingPersons.filter((p) => p.status === 'found').length,
    activeRescues: tasks.filter((t) => ['enroute', 'onscene'].includes(t.status)).length,
    campsOpen: camps.filter((c) => c.status === 'active').length,
    teamsActive: teams.filter((t) => t.status === 'active').length,
    avgResolutionHours: 4.2,
    updatedAt: now,
  })
  console.log(' ✅ Done')

  console.log('\n✨ Seed complete!\n')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
