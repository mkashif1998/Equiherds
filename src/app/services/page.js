import TopSection from "../components/topSection";

export const metadata = {
  title: "Services | Equiherds",
};

export default function ServicesPage() {
  return (
    <div className="font-sans">
      <TopSection title="Services" bgImage="/slider/2.jpeg" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        {/* Page content goes here */}
        <p className="opacity-80">Our services content will be here.</p>
      </section>
    </div>
  );
}


