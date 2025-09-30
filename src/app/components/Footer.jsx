"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Info, Phone, Newspaper, LogIn } from "lucide-react";

const footerItems = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/services", label: "Services", Icon: Briefcase },
  { href: "/about", label: "About us", Icon: Info },
  { href: "/contact", label: "Contact us", Icon: Phone },
  { href: "/news", label: "News", Icon: Newspaper },
  { href: "/login", label: "Login", Icon: LogIn },
];

export default function Footer() {
  const pathname = usePathname();
  return (
    <footer className="w-full border-t border-white/10 mt-10 bg-primary text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 text-[15px]">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Image src="/logo2.png" className="" alt="Logo" width={130} height={130} />
            <p className="opacity-70 leading-relaxed max-w-xs">Building modern herd management experiences with care and technology.</p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white text-[16px]">Company</h4>
            <ul className="space-y-3">
              {[
                { href: "/about", label: "About us" },
                { href: "/news", label: "News" },
                { href: "/contact", label: "Contact us" },
              ].map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link href={href} className={`text-white hover:underline underline-offset-4 ${isActive ? "[color:var(--secondary)] underline" : "text-white/80 hover:[color:var(--secondary)]"}`}>{label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold  text-[16px]">Services</h4>
            <ul className="space-y-3">
              {[
                { href: "/services", label: "All Services" },
                { href: "/services/consulting", label: "Consulting" },
                { href: "/services/support", label: "Support" },
              ].map(({ href, label }) => {
                const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link href={href} className={`text-white hover:underline underline-offset-4 ${isActive ? "[color:var(--secondary)] underline" : "text-white/80 hover:[color:var(--secondary)]"}`}>{label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold secondary text-[16px]">Subscribe</h4>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                required
                placeholder="Your email"
                className="w-full min-w-0 rounded border border-white/20 bg-white/5 text-white placeholder:text-white/50 px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[color:var(--secondary)]"
              />
              <button type="submit" className="shrink-0 rounded bg-[color:var(--secondary)] text-black px-4 py-2 text-[14px] hover:opacity-90">Subscribe</button>
            </form>
            <p className="mt-2 text-xs opacity-70">Get the latest news and updates.</p>
          </div>
        </div>

        <div className="flex items-center justify-between flex-col sm:flex-row gap-3 pt-8 mt-8 border-t border-white/10">
          <p className="opacity-70 text-center sm:text-left">© {new Date().getFullYear()} EquiHerds. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="#privacy" className="hover:underline underline-offset-4 text-white/80 hover:[color:var(--secondary)]">Privacy</Link>
            <Link href="#terms" className="hover:underline underline-offset-4 text-white/80 hover:[color:var(--secondary)]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


