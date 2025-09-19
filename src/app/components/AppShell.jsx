"use client";
import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isSwagger = pathname === "/swagger";

  if (isSwagger) {
    return (
      <main className="flex-1">
        {children}
      </main>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}


