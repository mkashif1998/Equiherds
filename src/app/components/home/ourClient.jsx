"use client";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const testimonials = [
    {
        id: 1,
        name: "Ayesha Khan",
        role: "Farm Owner",
        image: "/product/2.jpg",
        rating: 5,
        review:
            "Equiherds transformed how we manage our herd. The insights are actionable and the support is amazing.",
    },
    {
        id: 2,
        name: "Muhammad Ali",
        role: "Operations Manager",
        image: "/product/3.jpg",
        rating: 4,
        review:
            "The platform is intuitive and reliable. We improved productivity within weeks of adoption.",
    },
    {
        id: 3,
        name: "Sara Ahmed",
        role: "Veterinary Consultant",
        image: "/product/4.jpg",
        rating: 5,
        review:
            "Data-driven features help us make better health decisions. Highly recommended!",
    },
    {
        id: 4,
        name: "Sara Ali",
        role: "Veterinary Consultant",
        image: "/product/4.jpg",
        rating: 5,
        review:
            "Data-driven features help us make better health decisions. Highly recommended!",
    },
];

function Stars({ count = 0 }) {
    const items = Array.from({ length: 5 });
    return (
        <div className="flex items-center gap-1">
            {items.map((_, idx) => (
                <svg key={idx} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={idx < count ? "#F5C518" : "#555"} className="w-5 h-5">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </div>
    );
}

export default function OurClient() {
    const [index, setIndex] = useState(0);
    const total = testimonials.length;
    const perView = 3;

    const next = () => setIndex((i) => (i + 1) % total);
    const prev = () => setIndex((i) => (i - 1 + total) % total);

    useEffect(() => {
        const id = setInterval(next, 4000);
        return () => clearInterval(id);
    }, [total]);

    const visible = useMemo(
        () => Array.from({ length: perView }, (_, o) => testimonials[(index + o) % total]),
        [index, total]
    );

    return (
        <div className="bg-white">
            <section className="mx-auto max-w-6xl px-4 py-16">
                <div className="text-brand text-center mb-10">
                    <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">What our clients say</h2>
                     <div className="flex items-center justify-center mb-4">
                        <div className="w-16 h-0.5 bg-orange-300"></div>
                        <div className="w-16 h-2 bg-secondary mx-2"></div>
                        <div className="w-16 h-0.5 bg-orange-300"></div>
                    </div>
                </div>

                <div className="relative">
                    <div className="overflow-hidden rounded-xl">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {visible.map((t) => (
                                <div key={t.id} className="px-0 sm:px-0">
                                    <div className="border border-white/10 rounded-xl p-5 bg-primary backdrop-blur-sm h-full">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="relative w-14 h-14 rounded-full overflow-hidden border border-white/10">
                                                <Image src={t.image} alt={t.name} fill className="object-cover" />
                                            </div>
                                            <div>
                                                <p className="text-white font-medium leading-tight">{t.name}</p>
                                                <p className="text-xs opacity-70">{t.role}</p>
                                            </div>
                                        </div>
                                        <Stars count={t.rating} />
                                        <p className="mt-3 text-sm opacity-80 leading-6 text-white">{t.review}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button aria-label="Previous" onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                    </button>
                    <button aria-label="Next" onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full w-9 h-9 flex items-center justify-center border border-white/20">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                    </button>

                    <div className="flex items-center justify-center gap-2 mt-6">
                        {Array.from({ length: total }).map((_, i) => (
                            <button
                                key={i}
                                aria-label={`Go to slide ${i + 1}`}
                                onClick={() => setIndex(i)}
                                className={`h-2.5 rounded-full transition-all ${index === i ? "w-6 bg-[var(--secondary)]" : "w-2.5 bg-white/30"}`}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
