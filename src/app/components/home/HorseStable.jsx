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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);

  const tiles = [
    {
      id: 1,
      images: ["/product/1.jpg", "/product/3.jpg", "/product/1.jpg"],
      heading: "Expert Horse Trainers",
      paragraph: "Our experienced trainers provide personalized guidance for riders of all levels, ensuring a safe and enjoyable learning environment for both horse and rider.",
      buttonText: "Learn More",
      rating: 4.7,
      price: 220,
      extras: ["Helmet provided", "45 min session", "All ages welcome"]
    },
    {
      id: 2,
      images: ["/product/2.jpg", "/product/4.jpg", "/product/2.jpg"],
      heading: "Modern Stable Facilities",
      paragraph: "Enjoy our state-of-the-art stables, spacious paddocks, and clean, comfortable environments designed for the well-being of our horses and guests.",
      buttonText: "Learn More",
      rating: 4.3,
      price: 260,
      extras: ["Private locker", "Stable tour", "Free refreshments"]
    },
    {
      id: 3,
      images: ["/product/3.jpg", "/product/1.jpg", "/product/3.jpg"],
      heading: "Premium Horses",
      paragraph: "Ride and bond with our well-trained, gentle horses, carefully selected for temperament and quality to provide the best equestrian experience.",
      buttonText: "Learn More",
      rating: 4.9,
      price: 320,
      extras: ["Gentle breeds", "Photo session", "Safety equipment"]
    },
    {
      id: 4,
      images: ["/product/4.jpg", "/product/2.jpg", "/product/4.jpg"],
      heading: "Comprehensive Riding Programs",
      paragraph: "From beginner lessons to advanced riding techniques, our programs are tailored to help you achieve your equestrian goals at your own pace.",
      buttonText: "Learn More",
      rating: 4.5,
      price: 200,
      extras: ["Group & private", "Gear included", "Completion certificate"]
    }
  ];

  const openModal = (tile) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTile(null);
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (isModalOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  const renderStars = (ratingValue = 0) => {
    const fullStars = Math.floor(ratingValue);
    const halfStar = ratingValue - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    return (
      <div className="flex items-center gap-1" aria-label={`Rating ${ratingValue} out of 5`}>
        {Array.from({ length: fullStars }).map((_, idx) => (
          <span key={`full-${idx}`} className="text-yellow-500">★</span>
        ))}
        {halfStar && <span className="text-yellow-500">☆</span>}
        {Array.from({ length: emptyStars }).map((_, idx) => (
          <span key={`empty-${idx}`} className="text-gray-300">★</span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{ratingValue.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="items-center justify-items-center p-8 text-center">
          <h2 className="text-2xl font-semibold primary mb-2">Our Horse Stable</h2>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-0.5 bg-orange-300"></div>
            <div className="w-16 h-2 bg-secondary mx-0"></div>
            <div className="w-16 h-0.5 bg-orange-300"></div>
          </div>
          <p className="opacity-80">
            Discover the finest horse stable experience—expert trainers, premium horses, and modern facilities for all ages and skill levels.
          </p>
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
              <p className="text-gray-600 text-sm mb-2 leading-relaxed">
                {tile.paragraph.split(' ').slice(0, 10).join(' ')}
                {tile.paragraph.split(' ').length > 10 && '...'}
              </p>
              <div className="flex items-center justify-center gap-4 mb-4">
                {renderStars(tile.rating)}
                <span className="text-base font-semibold text-gray-800">${tile.price}</span>
              </div>
              <button onClick={() => openModal(tile)} className="secondary cursor-pointer font-medium text-sm transition-colors duration-200 border border-secondary rounded p-2">
                {tile.buttonText}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button className="bg-secondary text-white px-8 py-3 rounded-md hover:bg-gray-900 transition-colors duration-200 font-medium text-lg cursor-pointer">
            View All Programs
          </button>
        </div>
      </div>

      {isModalOpen && selectedTile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-auto">
            <div className="relative">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white"
                aria-label="Close"
              >
                ✕
              </button>
              <Image
                src={selectedTile.images?.[0] || "/product/1.jpg"}
                alt={selectedTile.heading}
                width={1200}
                height={800}
                className="w-full h-[320px] sm:h-[300px] object-cover"
                priority
              />
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <h3 className="text-xl font-semibold secondary">{selectedTile.heading}</h3>
                <div className="flex items-center gap-4">
                  {renderStars(selectedTile.rating)}
                  <span className="text-lg font-bold text-gray-900">${selectedTile.price}</span>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                {selectedTile.paragraph}
              </p>
              {Array.isArray(selectedTile.extras) && selectedTile.extras.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-800 mb-2">What's Included</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTile.extras.map((extra, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-800 border border-gray-200 px-2.5 py-1 rounded-full">
                        {extra}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={closeModal} className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Close
                </button>
                <button className="px-4 py-2 rounded bg-secondary text-white hover:bg-gray-900">
                  Book Your Ride
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OurServices;
