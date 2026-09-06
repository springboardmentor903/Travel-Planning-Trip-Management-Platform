"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import { UserProfile } from "@/types";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Settings,
  User,
  Lock,
  Heart,
  SlidersHorizontal,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export default function AccountSettingsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"profile" | "security" | "preferences" | "app">("profile");

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Profile Form State
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");

  // Security Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Preferences Form State
  const [travelPreferences, setTravelPreferences] = useState("");
  const [favoriteDestinations, setFavoriteDestinations] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // App Settings State
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    api
      .get("/user/profile")
      .then((res) => {
        if (res.data) {
          setProfile(res.data);
          setName(res.data.name || "");
          setBio(res.data.bio || "");
          setTravelPreferences(res.data.travelPreferences || "");
          setFavoriteDestinations(res.data.favoriteDestinations || "");
          setCurrency(res.data.preferredCurrency || "USD");
        }
      })
      .catch((err) => {
        console.log("Failed to load settings profile:", err);
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMsg(null);

    try {
      const res = await api.put("/user/profile", {
        name,
        bio,
        travelPreferences,
        favoriteDestinations,
        preferredCurrency: currency,
      });

      setProfile(res.data);
      if (res.data.name) localStorage.setItem("userName", res.data.name);
      setStatusMsg({ type: "success", message: "Account profile and preferences updated!" });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        message: getErrorMessage(err, "Failed to update profile settings."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAppPreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMsg(null);

    try {
      const res = await api.put("/user/profile", {
        name,
        bio,
        travelPreferences,
        favoriteDestinations,
        preferredCurrency: currency,
      });

      setProfile(res.data);
      setCurrency(res.data.preferredCurrency || "USD");
      setStatusMsg({ type: "success", message: "Application preferences saved!" });
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        message: getErrorMessage(err, "Failed to save application preferences."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: "error", message: "New passwords do not match." });
      return;
    }

    setSavingPassword(true);

    try {
      await api.put("/user/change-password", {
        currentPassword,
        newPassword,
      });

      setStatusMsg({ type: "success", message: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        message: getErrorMessage(err, "Current password is incorrect."),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#0B132B] text-[#D4AF37] flex items-center justify-center shadow-md">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0B132B]">Account Settings</h1>
            <p className="text-xs text-[#7A6F5A]">Manage profile details, security, and travel preferences</p>
          </div>
        </div>

        {statusMsg && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2 border font-medium ${
              statusMsg.type === "success"
                ? "bg-[#176B55]/10 border-[#176B55]/30 text-[#176B55]"
                : "bg-[#8B2635]/10 border-[#8B2635]/30 text-[#8B2635]"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-[#176B55]" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
            )}
            <span>{statusMsg.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Nav Tabs */}
          <div className="bg-[#FFFCF5] p-3 rounded-2xl border border-[#E3D8BC] shadow-sm space-y-1 self-start">
            {[
              { id: "profile", label: "Profile Info", icon: User },
              { id: "security", label: "Security & Password", icon: Lock },
              { id: "preferences", label: "Travel Preferences", icon: Heart },
              { id: "app", label: "App Preferences", icon: SlidersHorizontal },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setStatusMsg(null);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                    isActive
                      ? "bg-[#0B132B] text-[#D4AF37] shadow-xs"
                      : "text-[#7A6F5A] hover:bg-[#F8F4E8] hover:text-[#0B132B]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF37]" : "text-[#7A6F5A]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Box */}
          <div className="md:col-span-3 bg-[#FFFCF5] p-8 rounded-3xl border border-[#E3D8BC] shadow-sm min-h-[400px]">
            {loading ? (
              <div className="py-16 text-center text-[#7A6F5A]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#0B132B]" />
                <p className="text-xs">Loading settings...</p>
              </div>
            ) : (
              <>
                {/* Tab 1: Profile Info */}
                {activeTab === "profile" && (
                  <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                    <div className="border-b border-[#E3D8BC] pb-3 mb-4">
                      <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2">
                        <User className="w-4 h-4 text-[#0B132B]" /> Personal Profile Information
                      </h3>
                      <p className="text-[#7A6F5A] text-[11px] mt-0.5 font-medium">Update your displayed name and bio</p>
                    </div>

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
                      <label className="block font-semibold text-[#0B132B] mb-1">Email Address</label>
                      <input
                        type="email"
                        disabled
                        value={profile?.email || ""}
                        className="w-full px-3.5 py-2.5 bg-[#F8F4E8] border border-[#D8CCAE] rounded-xl text-[#7A6F5A] cursor-not-allowed"
                      />
                      <span className="text-[10px] text-[#7A6F5A] mt-1 block">Email address cannot be changed.</span>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">About / Bio</label>
                      <textarea
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Changes"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 2: Security & Password */}
                {activeTab === "security" && (
                  <form onSubmit={handleChangePassword} className="space-y-5 text-xs max-w-lg">
                    <div className="border-b border-[#E3D8BC] pb-3 mb-4">
                      <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#176B55]" /> Account Security & Password
                      </h3>
                      <p className="text-[#7A6F5A] text-[11px] mt-0.5 font-medium">Change your account password securely</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Current Password *</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">New Password *</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Confirm New Password *</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                      />
                    </div>

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] font-extrabold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 3: Travel Preferences */}
                {activeTab === "preferences" && (
                  <form onSubmit={handleUpdateProfile} className="space-y-5 text-xs">
                    <div className="border-b border-[#E3D8BC] pb-3 mb-4">
                      <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2">
                        <Heart className="w-4 h-4 text-[#176B55]" /> Travel Preferences & Favorite Places
                      </h3>
                      <p className="text-[#7A6F5A] text-[11px] mt-0.5 font-medium">Customize your travel interests and preferred destinations</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Preferred Travel Style</label>
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

                    <div className="pt-3">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Preferences"}
                      </button>
                    </div>
                  </form>
                )}

                {/* Tab 4: App Preferences */}
                {activeTab === "app" && (
                  <form onSubmit={handleSaveAppPreferences} className="space-y-6 text-xs max-w-lg">
                    <div className="border-b border-[#E3D8BC] pb-3 mb-4">
                      <h3 className="text-base font-bold text-[#0B132B] flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#0B132B]" /> Application Preferences
                      </h3>
                      <p className="text-[#7A6F5A] text-[11px] mt-0.5 font-medium">Customize your currency and display settings</p>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0B132B] mb-1">Preferred Currency</label>
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] font-semibold text-xs text-[#1C1C1C]"
                      >
                        <option value="USD">USD — US Dollar</option>
                        <option value="EUR">EUR — Euro</option>
                        <option value="GBP">GBP — British Pound</option>
                        <option value="INR">INR — Indian Rupee</option>
                        <option value="JPY">JPY — Japanese Yen</option>
                        <option value="AUD">AUD — Australian Dollar</option>
                        <option value="CAD">CAD — Canadian Dollar</option>
                        <option value="SGD">SGD — Singapore Dollar</option>
                        <option value="AED">AED — UAE Dirham</option>
                        <option value="CHF">CHF — Swiss Franc</option>
                      </select>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="inline-flex items-center gap-2 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold px-6 py-2.5 rounded-xl shadow-md transition disabled:opacity-50"
                      >
                        {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Settings"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
