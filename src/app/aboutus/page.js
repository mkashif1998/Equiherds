import TopSection from "../components/topSection";

export const metadata = {
  title: "About us | Equiherds",
};

export default function AboutPage() {
  return (
    <div className="font-sans">
      <TopSection title="About us" bgImage="/slider/3.jpeg" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <p className="opacity-80">About us content will be here.</p>
      </section>
    </div>
  );
}


