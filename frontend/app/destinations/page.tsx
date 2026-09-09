"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Destination } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, MapPin, Compass, Star, CloudSun, Plus, Loader2, Sparkles } from "lucide-react";

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [popularOnly, setPopularOnly] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const fetchDestinations = (query = "") => {
    setIsSearching(true);
    const url = query ? `/destinations/search?query=${encodeURIComponent(query)}` : "/destinations";

    api
      .get(url)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDestinations(res.data);
        }
      })
      .catch((err) => console.log("Failed to fetch destinations:", err))
      .finally(() => {
        setLoading(false);
        setIsSearching(false);
      });
  };

  // Initial load
  useEffect(() => {
    fetchDestinations("");
  }, []);

  // Debounced search trigger (250ms delay)
  useEffect(() => {
    if (searchQuery === "") return;
    const timer = setTimeout(() => {
      fetchDestinations(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q === "") {
      fetchDestinations("");
    }
  };

  const filtered = destinations.filter((dest) => {
    if (popularOnly && !dest.isPopular) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      {/* Hero Banner with Search */}
      <section className="bg-gradient-to-b from-sky-700 via-sky-800 to-sky-900 text-white py-14 px-4 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-sky-600/60 border border-sky-400/40 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Places & Open-Meteo Weather API
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Discover Worldwide Destinations
          </h1>
          <p className="text-xs sm:text-sm text-sky-100 max-w-xl mx-auto">
            Browse top travel spots, check live weather forecasts, and plan your custom itinerary effortlessly.
          </p>

          {/* Search Input Box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search cities, countries, attractions (e.g. Paris, Tokyo, Bali)..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-400 text-xs sm:text-sm font-medium"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-sky-600 animate-spin absolute right-4 top-4" />
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-sky-950 flex items-center gap-2">
              <Compass className="w-5 h-5 text-amber-500" />
              <span>Explore Top Destinations</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {loading ? "Loading destinations..." : `Showing ${filtered.length} places available for planning`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPopularOnly(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                !popularOnly
                  ? "bg-sky-700 text-white border-sky-700"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Destinations
            </button>
            <button
              onClick={() => setPopularOnly(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${
                popularOnly
                  ? "bg-amber-500 text-slate-950 border-amber-500"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              Popular Destinations Only
            </button>
          </div>
        </div>

        {/* Destination List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-sky-100 p-6 h-52 flex flex-col justify-between" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-sky-100 shadow-sm max-w-md mx-auto my-8">
            <Compass className="w-12 h-12 text-sky-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-sky-950">No Destinations Found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((dest) => (
              <div
                key={dest.id}
                className="bg-white rounded-2xl border border-sky-100 shadow-sm hover:shadow-lg transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-sky-950 group-hover:text-sky-700 transition">
                        {dest.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-medium text-sky-600 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span>{dest.country}</span>
                      </div>
                    </div>
                    {dest.isPopular && (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1 shrink-0">
                        ★ Popular
                      </span>
                    )}
                  </div>

                  <p className="text-slate-600 text-xs mt-3 line-clamp-3 leading-relaxed">
                    {dest.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <CloudSun className="w-4 h-4 text-sky-500" />
                      {dest.weatherInfo || "Clear 22°C"}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <Link
                    href={`/destinations/${dest.id}`}
                    className="font-bold text-sky-700 hover:text-sky-900 hover:underline"
                  >
                    View Details & Weather →
                  </Link>

                  <Link
                    href={`/trips/new?destinationId=${dest.id}`}
                    className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Plan Trip
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
