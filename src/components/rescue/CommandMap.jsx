import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";
import MapControls from "./MapControls";
import indiaData from "../../data/indiaStatesDistricts.json";

const STATE_COORDS = {
  "Andhra Pradesh": [15.9129, 79.74],
  "Arunachal Pradesh": [28.218, 94.7278],
  Assam: [26.2006, 92.9376],
  Bihar: [25.0961, 85.3131],
  Chhattisgarh: [21.2787, 81.8661],
  Goa: [15.2993, 74.124],
  Gujarat: [22.2587, 71.1924],
  Haryana: [29.0588, 76.0856],
  "Himachal Pradesh": [31.1048, 77.1734],
  Jharkhand: [23.6102, 85.2799],
  Karnataka: [15.3173, 75.7139],
  Kerala: [10.8505, 76.2711],
  "Madhya Pradesh": [22.9734, 78.6569],
  Maharashtra: [19.7515, 75.7139],
  Manipur: [24.6637, 93.9063],
  Meghalaya: [25.467, 91.3662],
  Mizoram: [23.1645, 92.9376],
  Nagaland: [26.1584, 94.5624],
  Odisha: [20.9517, 85.0985],
  Punjab: [31.1471, 75.3412],
  Rajasthan: [27.0238, 74.2179],
  Sikkim: [27.533, 88.5122],
  "Tamil Nadu": [11.1271, 78.6569],
  Telangana: [18.1124, 79.0193],
  Tripura: [23.9408, 91.9882],
  "Uttar Pradesh": [26.8467, 80.9462],
  Uttarakhand: [30.0668, 79.0193],
  "West Bengal": [22.9868, 87.855],
  "Andaman and Nicobar Islands": [11.7401, 92.6586],
  Chandigarh: [30.7333, 76.7794],
  "Dadra and Nagar Haveli and Daman and Diu": [20.1809, 73.0169],
  Delhi: [28.7041, 77.1025],
  "Jammu and Kashmir": [33.7782, 76.5762],
  Ladakh: [34.1526, 77.5771],
  Lakshadweep: [10.5667, 72.6417],
  Puducherry: [11.9416, 79.8083],
};

function getStateForDistrict(districtName) {
  if (!districtName) return null;
  for (const s of indiaData.states) {
    if (s.districts.includes(districtName)) return s.name;
  }
  for (const u of indiaData.union_territories) {
    if (u.districts.includes(districtName)) return u.name;
  }
  return null;
}

// Custom icons
const missingIcon = L.divIcon({
  html: `<div style="width: 14px; height: 14px; background-color: #ef4444; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  className: "",
  iconSize: [14, 14],
});
const foundIcon = L.divIcon({
  html: `<div style="width: 14px; height: 14px; background-color: #10b981; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
  className: "",
  iconSize: [14, 14],
});

function MapUpdater({ selectedState }) {
  const map = useMap();
  useEffect(() => {
    if (
      selectedState &&
      selectedState !== "All" &&
      STATE_COORDS[selectedState]
    ) {
      map.setView(STATE_COORDS[selectedState], 6, { animate: true });
    } else {
      map.setView([22.5937, 78.9629], 5, { animate: true });
    }
  }, [selectedState, map]);
  return null;
}

