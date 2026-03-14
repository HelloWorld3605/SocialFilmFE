import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { popularMovies } from "@/data/movies";

const PopularCarousel = () => {
  const [active, setActive] = useState(1);

  return (
    <section className="px-6 md:px-16 py-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Popular Movies</h3>
      <div className="relative">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide p-4 bg-secondary/50 rounded-xl">
          {popularMovies.map((movie, i) => (
            <button
              key={movie.id}
              onClick={() => setActive(i)}
              className={`flex-shrink-0 w-[100px] md:w-[130px] aspect-[2/3] rounded-lg overflow-hidden transition-all duration-300 ${
                active === i
                  ? "ring-2 ring-primary scale-105"
                  : "opacity-70 hover:opacity-100"
              }`}
            >
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
        <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-background/80 rounded-full flex items-center justify-center text-foreground hover:bg-background transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </section>
  );
};

export default PopularCarousel;
