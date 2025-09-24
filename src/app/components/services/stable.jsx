"use client";

import { useEffect, useMemo, useState } from "react";
import { getRequest } from "@/service";

export default function StableList() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await getRequest("/api/stables");
        const normalized = Array.isArray(data) ? data.map((d) => {
          const priceValues = Array.isArray(d?.PriceRate) ? d.PriceRate.map((p) => Number(p?.PriceRate || 0)).filter((n) => !Number.isNaN(n)) : [];
          const computedPrice = priceValues.length ? Math.min(...priceValues) : 0;
          const image = Array.isArray(d?.image) && d.image.length ? d.image[0] : "/product/1.jpg";
          return {
            id: String(d?._id || ""),
            title: String(d?.Tittle || "Untitled Stable"),
            details: String(d?.Deatils || ""),
            rating: Number(d?.Rating || 0),
            price: computedPrice,
            image,
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
  }, [items]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((s) => {
      const matchesSearch = term
        ? (s.title || "").toLowerCase().includes(term) || (s.details || "").toLowerCase().includes(term)
        : true;
      const matchesRating = Number(s.rating || 0) >= minRating;
      const price = Number(s.price || 0);
      const matchesPrice = price >= priceMin && price <= priceMax;
      return matchesSearch && matchesRating && matchesPrice;
    });
  }, [items, search, minRating, priceMin, priceMax]);

  function handleReset() {
    const prices = items.map((s) => s.price || 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    setSearch("");
    setMinRating(0);
    setPriceMin(min);
    setPriceMax(max);
  }

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
        </div>
      </aside>

      <section className="md:col-span-8 lg:col-span-9">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Stables • Showing <span className="font-medium text-brand">{filtered.length}</span> of {items.length}</p>
          <div className="text-xs text-gray-400">Updated just now</div>
        </div>

        {error && (<div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>)}
        {loading && (<div className="mb-4 text-sm text-gray-500">Loading stables...</div>)}

        <div className="grid grid-cols-1 items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((svc) => (
            <article key={svc.id} className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img src={svc.image} alt={svc.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
              </div>
              <div className="flex flex-1 flex-col space-y-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-brand">{svc.title}</h3>
                  <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">${svc.price}</span>
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