export default function CommandMap() {
  const [missing, setMissing] = useState([]);
  const [found, setFound] = useState([]);

  const [selectedState, setSelectedState] = useState("All");
  const [selectedDistrict, setSelectedDistrict] = useState("All");

  // Load missing persons
  useEffect(() => {
    const q = query(
      collection(db, "missing_persons"),
      where("status", "==", "missing"),
    );
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withCoords = data.map((p) => {
        const dist = p.lastKnownLocation?.district;
        const st = getStateForDistrict(dist);
        const base = STATE_COORDS[st] || [22.5937, 78.9629];
        // Pseudo-random offset based on ID so markers don't overlap entirely and scatter within state
        const seed1 = p.id.charCodeAt(0) / 255;
        const seed2 = p.id.charCodeAt(p.id.length - 1) / 255;
        return {
          ...p,
          state: st,
          lat: base[0] + (seed1 - 0.5) * 2,
          lng: base[1] + (seed2 - 0.5) * 2,
        };
      });
      setMissing(withCoords);
    });
  }, []);

  // Load found persons
  useEffect(() => {
    return onSnapshot(collection(db, "found_persons"), (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const withCoords = data.map((p) => {
        const dist = p.location?.district;
        const st = getStateForDistrict(dist);
        const base = STATE_COORDS[st] || [22.5937, 78.9629];
        const seed1 = p.id.charCodeAt(0) / 255;
        const seed2 = p.id.charCodeAt(p.id.length - 1) / 255;
        return {
          ...p,
          state: st,
          lat: base[0] + (seed1 - 0.5) * 2,
          lng: base[1] + (seed2 - 0.5) * 2,
        };
      });
      setFound(withCoords);
    });
  }, []);

  const visibleMissing = missing.filter((m) => {
    if (selectedState !== "All" && m.state !== selectedState) return false;
    if (
      selectedDistrict !== "All" &&
      m.lastKnownLocation?.district !== selectedDistrict
    )
      return false;
    return true;
  });

  const visibleFound = found.filter((f) => {
    if (selectedState !== "All" && f.state !== selectedState) return false;
    if (selectedDistrict !== "All" && f.location?.district !== selectedDistrict)
      return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 bg-white shadow-sm z-10 border-b border-slate-100">
        <MapControls
          selectedState={selectedState}
          setSelectedState={setSelectedState}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
        />
      </div>

      <div className="flex-1 relative z-0">
        <MapContainer
          center={[22.5937, 78.9629]}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapUpdater selectedState={selectedState} />

          {visibleMissing.map((m) => (
            <Marker key={m.id} position={[m.lat, m.lng]} icon={missingIcon}>
              <Popup>
                <div
                  className="text-sm"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <strong className="text-red-600 block mb-1 uppercase text-[10px] tracking-wider">
                    Missing Person
                  </strong>
                  <b className="text-sm text-slate-900">
                    {m.name || "Unknown"}
                  </b>{" "}
                  <span className="text-slate-500">
                    ({m.age ? m.age + "y" : "Age unknown"})
                  </span>
                  <br />
                  <span className="text-slate-600 block mt-1">
                    {m.lastKnownLocation?.description || "Location unknown"}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {m.lastKnownLocation?.district || "District unknown"}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {visibleFound.map((f) => (
            <Marker key={f.id} position={[f.lat, f.lng]} icon={foundIcon}>
              <Popup>
                <div
                  className="text-sm"
                  style={{ fontFamily: "var(--font-body)" }}
                >
                  <strong className="text-emerald-600 block mb-1 uppercase text-[10px] tracking-wider">
                    Found Person
                  </strong>
                  <b className="text-sm text-slate-900">
                    {f.name || "Unknown"}
                  </b>{" "}
                  <span className="text-slate-500">
                    ({f.age ? f.age + "y" : "Age unknown"})
                  </span>
                  <br />
                  <span className="text-slate-600 block mt-1">
                    {f.location?.description || "Location unknown"}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {f.location?.district || "District unknown"}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Simple Legend */}
        <div
          className="absolute bottom-3 left-3 md:bottom-6 md:left-6 z-[400] bg-white/95 backdrop-blur rounded-xl shadow-lg shadow-black/5 p-3 md:p-4 border border-slate-200"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <h4 className="text-[11px] md:text-xs font-bold text-slate-800 mb-2 md:mb-3 uppercase tracking-wider">
            Live Map Filter
          </h4>
          <div className="flex flex-col gap-2 md:gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-sm" />
              <span className="text-[11px] md:text-xs text-slate-600 font-semibold tracking-wide">
                Missing ({visibleMissing.length})
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
              <span className="text-[11px] md:text-xs text-slate-600 font-semibold tracking-wide">
                Found ({visibleFound.length})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
