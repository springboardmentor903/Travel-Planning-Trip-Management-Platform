"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Plane, Compass, Calendar, History, User, Settings, LogOut, LayoutDashboard, ShieldCheck } from "lucide-react";

import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedName = localStorage.getItem("userName");
    const storedRole = localStorage.getItem("userRole");
    if (storedName) {
      setUserName(storedName);
    }
    if (storedRole) {
      setUserRole(storedRole);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
    setUserName(null);
    setUserRole(null);
    router.push("/login");
  };

  const travelerNavLinks = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "My Trips", href: "/trips", icon: Calendar },
    { name: "Destinations", href: "/destinations", icon: Compass },
    { name: "History", href: "/history", icon: History },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const adminNavLinks = [
    { name: "Admin Panel", href: "/admin/dashboard", icon: ShieldCheck },
    { name: "Profile", href: "/profile", icon: User },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const navLinks = userRole === "ADMINISTRATOR" ? adminNavLinks : travelerNavLinks;
  const brandHref = userRole === "ADMINISTRATOR" ? "/admin/dashboard" : "/dashboard";

  if (!isMounted) return null;

  return (
    <header className="bg-[#0B132B] text-[#F8F4E8] shadow-md sticky top-0 z-50 border-b border-[#3B1F5C]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={brandHref} className="flex items-center gap-2 text-xl font-black tracking-wide hover:opacity-95 transition">
            <Plane className="w-6 h-6 text-[#D4AF37]" />
            <span className="text-[#FFFCF5]">Trip<span className="text-[#D4AF37]">Nest</span></span>
          </Link>

          {userName && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? "bg-[#3B1F5C] text-[#D4AF37] shadow-inner border border-[#D4AF37]/30"
                        : "text-[#F8F4E8] hover:bg-[#3B1F5C]/60 hover:text-[#D4AF37]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-[#D4AF37]" : "text-[#F8F4E8] group-hover:text-[#D4AF37]"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {userName ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <NotificationBell />
                <Link href="/profile" className="hidden sm:flex items-center gap-2 text-xs font-semibold bg-[#3B1F5C]/80 px-3 py-1.5 rounded-full border border-[#D4AF37]/30 hover:bg-[#3B1F5C] text-[#FFFCF5] transition">
                  <div className="w-6 h-6 rounded-full bg-[#D4AF37] text-[#0B132B] font-black flex items-center justify-center text-xs">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[100px] truncate">{userName}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 bg-[#8B2635] hover:bg-[#8B2635]/90 text-[#FFFCF5] px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-sm"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-xs font-bold px-4 py-2 rounded-xl text-[#F8F4E8] hover:bg-[#3B1F5C]/60 hover:text-[#D4AF37] transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-xs font-bold px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#E6C65C] text-[#0B132B] shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>

        {userName && (
          <div className="md:hidden flex overflow-x-auto py-2 border-t border-[#3B1F5C]/60 gap-1 scrollbar-none">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive ? "bg-[#3B1F5C] text-[#D4AF37] border border-[#D4AF37]/30" : "text-[#F8F4E8] hover:bg-[#3B1F5C]/50 hover:text-[#D4AF37]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
