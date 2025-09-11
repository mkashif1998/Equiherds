import HeroSlider from "./components/home/HeroSlider";
import HorseStable from "./components/home/HorseStable";
import Coach from "./components/home/Coach";
import Content from "./components/home/Content";
import OurClient from "./components/home/ourClient";

export default function Home() {
  return (
    <div className="font-sans">
      <HeroSlider />
      <HorseStable />
      <Coach />
      <Content />
      <OurClient />
    </div>
  );
}
