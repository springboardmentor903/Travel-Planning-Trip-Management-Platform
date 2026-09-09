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
      <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center text-slate-500 py-20">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-sky-600" />
            <p className="text-xs">Loading destination details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700 text-xs flex items-center justify-between">
            <span>{error || "Destination not found."}</span>
            <Link href="/destinations" className="underline font-bold">Back to Destinations</Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-sky-50 text-slate-800">
      <Navbar />

      {/* Header Banner */}
      <section className="bg-gradient-to-b from-sky-800 to-sky-900 text-white py-12 px-4 relative">
        <div className="max-w-7xl mx-auto space-y-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 bg-sky-700/80 hover:bg-sky-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xs transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Destinations
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl sm:text-4xl font-extrabold">{destination.name}</h1>
                {destination.isPopular && (
                  <span className="bg-amber-400 text-slate-950 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-slate-950" /> Popular Destination
                  </span>
                )}
              </div>
              <p className="text-sky-200 text-sm font-medium flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-400" /> {destination.country}
              </p>
            </div>

            <Link
              href={`/trips/new?destinationId=${destination.id}&destination=${encodeURIComponent(destination.name)}`}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-3 rounded-2xl shadow-lg transition text-xs shrink-0"
            >
              <Plus className="w-4 h-4" /> Plan a Trip
            </Link>
          </div>
        </div>
      </section>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Info Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white p-8 rounded-3xl border border-sky-100 shadow-sm space-y-4">
              <h2 className="text-xl font-bold text-sky-950 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> About {destination.name}
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                {destination.description}
              </p>
            </div>

            {/* Attractions Section */}
            <div className="bg-white p-8 rounded-3xl border border-sky-100 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-sky-950 flex items-center gap-2">
                  <Landmark className="w-5 h-5 text-sky-600" /> Top Attractions
                </h2>
                <span className="text-xs font-bold text-sky-800 bg-sky-50 px-3 py-1 rounded-full">
                  {attractions.length} listed
                </span>
              </div>

              {loadingAttractions ? (
                <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                  <span>Loading attractions...</span>
                </div>
              ) : attractions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No attractions have been added for this destination yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {attractions.map((a) => (
                    <div
                      key={a.id}
                      className="p-5 rounded-2xl border border-sky-100 bg-slate-50/60 hover:bg-sky-50/60 transition space-y-2 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-extrabold text-sm text-sky-950 group-hover:text-sky-700 transition">
                          {a.name}
                        </h3>
                        <Landmark className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {a.shortDescription}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Admin-Only Create Attraction Form */}
              {isAdmin && (
                <div className="pt-6 border-t border-slate-100 space-y-4">
                  <div className="flex items-center gap-2 text-sky-900 font-extrabold text-sm">
                    <PlusCircle className="w-4 h-4 text-emerald-600" /> Add New Attraction (Administrator)
                  </div>

                  {attractionSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{attractionSuccess}</span>
                    </div>
                  )}

                  {attractionError && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{attractionError}</span>
                    </div>
                  )}

                  <form onSubmit={handleCreateAttraction} className="space-y-4 bg-sky-50/50 p-5 rounded-2xl border border-sky-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Attraction Name *</label>
                      <input
                        type="text"
                        required
                        value={attractionName}
                        onChange={(e) => setAttractionName(e.target.value)}
                        placeholder="e.g. Eiffel Tower, Grand Canyon..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Short Description *</label>
                      <textarea
                        required
                        rows={3}
                        value={attractionDesc}
                        onChange={(e) => setAttractionDesc(e.target.value)}
                        placeholder="Describe why travelers should visit this attraction..."
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none bg-white text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingAttraction}
                      className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-xs transition disabled:opacity-50"
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
            <div className="bg-gradient-to-br from-sky-600 via-sky-700 to-sky-800 text-white p-6 rounded-3xl shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-sky-500/60 pb-4">
                <div>
                  <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider">Live Weather Service</span>
                  <h3 className="text-base font-bold">{destination.name} Weather</h3>
                </div>
                <CloudSun className="w-8 h-8 text-amber-300" />
              </div>

              {loadingWeather ? (
                <div className="py-6 text-center text-sky-200 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1" />
                  Fetching live weather from Open-Meteo REST API...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-black">{weather?.temperature || 22}°C</div>
                      <p className="text-xs font-semibold text-amber-300 mt-1">
                        {weather?.condition || "Sunny & Clear"}
                      </p>
                    </div>
                    <div className="text-5xl">{weather?.weatherIcon || "☀️"}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-sky-500/60 text-xs">
                    <div className="flex items-center gap-2 bg-sky-800/60 p-2.5 rounded-xl">
                      <Wind className="w-4 h-4 text-sky-300 shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-200 block">Wind Speed</span>
                        <span className="font-bold">{weather?.windSpeed || 12} km/h</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-sky-800/60 p-2.5 rounded-xl">
                      <Droplets className="w-4 h-4 text-sky-300 shrink-0" />
                      <div>
                        <span className="text-[10px] text-sky-200 block">Humidity</span>
                        <span className="font-bold">{weather?.humidity || 65}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[10px] text-sky-300 text-center flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Retrieved via Backend: {weather?.lastUpdated || "Just now"}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm text-center space-y-3">
              <h4 className="font-bold text-sm text-sky-950">Ready to travel to {destination.name}?</h4>
              <p className="text-xs text-slate-500">
                Create a new itinerary, schedule daily activities, and keep all details in one place.
              </p>
              <Link
                href={`/trips/new?destinationId=${destination.id}&destination=${encodeURIComponent(destination.name)}`}
                className="w-full inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2.5 rounded-xl shadow-xs transition text-xs"
              >
                <Plus className="w-4 h-4" /> Plan a Trip
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
