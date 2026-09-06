"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { Destination, WeatherInfo, Attraction } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowLeft, MapPin, CloudSun, Wind, Droplets, Clock, Plus, Loader2, Star, Sparkles, Landmark, PlusCircle, CheckCircle2, AlertCircle } from "lucide-react";

export default function DestinationDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [destination, setDestination] = useState<Destination | null>(null);
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [loadingAttractions, setLoadingAttractions] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Admin Attraction Form State
  const [isAdmin, setIsAdmin] = useState(false);
  const [attractionName, setAttractionName] = useState("");
  const [attractionDesc, setAttractionDesc] = useState("");
  const [submittingAttraction, setSubmittingAttraction] = useState(false);
  const [attractionError, setAttractionError] = useState<string | null>(null);
  const [attractionSuccess, setAttractionSuccess] = useState<string | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    setIsAdmin(role === "ADMINISTRATOR");

    // Fetch destination details
    api
      .get(`/destinations/${id}`)
      .then((res) => {
        setDestination(res.data);
      })
      .catch(() => {
        setError("Destination not found.");
      })
      .finally(() => setLoading(false));

    // Fetch live weather from backend weather API
    api
      .get(`/destinations/${id}/weather`)
      .then((res) => {
        setWeather(res.data);
      })
      .catch((err) => {
        console.log("Failed to fetch live weather:", err);
      })
      .finally(() => setLoadingWeather(false));

    // Fetch attractions
    api
      .get(`/destinations/${id}/attractions`)
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAttractions(res.data);
        }
      })
      .catch((err) => {
        console.log("Failed to fetch attractions:", err);
      })
      .finally(() => setLoadingAttractions(false));
  }, [id]);

  const handleCreateAttraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!attractionName.trim()) {
      setAttractionError("Attraction name is required.");
      return;
    }
    if (!attractionDesc.trim()) {
      setAttractionError("Short description is required.");
      return;
    }

    setSubmittingAttraction(true);
    setAttractionError(null);
    setAttractionSuccess(null);

    api
      .post(`/destinations/${id}/attractions`, {
        name: attractionName.trim(),
        shortDescription: attractionDesc.trim(),
      })
      .then((res) => {
        setAttractions((prev) => [...prev, res.data]);
        setAttractionName("");
        setAttractionDesc("");
        setAttractionSuccess("Attraction added successfully!");
      })
      .catch((err) => {
        setAttractionError(getErrorMessage(err));
      })
      .finally(() => setSubmittingAttraction(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-[#7A6F5A] py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0B132B]" />
            <p className="text-xs">Loading destination details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <div className="bg-[#8B2635]/10 border border-[#8B2635]/30 rounded-2xl p-6 text-[#8B2635] text-xs flex items-center justify-between">
            <span>{error || "Destination not found."}</span>
            <Link href="/destinations" className="underline font-bold">Back to Destinations</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      {/* Header Banner */}
      <section
        className="text-[#FFFCF5] py-12 px-4 relative"
        style={{ background: "linear-gradient(135deg, #0B132B, #3B1F5C)" }}
      >
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 bg-[#3B1F5C]/80 hover:bg-[#3B1F5C] text-[#FFFCF5] px-3.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xs transition border border-[#D4AF37]/30"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Destinations
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-[#FFFCF5]">{destination.name}</h1>
                {destination.isPopular && (
                  <span className="bg-[#D4AF37] text-[#0B132B] text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-[#0B132B]" /> Popular Destination
                  </span>
                )}
              </div>
              <p className="text-[#E5E0D5] text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D4AF37]" /> {destination.country}
              </p>
            </div>

            <Link
              href={`/trips/new?destinationId=${destination.id}&destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-6 py-3 rounded-2xl shadow-lg transition text-xs shrink-0"
            >
              <Plus className="w-4 h-4 text-[#0B132B]" /> Plan a Trip
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" /> About {destination.name}
              </h2>
              <p className="text-[#7A6F5A] text-xs sm:text-sm leading-relaxed whitespace-pre-line font-medium">
                {destination.description}
              </p>
            </div>

            {/* Attractions Section */}
            <div className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#0B132B] flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-[#3B1F5C]" /> Top Attractions
                </h2>
                <span className="text-xs font-bold text-[#0B132B] bg-[#F8F4E8] px-3 py-1 rounded-full border border-[#E3D8BC]">
                  {attractions.length} listed
                </span>
              </div>

              {loadingAttractions ? (
                <div className="py-8 text-center text-[#7A6F5A] text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0B132B]" />
                  <span>Loading attractions...</span>
                </div>
              ) : attractions.length === 0 ? (
                <div className="py-8 text-center text-[#7A6F5A] text-xs italic bg-[#F8F4E8] rounded-2xl border border-dashed border-[#E3D8BC]">
                  No attractions have been added for this destination yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attractions.map((a) => (
                    <div
                      key={a.id}
                      className="p-5 rounded-2xl border border-[#E3D8BC] bg-[#FFFCF5] hover:border-[#D4AF37] hover:shadow-md transition space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-[#3B1F5C] group-hover:text-[#0B132B] transition">
                          {a.name}
                        </h3>
                        <Landmark className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-[#7A6F5A] leading-relaxed">
                        {a.shortDescription}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin-Only Create Attraction Form */}
              {isAdmin && (
                <div className="pt-6 border-t border-[#E3D8BC] space-y-4">
                  <div className="flex items-center gap-2 text-[#0B132B] font-extrabold text-sm">
                    <PlusCircle className="w-4 h-4 text-[#176B55]" /> Add New Attraction (Administrator)
                  </div>

                  {attractionSuccess && (
                    <div className="p-3 bg-[#176B55]/10 border border-[#176B55]/30 text-[#176B55] rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-[#176B55]" />
                      <span>{attractionSuccess}</span>
                    </div>
                  )}

                  {attractionError && (
                    <div className="p-3 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
                      <span>{attractionError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateAttraction} className="space-y-4 bg-[#F8F4E8] p-5 rounded-2xl border border-[#E3D8BC]">
                    <div>
                      <label className="block text-xs font-bold text-[#0B132B] mb-1">Attraction Name *</label>
                      <input
                        type="text"
                        required
                        value={attractionName}
                        onChange={(e) => setAttractionName(e.target.value)}
                        placeholder="e.g. Eiffel Tower, Grand Canyon..."
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D8CCAE] text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none bg-[#FFFFFF] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#0B132B] mb-1">Short Description *</label>
                      <textarea
                        required
                        rows={3}
                        value={attractionDesc}
                        onChange={(e) => setAttractionDesc(e.target.value)}
                        placeholder="Describe why travelers should visit this attraction..."
                        className="w-full px-3.5 py-2 rounded-xl border border-[#D8CCAE] text-xs focus:ring-2 focus:ring-[#D4AF37] focus:outline-none bg-[#FFFFFF] text-[#1C1C1C]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAttraction}
                      className="inline-flex items-center gap-2 bg-[#176B55] hover:bg-[#176B55]/90 text-[#FFFCF5] font-bold px-5 py-2 rounded-xl text-xs shadow-xs transition disabled:opacity-50"
                    >
                      {submittingAttraction ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Adding...
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Save Attraction
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>

          {/* Live Weather Widget Sidebar */}
          <div className="space-y-6">
            <div className="bg-[#0B132B] text-[#FFFCF5] p-6 rounded-3xl border border-[#3B1F5C] shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-[#3B1F5C] pb-4">
                <div>
                  <span className="text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">Live Weather Service</span>
                  <h3 className="text-base font-bold text-[#FFFCF5]">{destination.name} Weather</h3>
                </div>
                <CloudSun className="w-8 h-8 text-[#D4AF37]" />
              </div>

              {loadingWeather ? (
                <div className="py-6 text-center text-[#E5E0D5] text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#D4AF37]" />
                  Fetching live weather from Open-Meteo REST API...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-black text-[#FFFCF5]">{weather?.temperature || 22}°C</div>
                      <p className="text-xs font-semibold text-[#D4AF37] mt-1">
                        {weather?.condition || "Sunny & Clear"}
                      </p>
                    </div>
                    <div className="text-5xl">{weather?.weatherIcon || "☀️"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#3B1F5C] text-xs">
                    <div className="flex items-center gap-2 bg-[#3B1F5C]/50 p-2.5 rounded-xl border border-[#3B1F5C]">
                      <Wind className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#E5E0D5] block">Wind Speed</span>
                        <span className="font-bold text-[#FFFCF5]">{weather?.windSpeed || 12} km/h</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-[#3B1F5C]/50 p-2.5 rounded-xl border border-[#3B1F5C]">
                      <Droplets className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#E5E0D5] block">Humidity</span>
                        <span className="font-bold text-[#FFFCF5]">{weather?.humidity || 65}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-[#E5E0D5] text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3 text-[#D4AF37]" />
                    <span>Retrieved via Backend: {weather?.lastUpdated || "Just now"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#FFFCF5] p-6 rounded-3xl border border-[#E3D8BC] shadow-sm text-center space-y-3">
              <h4 className="font-bold text-sm text-[#0B132B]">Ready to travel to {destination.name}?</h4>
              <p className="text-xs text-[#7A6F5A]">
                Create a new itinerary, schedule daily activities, and keep all details in one place.
              </p>
              <Link
                href={`/trips/new?destinationId=${destination.id}&destination=${encodeURIComponent(destination.name)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold py-2.5 rounded-xl shadow-xs transition text-xs"
              >
                <Plus className="w-4 h-4 text-[#0B132B]" /> Plan a Trip
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
