"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, Briefcase, Info, Phone, Newspaper, LogIn, Menu, X, User } from "lucide-react";
import { Spin } from "antd";
import { getUserData } from "../utils/localStorage";

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
  const [servicesOpen, setServicesOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const servicesRef = useRef(null);
  const pathname = usePathname();
  const router = useRouter();
  const userId = getUserData();
  console.log("userId", userId);

  // Helper function to validate URL and provide fallback
  const getValidImageSrc = (imageUrl) => {
    if (!imageUrl) return "/logo2.png";
    try {
      new URL(imageUrl);
      return imageUrl;
    } catch (_) {
      return "/logo2.png";
    }
  };

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

  // Close Services on outside click / Escape
  useEffect(() => {
    function handleClick(event) {
      if (!servicesRef.current) return;
      if (!servicesRef.current.contains(event.target)) {
        setServicesOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === "Escape") setServicesOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("touchstart", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("touchstart", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  // Handle navigation with loading state
  const handleNavigation = (href, e) => {
    e.preventDefault();
    if (pathname === href) return; // Don't navigate if already on the same page
    
    setIsLoading(true);
    setOpen(false); // Close mobile menu
    
    // Navigate immediately
    router.push(href);
  };

  // Listen for route changes to hide loading
  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(false);
    };

    // Hide loading when pathname changes (route has loaded)
    handleRouteChange();
  }, [pathname]);

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center gap-4">
            <Spin size="large" />
            <p className="text-gray-700 font-medium">Loading...</p>
          </div>
        </div>
      )}
      
      <header className="w-full border-b border-white/10 bg-primary sticky top-0 z-40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center"
            onClick={(e) => handleNavigation("/", e)}
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
            if (label === "Services") {
              return (
                <div
                  key={href}
                  className="relative group"
                  ref={servicesRef}
                  onMouseEnter={() => setServicesOpen(true)}
                >
                  <Link
                    href={href}
                    className={`flex items-center gap-2 underline-offset-4 ${
                      isActive ? "underline text-white" : "text-white hover:underline"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      setServicesOpen((v) => !v);
                    }}
                  >
                    <Icon className="text-white" size={22} />
                    <span className="text-white font-bold">{label}</span>
                  </Link>
                  <div
                    className={`${servicesOpen ? "visible opacity-100" : "invisible opacity-0"} group-hover:visible group-hover:opacity-100 transition-opacity duration-200 absolute left-0 top-full mt-2 min-w-[180px] rounded-md border border-white/10 bg-primary shadow-lg`}
                    onMouseEnter={() => setServicesOpen(true)}
                    onMouseLeave={() => setServicesOpen(false)}
                  >
                    <Link href="/services?type=trainer" className="block px-4 py-2 text-white hover:bg-white/10" onClick={(e) => { setServicesOpen(false); handleNavigation("/services?type=trainer", e); }}>Trainer</Link>
                    <Link href="/services?type=stables" className="block px-4 py-2 text-white hover:bg-white/10" onClick={(e) => { setServicesOpen(false); handleNavigation("/services?type=stables", e); }}>Stables</Link>
                  </div>
                </div>
              );
            }
            if (label === "Profile" && isAuthenticated && userId?.brandImage) {
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center"
                  title="Profile"
                  onClick={(e) => handleNavigation(href, e)}
                >
                  <Image 
                    src={getValidImageSrc(userId.brandImage)} 
                    alt="Profile" 
                    width={32} 
                    height={32} 
                    className="rounded-full object-cover border-2 border-white/20 hover:border-white/40 transition-colors"
                  />
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 underline-offset-4 ${
                  isActive ? "underline text-white" : "text-white hover:underline"
                }`}
                onClick={(e) => handleNavigation(href, e)}
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
            <Link href="/" className="flex items-center gap-2 gap-2" onClick={(e) => { setOpen(false); handleNavigation("/", e); }}>
              <Image src="/logo2.png" alt="Logo" width={110} height={110} />
            </Link>
            <button aria-label="Close menu" className="p-2 rounded hover:bg-white/10 text-white" onClick={() => setOpen(false)}>
              <X size={20} />
            </button>
          </div>
          <nav className="px-4 py-3 grid grid-cols-1 gap-2 text-[15px]">
            {[...baseNavItems, isAuthenticated ? { href: "/profile", label: "Profile", Icon: User } : { href: "/login", label: "Login", Icon: LogIn }].map(({ href, label, Icon }) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              if (label === "Services") {
                return (
                  <div key={href} className="grid gap-1">
                    <Link
                      href={href}
                      className={`flex items-center gap-3 ${
                        isActive ? "underline text-white" : "text-white hover:underline"
                      }`}
                      onClick={(e) => { setOpen(false); handleNavigation(href, e); }}
                    >
                      <Icon className="text-white" size={20} />
                      <span className="text-white">{label}</span>
                    </Link>
                    <div className="ml-7 grid">
                      <Link href="/services?type=trainer" className="px-2 py-1 text-white/90 hover:text-white" onClick={(e) => { setOpen(false); handleNavigation("/services?type=trainer", e); }}>Trainer</Link>
                      <Link href="/services?type=stables" className="px-2 py-1 text-white/90 hover:text-white" onClick={(e) => { setOpen(false); handleNavigation("/services?type=stables", e); }}>Stables</Link>
                    </div>
                  </div>
                );
              }
              if (label === "Profile" && isAuthenticated && userId?.brandImage) {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3"
                    onClick={(e) => { setOpen(false); handleNavigation(href, e); }}
                    title="Profile"
                  >
                    <Image 
                      src={getValidImageSrc(userId.brandImage)} 
                      alt="Profile" 
                      width={28} 
                      height={28} 
                      className="rounded-full object-cover border-2 border-white/20"
                    />
                    <span className="text-white">{label}</span>
                  </Link>
                );
              }
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 ${
                    isActive ? "underline text-white" : "text-white hover:underline"
                  }`}
                  onClick={(e) => { setOpen(false); handleNavigation(href, e); }}
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
    </>
  );
}
