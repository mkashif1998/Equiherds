import Image from "next/image";

export default function TopSection({ title, bgImage }) {
  const backgroundImage = bgImage || "/slider/1.jpeg";
  return (
    <section className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden">
      <Image
        src={backgroundImage}
        alt={title || "Top section background"}
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        {title ? (
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-white tracking-wide text-center">
            {title}
          </h1>
        ) : null}
      </div>
    </section>
  );
}

