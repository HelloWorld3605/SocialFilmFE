import type { Movie } from "@/data/movies";
import MovieCard from "./MovieCard";

interface MovieRowProps {
  title?: string;
  movies: Movie[];
}

const MovieRow = ({ title, movies }: MovieRowProps) => {
  return (
    <section className="px-6 md:px-16 mb-8">
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4">{title}</h3>
      )}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {movies.map((movie, i) => (
          <MovieCard key={movie.id} movie={movie} index={i} />
        ))}
      </div>
    </section>
  );
};

export default MovieRow;
