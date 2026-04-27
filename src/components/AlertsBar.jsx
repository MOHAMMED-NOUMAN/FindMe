import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [loadingCamp, setLoadingCamp] = useState(false);
  const [campError, setCampError] = useState(null);
  const [nearestCamp, setNearestCamp] = useState(null);

  const handleFindNearestCamp = () => {
    if (!navigator.geolocation) {
      setCampError(t("alerts_bar.no_geo"));
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
            setCampError(t("alerts_bar.no_camp"));
            setNearestCamp(null);
            return;
          }
          setNearestCamp(nearest);
        } catch (err) {
          setCampError(err?.message || t("alerts_bar.no_camp"));
          setNearestCamp(null);
        } finally {
          setLoadingCamp(false);
        }
      },
      () => {
        setCampError(t("alerts_bar.location_denied"));
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
        <span>{t("alerts_bar.event_name")}</span>
        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
          {t("alerts_bar.critical")}
        </span>
        <span className="text-white/60 hidden sm:inline">
          — {t("alerts_bar.stay_informed")}
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
            {loadingCamp ? t("alerts_bar.locating") : t("alerts_bar.find_camp_btn")}
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
          <p className="font-bold text-emerald-800">{t("alerts_bar.camp_found")}</p>
          <p className="mt-1 font-semibold">{nearestCamp.name}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-emerald-800">
            <MapPin className="w-3.5 h-3.5" />
            {nearestCamp.locationLabel ||
              nearestCamp.description ||
              nearestCamp.address ||
              t("alerts_bar.location_unavailable")}
          </p>
          {nearestCamp.phone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-emerald-800">
              <Phone className="w-3.5 h-3.5" />
              {nearestCamp.phone}
            </p>
          )}
          <p className="mt-1 text-emerald-700 font-semibold">
            {t("alerts_bar.approx_distance", { dist: nearestCamp.distanceKm.toFixed(1) })}
            <span className="ml-2 text-[11px] uppercase tracking-wide text-emerald-600">
              {nearestCamp.source === "firestore"
                ? t("alerts_bar.source_verified")
                : t("alerts_bar.source_osm")}
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
              {t("alerts_bar.open_maps")}
            </a>

            <a
              href={`https://www.openstreetmap.org/?mlat=${nearestCamp.latitude}&mlon=${nearestCamp.longitude}#map=15/${nearestCamp.latitude}/${nearestCamp.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-300 hover:bg-emerald-100 rounded-lg px-3 py-2 transition-colors"
            >
              {t("alerts_bar.open_osm")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
