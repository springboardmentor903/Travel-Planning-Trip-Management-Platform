"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { User, Mail, Calendar, Heart, Edit2, X, Loader2, AlertCircle, CheckCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Mode state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [travelPreferences, setTravelPreferences] = useState("");
  const [favoriteDestinations, setFavoriteDestinations] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await api.get("/user/profile");
      if (res.data) {
        setProfile(res.data);
        setName(res.data.name || "");
        setBio(res.data.bio || "");
        setTravelPreferences(res.data.travelPreferences || "");
        setFavoriteDestinations(res.data.favoriteDestinations || "");
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load user profile.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await api.put("/user/profile", {
        name,
        bio,
        travelPreferences,
        favoriteDestinations,
      });

      setProfile(res.data);
      localStorage.setItem("userName", res.data.name);
      setSuccess("Profile and travel preferences updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      setError(getErrorMessage(err, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        {loading ? (
          <div className="py-20 text-center text-[#7A6F5A]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#0B132B]" />
            <p className="text-xs">Loading profile information...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-[#8B2635]/10 border border-[#8B2635]/30 rounded-2xl text-[#8B2635] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-[#8B2635]" />
              <span>{error}</span>
            </div>
            <button onClick={fetchProfile} className="underline font-bold">Retry</button>
          </div>
        ) : (
          profile && (
            <>
              {/* Profile Top Card */}
              <div className="bg-[#FFFCF5] rounded-3xl border border-[#E3D8BC] shadow-sm p-8 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 rounded-full bg-[#0B132B] text-[#D4AF37] text-3xl font-black flex items-center justify-center shadow-md shrink-0 border-4 border-[#D4AF37]">
                    {profile.name ? profile.name.charAt(0).toUpperCase() : "U"}
                  </div>

                  <div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <h1 className="text-2xl font-extrabold text-[#0B132B]">{profile.name}</h1>
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#0B132B] border border-[#D4AF37]/40">
                        {profile.role || "TRAVELER"}
                      </span>
                    </div>

                    <p className="text-xs text-[#7A6F5A] flex items-center justify-center sm:justify-start gap-1.5 mt-1 font-medium">
                      <Mail className="w-3.5 h-3.5 text-[#0B132B]" /> {profile.email}
                    </p>

                    {profile.createdAt && (
                      <p className="text-[11px] text-[#7A6F5A] flex items-center justify-center sm:justify-start gap-1 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-[#7A6F5A]" /> Member since: {profile.createdAt.substring(0, 10)}
                      </p>
                    )}
                  </div>
                </div>

                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition"
                  >
                    <Edit2 className="w-4 h-4 text-[#D4AF37]" /> Edit Profile & Preferences
                  </button>
                )}
              </div>

              {/* Status Alert Messages */}
              {success && (
                <div className="p-4 bg-[#176B55]/10 border border-[#176B55]/30 text-[#176B55] text-xs rounded-xl flex items-center gap-2 font-medium">
                  <CheckCircle className="w-4 h-4 shrink-0 text-[#176B55]" />
                  <span>{success}</span>
                </div>
              )}

              {/* Form or Display View */}
              {isEditing ? (
                <div className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
                  <div className="flex items-center justify-between border-b border-[#E3D8BC] pb-4">
                    <h2 className="text-lg font-bold text-[#0B132B] flex items-center gap-2">
                      <Edit2 className="w-5 h-5 text-[#D4AF37]" /> Edit Personal Info & Travel Preferences
                    </h2>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="p-1 text-[#7A6F5A] hover:text-[#0B132B]"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">About / Bio</label>
                      <textarea
                        rows={3}
                        placeholder="Tell fellow travelers about yourself..."
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Preferred Travel Style / Types</label>
                      <input
                        type="text"
                        placeholder="e.g. Adventure, Beach, Solo, Family, Luxury, Cultural"
                        value={travelPreferences}
                        onChange={(e) => setTravelPreferences(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Favourite Destinations</label>
                      <input
                        type="text"
                        placeholder="e.g. Paris, Bali, Tokyo, Rome, New York"
                        value={favoriteDestinations}
                        onChange={(e) => setFavoriteDestinations(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 py-2.5 bg-transparent border border-[#0B132B] hover:bg-[#0B132B] text-[#0B132B] hover:text-[#FFFCF5] font-bold rounded-xl transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-2.5 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Updates"}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Bio & Personal Info */}
                  <div className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2 border-b border-[#E3D8BC] pb-3">
                      <User className="w-4 h-4 text-[#0B132B]" /> About Me
                    </h3>
                    <p className="text-xs text-[#7A6F5A] leading-relaxed italic">
                      {profile.bio || "No biography added yet. Click 'Edit Profile' above to introduce yourself!"}
                    </p>
                  </div>

                  {/* Travel Preferences & Favorites */}
                  <div className="bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm space-y-6">
                    <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2 border-b border-[#E3D8BC] pb-3">
                      <Heart className="w-4 h-4 text-[#176B55]" /> Travel Preferences & Favorites
                    </h3>

                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block mb-1">
                          Preferred Travel Types
                        </span>
                        {profile.travelPreferences && profile.travelPreferences.trim().length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.travelPreferences
                              .split(",")
                              .filter((p) => p.trim().length > 0)
                              .map((pref, i) => (
                                <span
                                  key={i}
                                  className="bg-[#3B1F5C]/15 text-[#3B1F5C] font-bold text-[11px] px-3 py-1 rounded-lg border border-[#3B1F5C]/30"
                                >
                                  ✈️ {pref.trim()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7A6F5A] italic">No travel preferences added yet.</p>
                        )}
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-[#7A6F5A] uppercase tracking-wider block mb-1">
                          Favourite Destinations
                        </span>
                        {profile.favoriteDestinations && profile.favoriteDestinations.trim().length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {profile.favoriteDestinations
                              .split(",")
                              .filter((d) => d.trim().length > 0)
                              .map((dest, i) => (
                                <span
                                  key={i}
                                  className="bg-[#D4AF37]/20 text-[#0B132B] font-bold text-[11px] px-3 py-1 rounded-lg border border-[#D4AF37]/40"
                                >
                                  📍 {dest.trim()}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <p className="text-xs text-[#7A6F5A] italic">No favorite destinations added yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
