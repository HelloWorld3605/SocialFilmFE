import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Plus, Star, Clock, Film } from "lucide-react";
import { movies } from "@/shared/data/movies";
import { Header } from "@/shared/components/PublicHeader/Header";
import Footer from "@/shared/components/PublicFooter/Footer";
import MovieCard from "@/shared/components/CardFilm/MovieCard";

const MovieDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  let movie: any = movies.find(
    (m) => String(m.id) === id || (m as any)._id === id,
  );

  // Fallback for HeroSection mock data divergence
  if (!movie && id && id.length > 5) {
    movie = {
      id: id,
      title: "Hero Movie",
      year: 2026,
      rating: 4.5,
      poster:
        "https://phimimg.com/upload/vod/20260307-1/7e5b11b1d5ce3514f6d62787d164b816.jpg",
      backdrop:
        "https://phimimg.com/upload/vod/20260307-1/81572d43eddf1dc784f3f53f6323f46d.jpg",
      genre: ["Action"],
      description: "Mô tả cho phim từ Hero Banner (Dữ liệu đang được mock)",
    };
  }

  if (!movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Không tìm thấy phim.</p>
      </div>
    );
  }

  const similarMovies = movies
    .filter(
      (m) => m.id !== movie.id && m.genre.some((g) => movie.genre.includes(g)),
    )
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Backdrop */}
      <div className="relative h-[80vh] w-full overflow-hidden">
        <img
          src={movie.thumb_url || movie.backdrop || movie.poster}
          alt={movie.title}
          className="h-full w-full object-cover object-[center_15%]"
          onError={() => setImageError(true)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        {/* Play button overlay */}
        <button className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex h-20 w-20 items-center justify-center rounded-full border-2 border-primary/80 bg-primary/20 text-primary backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary/40">
          <Play className="h-8 w-8 fill-current" />
        </button>

        {/* Bottom info on backdrop */}
        <div className="absolute bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground tracking-wider"
            >
              {movie.title} ({movie.year})
            </motion.h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-md bg-primary/20 px-3 py-1.5 text-sm font-semibold text-primary">
                <Star className="h-4 w-4 fill-current" /> IMDb {movie.rating}
              </span>
              <button className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary">
                <Heart className="h-4 w-4" /> Xem sau
              </button>
              <button className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary">
                <Plus className="h-4 w-4" /> Thêm vào danh sách
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Poster sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center lg:items-start gap-4"
          >
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-xl border border-border shadow-2xl">
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full object-cover"
              />
            </div>
            <div className="flex w-full max-w-[280px] flex-col gap-2">
              <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                <Heart className="h-4 w-4" /> Xem sau
              </button>
              <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent">
                <Plus className="h-4 w-4" /> Thêm vào danh sách
              </button>
            </div>
          </motion.div>

          {/* Info section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Title + meta */}
            <div>
              <h2 className="text-3xl font-bold text-foreground tracking-wide">
                {movie.title}{" "}
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 text-sm font-semibold text-primary align-middle">
                  <Star className="h-3.5 w-3.5 fill-current" /> {movie.rating}
                </span>
              </h2>
              <p className="mt-2 text-muted-foreground">{movie.description}</p>

              {/* Tags row */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" /> {movie.duration || "120 min"}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {movie.genre?.map((g: string) => (
                  <span
                    key={g}
                    className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-foreground"
                  >
                    {g}
                  </span>
                ))}
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>{movie.year}</span>
              </div>
            </div>

            {/* Details + Cast grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Details */}
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground tracking-wide">
                  Chi tiết
                </h3>
                <div className="space-y-2 text-sm">
                  {movie.director && (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Đạo diễn:
                      </span>
                      <span className="text-foreground">{movie.director}</span>
                    </div>
                  )}
                  {movie.writers && (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Biên kịch:
                      </span>
                      <span className="text-foreground">
                        {movie.writers.join(", ")}
                      </span>
                    </div>
                  )}
                  {movie.country && (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Quốc gia:
                      </span>
                      <span className="text-foreground">{movie.country}</span>
                    </div>
                  )}
                  {movie.language && (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Ngôn ngữ:
                      </span>
                      <span className="text-foreground">{movie.language}</span>
                    </div>
                  )}
                  {movie.releaseDate && (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Ngày phát hành:
                      </span>
                      <span className="text-foreground">
                        {movie.releaseDate}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Cast */}
              {movie.cast && (
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground tracking-wide">
                    Diễn viên
                  </h3>
                  <div className="space-y-3">
                    {movie.cast?.map((actor: any) => (
                      <div key={actor.name} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                          {actor.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {actor.name}
                          </p>
                          {actor.character && (
                            <p className="text-xs text-muted-foreground">
                              {actor.character}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Storyline */}
            {movie.storyline && (
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-foreground tracking-wide">
                  Cốt truyện
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {movie.storyline}
                </p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Similar movies */}
        {similarMovies.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-bold text-foreground tracking-wide">
                <Film className="h-5 w-5 text-primary" /> Phim tương tự
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {similarMovies.map((m, i) => (
                <div
                  key={m.id}
                  onClick={() => navigate(`/movie/${m.id}`)}
                  className="cursor-pointer"
                >
                  <MovieCard movie={m as any} index={i} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MovieDetail;
