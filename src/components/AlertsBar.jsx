import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Tent,
  AlertTriangle,
  Loader2,
  MapPin,
  Phone,
  Navigation,
} from "lucide-react";
import { useState } from "react";
import { findNearestReliefCamp } from "../services/campsService";

export default function AlertsBar() {
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [campError, setCampError] = useState(null);
  const [nearestCamp, setNearestCamp] = useState(null);

  const handleFindNearestCamp = () => {
    if (!navigator.geolocation) {
      setCampError("Geolocation is not supported on this device.");
      return;
    }

    setCampError(null);
    setLoadingCamp(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const nearest = await findNearestReliefCamp(latitude, longitude);
          if (!nearest) {
            setCampError(
              "No nearby relief camp found. Please call 112 for assistance.",
            );
            setNearestCamp(null);
            return;
          }
          setNearestCamp(nearest);
        } catch (err) {
          setCampError(
            err?.message || "Unable to find nearest camp right now.",
          );
          setNearestCamp(null);
        } finally {
          setLoadingCamp(false);
        }
      },
      () => {
        setCampError(
          "Location permission denied. Enable location to find nearest camp.",
        );
        setLoadingCamp(false);
      },
      { enableHighAccuracy: true, timeout: 12000 },
    );
  };

  return (
    <div
      className="px-5 max-w-6xl mx-auto mt-6"
      style={{ fontFamily: "var(--font-body)" }}
    >
      <div className="bg-[#1E3A8A] text-white text-sm py-2.5 px-5 flex items-center justify-center gap-2 font-medium rounded-xl shadow-sm">
        <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
        <span>Kerala Floods</span>
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
          Critical
        </span>
        <span className="text-white/60 hidden sm:inline">
          — Stay informed. Help is on the way.
        </span>
      </div>

      <div className="mt-4 flex justify-center">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <button
            onClick={handleFindNearestCamp}
            disabled={loadingCamp}
            className="inline-flex items-center gap-2.5 bg-[#1E3A8A] hover:bg-[#162D6B] text-white rounded-xl px-6 py-3 text-sm font-semibold transition-colors shadow-md shadow-[#1E3A8A]/20"
          >
            {loadingCamp ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Tent className="w-4 h-4" />
            )}
            {loadingCamp
              ? "Locating nearest camp..."
              : "Find Nearest Relief Camp"}
          </button>
        </motion.div>
      </div>

      {campError && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {campError}
        </div>
      )}

      {nearestCamp && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-bold text-emerald-800">
            Nearest Relief Camp Found
          </p>
          <p className="mt-1 font-semibold">{nearestCamp.name}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-emerald-800">
            <MapPin className="w-3.5 h-3.5" />
            {nearestCamp.locationLabel ||
              nearestCamp.description ||
              nearestCamp.address ||
              "Location details unavailable"}
          </p>
          {nearestCamp.phone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-emerald-800">
              <Phone className="w-3.5 h-3.5" />
              {nearestCamp.phone}
            </p>
          )}
          <p className="mt-1 text-emerald-700 font-semibold">
            Approx distance: {nearestCamp.distanceKm.toFixed(1)} km
            <span className="ml-2 text-[11px] uppercase tracking-wide text-emerald-600">
              Source:{" "}
              {nearestCamp.source === "firestore"
                ? "Verified camps data"
                : "OpenStreetMap"}
            </span>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={nearestCamp.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg px-3 py-2 transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              Open In Google Maps
            </a>

            <a
              href={`https://www.openstreetmap.org/?mlat=${nearestCamp.latitude}&mlon=${nearestCamp.longitude}#map=15/${nearestCamp.latitude}/${nearestCamp.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg px-3 py-2 transition-colors"
            >
              Open In OSM
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
