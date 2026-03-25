import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "../CardFilm/MovieCard";
import type { Movie } from "@/shared/data/movies";

interface MovieRowProps {
  title: string;
  movies: Movie[];
}

const MovieRow = ({ title, movies }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="relative py-8">
      <h2 className="mb-6 layout-padding text-2xl sm:text-3xl font-bold uppercase tracking-wider text-foreground">
        {title}
      </h2>

      <div className="group/row relative">
        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-r from-background/80 to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100"
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-0 z-10 hidden h-full w-10 items-center justify-center bg-gradient-to-l from-background/80 to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100"
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>

        {/* Movie cards */}
        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto layout-padding"
        >
          {movies.map((movie, index) => (
            <MovieCard key={movie.id} movie={movie} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieRow;
