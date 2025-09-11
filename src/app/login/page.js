import TopSection from "../components/topSection";

export const metadata = {
  title: "Login | Equiherds",
};

export default function LoginPage() {
  return (
    <div className="font-sans">
      <TopSection title="Login" />
      <section className="mx-auto max-w-md px-4 py-10 text-brand">
        {/* Replace with actual login form */}
        <form className="grid gap-4">
          <input className="bg-transparent border border-white/20 rounded px-3 py-2" placeholder="Email" />
          <input type="password" className="bg-transparent border border-white/20 rounded px-3 py-2" placeholder="Password" />
          <button type="submit" className="bg-white text-black rounded px-4 py-2 font-medium">Login</button>
        </form>
      </section>
    </div>
  );
}


