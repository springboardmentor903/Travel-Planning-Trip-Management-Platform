"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { Destination } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Compass, Sparkles, MapPin, ArrowRight, CloudSun } from "lucide-react";

export default function Home() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      setIsLoggedIn(true);
    }

    api
      .get("/destinations")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setDestinations(res.data);
        }
      })
      .catch((err) => console.log("Error loading destinations:", err));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      {/* Hero Banner */}
      <section
        className="text-[#FFFCF5] py-20 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B132B, #3B1F5C)" }}
      >
        <div className="max-w-4xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 bg-[#3B1F5C]/80 border border-[#D4AF37]/40 px-4 py-1.5 rounded-full text-xs font-bold text-[#D4AF37]">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Travel Planning & Itinerary Management
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-[#FFFCF5]">
            Explore Exceptional Places & <span className="text-[#D4AF37]">Plan Luxury Journeys</span>
          </h1>

          <p className="text-sm sm:text-base text-[#E5E0D5] max-w-2xl mx-auto leading-relaxed font-medium">
            Your all-in-one travel companion to discover worldwide destinations, organize day-by-day itineraries, check live weather, and track travel history seamlessly.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg transition"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-lg transition"
                >
                  Get Started Free <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 bg-transparent hover:bg-[#0B132B] text-[#D4AF37] hover:text-[#FFFCF5] font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm border border-[#D4AF37] transition"
                >
                  Sign In
                </Link>
              </>
            )}
            <Link
              href="/destinations"
              className="inline-flex items-center gap-2 bg-[#0B132B]/80 hover:bg-[#0B132B] text-[#F8F4E8] font-bold px-6 py-3 rounded-2xl text-xs sm:text-sm border border-[#3B1F5C] transition"
            >
              <Compass className="w-4 h-4 text-[#D4AF37]" /> Explore Destinations
            </Link>
          </div>
        </div>
      </section>

      {/* Popular Travel Destinations */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-[#0B132B] flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#D4AF37]" /> Featured Travel Destinations
            </h2>
            <p className="text-xs text-[#7A6F5A] mt-1 font-medium">Explore top places recommended by travelers</p>
          </div>

          <Link href="/destinations" className="text-xs font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline">
            View All Destinations →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {destinations.map((dest) => (
            <div
              key={dest.id}
              className="bg-[#FFFCF5] border border-[#E3D8BC] rounded-2xl p-6 shadow-sm hover:border-[#D4AF37] hover:shadow-md transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-[#0B132B] group-hover:text-[#3B1F5C] transition">{dest.name}</h3>
                    <span className="text-xs text-[#7A6F5A] font-semibold flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> {dest.country}
                    </span>
                  </div>
                  {dest.isPopular && (
                    <span className="bg-[#D4AF37]/15 text-[#C58A00] text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-[#D4AF37]/40">
                      ★ Popular
                    </span>
                  )}
                </div>

                <p className="text-[#7A6F5A] text-xs mt-3 mb-4 line-clamp-3 leading-relaxed">
                  {dest.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#E3D8BC] flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-[#7A6F5A] font-medium">
                  <CloudSun className="w-4 h-4 text-[#0B132B]" />
                  {dest.weatherInfo || "22°C"}
                </span>

                <Link
                  href={`/destinations/${dest.id}`}
                  className="font-bold text-[#0B132B] hover:text-[#3B1F5C] hover:underline"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
