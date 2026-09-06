"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Trip } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { History, Calendar, MapPin, Eye, Search, Loader2 } from "lucide-react";

export default function TravelHistoryPage() {
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("/trips/my-trips")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setTrips(res.data);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch travel history:", err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Travel history includes completed trips, cancelled trips, or trips whose end date is past
  const pastTrips = trips.filter((trip) => {
    const isCompleted = trip.status === "COMPLETED" || trip.status === "CANCELLED";
    const isPastDate = new Date(trip.endDate) < new Date();
    return isCompleted || isPastDate;
  });

  const filteredHistory = pastTrips.filter((trip) => {
    const q = searchQuery.toLowerCase();
    return (
      trip.title.toLowerCase().includes(q) ||
      (trip.destination?.name && trip.destination.name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[#0B132B] flex items-center gap-2">
              <History className="w-8 h-8 text-[#D4AF37]" /> Travel History
            </h1>
            <p className="text-xs text-[#7A6F5A] mt-1 font-medium">Review your past travels, completed journeys, and trip logs</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search past trips..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-xs text-[#1C1C1C]"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-[#7A6F5A]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0B132B]" />
            <p className="text-xs">Loading travel history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="bg-[#FFFCF5] rounded-3xl p-12 text-center border border-[#E3D8BC] shadow-sm max-w-md mx-auto my-8 space-y-3">
            <History className="w-12 h-12 text-[#D4AF37] mx-auto" />
            <h3 className="text-base font-bold text-[#0B132B]">No Past Travel Records</h3>
            <p className="text-xs text-[#7A6F5A]">
              {searchQuery ? "No travel history matched your search." : "Completed or past trips will appear here automatically."}
            </p>
            <Link
              href="/trips"
              className="inline-block bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition"
            >
              View Active Trips
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory.map((trip) => (
              <div
                key={trip.id}
                className="bg-[#FFFCF5] rounded-2xl border border-[#E3D8BC] shadow-sm hover:border-[#D4AF37] hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-extrabold text-base text-[#0B132B] group-hover:text-[#3B1F5C] transition line-clamp-1">{trip.title}</h3>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#0B132B]/10 text-[#0B132B] border border-[#0B132B]/30">
                      {trip.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-[#7A6F5A] mb-4">
                    {trip.destination && (
                      <div className="flex items-center gap-1.5 font-semibold text-[#0B132B]">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span>{trip.destination.name}, {trip.destination.country}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[#3B1F5C] font-semibold">
                      <Calendar className="w-3.5 h-3.5 text-[#3B1F5C] shrink-0" />
                      <span>{trip.startDate} to {trip.endDate}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#F8F4E8] p-4 border-t border-[#E3D8BC] flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#7A6F5A] text-[11px] font-medium">Logged Journey</span>
                  <Link
                    href={`/trips/${trip.id}`}
                    className="inline-flex items-center gap-1 text-[#0B132B] hover:text-[#3B1F5C] transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" /> View Trip Details
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
