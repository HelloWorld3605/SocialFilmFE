import { useEffect, useRef, useState } from "react";
import { Play, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MovieSummary } from "@/shared/types/api";
import { buildWatchUrl } from "@/shared/lib/watch";
import { Skeleton } from "@/shared/components/ui/skeleton";

interface HeroSectionProps {
  movies: MovieSummary[];
}

const HeroSection = ({ movies }: HeroSectionProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselViewportRef = useRef<HTMLDivElement | null>(null);
  const movieCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const navigate = useNavigate();

  useEffect(() => {
    setActiveIndex(0);
  }, [movies]);

  useEffect(() => {
    if (movies.length <= 1) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % movies.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, [movies.length]);

  useEffect(() => {
    const viewport = carouselViewportRef.current;
    const activeCard = movieCardRefs.current[activeIndex];

    if (!viewport || !activeCard) {
      return;
    }

    const nextLeft =
      activeCard.offsetLeft -
      (viewport.clientWidth - activeCard.offsetWidth) / 2;

    viewport.scrollTo({
      left: Math.max(nextLeft, 0),
      behavior: "smooth",
    });
  }, [activeIndex]);

  const activeMovie =
    movies[Math.min(activeIndex, Math.max(movies.length - 1, 0))] ?? null;

  if (!activeMovie) {
    return (
      <section className="relative h-screen w-full overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.18),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.01))]" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
        <div className="relative z-10 flex h-full items-end">
          <div className="layout-padding grid w-full grid-cols-1 gap-8 pb-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.38fr)]">
            <div className="space-y-5 p-1 pr-2">
              <div className="space-y-3">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-12 w-4/5 max-w-xl" />
                <Skeleton className="h-12 w-3/5 max-w-lg" />
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Skeleton className="h-11 w-32 rounded-lg" />
                <Skeleton className="h-11 w-28 rounded-lg" />
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex gap-4 overflow-hidden px-2 pb-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={`hero-skeleton-${index}`}
                    className="flex w-[205px] flex-none overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))] md:w-[245px]"
                  >
                    <Skeleton className="h-full w-[72px] flex-none rounded-none md:w-[84px]" />
                    <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-4/5" />
                        <Skeleton className="h-4 w-3/5" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-1.5">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-12 rounded-full" />
                        </div>
                        <Skeleton className="h-1.5 w-full rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const setActiveMovieByIndex = (index: number) => {
    setActiveIndex(index);
  };

  const scrollCarousel = (direction: "left" | "right") => {
    const delta = direction === "left" ? -1 : 1;
    const nextIndex = Math.min(
      Math.max(activeIndex + delta, 0),
      movies.length - 1,
    );
    if (nextIndex !== activeIndex) {
      setActiveMovieByIndex(nextIndex);
    }
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <div className="absolute inset-0 z-0 transition-opacity duration-700 ease-in-out">
        <img
          key={activeMovie.slug}
          src={activeMovie.thumbUrl || activeMovie.posterUrl || ""}
          alt={activeMovie.name}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[center_10%] animate-in fade-in duration-700"
        />
      </div>

      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(0, 0, 0, 0.2) 1px, transparent 1px)",
          backgroundSize: "3px 3px",
        }}
      />

      <div className="absolute inset-0 z-[2] bg-gradient-to-r from-background/90 via-background/0 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-t from-background/95 via-background/0 to-transparent pointer-events-none" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(circle_at_top_right,rgba(229,9,20,0.22),transparent_30%)] pointer-events-none" />
      <div className="absolute inset-0 z-[2] h-40 bg-gradient-to-b from-background/60 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 h-full w-full">
        <div className="layout-padding absolute inset-x-0 bottom-0 z-20 pb-6">
          <div className="grid w-full grid-cols-[minmax(0,0.92fr)_minmax(0,1.38fr)] items-end gap-5">
            <div className="space-y-5 p-1 pr-2">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.34em] text-primary/90 text-shadow-hero">
                  {activeMovie.originName || "Mới cập nhật"}
                </p>
                <h2 className="max-w-3xl text-3xl font-black leading-[0.94] tracking-tight text-foreground text-shadow-hero md:text-4xl lg:text-5xl">
                  {activeMovie.name}
                </h2>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => navigate(buildWatchUrl(activeMovie.slug))}
                  className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  <Play className="h-4 w-4 fill-current" />
                  Xem ngay
                </button>
                <button
                  onClick={() => navigate(`/movie/${activeMovie.slug}`)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Chi tiết
                </button>
              </div>
            </div>

            <div className="min-w-0">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-20 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => scrollCarousel("left")}
                    aria-label="Cuộn phim sang trái"
                    className="pointer-events-auto -translate-x-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-black/65"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollCarousel("right")}
                    aria-label="Cuộn phim sang phải"
                    className="pointer-events-auto translate-x-5 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-black/65"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <div
                  ref={carouselViewportRef}
                  className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                >
                  {movies.map((movie, index) => (
                    <div
                      key={movie.slug}
                      ref={(el) => {
                        movieCardRefs.current[index] = el;
                      }}
                      onClick={() => setActiveMovieByIndex(index)}
                      className={`group relative flex w-[205px] flex-none cursor-pointer snap-start overflow-hidden rounded-[26px] border transition-all duration-300 md:w-[245px] ${
                        activeIndex === index
                          ? "border-primary/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(255,255,255,0.05))] shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
                          : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.11),rgba(255,255,255,0.05))]"
                      }`}
                    >
                      <div className="relative w-[72px] flex-none overflow-hidden md:w-[84px]">
                        <img
                          src={movie.posterUrl || movie.thumbUrl || ""}
                          alt={movie.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/25" />
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col justify-between p-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary/85">
                            {movie.lang || "Vietsub"}
                          </p>
                          <h3 className="mt-1.5 line-clamp-2 text-xs font-bold leading-4 text-white md:text-sm md:leading-5">
                            {movie.name}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-[11px] text-white/55">
                            {movie.originName ||
                              movie.categories?.slice(0, 2).join(" • ") ||
                              "Đang cập nhật"}
                          </p>
                        </div>

                        <div className="mt-3 space-y-2">
                          <div className="flex flex-wrap gap-1.5 text-[10px] text-white/70">
                            {movie.episodeCurrent ? (
                              <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1">
                                {movie.episodeCurrent}
                              </span>
                            ) : null}
                            {movie.year ? (
                              <span className="rounded-full border border-white/10 bg-black/35 px-2.5 py-1">
                                {movie.year}
                              </span>
                            ) : null}
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-white/8">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                activeIndex === index
                                  ? "w-full bg-primary"
                                  : "w-1/3 bg-white/25"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
