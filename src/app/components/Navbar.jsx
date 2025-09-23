"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Briefcase, Info, Phone, Newspaper, LogIn, Menu, X, User } from "lucide-react";

const baseNavItems = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/services", label: "Services", Icon: Briefcase },
  { href: "/aboutus", label: "About us", Icon: Info },
  { href: "/contactus", label: "Contact us", Icon: Phone },
  { href: "/news", label: "News", Icon: Newspaper },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkToken = () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        setIsAuthenticated(Boolean(token));
      } catch {
        setIsAuthenticated(false);
      }
    };
    checkToken();

    // Sync across tabs
    const onStorage = (e) => {
      if (e.key === "token") checkToken();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <header className="w-full border-b border-white/10 bg-primary sticky top-0 z-40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2"
          >
            <Image src="/logo2.png" alt="Logo" width={120} height={120} />
          </Link>
        </div>

        <button aria-label="Toggle menu" className="sm:hidden p-2 rounded hover:bg-white/10 text-white" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        <nav className="hidden sm:flex items-center gap-6 text-[15px]">
          {[...baseNavItems, isAuthenticated ? { href: "/profile", label: "Profile", Icon: User } : { href: "/login", label: "Login", Icon: LogIn }].map(({ href, label, Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 underline-offset-4 ${
                  isActive ? "underline text-white" : "text-white hover:underline"
                }`}
              >
                <Icon className="text-white" size={22} />
                <span className="text-white font-bold">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile drawer */}
      <div className={`sm:hidden fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-[80vw] max-w-[22rem] bg-primary border-r border-white/10 shadow-xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
            <Link href="/" className="flex items-center gap-2 gap-2" onClick={() => setOpen(false)}>
              <Image src="/logo2.png" alt="Logo" width={110} height={110} />
            </Link>
            <button aria-label="Close menu" className="p-2 rounded hover:bg-white/10 text-white" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="px-4 py-3 grid grid-cols-1 gap-2 text-[15px]">
            {[...baseNavItems, isAuthenticated ? { href: "/profile", label: "Profile", Icon: User } : { href: "/login", label: "Login", Icon: LogIn }].map(({ href, label, Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 ${
                    isActive ? "underline text-white" : "text-white hover:underline"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  <Icon className="text-white" size={20} />
                  <span className="text-white">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
