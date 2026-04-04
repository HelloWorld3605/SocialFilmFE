import { useNavigate } from "react-router-dom";
import { useState, type MouseEvent } from "react";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MovieSummary } from "@/shared/types/api";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";

interface MovieCardProps {
  movie: MovieSummary;
  index?: number;
}

const MovieCard = ({ movie, index }: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const image = movie.posterUrl || movie.thumbUrl || "";

  const wishlistQuery = useQuery({
    queryKey: ["wishlist", token],
    queryFn: () => api.wishlist(token as string),
    enabled: Boolean(token),
  });

  const wished = Boolean(
    wishlistQuery.data?.some((item) => item.movieSlug === movie.slug),
  );

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Bạn cần đăng nhập để lưu phim.");
      }

      if (wished) {
        await api.removeWishlist(token, movie.slug);
        return;
      }

      await api.addWishlist(token, {
        movieSlug: movie.slug,
        movieName: movie.name,
        originName: movie.originName,
        posterUrl: movie.posterUrl,
        thumbUrl: movie.thumbUrl,
        quality: movie.quality,
        lang: movie.lang,
        year: movie.year ? String(movie.year) : null,
      });
    },
    onSuccess: () => {
      if (!token) {
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["wishlist", token] });
      queryClient.invalidateQueries({ queryKey: ["wishlist-state", movie.slug, token] });
    },
  });

  const handleWishlistClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!token) {
      navigate("/auth?mode=login");
      return;
    }
    wishlistMutation.mutate();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: (index ?? 0) * 0.05 }}
      className="group flex min-w-[160px] cursor-pointer flex-col gap-3 sm:min-w-[200px]"
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-lg bg-secondary"
        onClick={() => navigate(`/movie/${movie.slug}`)}
      >
        {!imageError && image ? (
          <img
            src={image}
            alt={movie.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            <span className="px-2 text-center text-xs text-muted-foreground">
              {movie.name}
            </span>
          </div>
        )}

        <div className="absolute right-3 top-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleWishlistClick}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  wished
                    ? "border-primary/80 bg-primary text-white"
                    : "border-white/20 bg-black/55 text-white hover:border-primary/60 hover:bg-primary/20"
                }`}
              >
                <Heart className={`h-4 w-4 ${wished ? "fill-current" : ""}`} />
              </button>
            </TooltipTrigger>
            <TooltipContent>
              {token
                ? wished
                  ? "Bỏ khỏi danh sách xem sau"
                  : "Lưu vào danh sách xem sau"
                : "Đăng nhập để lưu phim"}
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/25 to-transparent p-3">
          <div className="flex flex-wrap items-center gap-2">
            {movie.lang ? (
              <span className="max-w-full truncate whitespace-nowrap rounded-full bg-primary/90 px-2.5 py-1 text-[11px] font-semibold text-white">
                {movie.lang}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-3 px-1">
        <div
          className="space-y-1"
          onClick={() => navigate(`/movie/${movie.slug}`)}
        >
          <h3 className="line-clamp-2 text-sm font-bold leading-5 text-foreground">
            {movie.name}
          </h3>
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {movie.episodeCurrent || "Đang cập nhật"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {wishlistMutation.isPending ? (
            <span className="text-xs text-muted-foreground">Đang lưu...</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
};

export default MovieCard;
