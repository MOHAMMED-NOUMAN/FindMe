import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase/config";

function formatReadableLocation({
  address,
  district,
  state,
  latitude,
  longitude,
}) {
  const parts = [address, district, state].filter(Boolean);
  if (parts.length > 0) return parts.join(", ");
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

function buildGoogleMapsUrl({ name, latitude, longitude }) {
  const label = encodeURIComponent(name || "Relief Camp");
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}&query_place_id=${label}`;
}

function toRad(v) {
  return (v * Math.PI) / 180;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseFirestoreCamp(docData, id) {
  const lat = Number(docData.latitude ?? docData.location?.latitude);
  const lng = Number(docData.longitude ?? docData.location?.longitude);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  const camp = {
    id,
    source: "firestore",
    name: docData.name || docData.title || "Relief Camp",
    description: docData.description || null,
    state: docData.state || null,
    district: docData.district || null,
    address: docData.address || null,
    latitude: lat,
    longitude: lng,
    phone: docData.phone || docData.contactPhone || null,
  };

  return {
    ...camp,
    locationLabel: formatReadableLocation(camp),
    mapsUrl: buildGoogleMapsUrl(camp),
  };
}

async function getNearestFromFirestore(userLat, userLng) {
  const campsQuery = query(
    collection(db, "camps"),
    where("status", "==", "active"),
  );
  const snap = await getDocs(campsQuery);
  if (snap.empty) return null;

  let nearest = null;
  snap.forEach((d) => {
    const camp = parseFirestoreCamp(d.data(), d.id);
    if (!camp) return;
    const distanceKm = haversineKm(
      userLat,
      userLng,
      camp.latitude,
      camp.longitude,
    );
    if (!nearest || distanceKm < nearest.distanceKm) {
      nearest = { ...camp, distanceKm };
    }
  });

  return nearest;
}

async function getNearestFromOpenStreetMap(userLat, userLng) {
  const queryText = `
    [out:json][timeout:20];
    (
      node["amenity"="shelter"](around:50000,${userLat},${userLng});
      node["social_facility"="shelter"](around:50000,${userLat},${userLng});
      node["emergency"="assembly_point"](around:50000,${userLat},${userLng});
    );
    out body;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryText)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("OpenStreetMap lookup failed.");

  const payload = await res.json();
  const elements = Array.isArray(payload.elements) ? payload.elements : [];
  if (elements.length === 0) return null;

  let nearest = null;
  for (const el of elements) {
    const lat = Number(el.lat);
    const lng = Number(el.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;

    const tags = el.tags || {};
    const distanceKm = haversineKm(userLat, userLng, lat, lng);
    const item = {
      id: String(el.id),
      source: "osm",
      name: tags.name || "Nearby Shelter",
      description:
        tags.description || tags.amenity || tags.emergency || "Relief point",
      state: tags["addr:state"] || null,
      district:
        tags["addr:city"] ||
        tags["addr:district"] ||
        tags["addr:suburb"] ||
        null,
      address: tags["addr:full"] || tags["addr:street"] || null,
      latitude: lat,
      longitude: lng,
      phone: tags.phone || tags.contact_phone || null,
      distanceKm,
    };

    item.locationLabel = formatReadableLocation(item);
    item.mapsUrl = buildGoogleMapsUrl(item);

    if (!nearest || item.distanceKm < nearest.distanceKm) {
      nearest = item;
    }
  }

  return nearest;
}

export async function findNearestReliefCamp(userLat, userLng) {
  const firestoreCamp = await getNearestFromFirestore(userLat, userLng);
  if (firestoreCamp) return firestoreCamp;

  return getNearestFromOpenStreetMap(userLat, userLng);
}
