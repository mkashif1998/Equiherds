"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import TopSection from "../components/topSection";
// Child components fetch their own data
import TrainerList from "../components/services/trainer";
import StableList from "../components/services/stable";

// Data is fetched dynamically based on the `type` query.

// Rating UI moved inside child list components

// Note: metadata must be exported from a Server Component. Removed here because this is a Client Component.

function ServicesContent() {
  const searchParams = useSearchParams();
  const type = (searchParams.get("type") || "trainer").toLowerCase();

  // No local data; child components will fetch

  // Filter state moved to child components

  useEffect(() => {
    // keep reacting to type change for future enhancements
  }, [type]);

  // Filtering handled in child components

  return (
    <div className="font-sans bg-white">
      <TopSection title="Services" bgImage="/slider/1.jpeg" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <div>{type === "stables" ? <StableList /> : <TrainerList />}</div>
      </section>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <ServicesContent />
    </Suspense>
  );
}
