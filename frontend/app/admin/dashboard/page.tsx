"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/api";
import { AdminDashboardData } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  ShieldAlert,
  Users,
  Compass,
  DollarSign,
  Bell,
  Calendar,
  MapPin,
  Clock,
  Loader2,
  Lock,
  UserCheck,
} from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");
    if (!token) {
      router.push("/login");
      return;
    }

    if (role !== "ADMINISTRATOR") {
      setForbidden(true);
      setLoading(false);
      return;
    }

    api
      .get("/dashboard/admin")
      .then((res) => {
        if (res.data) {
          setData(res.data);
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setForbidden(true);
        } else {
          setErrorMsg(getErrorMessage(err, "Failed to load Administrator Dashboard."));
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#0B132B]" />
            <p className="text-sm font-semibold text-[#7A6F5A]">Loading Administrator Dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#FFFCF5] p-8 rounded-3xl border border-[#8B2635]/40 shadow-lg text-center space-y-4">
            <div className="w-14 h-14 bg-[#8B2635]/10 text-[#8B2635] rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h1 className="text-xl font-extrabold text-[#0B132B]">403 Forbidden Access</h1>
            <p className="text-xs text-[#7A6F5A] leading-relaxed">
              You do not have Administrator permissions to view the platform administrator dashboard. This page is restricted to users with the <strong>ADMINISTRATOR</strong> role.
            </p>
            <Link
              href="/dashboard"
              className="inline-block bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-6 py-2.5 rounded-xl shadow-md transition text-xs"
            >
              Return to Traveler Dashboard
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      {/* Admin Header Banner */}
      <section className="bg-[#0B132B] text-[#FFFCF5] py-8 px-4 border-b border-[#3B1F5C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#D4AF37]/20 border border-[#D4AF37]/40 px-3 py-1 rounded-full text-xs font-bold text-[#D4AF37] mb-2">
              <Lock className="w-3.5 h-3.5" /> Administrator Control Panel (Read-Only)
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#FFFCF5]">Platform Analytics & Overview</h1>
            <p className="text-xs text-[#E5E0D5] mt-1 font-medium">
              Read-only system metrics, global user analytics, trip oversight, and popular destinations.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-[#3B1F5C]/80 px-4 py-2 rounded-2xl border border-[#D4AF37]/30 text-xs text-[#FFFCF5]">
            <UserCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>Role: <strong className="text-[#D4AF37]">ADMINISTRATOR</strong></span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] rounded-2xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#0B132B] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Total Registered Users</span>
              <span className="text-2xl font-extrabold text-[#0B132B]">{data?.userAnalytics.totalUsers || 0}</span>
              {data?.userAnalytics.travelerUsers !== undefined && (
                <span className="text-[10px] text-[#7A6F5A] block mt-0.5">
                  {data.userAnalytics.travelerUsers} Travelers | {data.userAnalytics.adminUsers || 0} Admins
                </span>
              )}
            </div>
          </div>

          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#3B1F5C] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Total Trips Created</span>
              <span className="text-2xl font-extrabold text-[#3B1F5C]">{data?.tripAnalytics.totalTrips || 0}</span>
              <span className="text-[10px] text-[#3B1F5C] font-bold block mt-0.5">
                {data?.tripAnalytics.activeTrips || 0} Active | {data?.tripAnalytics.completedTrips || 0} Completed
              </span>
            </div>
          </div>

          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#176B55] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-6 h-6 text-[#FFFCF5]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Platform Expenses Logged</span>
              <span className="text-2xl font-extrabold text-[#176B55]">
                ${data?.platformStats.totalExpensesLogged?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
              </span>
            </div>
          </div>

          <div className="bg-[#FFFCF5] p-5 rounded-2xl border border-[#E3D8BC] shadow-xs flex items-center gap-4 hover:border-[#D4AF37] transition">
            <div className="w-12 h-12 rounded-xl bg-[#0B132B] text-[#FFFCF5] flex items-center justify-center font-bold shrink-0">
              <Bell className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block">Notifications Sent</span>
              <span className="text-2xl font-extrabold text-[#0B132B]">{data?.platformStats.totalNotificationsSent || 0}</span>
            </div>
          </div>
        </div>

        {/* Destination Analytics */}
        <section className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E3D8BC] pb-4">
            <Compass className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-lg font-bold text-[#0B132B]">Popular Destinations (Across All User Trips)</h2>
          </div>

          {!data?.destinationAnalytics || data.destinationAnalytics.length === 0 ? (
            <p className="text-xs text-[#7A6F5A] italic py-4">No destination trip activity recorded yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.destinationAnalytics.map((dest, idx) => (
                <div
                  key={dest.destinationId}
                  className="p-4 rounded-2xl border border-[#E3D8BC] bg-[#F8F4E8] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-[#D4AF37] text-[#0B132B] font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-[#0B132B]">{dest.destinationName}</h4>
                      <span className="text-[10px] font-semibold text-[#7A6F5A] block">📍 {dest.country}</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold bg-[#0B132B] text-[#FFFCF5] px-3 py-1 rounded-full">
                    {dest.tripCount} {dest.tripCount === 1 ? "trip" : "trips"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* All Platform Trips Overview */}
        <section className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#0B132B]" />
              <h2 className="text-lg font-bold text-[#0B132B]">All Platform Trips Overview (Read-Only)</h2>
            </div>
            <span className="text-xs font-bold text-[#7A6F5A] bg-[#F8F4E8] px-3 py-1 rounded-full border border-[#E3D8BC]">
              {data?.allTrips?.length || 0} Total Trips
            </span>
          </div>

          {!data?.allTrips || data.allTrips.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#7A6F5A] italic">
              No trips have been created on the platform yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.allTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-5 rounded-2xl border border-[#E3D8BC] bg-[#F8F4E8]/60 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E3D8BC] pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-[#0B132B]">{trip.title}</h3>
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                            trip.status === "ONGOING"
                              ? "bg-[#176B55]/15 text-[#176B55] border-[#176B55]/30"
                              : trip.status === "COMPLETED"
                              ? "bg-[#0B132B]/15 text-[#0B132B] border-[#0B132B]/30"
                              : trip.status === "CANCELLED"
                              ? "bg-[#8B2635]/15 text-[#8B2635] border-[#8B2635]/30"
                              : "bg-[#3B1F5C]/15 text-[#3B1F5C] border-[#3B1F5C]/30"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-[#7A6F5A] mt-1">
                        <span className="flex items-center gap-1 text-[#0B132B] font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                          {trip.destinationName} {trip.destinationCountry && `(${trip.destinationCountry})`}
                        </span>
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-[#7A6F5A]" />
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs bg-[#FFFCF5] px-3 py-1.5 rounded-xl border border-[#E3D8BC] shrink-0">
                      <span className="text-[10px] text-[#7A6F5A] block uppercase font-bold">Owner</span>
                      <span className="font-extrabold text-[#0B132B]">{trip.ownerName}</span>
                      <span className="text-[10px] text-[#7A6F5A] block">{trip.ownerEmail}</span>
                    </div>
                  </div>

                  {/* Trip Members Display */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-[#7A6F5A] tracking-wider block mb-1.5">
                      Members ({trip.memberCount})
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {trip.members.map((m) => (
                        <div
                          key={m.userId}
                          className="bg-[#FFFCF5] border border-[#E3D8BC] px-3 py-1 rounded-xl text-xs flex items-center gap-2 shadow-2xs"
                        >
                          <span className="font-bold text-[#1C1C1C]">{m.name}</span>
                          <span className="text-[10px] text-[#7A6F5A]">({m.email})</span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                              m.role === "OWNER"
                                ? "bg-[#D4AF37]/20 text-[#0B132B]"
                                : m.role === "GROUP_ADMIN"
                                ? "bg-[#3B1F5C]/15 text-[#3B1F5C]"
                                : "bg-[#F8F4E8] text-[#7A6F5A]"
                            }`}
                          >
                            {m.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
