import TopSection from "../components/topSection";

export const metadata = {
  title: "News | Equiherds",
};

export default function NewsPage() {
  return (
    <div className="font-sans">
      <TopSection title="News" />
      <section className="mx-auto max-w-6xl px-4 py-10 text-brand">
        <p className="opacity-80">News content will be here.</p>
      </section>
    </div>
  );
}


