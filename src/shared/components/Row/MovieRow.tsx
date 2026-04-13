import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import MovieCard from "../CardFilm/MovieCard";
import type { MovieSummary } from "@/shared/types/api";
import { cn } from "@/shared/utils/utils";

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: MovieSummary[];
  viewAllHref?: string;
  viewAllLabel?: string;
  variant?: "default" | "rank";
}

const MovieRow = ({
  title,
  subtitle,
  movies,
  viewAllHref,
  viewAllLabel = "Xem tất cả",
  variant = "default",
}: MovieRowProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateScrollState = () => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    setCanScrollPrev(node.scrollLeft > 4);
    setCanScrollNext(node.scrollLeft + node.clientWidth < node.scrollWidth - 4);
  };

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) {
      return;
    }

    updateScrollState();
    node.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      node.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [movies.length]);

  if (!movies.length) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) {
      return;
    }

    const viewportWidth = scrollRef.current.clientWidth;
    const amount = Math.max(viewportWidth * 0.82, variant === "rank" ? 340 : 280);
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="relative pb-7 pt-9">
      <div className="layout-padding mb-6 flex items-end justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-black uppercase tracking-[0.16em] text-foreground sm:text-3xl">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>

        {viewAllHref ? (
          <Link
            to={viewAllHref}
            className="group hidden shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:border-primary/35 hover:bg-primary/10 md:inline-flex"
          >
            <span>{viewAllLabel}</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        ) : null}
      </div>

      <div className="group/row relative">
        <button
          type="button"
          disabled={!canScrollPrev}
          onClick={() => scroll("left")}
          className={cn(
            "absolute left-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-r from-background/90 via-background/55 to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100",
            !canScrollPrev && "pointer-events-none opacity-0",
          )}
          aria-label={`Cuộn ${title} sang trái`}
        >
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <button
          type="button"
          disabled={!canScrollNext}
          onClick={() => scroll("right")}
          className={cn(
            "absolute right-0 top-0 z-10 hidden h-full w-12 items-center justify-center bg-gradient-to-l from-background/90 via-background/55 to-transparent opacity-0 transition-opacity group-hover/row:flex group-hover/row:opacity-100",
            !canScrollNext && "pointer-events-none opacity-0",
          )}
          aria-label={`Cuộn ${title} sang phải`}
        >
          <ChevronRight className="h-6 w-6 text-foreground" />
        </button>

        <div
          ref={scrollRef}
          className="scrollbar-hide flex snap-x snap-mandatory gap-4 overflow-x-auto layout-padding pb-3 pt-2"
        >
          {movies.map((movie, index) =>
            variant === "rank" ? (
              <article
                key={movie.slug}
                className="flex min-w-[250px] snap-start items-end gap-3 pr-2 sm:min-w-[320px]"
              >
                <div className="pointer-events-none select-none pb-3">
                  <span className="text-[4.25rem] font-black leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.26)] sm:text-[5rem]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>
                <MovieCard
                  movie={movie}
                  index={index}
                  className="min-w-[170px] sm:min-w-[205px]"
                />
              </article>
            ) : (
              <div key={movie.slug} className="snap-start">
                <MovieCard movie={movie} index={index} />
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
};

export default MovieRow;
