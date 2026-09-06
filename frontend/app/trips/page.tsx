"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { Trip } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Plus, Search, Calendar, MapPin, Eye, Edit2, Trash2, Loader2, AlertCircle, UserPlus, CheckCircle2, X } from "lucide-react";

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Search Trips & Join Request Flow State
  const [showSearchJoinModal, setShowSearchJoinModal] = useState(false);
  const [searchTripName, setSearchTripName] = useState("");
  const [searchResults, setSearchResults] = useState<Trip[]>([]);
  const [searching, setSearching] = useState(false);
  const [requestingTripId, setRequestingTripId] = useState<number | null>(null);
  const [joinMessage, setJoinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await api.get("/trips/my-trips");
      if (Array.isArray(res.data)) {
        const mapped = res.data.map((t: Trip) => {
          if (t.destination && (t.destination.id || t.destination.name)) return t;
          if (t.destinationName || t.destinationId) {
            return {
              ...t,
              destination: {
                id: t.destinationId || 0,
                name: t.destinationName || "",
                country: t.destinationCountry || "",
                description: "",
                weatherInfo: "",
                isPopular: false,
              },
            };
          }
          return t;
        });
        setTrips(mapped);
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load trips. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this trip?")) return;

    setDeletingId(id);
    try {
      await api.delete(`/trips/${id}`);
      setTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err: any) {
      alert(getErrorMessage(err, "Failed to delete trip."));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSearchTripsByName = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setJoinMessage(null);
    try {
      const res = await api.get(`/trips/search?name=${encodeURIComponent(searchTripName.trim())}`);
      setSearchResults(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setJoinMessage({ type: "error", text: getErrorMessage(err, "Failed to search trips.") });
    } finally {
      setSearching(false);
    }
  };

  const handleSendJoinRequest = async (tripId: number) => {
    setRequestingTripId(tripId);
    setJoinMessage(null);
    try {
      await api.post(`/trips/${tripId}/join-request`);
      setJoinMessage({ type: "success", text: "Join request sent successfully! The trip admin will review your request." });
    } catch (err: any) {
      setJoinMessage({ type: "error", text: getErrorMessage(err, "Failed to send join request.") });
    } finally {
      setRequestingTripId(null);
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (trip.destination?.name && trip.destination.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || trip.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PLANNED":
        return "bg-[#3B1F5C]/15 text-[#3B1F5C] border-[#3B1F5C]/30";
      case "ONGOING":
        return "bg-[#176B55]/15 text-[#176B55] border-[#176B55]/30";
      case "COMPLETED":
        return "bg-[#0B132B]/15 text-[#0B132B] border-[#0B132B]/30";
      case "CANCELLED":
        return "bg-[#8B2635]/15 text-[#8B2635] border-[#8B2635]/30";
      default:
        return "bg-[#F8F4E8] text-[#7A6F5A] border-[#E3D8BC]";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B132B]">My Travel Trips</h1>
            <p className="text-xs text-[#7A6F5A] mt-1 font-medium">
              Manage all your owned and joined travel itineraries
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSearchTripName("");
                setSearchResults([]);
                setJoinMessage(null);
                setShowSearchJoinModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FFFCF5] border border-[#0B132B] hover:bg-[#0B132B] hover:text-[#FFFCF5] text-[#0B132B] px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition group"
            >
              <UserPlus className="w-4 h-4 text-[#0B132B] group-hover:text-[#FFFCF5]" />
              Find & Join a Trip
            </button>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4 text-[#0B132B]" />
              Create New Trip
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-[#FFFCF5] p-4 rounded-2xl shadow-sm border border-[#E3D8BC] mb-6 flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter my trips by title or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {["ALL", "PLANNED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  statusFilter === status
                    ? "bg-[#0B132B] text-[#FFFCF5] border-[#0B132B]"
                    : "bg-[#FFFCF5] text-[#7A6F5A] border-[#E3D8BC] hover:border-[#D4AF37]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-[#7A6F5A]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0B132B]" />
            <p className="text-xs">Loading your trips...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#8B2635]/10 border border-[#8B2635]/30 rounded-2xl text-[#8B2635] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#8B2635]" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTrips} className="underline font-bold">Retry</button>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-[#FFFCF5] rounded-2xl p-12 text-center border border-[#E3D8BC] shadow-sm max-w-lg mx-auto my-8 space-y-4">
            <Calendar className="w-12 h-12 text-[#D4AF37] mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-[#0B132B] mb-1">No Trips Found</h3>
              <p className="text-xs text-[#7A6F5A]">
                {searchQuery || statusFilter !== "ALL"
                  ? "No trips matched your search filter."
                  : "You haven't created or joined any travel itineraries yet."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowSearchJoinModal(true)}
                className="inline-flex items-center gap-1.5 bg-[#FFFCF5] border border-[#0B132B] text-[#0B132B] hover:bg-[#0B132B] hover:text-[#FFFCF5] px-4 py-2 rounded-xl font-bold text-xs transition"
              >
                <UserPlus className="w-4 h-4" /> Find Trips to Join
              </button>
              <Link
                href="/trips/new"
                className="inline-flex items-center gap-1.5 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2 rounded-xl font-bold text-xs transition"
              >
                <Plus className="w-4 h-4 text-[#D4AF37]" /> Create New Trip
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#FFFCF5] rounded-2xl border border-[#E3D8BC] shadow-sm hover:border-[#D4AF37] hover:shadow-md transition flex flex-col overflow-hidden group"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-[#0B132B] group-hover:text-[#3B1F5C] transition line-clamp-1">{trip.title}</h3>
                        {trip.ownerName && (
                          <span className="text-[10px] text-[#7A6F5A]">Created by: {trip.ownerName}</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border shrink-0 ${getStatusBadge(
                          trip.status
                        )}`}
                      >
                        {trip.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs text-[#7A6F5A] mb-4">
                      {trip.destination && (
                        <div className="flex items-center gap-1.5 font-semibold text-[#7A6F5A]">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-[#D4AF37]" />
                          <span>{trip.destination.name}, {trip.destination.country}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[#3B1F5C] font-semibold">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-[#3B1F5C]" />
                        <span>
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E3D8BC] flex items-center justify-between text-xs font-semibold">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex items-center gap-1 text-[#0B132B] hover:text-[#3B1F5C] transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#D4AF37]" /> View Details & Itinerary
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trips/${trip.id}/edit`}
                        className="p-1.5 rounded-lg bg-[#F8F4E8] hover:bg-[#0B132B] text-[#7A6F5A] hover:text-[#FFFCF5] transition"
                        title="Edit Trip"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        disabled={deletingId === trip.id}
                        className="p-1.5 rounded-lg bg-[#F8F4E8] hover:bg-[#8B2635] text-[#7A6F5A] hover:text-[#FFFCF5] transition"
                        title="Delete Trip"
                      >
                        {deletingId === trip.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: FIND & JOIN A TRIP */}
      {showSearchJoinModal && (
        <div className="fixed inset-0 bg-[#0B132B]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
              <h3 className="font-bold text-base text-[#0B132B] flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#0B132B]" /> Find & Join a Trip
              </h3>
              <button onClick={() => setShowSearchJoinModal(false)} className="text-[#7A6F5A] hover:text-[#0B132B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  joinMessage.type === "success"
                    ? "bg-[#176B55]/10 border-[#176B55]/30 text-[#176B55]"
                    : "bg-[#8B2635]/10 border-[#8B2635]/30 text-[#8B2635]"
                }`}
              >
                {joinMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#176B55]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
                )}
                <span>{joinMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleSearchTripsByName} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="Search trip title (e.g. Summer Euro Tour)..."
                value={searchTripName}
                onChange={(e) => setSearchTripName(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Search</>}
              </button>
            </form>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <p className="text-xs text-[#7A6F5A] italic text-center py-6">
                  {searching ? "Searching trips..." : "Type a trip name above to search and send a join request."}
                </p>
              ) : (
                searchResults.map((t, index) => (
                  <div
                    key={`search-trip-${t.id}-${index}`}
                    className="p-3.5 bg-[#F8F4E8] rounded-xl border border-[#E3D8BC] flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-[#0B132B]">{t.title}</h4>
                      <p className="text-[11px] text-[#7A6F5A]">
                        Owner: {t.ownerName || "Trip Admin"} • Dates: {t.startDate} - {t.endDate}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendJoinRequest(t.id)}
                      disabled={requestingTripId === t.id}
                      className="bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-3 py-1.5 rounded-lg transition shrink-0 disabled:opacity-50 flex items-center gap-1"
                    >
                      {requestingTripId === t.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <><UserPlus className="w-3.5 h-3.5" /> Request to Join</>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
