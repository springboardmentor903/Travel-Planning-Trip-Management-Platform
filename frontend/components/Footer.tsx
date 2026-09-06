import Link from "next/link";
import { Plane } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0B132B] text-[#F8F4E8] py-8 px-6 border-t border-[#3B1F5C]/40 mt-auto text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 font-black text-sm text-[#FFFCF5]">
          <Plane className="w-4 h-4 text-[#D4AF37]" />
          <span>Trip<span className="text-[#D4AF37]">Nest</span></span>
          <span className="text-[#BDB5A4] font-medium text-xs">| Travel & Itinerary Platform</span>
        </div>
        <div className="flex items-center gap-6 text-[#F8F4E8]">
          <Link href="/dashboard" className="hover:text-[#D4AF37] transition">Dashboard</Link>
          <Link href="/trips" className="hover:text-[#D4AF37] transition">My Trips</Link>
          <Link href="/destinations" className="hover:text-[#D4AF37] transition">Destinations</Link>
          <Link href="/profile" className="hover:text-[#D4AF37] transition">Profile</Link>
          <Link href="/settings" className="hover:text-[#D4AF37] transition">Settings</Link>
        </div>
        <p className="text-[#BDB5A4] text-center md:text-right">
          © {new Date().getFullYear()} TripNest. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
