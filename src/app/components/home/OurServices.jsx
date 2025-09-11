"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

// StackedPolaroid component for exact image design match
const StackedPolaroid = ({
  src,
  images,
  alt = "",
  width = 285,
  height = 198,
  intervalMs = 3000,
  pauseOnHover = true,
}) => {
  const imageList = Array.isArray(images) && images.length > 0 ? images : (src ? [src] : []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (imageList.length <= 1) return;
    const timer = setInterval(() => {
      if (!pauseOnHover || !isPaused) {
        setCurrentIndex((prev) => (prev + 1) % imageList.length);
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [imageList.length, intervalMs, isPaused, pauseOnHover]);

  const currentSrc = imageList.length ? imageList[currentIndex] : src;

  return (
    <div 
      className="relative inline-block select-none w-[305px] h-[198px]"
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
    >
      <div 
        className="absolute bg-white rounded-md w-[305px] h-[198px] border border-gray-200/60 shadow-lg"
        style={{
          left: '-14px',
          top: '-10px',
          transform: 'rotate(-4deg)',
        }}
        aria-hidden
      />
      <div 
        className="absolute bg-white rounded-md w-[305px] h-[198px] border border-gray-200/60 shadow-md"
        style={{
          left: '-8px',
          top: '-6px',
          transform: 'rotate(3deg)',
        }}
        aria-hidden
      />

      {/* main "photo" card */}
      <div className="relative bg-white rounded-md w-[305px] h-[198px] shadow-2xl border border-gray-200/80">
        {/* inner white frame to create that thicker photo border */}
        <div className="w-full h-full p-2.5 rounded-md overflow-hidden bg-white">
          <Image
            src={currentSrc}
            alt={alt}
            width={285}
            height={178}
            className="object-cover rounded-sm w-full h-full"
          />
        </div>
      </div>
    </div>
  );
};

const OurServices = () => {
  const tiles = [
    {
      id: 1,
      images: ["/product/1.jpg", "/product/3.jpg", "/product/1.jpg"],
      heading: "Dedicated Instructors",
      paragraph: "Integer vitae eleifend est, sed viverra erat. Sed blandit massa quis posuere volutpat. Quisque tempor vulputate.",
      buttonText: "See All Our Instructors"
    },
    {
      id: 2,
      images: ["/product/2.jpg", "/product/4.jpg", "/product/2.jpg"],
      heading: "Premium Facilities",
      paragraph: "Integer vitae eleifend est, sed viverra erat. Sed blandit massa quis posuere volutpat. Quisque tempor vulputate.",
      buttonText: "Explore Our Facilities"
    },
    {
      id: 3,
      images: ["/product/3.jpg", "/product/1.jpg", "/product/3.jpg"],
      heading: "Quality Horses",
      paragraph: "Integer vitae eleifend est, sed viverra erat. Sed blandit massa quis posuere volutpat. Quisque tempor vulputate.",
      buttonText: "Meet Our Horses"
    },
    {
      id: 4,
      images: ["/product/4.jpg", "/product/2.jpg", "/product/4.jpg"],
      heading: "Training Programs",
      paragraph: "Integer vitae eleifend est, sed viverra erat. Sed blandit massa quis posuere volutpat. Quisque tempor vulputate.",
      buttonText: "View All Programs"
    }
  ];

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="items-center justify-items-center p-8 text-center">
          <h2 className="text-2xl font-semibold primary mb-2">Our Services</h2>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-0.5 bg-orange-300"></div>
            <div className="w-16 h-2 bg-secondary mx-0"></div>
            <div className="w-16 h-0.5 bg-orange-300"></div>
          </div>
          <p className="opacity-80">This is your hero section slider. Replace images in public/slider.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {tiles.map((tile) => (
            <div key={tile.id} className="text-center px-4">
              {/* StackedPolaroid image design - exact match to original */}
              <div className="mb-6 flex justify-center">
                <StackedPolaroid 
                  images={tile.images}
                  alt={tile.heading} 
                  width={285} 
                  height={198} 
                />
              </div>

              {/* Content below image */}
              <h3 className="text-xl font-bold secondary mb-3">
                {tile.heading}
              </h3>
              <div className="flex justify-center mb-3">
                <div className="w-8 h-0.5 bg-secondary"></div>
                <div className="w-16 h-0.5 bg-gray-300 ml-2"></div>
              </div>
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {tile.paragraph}
              </p>
              <button className="secondary cursor-pointer font-medium text-sm transition-colors duration-200 border border-secondary rounded p-2">
                {tile.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-secondary text-white px-8 py-3 rounded-md hover:bg-gray-900 transition-colors duration-200 font-medium text-lg cursor-pointer">
            View All
          </button>
        </div>
      </div>
    </section>
  );
};

export default OurServices;
