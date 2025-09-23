"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getRequest } from "@/service";

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [tiles, setTiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        let data = await getRequest('/api/stables');
        if (!Array.isArray(data)) data = [];
        const mapped = data.map((s) => {
          // PriceRate can be an array or object, handle both
          let priceRates = [];
          if (Array.isArray(s?.PriceRate) && s.PriceRate.length > 0) {
            priceRates = s.PriceRate
              .filter((pr) => typeof pr?.PriceRate === "number" && pr.PriceRate > 0 && pr.RateType)
              .map((pr) => ({
                price: pr.PriceRate,
                rateType: pr.RateType,
              }));
          } else if (typeof s?.PriceRate === "object" && s.PriceRate !== null) {
            if (typeof s.PriceRate.PriceRate === "number" && s.PriceRate.PriceRate > 0 && s.PriceRate.RateType) {
              priceRates = [{
                price: s.PriceRate.PriceRate,
                rateType: s.PriceRate.RateType,
              }];
            }
          }
          // For backward compatibility, keep price/rateType as first entry if available
          let price = priceRates.length > 0 ? priceRates[0].price : 0;
          let rateType = priceRates.length > 0 ? priceRates[0].rateType : '';
          return {
            id: s?._id || s?.id,
            images: Array.isArray(s?.image) && s.image.length > 0 ? s.image : ["/product/1.jpg"],
            heading: s?.Tittle || "Stable",
            paragraph: s?.Deatils || "",
            rating: typeof s?.Rating === 'number' ? s.Rating : null,
            price,
            rateType,
            priceRates, // array of { price, rateType }
            slots: Array.isArray(s?.Slotes)
              ? s.Slotes.map((sl) => ({ date: sl?.date || '', startTime: sl?.startTime || '', endTime: sl?.endTime || '' }))
              : [],
            ownerName: s?.userId ? `${s.userId.firstName || ''} ${s.userId.lastName || ''}`.trim() : '',
            ownerEmail: s?.userId?.email || '',
          };
        });
        setTiles(mapped);
      } catch (e) {
        setError('Failed to load stables');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openModal = (tile) => {
    setSelectedTile(tile);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTile(null);
    setCurrentImageIndex(0);
  };

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    if (selectedTile && selectedTile.images) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedTile.images.length);
    }
  };

  const prevImage = () => {
    if (selectedTile && selectedTile.images) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedTile.images.length) % selectedTile.images.length);
    }
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    if (isModalOpen) {
      window.addEventListener("keydown", onKeyDown);
    }
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen, selectedTile]);

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

  // Helper to render all price rates
  const renderPriceRates = (priceRates) => {
    if (!Array.isArray(priceRates) || priceRates.length === 0) return null;
    return (
      <div className="flex flex-col items-center gap-1">
        {priceRates.map((pr, idx) => (
          <span key={idx} className="text-base font-semibold text-gray-800">
            ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
          </span>
        ))}
      </div>
    );
  };

  return (
    <section className="py-16 px-4 sm:px-8 lg:px-16 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="items-center justify-items-center p-8 text-center">
          <h2 className="text-2xl font-semibold primary mb-4">Our Horse Stable</h2>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-0.5 bg-orange-300"></div>
            <div className="w-16 h-2 bg-secondary mx-2"></div>
            <div className="w-16 h-0.5 bg-orange-300"></div>
          </div>
          <p className="opacity-80">
            Discover the finest horse stable experience—expert trainers, premium horses, and modern facilities for all ages and skill levels.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {loading && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-gray-500">Loading...</div>
          )}
          {!loading && error && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-red-500">{error}</div>
          )}
          {!loading && !error && tiles.length === 0 && (
            <div className="col-span-1 md:col-span-2 lg:col-span-4 text-center text-gray-500">No stables found</div>
          )}
          {!loading && !error && tiles.map((tile) => (
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
                {tile.paragraph ? `${tile.paragraph.split(' ').slice(0, 10).join(' ')}${tile.paragraph.split(' ').length > 10 ? '...' : ''}` : ''}
              </p>
              {/* <div className="flex items-center justify-center gap-4 mb-4">
                {typeof tile.rating === 'number' && (
                  renderStars(tile.rating)
                )}
                {tile.priceRates && tile.priceRates.length > 0 && (
                  <div>
                    {renderPriceRates(tile.priceRates)}
                  </div>
                )}
              </div> */}
              <button onClick={() => openModal(tile)} className="secondary cursor-pointer font-medium text-sm transition-colors duration-200 border border-secondary rounded p-2">
                View Details
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */
            }
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-semibold secondary">{selectedTile.heading}</h3>
                  {(selectedTile.ownerName || selectedTile.ownerEmail) && (
                    <p className="text-xs text-gray-500">By {selectedTile.ownerName || 'User'}{selectedTile.ownerEmail ? ` • ${selectedTile.ownerEmail}` : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {typeof selectedTile.rating === 'number' && renderStars(selectedTile.rating)}
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row">
              {/* Image Gallery Section */}
              <div className="lg:w-2/3">
                {/* Large Main Image */}
                <div className="relative bg-gray-100">
                  <div className="relative h-[400px] lg:h-[500px] overflow-hidden">
                    <Image
                      src={selectedTile.images?.[currentImageIndex] || "/product/1.jpg"}
                      alt={`${selectedTile.heading} - Image ${currentImageIndex + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover transition-all duration-300"
                      priority
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedTile.images && selectedTile.images.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                          aria-label="Previous image"
                        >
                          ‹
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                          aria-label="Next image"
                        >
                          ›
                        </button>
                      </>
                    )}

                    {/* Image Counter */}
                    {selectedTile.images && selectedTile.images.length > 1 && (
                      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedTile.images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {selectedTile.images && selectedTile.images.length > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {selectedTile.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex
                                ? 'border-secondary shadow-md scale-105'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Image
                              src={image}
                              alt={`Thumbnail ${index + 1}`}
                              width={80}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                            {index === currentImageIndex && (
                              <div className="absolute inset-0 bg-secondary/20"></div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Section */}
              <div className="lg:w-1/3 p-6 overflow-y-auto max-h-[400px] lg:max-h-[500px]">
                <div className="space-y-4">
                  <p className="text-gray-600 leading-relaxed">
                    {selectedTile.paragraph}
                  </p>
                  
                  {Array.isArray(selectedTile.slots) && selectedTile.slots.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Available Slots</h4>
                      <div className="space-y-2">
                        {selectedTile.slots.map((sl, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-secondary rounded-full"></div>
                            <span className="text-sm text-gray-700">{sl.date} {sl.startTime}-{sl.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show all price rates in modal */}
                  {Array.isArray(selectedTile.priceRates) && selectedTile.priceRates.length > 0 && (
                    <div className="pt-2">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Price</h4>
                      <div className="flex flex-col gap-1">
                        {selectedTile.priceRates.map((pr, idx) => (
                          <p key={idx} className="text-sm text-gray-700">
                            ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-3">
                      <button 
                        className="w-full px-6 py-3 bg-secondary text-white rounded-lg hover:bg-gray-900 transition-colors duration-200 font-medium"
                      >
                        Book Your Stable
                      </button>
                      <button 
                        onClick={closeModal} 
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OurServices;
