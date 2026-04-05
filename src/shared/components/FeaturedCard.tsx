import { Play, Plus, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { MovieSummary } from "@/shared/types/api";
import { buildWatchUrl } from "@/shared/lib/watch";

interface FeaturedCardProps {
  movie?: MovieSummary | null;
}

const FeaturedCard = ({ movie }: FeaturedCardProps) => {
  const navigate = useNavigate();

  if (!movie) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="layout-margin relative my-10 overflow-hidden rounded-xl"
    >
      <img
        src={movie.thumbUrl || movie.posterUrl || ""}
        alt={movie.name}
        className="h-[500px] w-full object-cover md:h-[900px] lg:h-[980px]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-destructive/80 px-2 py-0.5 text-xs font-bold text-foreground">
            {movie.quality || "HD"}
          </span>
          <span>{movie.year || "Chưa rõ"}</span>
          <span>{movie.episodeCurrent || "Đang cập nhật"}</span>
          <div className="ml-2 flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-3 w-3 fill-star text-star" />
            ))}
          </div>
        </div>

        <h3 className="mb-2 text-2xl font-bold text-foreground md:text-3xl">
          {movie.name}
        </h3>
        <p className="mb-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
          {movie.originName ||
            "Dữ liệu được lấy trực tiếp từ API phim của bạn."}
        </p>

        <div className="mb-4 flex items-center gap-3 text-sm text-muted-foreground">
          {movie.categories?.slice(0, 3).map((category) => (
            <span
              key={category}
              className="transition-colors hover:text-foreground"
            >
              {category}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(buildWatchUrl(movie.slug))}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Play className="h-4 w-4 fill-current" />
            Xem ngay
          </button>
          <button
            onClick={() => navigate(`/movie/${movie.slug}`)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
          >
            <Plus className="h-4 w-4" />
            Chi tiết
          </button>
        </div>
      </div>
    </motion.section>
  );
};

export default FeaturedCard;
