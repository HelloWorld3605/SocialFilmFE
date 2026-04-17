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
import { cn } from "@/shared/utils/utils";

interface MovieCardProps {
  movie: MovieSummary;
  index?: number;
  className?: string;
  wishlistMovieSlugs?: ReadonlySet<string>;
}

const MovieCard = ({
  movie,
  index,
  className,
  wishlistMovieSlugs,
}: MovieCardProps) => {
  const [imageError, setImageError] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const image = movie.posterUrl || movie.thumbUrl || "";
  const countryText =
    movie.countries?.slice(0, 2).join(" • ") || "Đang cập nhật";
  const englishTitle = movie.originName?.trim();
  const prefetchMovieDetails = () => {
    if (queryClient.getQueryData(["movie", movie.slug])) {
      return;
    }

    void queryClient.prefetchQuery({
      queryKey: ["movie", movie.slug],
      queryFn: () => api.movie(movie.slug),
      staleTime: 1000 * 60 * 5,
    });
  };

  const hasExternalWishlistState = wishlistMovieSlugs !== undefined;
  const wishlistQuery = useQuery({
    queryKey: ["wishlist", token],
    queryFn: ({ signal }) => api.wishlist(token as string, { signal }),
    enabled: Boolean(token && !hasExternalWishlistState),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  const wished = hasExternalWishlistState
    ? wishlistMovieSlugs.has(movie.slug)
    : Boolean(wishlistQuery.data?.some((item) => item.movieSlug === movie.slug));

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
      className={cn(
        "group flex min-w-[160px] cursor-pointer flex-col gap-3 rounded-[28px] sm:min-w-[200px]",
        className,
      )}
      onHoverStart={prefetchMovieDetails}
      onFocusCapture={prefetchMovieDetails}
    >
      <div
        className="relative aspect-[2/3] overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] p-2 shadow-[0_18px_55px_rgba(0,0,0,0.22)] transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/30 group-hover:shadow-[0_24px_70px_rgba(0,0,0,0.3)]"
        onClick={() => navigate(`/movie/${movie.slug}`)}
      >
        <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-secondary">
          {!imageError && image ? (
            <img
              src={image}
              alt={movie.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              decoding="async"
              sizes="(min-width: 1280px) 16vw, (min-width: 1024px) 18vw, (min-width: 640px) 28vw, 45vw"
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
                      : "border-white/15 bg-black/55 text-white hover:border-primary/60 hover:bg-primary/20"
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
                <span className="max-w-full truncate whitespace-nowrap rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {movie.lang}
                </span>
              ) : null}
              {movie.year ? (
                <span className="rounded-full border border-white/10 bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white/80">
                  {movie.year}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 px-1.5">
        <div
          className="space-y-1"
          onClick={() => navigate(`/movie/${movie.slug}`)}
        >
          <h3 className="min-h-[2.5rem] line-clamp-2 text-sm font-bold leading-5 text-foreground">
            {movie.name}
          </h3>
          <p className="min-h-4 line-clamp-1 text-[11px] italic text-muted-foreground/80">
            {englishTitle || " "}
          </p>
          <p className="min-h-4 line-clamp-1 text-xs text-muted-foreground">
            {movie.episodeCurrent || "Đang cập nhật"}
          </p>
          <p className="min-h-4 line-clamp-1 text-xs text-muted-foreground/90">
            {countryText}
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
