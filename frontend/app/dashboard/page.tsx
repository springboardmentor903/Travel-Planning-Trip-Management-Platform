"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { TravelerDashboardData, UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Calendar,
  Compass,
  Plus,
  MapPin,
  Clock,
  Eye,
  Heart,
  TrendingUp,
  Sparkles,
  User,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();

  const [data, setData] = useState<TravelerDashboardData | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    // Parallel progressive data fetching
    Promise.all([
      api.get("/dashboard/traveler"),
      api.get("/user/profile"),
    ])
      .then(([dashRes, profileRes]) => {
        if (dashRes.data) setData(dashRes.data);
        if (profileRes.data) {
          setProfile(profileRes.data);
          if (profileRes.data.name) {
            localStorage.setItem("userName", profileRes.data.name);
          }
        }
      })
      .catch((err) => {
        setErrorMsg(getErrorMessage(err, "Failed to load Traveler Dashboard."));
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      {/* Welcome Banner */}
      <section
        className="text-[#FFFCF5] py-10 px-4"
        style={{ background: "linear-gradient(135deg, #0B132B, #3B1F5C)" }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#3B1F5C]/80 border border-[#D4AF37]/40 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to your Traveler Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFCF5]">Hello, {profile?.name || "Traveler"}!</h1>
            <p className="text-xs sm:text-sm text-[#E5E0D5] mt-1 max-w-xl font-medium">
              Here is your overall travel summary, upcoming itineraries, and personal travel stats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-5 py-2.5 rounded-xl shadow-md transition text-xs"
            >
              <Plus className="w-4 h-4 text-[#0B132B]" /> Create New Trip
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 bg-[#0B132B]/80 hover:bg-[#0B132B] text-[#FFFCF5] font-bold px-4 py-2.5 rounded-xl border border-[#D4AF37]/40 transition text-xs"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" /> Browse Destinations
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] rounded-2xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Top Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Total Trips: Royal Navy #0B132B */}
          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#0B132B] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Total Trips Taken</span>
              <span className="text-2xl font-extrabold text-[#0B132B]">
                {loading ? "..." : data?.travelStats?.totalTripsTaken ?? 0}
              </span>
            </div>
          </div>

          {/* Unique Places: Royal Purple #3B1F5C */}
          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#3B1F5C] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Unique Places Visited</span>
              <span className="text-2xl font-extrabold text-[#0B132B]">
                {loading ? "..." : data?.travelStats?.uniqueDestinationsVisited ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Upcoming Trips (Accent Antique Gold #D4AF37) */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#D4AF37]" />
                  <h2 className="text-lg font-bold text-[#0B132B]">Upcoming Trips</h2>
                </div>
                <Link href="/trips" className="text-xs font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline">
                  View All Trips →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-[#F8F4E8] rounded-2xl w-full" />
                  ))}
                </div>
              ) : !data?.upcomingTrips || data.upcomingTrips.length === 0 ? (
                <div className="py-8 text-center bg-[#F8F4E8] rounded-2xl border border-[#E3D8BC]">
                  <p className="text-xs text-[#7A6F5A] mb-3 font-medium">No upcoming trips planned</p>
                  <Link
                    href="/trips/new"
                    className="inline-flex items-center gap-1.5 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#D4AF37]" /> Plan a New Trip
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 rounded-2xl border border-[#E3D8BC] bg-[#F8F4E8]/60 hover:bg-[#F8F4E8] hover:border-[#D4AF37] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-[#0B132B]">{trip.title}</h3>
                          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#3B1F5C]/15 text-[#3B1F5C] border border-[#3B1F5C]/30">
                            {trip.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[#7A6F5A] mt-1">
                          {trip.destinationName && (
                            <span className="flex items-center gap-1 font-semibold text-[#0B132B]">
                              <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                              {trip.destinationName} {trip.destinationCountry && `(${trip.destinationCountry})`}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#7A6F5A]" />
                            {trip.startDate} to {trip.endDate}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1 bg-[#FFFCF5] border border-[#E3D8BC] px-3.5 py-1.5 rounded-xl text-xs font-bold text-[#0B132B] hover:bg-[#0B132B] hover:text-[#FFFCF5] transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Trip Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1 Col): Favorites (Accent Emerald #176B55) */}
          <div className="space-y-6">
            {/* Favorite Destinations Card */}
            <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-3">
                <h3 className="font-bold text-sm text-[#0B132B] flex items-center gap-2">
                  <Heart className="w-4 h-4 text-[#176B55]" /> Favorite Destinations
                </h3>
                <Link href="/settings" className="text-xs font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline">
                  Edit Profile
                </Link>
              </div>

              {loading ? (
                <div className="h-16 bg-[#F8F4E8] rounded-xl animate-pulse" />
              ) : !data?.favoriteDestinations || data.favoriteDestinations.length === 0 ? (
                <p className="text-xs text-[#7A6F5A] italic py-2">No favorite destinations yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.favoriteDestinations.map((fav, i) => (
                    <span key={i} className="text-xs font-bold bg-[#176B55]/15 text-[#176B55] px-3 py-1 rounded-full border border-[#176B55]/30">
                      📍 {fav}
                    </span>
                  ))}
                </div>
              )}

              {/* Derived Most-Visited Destinations */}
              <div className="border-t border-[#E3D8BC] pt-3 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-[#7A6F5A] tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-[#0B132B]" /> Most-Visited Destinations
                </span>

                {loading ? (
                  <div className="h-16 bg-[#F8F4E8] rounded-xl animate-pulse" />
                ) : !data?.mostVisitedDestinations || data.mostVisitedDestinations.length === 0 ? (
                  <p className="text-xs text-[#7A6F5A] italic">No destination visit history recorded yet</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {data.mostVisitedDestinations.map((dest) => (
                      <div key={dest.destinationId} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F4E8] border border-[#E3D8BC]">
                        <div>
                          <span className="font-bold text-[#0B132B] block">{dest.destinationName}</span>
                          <span className="text-[10px] text-[#7A6F5A]">📍 {dest.country}</span>
                        </div>
                        <span className="text-xs font-black bg-[#0B132B] text-[#FFFCF5] px-2.5 py-0.5 rounded-full">
                          {dest.visitCount} {dest.visitCount === 1 ? "trip" : "trips"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Travel Preferences Summary */}
            <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-2">
                <h3 className="font-bold text-sm text-[#0B132B] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0B132B]" /> Preferred Travel Style
                </h3>
                <Link href="/settings" className="text-xs font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline">
                  Edit
                </Link>
              </div>

              {profile?.travelPreferences ? (
                <p className="font-semibold text-[#1C1C1C] bg-[#F8F4E8] p-3 rounded-xl border border-[#E3D8BC]">
                  {profile.travelPreferences}
                </p>
              ) : (
                <p className="text-[#7A6F5A] italic py-1">No travel preferences added yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
