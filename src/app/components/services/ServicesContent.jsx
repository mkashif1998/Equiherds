"use client";

import { useMemo, useState } from "react";

const SERVICES = [
  {
    id: "svc-boarding",
    title: "Premium Horse Boarding",
    details: "Safe stables, daily turnout, and attentive care.",
    rating: 4.7,
    price: 350,
    image: "/product/1.jpg",
  },
  {
    id: "svc-training",
    title: "Personalized Training",
    details: "1:1 sessions tailored to your horse’s goals.",
    rating: 4.9,
    price: 520,
    image: "/product/2.jpg",
  },
  {
    id: "svc-rehab",
    title: "Rehabilitation & Therapy",
    details: "Professional rehab plans with close monitoring.",
    rating: 4.4,
    price: 440,
    image: "/product/3.jpg",
  },
  {
    id: "svc-lesson",
    title: "Riding Lessons",
    details: "Beginner to advanced, rider-first approach.",
    rating: 4.2,
    price: 120,
    image: "/product/4.jpg",
  },
];

function StarRating({ value }) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const total = 5;
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${value} out of 5`}>
      {Array.from({ length: total }).map((_, index) => {
        const isFull = index < fullStars;
        const isHalf = !isFull && hasHalf && index === fullStars;
        return (
          <svg
            key={index}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${isFull ? "fill-yellow-400" : isHalf ? "fill-yellow-300" : "fill-gray-300"}`}
          >
            <path d="M12 .587l3.668 7.431 8.204 1.193-5.936 5.787 1.402 8.168L12 18.897l-7.338 3.869 1.402-8.168L.128 9.211l8.204-1.193z" />
          </svg>
        );
      })}
      <span className="ml-1 text-xs text-gray-500">{value.toFixed(1)}</span>
    </div>
  );
}

export default function ServicesContent() {
  const prices = useMemo(() => SERVICES.map((s) => s.price), []);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(minPrice);
  const [priceMax, setPriceMax] = useState(maxPrice);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return SERVICES.filter((s) => {
      const matchesSearch = term
        ? s.title.toLowerCase().includes(term) || s.details.toLowerCase().includes(term)
        : true;
      const matchesRating = s.rating >= minRating;
      const matchesPrice = s.price >= priceMin && s.price <= priceMax;
      return matchesSearch && matchesRating && matchesPrice;
    });
  }, [search, minRating, priceMin, priceMax]);

  function handleReset() {
    setSearch("");
    setMinRating(0);
    setPriceMin(minPrice);
    setPriceMax(maxPrice);
  }

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
      <aside className="md:col-span-4 lg:col-span-3">
        <div className="sticky top-24 rounded-xl border border-gray-200 bg-white/60 p-5 shadow-sm backdrop-blur">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand">Filters</h2>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-brand"
            >
              Reset
            </button>
          </div>

          <div className="mb-6">
            <label htmlFor="service-search" className="mb-2 block text-sm font-medium text-gray-700">
              Search
            </label>
            <input
              id="service-search"
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring"
            />
          </div>

          <div className="mb-6">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="rating" className="text-sm font-medium text-gray-700">
                Minimum Rating
              </label>
              <span className="text-xs text-gray-500">{minRating.toFixed(1)}+</span>
            </div>
            <input
              id="rating"
              type="range"
              min={0}
              max={5}
              step={0.5}
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Price Range</span>
              <span className="text-xs text-gray-500">${priceMin} - ${priceMax}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="min-price" className="mb-1 block text-xs text-gray-500">
                  Min
                </label>
                <input
                  id="min-price"
                  type="number"
                  min={minPrice}
                  max={priceMax}
                  value={priceMin}
                  onChange={(e) => setPriceMin(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring"
                />
              </div>
              <div>
                <label htmlFor="max-price" className="mb-1 block text-xs text-gray-500">
                  Max
                </label>
                <input
                  id="max-price"
                  type="number"
                  min={priceMin}
                  max={maxPrice}
                  value={priceMax}
                  onChange={(e) => setPriceMax(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-brand/20 transition focus:ring"
                />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="md:col-span-8 lg:col-span-9">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing <span className="font-medium text-brand">{filtered.length}</span> of {SERVICES.length}
          </p>
          <div className="text-xs text-gray-400">Updated just now</div>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((svc) => (
            <article key={svc.id} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={svc.image}
                  alt={svc.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-brand">{svc.title}</h3>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">${svc.price}</span>
                </div>
                <p className="text-sm text-gray-600">{svc.details}</p>
                <StarRating value={svc.rating} />
                <div className="mt-auto pt-1">
                  <button
                    type="button"
                    className="w-full rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand/90"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-10 rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
            No services match your filters.
          </div>
        )}
      </section>
    </div>
  );
}


