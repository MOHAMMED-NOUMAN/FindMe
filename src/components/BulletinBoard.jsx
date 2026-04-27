import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { searchMissingPersons } from "../firebase/missingPersons";
import { AlertCircle, Megaphone, MapPin, User } from "lucide-react";

export default function BulletinBoard() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadNotices() {
      setLoading(true);
      try {
        const results = await searchMissingPersons("", { ageGroup: filter });
        if (results && results.length > 0) {
          setNotices(results.slice(0, 6)); // Get up to 6 recent missing persons
        } else {
          setNotices(getDummyData(filter));
        }
      } catch (err) {
        setNotices(getDummyData(filter));
      } finally {
        setLoading(false);
      }
    }
    loadNotices();
  }, [filter]);

  function getDummyData(activeFilter) {
    const base = [
      {
        id: "1",
        name: "Rajan Kumar",
        age: 34,
        lastKnownLocation: {
          district: "Wayanad",
          description: "Near Chooralmala bridge",
        },
        gender: "Male",
      },
      {
        id: "2",
        name: "Aisha Begum",
        age: 28,
        lastKnownLocation: {
          district: "Ernakulam",
          description: "Marine Drive area",
        },
        gender: "Female",
      },
      {
        id: "3",
        name: "Kiran",
        age: 12,
        lastKnownLocation: {
          district: "Idukki",
          description: "Munnar town center",
        },
        gender: "Male",
      },
      {
        id: "4",
        name: "Priya",
        age: 45,
        lastKnownLocation: {
          district: "Thrissur",
          description: "Railway Station",
        },
        gender: "Female",
      },
    ];

    if (activeFilter === "children")
      return base.filter((p) => (p.age ?? 99) < 18);
    if (activeFilter === "adults")
      return base.filter((p) => (p.age ?? 0) >= 18);
    return base;
  }

  if (loading)
    return (
      <div className="px-5 pb-12 max-w-6xl mx-auto flex justify-center">
        <div className="animate-pulse flex gap-2 items-center text-slate-400">
          Loading notices...
        </div>
      </div>
    );

  return (
    <section className="px-5 pb-16 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mb-6 flex items-center gap-3"
      >
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center border border-red-200">
          <Megaphone className="w-5 h-5 text-red-600" />
        </div>
        <div>
          <h2
            className="text-2xl font-bold text-[#0F172A]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Missing Persons Bulletin
          </h2>
          <p className="text-sm text-red-600 font-semibold uppercase tracking-wide flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />{" "}
            Live Flash Notices
          </p>
        </div>
      </motion.div>

      <div
        className="mb-4 flex flex-wrap items-center gap-2"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {[
          { id: "all", label: "All Notices" },
          { id: "children", label: "Children" },
          { id: "adults", label: "Adults" },
        ].map((chip) => {
          const active = filter === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => setFilter(chip.id)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Grid of Flash Notices */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notices.map((person, i) => (
          <motion.div
            key={person.id || i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border-l-4 border-l-red-500 border-y border-r border-slate-200 rounded-r-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between relative overflow-hidden"
          >
            {/* Background flash accent */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-full blur-3xl -z-10 opacity-60 translate-x-1/2 -translate-y-1/2" />

            <div>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-bold text-lg text-[#0F172A] truncate pr-2">
                  {person.name || "Unknown Person"}
                </h3>
                <span className="shrink-0 bg-red-50 text-red-700 text-[10px] font-bold uppercase px-2 py-1 rounded-md border border-red-100">
                  Missing
                </span>
              </div>

              <div className="space-y-2 text-sm text-[#475569]">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {person.age ? `${person.age} yrs` : "Unknown age"}
                    {person.gender ? `, ${person.gender}` : ""}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2 leading-tight">
                    {person.lastKnownLocation?.description ||
                      person.lastKnownLocation?.district ||
                      "Location unverified"}
                    {person.lastKnownLocation?.district &&
                    person.lastKnownLocation?.description
                      ? ` (${person.lastKnownLocation.district})`
                      : ""}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A]">
              <AlertCircle className="w-3.5 h-3.5" />
              If found, please contact nearest rescue unit
            </div>

            <div className="mt-3">
              <Link
                to="/report-found"
                className="inline-flex items-center justify-center text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#162D6B] rounded-lg px-3 py-1.5 transition-colors"
              >
                Report Found Person
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {!loading && notices.length === 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          No {filter === "all" ? "" : `${filter} `}notices found right now.
        </div>
      )}
    </section>
  );
}
