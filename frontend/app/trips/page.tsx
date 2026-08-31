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
        setTrips(res.data);
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "ONGOING":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-sky-950">My Travel Trips</h1>
            <p className="text-xs text-slate-500 mt-1">
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
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <UserPlus className="w-4 h-4 text-sky-600" />
              Find & Join a Trip
            </button>
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create New Trip
            </Link>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-sky-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center text-xs">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter my trips by title or destination..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {["ALL", "PLANNED", "ONGOING", "COMPLETED", "CANCELLED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  statusFilter === status
                    ? "bg-sky-700 text-white border-sky-700"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-600" />
            <p className="text-xs">Loading your trips...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button onClick={fetchTrips} className="underline font-bold">Retry</button>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-sky-100 shadow-sm max-w-lg mx-auto my-8 space-y-4">
            <Calendar className="w-12 h-12 text-sky-300 mx-auto" />
            <div>
              <h3 className="text-lg font-bold text-sky-950 mb-1">No Trips Found</h3>
              <p className="text-xs text-slate-500">
                {searchQuery || statusFilter !== "ALL"
                  ? "No trips matched your search filter."
                  : "You haven't created or joined any travel itineraries yet."}
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowSearchJoinModal(true)}
                className="inline-flex items-center gap-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 px-4 py-2 rounded-xl font-bold text-xs transition"
              >
                <UserPlus className="w-4 h-4" /> Find Trips to Join
              </button>
              <Link
                href="/trips/new"
                className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition"
              >
                <Plus className="w-4 h-4" /> Create New Trip
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl border border-sky-100 shadow-sm hover:shadow-md transition flex flex-col overflow-hidden"
              >
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-sky-950 line-clamp-1">{trip.title}</h3>
                        {trip.ownerName && (
                          <span className="text-[10px] text-slate-400">Created by: {trip.ownerName}</span>
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

                    <div className="space-y-2 text-xs text-slate-600 mb-4">
                      {trip.destination && (
                        <div className="flex items-center gap-1.5 font-medium text-sky-700">
                          <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                          <span>{trip.destination.name}, {trip.destination.country}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span>
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="flex items-center gap-1 text-sky-600 hover:text-sky-800 transition"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details & Itinerary
                    </Link>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trips/${trip.id}/edit`}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition"
                        title="Edit Trip"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(trip.id)}
                        disabled={deletingId === trip.id}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 transition"
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

      {/* ========================================================================= */}
      {/* MODAL: FIND & JOIN A TRIP */}
      {/* ========================================================================= */}
      {showSearchJoinModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-sky-950 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-sky-600" /> Find & Join a Trip
              </h3>
              <button onClick={() => setShowSearchJoinModal(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {joinMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
                  joinMessage.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {joinMessage.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
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
                className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-sky-700 hover:bg-sky-800 text-white px-4 py-2 rounded-xl font-bold transition flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Search</>}
              </button>
            </form>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-400 italic text-center py-6">
                  {searching ? "Searching trips..." : "Type a trip name above to search and send a join request."}
                </p>
              ) : (
                searchResults.map((t, index) => (
                  <div
                    key={`search-trip-${t.id}-${index}`}
                    className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900">{t.title}</h4>
                      <p className="text-[11px] text-slate-500">
                        Owner: {t.ownerName || "Trip Admin"} • Dates: {t.startDate} - {t.endDate}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSendJoinRequest(t.id)}
                      disabled={requestingTripId === t.id}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition shrink-0 disabled:opacity-50 flex items-center gap-1"
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
