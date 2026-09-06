"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, name, email: userEmail, role } = response.data;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("userName", name || "Traveler");
        localStorage.setItem("userEmail", userEmail || email);
        localStorage.setItem("userRole", role || "TRAVELER");

        if (role === "ADMINISTRATOR") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError("Invalid response from server. Please try again.");
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Invalid email or password"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F4E8] text-[#1C1C1C]">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-[#FFFCF5] p-8 rounded-2xl shadow-xl border border-[#E3D8BC] max-w-md w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-[#0B132B]/10 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#D4AF37]/30">
              <LogIn className="w-6 h-6 text-[#0B132B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B132B]">Welcome Back</h1>
            <p className="text-xs text-[#7A6F5A] mt-1 font-medium">Log in to access your trips and itineraries</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0B132B] mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#0B132B] mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0B132B] hover:bg-[#3B1F5C] text-[#FFFCF5] font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
            </button>
          </form>

          <p className="text-center text-xs text-[#7A6F5A] mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-[#0B132B] font-extrabold hover:text-[#3B1F5C] hover:underline">
              Create one here
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
