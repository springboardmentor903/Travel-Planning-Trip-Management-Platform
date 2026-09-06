"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api, { getErrorMessage } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { UserPlus, User, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password });
      
      // Auto login after registration
      const loginRes = await api.post("/auth/login", { email, password });
      const { token, role } = loginRes.data;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("userName", name);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", role || "TRAVELER");
        router.push("/dashboard");
      } else {
        router.push("/login?registered=true");
      }
    } catch (err: any) {
      setError(getErrorMessage(err, "Registration failed. Please try again."));
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
            <div className="w-12 h-12 bg-[#D4AF37]/15 text-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-3 border border-[#D4AF37]/30">
              <UserPlus className="w-6 h-6 text-[#0B132B]" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B132B]">Create Account</h1>
            <p className="text-xs text-[#7A6F5A] mt-1 font-medium">Start planning your dream journeys today</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#8B2635]/10 border border-[#8B2635]/30 text-[#8B2635] text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#8B2635]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0B132B] mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-[#7A6F5A] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#FFFFFF] border border-[#D8CCAE] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-[#1C1C1C]"
                />
              </div>
            </div>

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
                  minLength={6}
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
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-xs text-[#7A6F5A] mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#0B132B] font-extrabold hover:text-[#3B1F5C] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
