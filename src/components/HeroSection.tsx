import { Play, Info } from "lucide-react";
import { Star } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      <img
        src={heroBg}
        alt="Featured movie"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />

      <div className="relative z-10 flex flex-col justify-end h-full px-6 md:px-16 pb-16">
        <h2 className="text-5xl md:text-7xl font-black tracking-tight text-foreground text-shadow-hero leading-none mb-2">
          STAR WARS
        </h2>
        <p className="text-2xl md:text-3xl font-bold text-foreground/90 text-shadow-hero mb-4">
          THE RISE OF SKYWALKER
        </p>
        <p className="text-sm md:text-base text-foreground/70 max-w-lg mb-4 leading-relaxed">
          The surviving members of the resistance face the First Order once again, and the legendary conflict between the Jedi and the Sith reaches its peak bringing the Skywalker saga to its end.
        </p>

        <div className="flex items-center gap-1 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Star key={i} className="w-4 h-4 fill-star text-star" />
          ))}
          <Star className="w-4 h-4 text-star" />
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity">
            <Play className="w-4 h-4 fill-current" />
            Watch Now
          </button>
          <button className="flex items-center gap-2 px-6 py-2.5 border border-foreground/30 text-foreground rounded-lg font-medium text-sm hover:bg-foreground/10 transition-colors">
            <Info className="w-4 h-4" />
            Trailer
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
