"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Checkbox } from "antd";
import { getRequest } from "@/service";

export default function StableList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedStable, setSelectedStable] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // New filters
  const [stayType, setStayType] = useState("");
  const [stallionsAccepted, setStallionsAccepted] = useState(false);
  const [eventFacilities, setEventFacilities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getRequest("/api/stables");
        const normalized = Array.isArray(data) ? data.map((d) => {
          // Handle images - can be from 'images' or 'image' field
          const images = Array.isArray(d?.image) && d.image.length > 0 ? d.image : ["/product/1.jpg"];
          
          // Handle PriceRate - can be array or object
          let priceRates = [];
          if (Array.isArray(d?.PriceRate) && d.PriceRate.length > 0) {
            priceRates = d.PriceRate
              .filter((pr) => typeof pr?.PriceRate === "number" && pr.PriceRate > 0 && pr.RateType)
              .map((pr) => ({
                price: pr.PriceRate,
                rateType: pr.RateType,
              }));
          } else if (typeof d?.PriceRate === "object" && d.PriceRate !== null) {
            if (typeof d.PriceRate.PriceRate === "number" && d.PriceRate.PriceRate > 0 && d.PriceRate.RateType) {
              priceRates = [{
                price: d.PriceRate.PriceRate,
                rateType: d.PriceRate.RateType,
              }];
            }
          }
          
          // For backward compatibility, keep price as first entry if available
          let price = priceRates.length > 0 ? priceRates[0].price : 0;
          
          return {
            id: String(d?._id || ""),
            title: String(d?.Tittle || "Untitled Stable"),
            details: String(d?.Deatils || ""),
            rating: Number(d?.Rating || 0),
            price,
            priceRates,
            images,
            image: images[0], // Keep first image for card display
            location: String(d?.location || ""),
            coordinates: d?.coordinates || null,
            userId: d?.userId || null,
            // Handle populated user data
            ownerName: d?.userId ? `${d.userId.firstName || ''} ${d.userId.lastName || ''}`.trim() : '',
            ownerEmail: d?.userId?.email || '',
            slots: Array.isArray(d?.Slotes)
              ? d.Slotes.map((sl) => ({ 
                  date: sl?.date || '', 
                  startTime: sl?.startTime || '', 
                  endTime: sl?.endTime || '' 
                }))
              : [],
            status: d?.status || "active",
            // New fields for filtering
            shortTermStay: d?.shortTermStay || {},
            longTermStay: d?.longTermStay || {},
            stallionsAccepted: Boolean(d?.stallionsAccepted),
            stallionsPrice: d?.stallionsPrice || null,
            eventPricing: d?.eventPricing || {},
          };
        }) : [];
        if (!cancelled) setItems(normalized);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Failed to load stables");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const prices = items.map((s) => s.price || 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setPriceMin(min);
    setPriceMax(max);
    setMinRating(0);
    setSearch("");
    setSelectedDay("");
    setStayType("");
    setStallionsAccepted(false);
    setEventFacilities([]);
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    console.log('Filter values:', { stayType, stallionsAccepted, eventFacilities, search, minRating, priceMin, priceMax, selectedDay });
    return items.filter((s) => {
      const matchesSearch = term
        ? (s.title || "").toLowerCase().includes(term) || 
          (s.details || "").toLowerCase().includes(term) || 
          (s.location || "").toLowerCase().includes(term)
        : true;
      const matchesRating = Number(s.rating || 0) >= minRating;
      const price = Number(s.price || 0);
      const matchesPrice = price >= priceMin && price <= priceMax;
      const matchesDay = selectedDay ? s.slots.some(slot => slot.date.toLowerCase() === selectedDay.toLowerCase()) : true;
      
      // New filter logic
      const matchesStayType = !stayType || (
        stayType === "shortTerm" ? (
          s.shortTermStay?.inStableStraw === true || 
          s.shortTermStay?.inStableShavings === true || 
          s.shortTermStay?.inFieldAlone === true || 
          s.shortTermStay?.inFieldHerd === true
        ) : stayType === "longTerm" ? (
          s.longTermStay?.inStableStraw === true || 
          s.longTermStay?.inStableShavings === true || 
          s.longTermStay?.inFieldAlone === true || 
          s.longTermStay?.inFieldHerd === true
        ) : true
      );
      
      const matchesStallions = !stallionsAccepted || s.stallionsAccepted;
      
      const matchesEventFacilities = eventFacilities.length === 0 || eventFacilities.some(facility => 
        s.eventPricing?.[facility] === true
      );
      
      const result = matchesSearch && matchesRating && matchesPrice && matchesDay && 
             matchesStayType && matchesStallions && matchesEventFacilities;
      
      // Debug logging for first few items
      if (items.indexOf(s) < 3) {
        console.log(`Item ${s.title}:`, {
          matchesSearch, matchesRating, matchesPrice, matchesDay,
          matchesStayType, matchesStallions, matchesEventFacilities,
          result,
          shortTermStay: s.shortTermStay,
          longTermStay: s.longTermStay,
          stallionsAccepted: s.stallionsAccepted,
          eventPricing: s.eventPricing
        });
      }
      
      return result;
    });
  }, [items, search, minRating, priceMin, priceMax, selectedDay, stayType, stallionsAccepted, eventFacilities]);

  function handleReset() {
    const prices = items.map((s) => s.price || 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setSearch("");
    setMinRating(0);
    setPriceMin(min);
    setPriceMax(max);
    setSelectedDay("");
    setStayType("");
    setStallionsAccepted(false);
    setEventFacilities([]);
  }

  function handleStableClick(stable) {
    setSelectedStable(stable);
    setCurrentImageIndex(0);
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setSelectedStable(null);
    setCurrentImageIndex(0);
  }

  const selectImage = (index) => {
    setCurrentImageIndex(index);
  };

  const nextImage = () => {
    if (selectedStable && selectedStable.images) {
      setCurrentImageIndex((prev) => (prev + 1) % selectedStable.images.length);
    }
  };

  const prevImage = () => {
    if (selectedStable && selectedStable.images) {
      setCurrentImageIndex((prev) => (prev - 1 + selectedStable.images.length) % selectedStable.images.length);
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
  }, [isModalOpen, selectedStable]);

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <aside className="md:col-span-4 lg:col-span-3">
        <div className="sticky top-24 rounded-xl border border-gray-200 bg-white/60 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand">Filters</h2>
            <button type="button" onClick={handleReset} className="text-sm text-gray-500 hover:text-brand">Reset</button>
          </div>

          <div className="mb-6">
            <label htmlFor="stable-search" className="mb-2 block text-sm font-medium text-gray-700">Search</label>
            <input id="stable-search" type="text" placeholder="Search stables..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring" />
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rating" className="text-sm font-medium text-gray-700">Minimum Rating</label>
              <span className="text-xs text-gray-500">{minRating.toFixed(1)}+</span>
            </div>
            <input id="rating" type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full" />
          </div>

          <div className="mb-6">
            <label htmlFor="day-filter" className="mb-2 block text-sm font-medium text-gray-700">Available Day</label>
            <select id="day-filter" value={selectedDay} onChange={(e) => setSelectedDay(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring">
              <option value="">All Days</option>
              <option value="Monday">Monday</option>
              <option value="Tuesday">Tuesday</option>
              <option value="Wednesday">Wednesday</option>
              <option value="Thursday">Thursday</option>
              <option value="Friday">Friday</option>
              <option value="Saturday">Saturday</option>
              <option value="Sunday">Sunday</option>
            </select>
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Price Range</span>
              <span className="text-xs text-gray-500">${priceMin} - ${priceMax}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="min-price" className="mb-1 block text-xs text-gray-500">Min</label>
                <input id="min-price" type="number" min={0} max={priceMax} value={priceMin} onChange={(e) => setPriceMin(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring" />
              </div>
              <div>
                <label htmlFor="max-price" className="mb-1 block text-xs text-gray-500">Max</label>
                <input id="max-price" type="number" min={priceMin} max={priceMax} value={priceMax} onChange={(e) => setPriceMax(Number(e.target.value))} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring" />
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="stay-type" className="mb-2 block text-sm font-medium text-gray-700">Stay Type</label>
            <select id="stay-type" value={stayType} onChange={(e) => setStayType(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring">
              <option value="">All Stay Types</option>
              <option value="shortTerm">Short Term Stay</option>
              <option value="longTerm">Long Term Stay</option>
            </select>
          </div>

          <div className="mb-6">
            <Checkbox
              checked={stallionsAccepted}
              onChange={(e) => setStallionsAccepted(e.target.checked)}
              className="text-sm font-medium text-gray-700"
            >
              Accepts Stallions
            </Checkbox>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-sm font-medium text-gray-700">Event Facilities</label>
            <Checkbox.Group
              value={eventFacilities}
              onChange={(checkedValues) => setEventFacilities(checkedValues)}
              className="flex flex-col space-y-2"
            >
              {[
                { key: 'eventingCourse', label: 'Eventing Course' },
                { key: 'canterTrack', label: 'Canter Track' },
                { key: 'jumpingTrack', label: 'Jumping Track' },
                { key: 'dressageTrack', label: 'Dressage Track' }
              ].map((facility) => (
                <Checkbox
                  key={facility.key}
                  value={facility.key}
                  className="text-sm text-gray-700"
                >
                  {facility.label}
                </Checkbox>
              ))}
            </Checkbox.Group>
          </div>
        </div>
      </aside>

      <section className="md:col-span-8 lg:col-span-9">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Stables • Showing <span className="font-medium text-brand">{filtered.length}</span> of {items.length}</p>
          <div className="text-xs text-gray-400">Updated just now</div>
        </div>

        {error && (<div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>)}
        {loading && (<div className="mb-4 text-sm text-gray-500">Loading stables...</div>)}

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((svc) => (
            <article key={svc.id} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md cursor-pointer" onClick={() => handleStableClick(svc)}>
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={svc.image} alt={svc.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-brand">{svc.title}</h3>
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(svc.priceRates) && svc.priceRates.length > 0 ? (
                      svc.priceRates.slice(0, 2).map((pr, idx) => (
                        <span key={idx} className="shrink-0 rounded-full bg-brand/10 px-2 py-1 text-xs font-semibold text-brand border border-brand/20">
                          ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
                        </span>
                      ))
                    ) : (
                      <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand border border-brand/20">${svc.price}</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">{svc.details}</p>
                <Rating value={Number(svc.rating || 0)} />
                <div className="mt-auto pt-1">
                  <button type="button" className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90">View Details</button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && !loading && !error && (
          <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">No stables match your filters.</div>
        )}
      </section>

      {/* Modal */}
      {isModalOpen && selectedStable && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-brand">{selectedStable.title}</h3>
                  {(selectedStable.ownerName || selectedStable.ownerEmail) && (
                    <p className="text-xs text-gray-500">By {selectedStable.ownerName || 'User'}{selectedStable.ownerEmail ? ` • ${selectedStable.ownerEmail}` : ''}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Rating value={Number(selectedStable.rating || 0)} />
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
                      src={selectedStable.images?.[currentImageIndex] || selectedStable.image || "/product/1.jpg"}
                      alt={`${selectedStable.title} - Image ${currentImageIndex + 1}`}
                      width={800}
                      height={600}
                      className="w-full h-full object-cover transition-all duration-300"
                      priority
                    />
                    
                    {/* Navigation Arrows */}
                    {selectedStable.images && selectedStable.images.length > 1 && (
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
                    {selectedStable.images && selectedStable.images.length > 1 && (
                      <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {currentImageIndex + 1} / {selectedStable.images.length}
                      </div>
                    )}
                  </div>

                  {/* Thumbnail Strip */}
                  {selectedStable.images && selectedStable.images.length > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {selectedStable.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => selectImage(index)}
                            className={`relative flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                              index === currentImageIndex
                                ? 'border-brand shadow-md scale-105'
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
                              <div className="absolute inset-0 bg-brand/20"></div>
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
                  

                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">Description</h4>
                    <p className="text-gray-600 leading-relaxed text-sm">
                      {selectedStable.details}
                    </p>
                  </div>

                  {selectedStable.location && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Location</h4>
                      <p className="text-gray-600 text-sm">{selectedStable.location}</p>
                    </div>
                  )}

                  {Array.isArray(selectedStable.slots) && selectedStable.slots.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Available Slots</h4>
                      <div className="space-y-2">
                        {selectedStable.slots.map((sl, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-brand rounded-full"></div>
                            <span className="text-sm text-gray-700">{sl.date} {sl.startTime}-{sl.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stay Options */}
                  {(selectedStable.shortTermStay || selectedStable.longTermStay) && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Stay Options</h4>
                      <div className="space-y-3">
                        {selectedStable.shortTermStay && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-600 mb-2">Short Term Stay</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {selectedStable.shortTermStay.inStableStraw && (
                                <div className="flex justify-between">
                                  <span>In Stable (Straw):</span>
                                  <span className="font-medium">${selectedStable.shortTermStay.inStableStrawPrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.shortTermStay.inStableShavings && (
                                <div className="flex justify-between">
                                  <span>In Stable (Shavings):</span>
                                  <span className="font-medium">${selectedStable.shortTermStay.inStableShavingsPrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.shortTermStay.inFieldAlone && (
                                <div className="flex justify-between">
                                  <span>In Field (Alone):</span>
                                  <span className="font-medium">${selectedStable.shortTermStay.inFieldAlonePrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.shortTermStay.inFieldHerd && (
                                <div className="flex justify-between">
                                  <span>In Field (Herd):</span>
                                  <span className="font-medium">${selectedStable.shortTermStay.inFieldHerdPrice || 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {selectedStable.longTermStay && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-600 mb-2">Long Term Stay</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {selectedStable.longTermStay.inStableStraw && (
                                <div className="flex justify-between">
                                  <span>In Stable (Straw):</span>
                                  <span className="font-medium">${selectedStable.longTermStay.inStableStrawPrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.longTermStay.inStableShavings && (
                                <div className="flex justify-between">
                                  <span>In Stable (Shavings):</span>
                                  <span className="font-medium">${selectedStable.longTermStay.inStableShavingsPrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.longTermStay.inFieldAlone && (
                                <div className="flex justify-between">
                                  <span>In Field (Alone):</span>
                                  <span className="font-medium">${selectedStable.longTermStay.inFieldAlonePrice || 'N/A'}</span>
                                </div>
                              )}
                              {selectedStable.longTermStay.inFieldHerd && (
                                <div className="flex justify-between">
                                  <span>In Field (Herd):</span>
                                  <span className="font-medium">${selectedStable.longTermStay.inFieldHerdPrice || 'N/A'}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stallions */}
                  {selectedStable.stallionsAccepted && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-2">Stallions</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-gray-700">Stallions Accepted</span>
                        {selectedStable.stallionsPrice && (
                          <span className="text-sm font-medium text-brand">${selectedStable.stallionsPrice}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Event Facilities */}
                  {selectedStable.eventPricing && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Event Facilities</h4>
                      <div className="space-y-2">
                        {selectedStable.eventPricing.eventingCourse && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Eventing Course</span>
                            <span className="text-sm font-medium text-brand">${selectedStable.eventPricing.eventingCoursePrice || 'N/A'}</span>
                          </div>
                        )}
                        {selectedStable.eventPricing.canterTrack && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Canter Track</span>
                            <span className="text-sm font-medium text-brand">${selectedStable.eventPricing.canterTrackPrice || 'N/A'}</span>
                          </div>
                        )}
                        {selectedStable.eventPricing.jumpingTrack && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Jumping Track</span>
                            <span className="text-sm font-medium text-brand">${selectedStable.eventPricing.jumpingTrackPrice || 'N/A'}</span>
                          </div>
                        )}
                        {selectedStable.eventPricing.dressageTrack && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-700">Dressage Track</span>
                            <span className="text-sm font-medium text-brand">${selectedStable.eventPricing.dressageTrackPrice || 'N/A'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
<div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-3">Pricing</h4>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(selectedStable.priceRates) && selectedStable.priceRates.length > 0 ? (
                        selectedStable.priceRates.map((pr, idx) => (
                          <span key={idx} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                            ${pr.price}{pr.rateType ? `/${pr.rateType}` : ''}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-brand/10 text-brand border border-brand/20">
                          ${selectedStable.price}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          window.location.href = `/bookingStables?stableId=${selectedStable.id}`;
                        }}
                        className="w-full px-6 py-3 bg-brand text-white rounded-lg hover:bg-brand/90 transition-colors duration-200 font-medium"
                      >
                        Book Stable
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
    </div>
  );
}

function Rating({ value = 0 }) {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.5;
  const total = 5;
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${value} out of 5`}>
      {Array.from({ length: total }).map((_, index) => {
        const isFull = index < full;
        const isHalf = !isFull && hasHalf && index === full;
        return (
          <svg key={index} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`h-4 w-4 ${isFull ? "fill-yellow-400" : isHalf ? "fill-yellow-300" : "fill-gray-300"}`}>
            <path d="M12 .587l3.668 7.431 8.204 1.193-5.936 5.787 1.402 8.168L12 18.897l-7.338 3.869 1.402-8.168L.128 9.211l8.204-1.193z" />
          </svg>
        );
      })}
      <span className="ml-1 text-xs text-gray-500">{Number(value).toFixed(1)}</span>
    </div>
  );
}


