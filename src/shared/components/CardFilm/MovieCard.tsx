import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import type { Movie } from "@/shared/data/movies";

interface MovieCardProps {
  movie: Movie;
  index: number;
}

const MovieCard = ({ movie, index }: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      className="group relative min-w-[160px] sm:min-w-[200px] cursor-pointer"
      onClick={() => navigate(`/movie/${movie.id}`)}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-secondary">
        {!imageError ? (
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="text-xs text-muted-foreground">{movie.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background/95 via-background/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="p-3">
            <div className="mb-2 flex items-center gap-2">
              <span
                className="flex items-center gap-1 text-xs font-semibold"
                style={{ color: "hsl(var(--gold))" }}
              >
                <Star className="h-3 w-3 fill-current" />
                {movie.rating}
              </span>
              <span className="text-xs text-muted-foreground">
                {movie.year}
              </span>
            </div>
            <h3 className="mb-2 text-sm font-bold text-foreground line-clamp-2">
              {movie.title}
            </h3>
            <div className="flex gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-110">
                <Play className="h-3.5 w-3.5 fill-current" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:border-foreground">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
