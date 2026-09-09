"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { Destination, Trip } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar, MapPin, Loader2, AlertCircle, Check } from "lucide-react";

export default function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [destinationId, setDestinationId] = useState<string>("");
  const [selectedDest, setSelectedDest] = useState<Destination | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Destination[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState("PLANNED");

  const [fetchingTrip, setFetchingTrip] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    api.get(`/trips/${id}`)
      .then((res) => {
        const trip: Trip = res.data;
        setTitle(trip.title);
        setStartDate(trip.startDate);
        setEndDate(trip.endDate);
        setStatus(trip.status);

        const destObj = trip.destination || (trip.destinationName ? {
          id: trip.destinationId || 0,
          name: trip.destinationName,
          country: trip.destinationCountry || "",
          description: "",
          weatherInfo: "",
          isPopular: false
        } : null);

        if (destObj) {
          setSelectedDest(destObj);
          setDestinationId(destObj.id ? destObj.id.toString() : "");
          setSearchQuery(`${destObj.name}, ${destObj.country}`);
        }
      })
      .catch(() => {
        setError("Failed to load trip details for editing.");
      })
      .finally(() => setFetchingTrip(false));
  }, [id]);

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDest(dest);
    setDestinationId(dest.id.toString());
    setSearchQuery(`${dest.name}, ${dest.country}`);
    setIsDropdownOpen(false);
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
        status,
      };

      await api.put(`/trips/${id}`, payload);
      router.push(`/trips/${id}`);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update trip."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-sky-100 max-w-xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-slate-600"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-sky-950">Edit Trip</h1>
              <p className="text-xs text-slate-500">Update your trip details and schedule</p>
            </div>
          </div>

          {fetchingTrip ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-sky-600" />
              <p className="text-xs">Loading trip details...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trip Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Summer Vacation in Paris"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                {/* Searchable Destination Autocomplete Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destination</label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 z-10" />
                    <input
                      type="text"
                      placeholder="Search destination (e.g. Madurai, Paris, Tokyo)..."
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
                      className="w-full pl-9 pr-8 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-xs font-medium"
                    />

                    {isSearching ? (
                      <Loader2 className="w-4 h-4 text-sky-600 animate-spin absolute right-3 top-3" />
                    ) : searchQuery ? (
                      <button
                        type="button"
                        onClick={handleClearDestination}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    ) : null}

                    {/* Dropdown Options Overlay */}
                    {isDropdownOpen && !selectedDest && (
                      <div
                        className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-56 overflow-y-auto divide-y divide-slate-100"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {isSearching ? (
                          <div className="p-4 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-600" />
                            Searching destinations...
                          </div>
                        ) : searchResults.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs italic">
                            No destinations found.
                          </div>
                        ) : (
                          searchResults.map((dest) => (
                            <button
                              key={dest.id}
                              type="button"
                              onClick={() => handleSelectDestination(dest)}
                              className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition flex items-center justify-between text-xs group"
                            >
                              <div>
                                <span className="font-bold text-slate-800 group-hover:text-sky-900 block">
                                  {dest.name}, {dest.country}
                                </span>
                              </div>
                              {dest.isPopular && (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                  Popular
                                </span>
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {selectedDest && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold text-xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Selected: {selectedDest.name}, {selectedDest.country}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trip Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="PLANNED">PLANNED</option>
                    <option value="ONGOING">ONGOING</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
