"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import api, { getErrorMessage } from "@/lib/api";
import { AdminDashboardData, AdminUser } from "@/types";
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
  const [users, setUsers] = useState<AdminUser[]>([]);
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
          setErrorMsg(
            getErrorMessage(
              err,
              "Failed to load Administrator Dashboard."
            )
          );
        }
      })
      .finally(() => setLoading(false));

    api
      .get("/admin/users")
      .then((res) => {
        setUsers(res.data || []);
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
      });
  }, [router]);

  const updateUserRole = async (userId: number, role: string) => {
    try {
      await api.put(`/admin/users/${userId}/role`, {
        roleName: role,
      });

      setUsers((currentUsers) =>
        currentUsers.map((user) =>
          user.id === userId ? { ...user, role } : user
        )
      );
    } catch (err) {
      console.error("Failed to update user role:", err);
      setErrorMsg(
        getErrorMessage(err, "Failed to update user role.")
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-700" />
            <p className="text-sm font-semibold text-slate-600">
              Loading Administrator Dashboard...
            </p>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
        <Navbar />

        <main className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-lg text-center space-y-4">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-xl font-extrabold text-slate-900">
              403 Forbidden Access
            </h1>

            <p className="text-xs text-slate-600 leading-relaxed">
              You do not have Administrator permissions to view the platform
              administrator dashboard. This page is restricted to users with
              the <strong>ADMINISTRATOR</strong> role.
            </p>

            <Link
              href="/dashboard"
              className="inline-block bg-sky-700 hover:bg-sky-800 text-white font-bold px-6 py-2.5 rounded-xl shadow-md transition text-xs"
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
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      {/* Admin Header Banner */}
      <section className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 text-white py-8 px-4 border-b border-sky-900">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/20 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300 mb-2">
              <Lock className="w-3.5 h-3.5" />
              Administrator Control Panel
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Platform Analytics & Overview
            </h1>

            <p className="text-xs text-slate-300 mt-1">
              System metrics, global user management, trip oversight, and
              popular destinations.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700 text-xs text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />

            <span>
              Role:{" "}
              <strong className="text-white">ADMINISTRATOR</strong>
            </span>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs">
            {errorMsg}
          </div>
        )}

        {/* 1. Overview Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold shrink-0">
              <Users className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Registered Users
              </span>

              <span className="text-2xl font-extrabold text-sky-950">
                {data?.userAnalytics.totalUsers || 0}
              </span>

              {data?.userAnalytics.travelerUsers !== undefined && (
                <span className="text-[10px] text-slate-500 block">
                  {data.userAnalytics.travelerUsers} Travelers |{" "}
                  {data.userAnalytics.adminUsers || 0} Admins
                </span>
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
              <Calendar className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Trips Created
              </span>

              <span className="text-2xl font-extrabold text-sky-950">
                {data?.tripAnalytics.totalTrips || 0}
              </span>

              <span className="text-[10px] text-amber-700 font-semibold block">
                {data?.tripAnalytics.activeTrips || 0} Active |{" "}
                {data?.tripAnalytics.completedTrips || 0} Completed
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Platform Expenses Logged
              </span>

              <span className="text-2xl font-extrabold text-sky-950">
                $
                {data?.platformStats.totalExpensesLogged?.toLocaleString(
                  undefined,
                  {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }
                ) || "0.00"}
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-sky-100 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold shrink-0">
              <Bell className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Notifications Sent
              </span>

              <span className="text-2xl font-extrabold text-sky-950">
                {data?.platformStats.totalNotificationsSent || 0}
              </span>
            </div>
          </div>
        </div>

        {/* USER MANAGEMENT */}
        <section className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-700" />

              <h2 className="text-lg font-bold text-sky-950">
                User Management
              </h2>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {users.length} Users
            </span>
          </div>

          {users.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="py-3 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      Name
                    </th>

                    <th className="py-3 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      Email
                    </th>

                    <th className="py-3 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      Current Role
                    </th>

                    <th className="py-3 px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">
                      Change Role
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="py-4 px-3 font-bold text-slate-800">
                        {user.name}
                      </td>

                      <td className="py-4 px-3 text-slate-500">
                        {user.email}
                      </td>

                      <td className="py-4 px-3">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold ${
                            user.role === "ADMINISTRATOR"
                              ? "bg-amber-100 text-amber-900"
                              : "bg-sky-100 text-sky-900"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="py-4 px-3">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            updateUserRole(user.id, e.target.value)
                          }
                          className="border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                        >
                          <option value="TRAVELER">TRAVELER</option>
                          <option value="ADMINISTRATOR">
                            ADMINISTRATOR
                          </option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 2. Destination Analytics */}
        <section className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Compass className="w-5 h-5 text-amber-500" />

            <h2 className="text-lg font-bold text-sky-950">
              Popular Destinations (Across All User Trips)
            </h2>
          </div>

          {!data?.destinationAnalytics ||
          data.destinationAnalytics.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4">
              No destination trip activity recorded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {data.destinationAnalytics.map((dest, idx) => (
                <div
                  key={dest.destinationId}
                  className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>

                    <div>
                      <h4 className="font-extrabold text-sm text-sky-950">
                        {dest.destinationName}
                      </h4>

                      <span className="text-[10px] font-semibold text-slate-500 block">
                        📍 {dest.country}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-extrabold bg-sky-100 text-sky-900 px-3 py-1 rounded-full">
                    {dest.tripCount}{" "}
                    {dest.tripCount === 1 ? "trip" : "trips"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 3. All Platform Trips Overview */}
        <section className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-700" />

              <h2 className="text-lg font-bold text-sky-950">
                All Platform Trips Overview (Read-Only)
              </h2>
            </div>

            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {data?.allTrips?.length || 0} Total Trips
            </span>
          </div>

          {!data?.allTrips || data.allTrips.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 italic">
              No trips have been created on the platform yet.
            </div>
          ) : (
            <div className="space-y-4">
              {data.allTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-sky-950">
                          {trip.title}
                        </h3>

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            trip.status === "ONGOING"
                              ? "bg-emerald-100 text-emerald-800"
                              : trip.status === "COMPLETED"
                              ? "bg-slate-200 text-slate-800"
                              : "bg-sky-100 text-sky-800"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1 text-sky-700 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-amber-500" />
                          {trip.destinationName}{" "}
                          {trip.destinationCountry &&
                            `(${trip.destinationCountry})`}
                        </span>

                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {trip.startDate} to {trip.endDate}
                        </span>
                      </div>
                    </div>

                    <div className="text-right text-xs bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">
                        Owner
                      </span>

                      <span className="font-extrabold text-slate-900">
                        {trip.ownerName}
                      </span>

                      <span className="text-[10px] text-slate-500 block">
                        {trip.ownerEmail}
                      </span>
                    </div>
                  </div>

                  {/* Trip Members Display */}
                  <div>
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                      Members ({trip.memberCount})
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {trip.members.map((m) => (
                        <div
                          key={m.userId}
                          className="bg-white border border-slate-200 px-3 py-1 rounded-xl text-xs flex items-center gap-2 shadow-2xs"
                        >
                          <span className="font-bold text-slate-800">
                            {m.name}
                          </span>

                          <span className="text-[10px] text-slate-400">
                            ({m.email})
                          </span>

                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                              m.role === "OWNER"
                                ? "bg-amber-100 text-amber-900"
                                : m.role === "GROUP_ADMIN"
                                ? "bg-purple-100 text-purple-900"
                                : "bg-slate-100 text-slate-700"
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