"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { Destination } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, MapPin, Loader2, AlertCircle } from "lucide-react";

function CreateTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedDestId = searchParams.get("destinationId");
  const preselectedDestName = searchParams.get("destination");

  const [title, setTitle] = useState("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Search selector state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [loading, setLoading] = useState(false);
  const [fetchingPreselect, setFetchingPreselect] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load preselected destination if destinationId query param exists
  useEffect(() => {
    if (preselectedDestId) {
      setFetchingPreselect(true);
      api
        .get(`/destinations/${preselectedDestId}`)
        .then((res) => {
          if (res.data) {
            setSelectedDest(res.data);
            setDestinationId(res.data.id.toString());
            setSearchQuery(`${res.data.name}, ${res.data.country}`);
            if (!title) {
              setTitle(`Trip to ${res.data.name}`);
            }
          }
        })
        .catch(() => {
          // Fallback to name search if ID lookup fails
          if (preselectedDestName) {
            handleSearch(preselectedDestName);
          }
        })
        .finally(() => setFetchingPreselect(false));
    } else if (preselectedDestName) {
      setFetchingPreselect(true);
      api
        .get(`/destinations/search?query=${encodeURIComponent(preselectedDestName)}`)
        .then((res) => {
          if (Array.isArray(res.data) && res.data.length > 0) {
            const dest = res.data[0];
            setSelectedDest(dest);
            setDestinationId(dest.id.toString());
            setSearchQuery(`${dest.name}, ${dest.country}`);
            if (!title) {
              setTitle(`Trip to ${dest.name}`);
            }
          }
        })
        .catch(() => {})
        .finally(() => setFetchingPreselect(false));
    } else {
      // Pre-load default initial destination list for fast search
      handleSearch("");
    }
  }, [preselectedDestId, preselectedDestName]);

  // Debounced search function
  const handleSearch = (query: string) => {
    setIsSearching(true);
    const url = query.trim()
      ? `/destinations/search?query=${encodeURIComponent(query.trim())}`
      : "/destinations/popular";

    api
      .get(url)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setSearchResults(res.data);
        }
      })
      .catch((err) => console.log("Failed destination search:", err))
      .finally(() => setIsSearching(false));
  };

  useEffect(() => {
    if (!selectedDest && isDropdownOpen) {
      const timer = setTimeout(() => {
        handleSearch(searchQuery);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, isDropdownOpen, selectedDest]);

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDest(dest);
    setDestinationId(dest.id.toString());
    setSearchQuery(`${dest.name}, ${dest.country}`);
    setIsDropdownOpen(false);
    if (!title) {
      setTitle(`Trip to ${dest.name}`);
    }
  };

  const handleClearDestination = () => {
    setSelectedDest(null);
    setDestinationId("");
    setSearchQuery("");
    setIsDropdownOpen(true);
    handleSearch("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title,
        destinationId: destinationId ? parseInt(destinationId) : null,
        startDate,
        endDate,
      };

      const res = await api.post("/trips", payload);
      router.push(`/trips/${res.data.id}`);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to create trip. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFCF5] p-8 rounded-2xl shadow-sm border border-[#E3D8BC] max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-[#F8F4E8] hover:bg-[#0B132B] text-[#7A6F5A] hover:text-[#FFFCF5] transition"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#0B132B]">Plan a New Trip</h1>
          <p className="text-xs text-[#7A6F5A]">Fill in details to set up your itinerary</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-[#0B132B] mb-1">Trip Title *</label>
          <input
            type="text"
            required
            placeholder="e.g. Summer Vacation in Paris"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
          />
        </div>

        {/* Searchable Destination Selector */}
        <div>
          <label className="block font-semibold text-[#0B132B] mb-1">Destination</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3 z-10" />
            <input
              type="text"
              placeholder="Search destination (e.g. Paris, Bangalore, Tokyo)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (selectedDest) {
                  setSelectedDest(null);
                  setDestinationId("");
                }
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              className="w-full pl-9 pr-8 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C] text-xs font-medium"
            />

            {isSearching || fetchingPreselect ? (
              <Loader2 className="w-4 h-4 text-[#0B132B] animate-spin absolute right-3 top-3" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearDestination}
                className="absolute right-3 top-3 text-[#7A6F5A] hover:text-[#0B132B] font-bold"
              >
                ✕
              </button>
            ) : null}

            {/* Dropdown Options Overlay */}
            {isDropdownOpen && !selectedDest && (
              <div
                className="absolute left-0 right-0 top-full mt-1 bg-[#FFFCF5] border border-[#E3D8BC] rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-[#E3D8BC]/60"
                onMouseDown={(e) => e.preventDefault()}
              >
                {isSearching ? (
                  <div className="p-4 text-center text-[#7A6F5A] text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0B132B]" />
                    Searching destinations...
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="p-4 text-center text-[#7A6F5A] text-xs italic">
                    No destinations found.
                  </div>
                ) : (
                  searchResults.map((dest) => (
                    <button
                      key={dest.id}
                      type="button"
                      onClick={() => handleSelectDestination(dest)}
                      className="w-full text-left px-4 py-2.5 hover:bg-[#F8F4E8] transition flex items-center justify-between text-xs group"
                    >
                      <div>
                        <span className="font-bold text-[#0B132B] group-hover:text-[#3B1F5C] block">
                          {dest.name}, {dest.country}
                        </span>
                        <span className="text-[10px] text-[#7A6F5A] line-clamp-1">
                          {dest.description}
                        </span>
                      </div>
                      {dest.isPopular && (
                        <span className="text-[9px] font-extrabold bg-[#D4AF37]/20 text-[#C58A00] px-2 py-0.5 rounded-full shrink-0">
                          ★ Popular
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          {selectedDest && (
            <p className="text-[11px] text-[#176B55] mt-1 font-semibold flex items-center gap-1">
              ✓ Selected: {selectedDest.name}, {selectedDest.country}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-[#0B132B] mb-1">Start Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0B132B] mb-1">End Date *</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-2.5 bg-transparent border border-[#0B132B] hover:bg-[#0B132B] text-[#0B132B] hover:text-[#FFFCF5] font-bold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold rounded-xl shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Trip"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function CreateTripPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Suspense fallback={<div className="text-center py-10 text-xs text-[#7A6F5A]">Loading form...</div>}>
          <CreateTripForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
