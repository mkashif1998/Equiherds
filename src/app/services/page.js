import TopSection from "../components/topSection";
import ServicesContent from "../components/services/ServicesContent";

export const metadata = {
  title: "Services | Equiherds",
};

export default function ServicesPage() {
  return (
    <div className="font-sans bg-white">
      <TopSection title="Services" bgImage="/slider/1.jpeg" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <ServicesContent />
      </section>
    </div>
  );
}


