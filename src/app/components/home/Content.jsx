import Image from "next/image";

export default function Content() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-14 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="text-brand">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-4">Our Mission</h2>
          <div className="flex items-center  mb-4">
            <div className="w-16 h-0.5 bg-orange-300"></div>
            <div className="w-16 h-2 bg-secondary mx-2"></div>
            <div className="w-16 h-0.5 bg-orange-300"></div>
          </div>
          <p className="opacity-80 text-gray-600">
            We empower farmers and businesses with innovative livestock solutions. Our platform simplifies
            management, enhances productivity, and helps you make data‑driven decisions to grow sustainably.
          </p>
        </div>
        <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px]">
          <Image
            src="/content1.jpg"
            alt="Equiherds platform overview"
            fill
            className="object-cover rounded-lg border border-white/10"
            priority
          />
        </div>
      </div>
    </section>
  );
}
