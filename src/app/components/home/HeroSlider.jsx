"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { images } from "@/app/const/images";

// Provide your slide images and captions here. Place files under public/slider/
const defaultSlides = [
    { 
      src: images.slide1, 
      title: "Manage Herds Smarter", 
      subtitle: "Streamline, monitor, and grow with EquiHerds." 
    },
    { 
      src: images.slide2, 
      title: "Real-time Insights", 
      subtitle: "Make data-driven decisions effortlessly." 
    },
    { 
      src: images.slide3, 
      title: "Connect Your Team", 
      subtitle: "Collaboration that keeps everyone aligned." 
    },
    { 
      src: images.slide4, 
      title: "Boost Productivity", 
      subtitle: "Achieve more with less effort using our smart tools." 
    },
  ];
  

 const HeroSlider = ({ slides = defaultSlides, intervalMs = 5000 }) => {
  const validSlides = useMemo(() => slides.filter(s => s && s.src), [slides]);
  const [index, setIndex] = useState(0);
  const total = validSlides.length;

  useEffect(() => {
    if (total <= 1) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(id);
  }, [total, intervalMs]);

  const go = (dir) => {
    setIndex((i) => (i + (dir === "next" ? 1 : -1) + total) % total);
  };

  if (total === 0) return null;

  const current = validSlides[index];

  return (
    <section className="relative w-full bg-primary">
      <div className="relative h-[48vh] sm:h-[60vh] md:h-[70vh] overflow-hidden">
        {/* Background image */}
        <Image
          src={current.src}
          alt={current.title || "Slide"}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        <div className="absolute inset-0 z-10">
          <div className="mx-auto max-w-6xl h-full px-4 sm:px-6 w-full flex items-center">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6 w-full h-full">
              <div className="md:pr-6">
                {current.title && (
                  <h1 className="text-white text-3xl sm:text-4xl md:text-5xl font-semibold leading-tight">
                    {current.title}
                  </h1>
                )}
                {current.subtitle && (
                  <p className="mt-3 text-white/85 text-base sm:text-lg md:text-xl">
                    {current.subtitle}
                  </p>
                )}
                <div className="mt-6 flex gap-3">
                  <a href="#services" className="rounded bg-[color:var(--secondary)] text-black px-4 py-2 text-[14px] sm:text-[15px] hover:opacity-90">Get Started</a>
                  <a href="#contact" className="rounded border border-white/30 text-white px-4 py-2 text-[14px] sm:text-[15px] hover:bg-white/10">Contact Us</a>
                </div>
              </div>
              <div className="hidden md:block" />
            </div>
          </div>
        </div>

        {total > 1 && (
          <>
            <button aria-label="Previous" onClick={() => go("prev")} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 z-20">
              <ChevronLeft size={22} />
            </button>
            <button aria-label="Next" onClick={() => go("next")} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 z-20">
              <ChevronRight size={22} />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
              {validSlides.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-[color:var(--secondary)]" : "w-3 bg-white/60"}`} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};


export default HeroSlider