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
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      {/* Welcome Banner */}
      <section className="bg-gradient-to-r from-sky-700 via-sky-800 to-sky-900 text-white py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-sky-600/60 border border-sky-400/40 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Welcome to your Traveler Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold">Hello, {profile?.name || "Traveler"}!</h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              Here is your overall travel summary, upcoming itineraries, and personal travel stats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/trips/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-md transition text-xs"
            >
              <Plus className="w-4 h-4" /> Create New Trip
            </Link>
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 bg-sky-600/80 hover:bg-sky-600 text-white font-bold px-4 py-2.5 rounded-xl border border-sky-500 transition text-xs"
            >
              <Compass className="w-4 h-4 text-amber-300" /> Browse Destinations
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* Top Statistics Cards: Total Trips & Unique Places */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Trips Taken</span>
              <span className="text-2xl font-extrabold text-sky-950">
                {loading ? "..." : data?.travelStats?.totalTripsTaken ?? 0}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Unique Places Visited</span>
              <span className="text-2xl font-extrabold text-sky-950">
                {loading ? "..." : data?.travelStats?.uniqueDestinationsVisited ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column (2 Cols): Upcoming Trips */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-bold text-sky-950">Upcoming Trips</h2>
                </div>
                <Link href="/trips" className="text-xs font-bold text-sky-600 hover:underline">
                  View All Trips →
                </Link>
              </div>

              {loading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-16 bg-slate-100 rounded-2xl w-full" />
                  ))}
                </div>
              ) : !data?.upcomingTrips || data.upcomingTrips.length === 0 ? (
                <div className="py-8 text-center bg-sky-50/50 rounded-2xl border border-sky-100">
                  <p className="text-xs text-slate-500 mb-3">No upcoming trips</p>
                  <Link
                    href="/trips/new"
                    className="inline-flex items-center gap-1.5 bg-sky-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:bg-sky-800 transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Plan a New Trip
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.upcomingTrips.map((trip) => (
                    <div
                      key={trip.id}
                      className="p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-sky-950">{trip.title}</h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                            {trip.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          {trip.destinationName && (
                            <span className="flex items-center gap-1 font-medium text-sky-700">
                              <MapPin className="w-3.5 h-3.5 text-amber-500" />
                              {trip.destinationName} {trip.destinationCountry && `(${trip.destinationCountry})`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {trip.startDate} to {trip.endDate}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/trips/${trip.id}`}
                        className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold text-sky-700 hover:bg-sky-50 transition shrink-0"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Trip Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Right Column (1 Col): Destinations & Travel Style */}
          <div className="space-y-6">
            {/* Favorite Destinations Card */}
            <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-500" /> Favorite Destinations
                </h3>
                <Link href="/settings" className="text-xs font-bold text-sky-600 hover:underline">
                  Edit Profile
                </Link>
              </div>

              {loading ? (
                <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
              ) : !data?.favoriteDestinations || data.favoriteDestinations.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No favorite destinations yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {data.favoriteDestinations.map((fav, i) => (
                    <span key={i} className="text-xs font-bold bg-amber-100 text-amber-900 px-3 py-1 rounded-full border border-amber-200">
                      📍 {fav}
                    </span>
                  ))}
                </div>
              )}

              {/* Derived Most-Visited Destinations */}
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-600" /> Most-Visited Destinations
                </span>

                {loading ? (
                  <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
                ) : !data?.mostVisitedDestinations || data.mostVisitedDestinations.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No destination visit history recorded yet</p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {data.mostVisitedDestinations.map((dest) => (
                      <div key={dest.destinationId} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div>
                          <span className="font-bold text-slate-900 block">{dest.destinationName}</span>
                          <span className="text-[10px] text-slate-500">📍 {dest.country}</span>
                        </div>
                        <span className="text-xs font-black bg-sky-100 text-sky-900 px-2.5 py-0.5 rounded-full">
                          {dest.visitCount} {dest.visitCount === 1 ? "trip" : "trips"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Travel Preferences Summary */}
            <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-sm text-sky-950 flex items-center gap-2">
                  <User className="w-4 h-4 text-sky-600" /> Preferred Travel Style
                </h3>
                <Link href="/settings" className="text-xs font-bold text-sky-600 hover:underline">
                  Edit
                </Link>
              </div>

              {profile?.travelPreferences ? (
                <p className="font-semibold text-slate-800 bg-sky-50 p-3 rounded-xl border border-sky-100">
                  {profile.travelPreferences}
                </p>
              ) : (
                <p className="text-slate-400 italic py-1">No travel preferences added yet</p>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
