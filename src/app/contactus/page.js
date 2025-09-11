import TopSection from "../components/topSection";

export const metadata = {
  title: "Contact us | Equiherds",
};

export default function ContactPage() {
  return (
    <div className="font-sans">
      <TopSection title="Contact us" bgImage="/slider/4.jpeg" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <p className="opacity-80">Contact us content will be here.</p>
      </section>
    </div>
  );
}


