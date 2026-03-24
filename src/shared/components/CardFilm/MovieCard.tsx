import { Star, Heart, Eye } from "lucide-react";
import type { Movie } from "@/shared/data/movies";
import { motion } from "framer-motion";

interface MovieCardProps {
  movie: Movie;
  index?: number;
}

const MovieCard = ({ movie, index = 0 }: MovieCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="group flex-shrink-0 w-[140px] md:w-[200px] cursor-pointer"
    >
      <div className="relative overflow-hidden rounded-lg mb-2 aspect-[2/3]">
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/20 transition-colors" />
      </div>
      <h3 className="text-sm font-medium text-foreground truncate">
        {movie.title}
      </h3>
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span className="text-primary font-semibold">{movie.year}</span>
        <Heart className="w-3 h-3" />
        <Eye className="w-3 h-3" />
        <span className="flex items-center gap-0.5">
          <Star className="w-3 h-3 fill-star text-star" />
          {movie.rating}
        </span>
      </div>
    </motion.div>
  );
};

export default MovieCard;
