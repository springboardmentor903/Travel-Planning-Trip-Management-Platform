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
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      {/* Hero Banner with Search */}
      <section
        className="text-[#FFFCF5] py-14 px-4 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B132B, #3B1F5C)" }}
      >
        <div className="max-w-4xl mx-auto space-y-4 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#3B1F5C]/80 border border-[#D4AF37]/40 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37]">
            <Sparkles className="w-3.5 h-3.5" /> Powered by Google Places & Open-Meteo Weather API
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#FFFCF5]">
            Discover Worldwide Destinations
          </h1>
          <p className="text-xs sm:text-sm text-[#E5E0D5] max-w-xl mx-auto font-medium">
            Browse top travel spots, check live weather forecasts, and plan your custom itinerary effortlessly.
          </p>

          {/* Search Input Box */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <Search className="w-5 h-5 text-[#7A6F5A] absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search cities, countries, attractions (e.g. Paris, Tokyo, Bali)..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-12 pr-10 py-3.5 bg-[#FFFFFF] text-[#1C1C1C] rounded-2xl shadow-xl focus:outline-none focus:ring-4 focus:ring-[#D4AF37] text-xs sm:text-sm font-medium border border-[#D8CCAE]"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-[#0B132B] animate-spin absolute right-4 top-4" />
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
              <Compass className="w-5 h-5 text-[#D4AF37]" />
              <span>Explore Top Destinations</span>
            </h2>
            <p className="text-xs text-[#7A6F5A] mt-0.5 font-medium">
              {loading ? "Loading destinations..." : `Showing ${filtered.length} places available for planning`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPopularOnly(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                !popularOnly
                  ? "bg-[#0B132B] text-[#FFFCF5] border-[#0B132B]"
                  : "bg-[#FFFCF5] text-[#7A6F5A] border-[#E3D8BC] hover:border-[#D4AF37]"
              }`}
            >
              All Destinations
            </button>
            <button
              onClick={() => setPopularOnly(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border flex items-center gap-1 ${
                popularOnly
                  ? "bg-[#D4AF37] text-[#0B132B] border-[#D4AF37]"
                  : "bg-[#FFFCF5] text-[#7A6F5A] border-[#E3D8BC] hover:border-[#D4AF37]"
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${popularOnly ? "fill-[#0B132B] text-[#0B132B]" : "text-[#D4AF37]"}`} />
              Popular Destinations Only
            </button>
          </div>
        </div>

        {/* Destination List */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-[#FFFCF5] rounded-2xl border border-[#E3D8BC] p-6 h-52 flex flex-col justify-between" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-[#FFFCF5] rounded-2xl p-12 text-center border border-[#E3D8BC] shadow-sm max-w-md mx-auto my-8">
            <Compass className="w-12 h-12 text-[#D4AF37] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0B132B]">No Destinations Found</h3>
            <p className="text-xs text-[#7A6F5A] mt-1">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filtered.map((dest) => (
              <div
                key={dest.id}
                className="bg-[#FFFCF5] rounded-2xl border border-[#E3D8BC] shadow-sm hover:border-[#D4AF37] hover:shadow-lg transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-extrabold text-[#0B132B] group-hover:text-[#3B1F5C] transition">
                        {dest.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs font-medium text-[#7A6F5A] mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{dest.country}</span>
                      </div>
                    </div>
                    {dest.isPopular && (
                      <span className="bg-[#D4AF37]/15 text-[#C58A00] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40 flex items-center gap-1 shrink-0">
                        ★ Popular
                      </span>
                    )}
                  </div>

                  <p className="text-[#7A6F5A] text-xs mt-3 line-clamp-3 leading-relaxed">
                    {dest.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-[#E3D8BC] flex items-center justify-between text-xs text-[#7A6F5A]">
                    <span className="flex items-center gap-1 font-semibold text-[#1C1C1C]">
                      <CloudSun className="w-4 h-4 text-[#0B132B]" />
                      {dest.weatherInfo || "Clear 22°C"}
                    </span>
                  </div>
                </div>

                <div className="bg-[#F8F4E8] p-4 border-t border-[#E3D8BC] flex items-center justify-between gap-2 text-xs">
                  <Link
                    href={`/destinations/${dest.id}`}
                    className="font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline"
                  >
                    View Details & Weather →
                  </Link>

                  <Link
                    href={`/trips/new?destinationId=${dest.id}`}
                    className="inline-flex items-center gap-1 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-3 py-1.5 rounded-lg shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Plan Trip
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
