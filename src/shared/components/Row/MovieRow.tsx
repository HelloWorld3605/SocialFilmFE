import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "../CardFilm/MovieCard";
import type { MovieSummary } from "@/shared/types/api";

interface MovieRowProps {
  title: string;
  description?: string;
  movies: MovieSummary[];
}

const MovieRow = ({ title, description, movies }: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!movies.length) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = direction === "left" ? -400 : 400;
    scrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  return (
    <section className="relative pb-6 pt-8">
      <div className="layout-padding mb-6">
        <h2 className="text-2xl font-bold uppercase tracking-wider text-foreground sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>

      <div className="group/row relative">
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

        <div
          ref={scrollRef}
          className="scrollbar-hide flex gap-3 overflow-x-auto layout-padding pb-3 pt-2"
        >
          {movies.map((movie, index) => (
            <MovieCard key={movie.slug} movie={movie} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MovieRow;
