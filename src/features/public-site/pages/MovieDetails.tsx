import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Play, Heart, Plus, Star, Clock, Film, Share2 } from "lucide-react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/shared/lib/api";
import { useAuth } from "@/shared/auth/AuthContext";
import MovieCard from "@/shared/components/CardFilm/MovieCard";
import PageNavigation from "@/shared/components/PageNavigation";
import ShareMovieDialog from "@/shared/components/ShareMovieDialog";
import { buildWatchUrl } from "@/shared/lib/watch";
import type { MovieSummary } from "@/shared/types/api";

const stripHtml = (value: unknown) =>
  typeof value === "string" ? value.replace(/<[^>]+>/g, "").trim() : "";

const extractTaxonomyEntries = (value: unknown) => {
  if (!Array.isArray(value)) {
    return [] as Array<{ name: string; slug: string | null }>;
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        const name = item.trim();
        return name ? { name, slug: null } : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const entry = item as Record<string, unknown>;
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      const slug = typeof entry.slug === "string" ? entry.slug.trim() : null;

      if (!name && !slug) {
        return null;
      }

      return {
        name: name || slug || "",
        slug: slug || null,
      };
    })
    .filter((item): item is { name: string; slug: string | null } =>
      Boolean(item),
    );
};

const buildRelatedParams = (
  extra: Record<string, string | number | null | undefined> = {},
) => {
  const params = new URLSearchParams({
    page: "1",
    limit: "18",
    sort_field: "modified.time",
    sort_type: "desc",
  });

  Object.entries(extra).forEach(([key, value]) => {
    if (value !== null && value !== undefined && `${value}`.trim()) {
      params.set(key, String(value));
    }
  });

  return params;
};

const MovieDetail = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showAllActors, setShowAllActors] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const movieQuery = useQuery({
    queryKey: ["movie", slug],
    queryFn: () => api.movie(slug),
    enabled: Boolean(slug),
  });

  const wishlistQuery = useQuery({
    queryKey: ["wishlist-state", slug, token],
    queryFn: () => api.wishlistState(token as string, slug),
    enabled: Boolean(token && slug),
  });

  const movie = movieQuery.data?.movie;
  const rawMovie = movieQuery.data?.raw?.movie as
    | Record<string, any>
    | undefined;
  const episodes = movieQuery.data?.episodes ?? [];

  const goToEpisodes = () => {
    document
      .getElementById("episodes")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const goToWatchPage = (serverIndex = 0, episodeIndex = 0) => {
    if (!movie) {
      return;
    }
    navigate(buildWatchUrl(movie.slug, serverIndex, episodeIndex));
  };

  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!token || !movie) {
        throw new Error("Bạn cần đăng nhập để dùng danh sách xem sau.");
      }

      if (wishlistQuery.data?.wished) {
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
      queryClient.invalidateQueries({
        queryKey: ["wishlist-state", slug, token],
      });
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    },
  });

  const actors = useMemo(() => {
    const source = rawMovie?.actor;
    if (Array.isArray(source)) return source;
    if (typeof source === "string") {
      return source
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
    return [];
  }, [rawMovie]);

  const visibleActors = useMemo(
    () => (showAllActors ? actors : actors.slice(0, 6)),
    [actors, showAllActors],
  );

  useEffect(() => {
    setShowAllActors(false);
  }, [slug]);

  const directors = useMemo(() => {
    const source = rawMovie?.director;
    if (Array.isArray(source)) return source.join(", ");
    if (typeof source === "string") return source;
    return null;
  }, [rawMovie]);

  const categoryEntries = useMemo(
    () => extractTaxonomyEntries(rawMovie?.category),
    [rawMovie],
  );

  const countryEntries = useMemo(
    () => extractTaxonomyEntries(rawMovie?.country),
    [rawMovie],
  );

  const relatedCategorySlugs = useMemo(
    () =>
      Array.from(
        new Set(
          categoryEntries
            .map((entry) => entry.slug)
            .filter((value): value is string => Boolean(value)),
        ),
      ).slice(0, 3),
    [categoryEntries],
  );

  const primaryCountrySlug =
    countryEntries.find((entry) => entry.slug)?.slug ?? null;

  const releaseYear = useMemo(() => {
    const rawYear = rawMovie?.year ?? movie?.year;
    const parsedYear = Number(rawYear);
    return Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null;
  }, [movie?.year, rawMovie]);

  const countries = movie?.countries?.join(", ") || "Đang cập nhật";
  const categories = movie?.categories ?? [];

  const relatedCategoryQueries = useQueries({
    queries: relatedCategorySlugs.map((categorySlug) => ({
      queryKey: ["related-category", categorySlug],
      queryFn: () => api.categoryDetail(categorySlug, buildRelatedParams()),
      enabled: Boolean(categorySlug),
      staleTime: 1000 * 60 * 5,
    })),
  });

  const relatedCountryQuery = useQuery({
    queryKey: ["related-country", primaryCountrySlug, relatedCategorySlugs[0]],
    queryFn: () =>
      api.countryDetail(
        primaryCountrySlug as string,
        buildRelatedParams({ category: relatedCategorySlugs[0] ?? undefined }),
      ),
    enabled: Boolean(primaryCountrySlug),
    staleTime: 1000 * 60 * 5,
  });

  const similarMovies = useMemo(() => {
    if (!movie) return [];

    const currentCategories = new Set(
      categories.map((category) => category.toLowerCase()),
    );
    const currentCountries = new Set(
      (movie.countries ?? []).map((country) => country.toLowerCase()),
    );
    const ranked = new Map<string, { item: MovieSummary; score: number }>();

    const applyCandidate = (item: MovieSummary, sourceBoost: number) => {
      if (item.slug === movie.slug) {
        return;
      }

      const current = ranked.get(item.slug) ?? { item, score: 0 };
      const sharedCategories = (item.categories ?? []).filter((category) =>
        currentCategories.has(category.toLowerCase()),
      ).length;
      const sharedCountry = (item.countries ?? []).some((country) =>
        currentCountries.has(country.toLowerCase()),
      );

      current.item = item;
      current.score += sourceBoost;
      current.score += sharedCategories * 3;

      if (sharedCountry) {
        current.score += 2;
      }

      if (releaseYear && item.year === releaseYear) {
        current.score += 1.5;
      }

      if (movie.type && item.type === movie.type) {
        current.score += 1;
      }

      if (movie.lang && item.lang === movie.lang) {
        current.score += 0.5;
      }

      ranked.set(item.slug, current);
    };

    relatedCategoryQueries.forEach((query, index) => {
      const sourceBoost = index === 0 ? 5 : 4;
      (query.data?.items ?? []).forEach((item) =>
        applyCandidate(item, sourceBoost),
      );
    });

    (relatedCountryQuery.data?.items ?? []).forEach((item) =>
      applyCandidate(item, 3),
    );

    return Array.from(ranked.values())
      .sort(
        (left, right) =>
          right.score - left.score ||
          Number(right.item.year ?? 0) - Number(left.item.year ?? 0) ||
          left.item.name.localeCompare(right.item.name, "vi"),
      )
      .map((entry) => entry.item)
      .slice(0, 6);
  }, [
    categories,
    movie,
    releaseYear,
    relatedCategoryQueries,
    relatedCountryQuery.data?.items,
  ]);

  if (movieQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Đang tải phim.</p>
      </div>
    );
  }

  if (movieQuery.error || !movie) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Không tìm thấy phim.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="relative h-[80vh] w-full overflow-hidden">
        <img
          src={movie.thumbUrl || movie.posterUrl || ""}
          alt={movie.name}
          className="h-full w-full object-cover object-[center_15%]"
          onError={() => setImageError(true)}
        />
        {imageError ? <div className="absolute inset-0 bg-secondary" /> : null}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />

        <button
          onClick={() => goToWatchPage()}
          className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary/80 bg-primary/20 text-primary backdrop-blur-sm transition-all hover:scale-110 hover:bg-primary/40"
        >
          <Play className="h-8 w-8 fill-current" />
        </button>

        <div className="absolute bottom-8 left-0 right-0 px-4 sm:px-6 lg:px-8">
          <div className="content-shell">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-wider text-foreground sm:text-5xl lg:text-6xl"
            >
              {movie.name} ({movie.year || "Chưa rõ"})
            </motion.h1>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5 rounded-md bg-primary/20 px-3 py-1.5 text-sm font-semibold text-primary">
                <Star className="h-4 w-4 fill-current" />{" "}
                {movie.quality || "HD"}
              </span>
              <button
                onClick={() => isAuthenticated && wishlistMutation.mutate()}
                className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
              >
                <Heart className="h-4 w-4" />
                {wishlistQuery.data?.wished ? "Đã lưu" : "Xem sau"}
              </button>
              <button
                onClick={goToEpisodes}
                className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
              >
                <Plus className="h-4 w-4" /> Danh sách tập
              </button>
              <button
                onClick={() => setShareDialogOpen(true)}
                className="flex items-center gap-1.5 rounded-md border border-border bg-secondary/50 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
              >
                <Share2 className="h-4 w-4" /> Chia sẻ
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-shell px-4 py-10 sm:px-6 lg:px-8">
        <PageNavigation
          backTo="/"
          backLabel="Trang chủ"
          items={[{ label: "Trang chủ", to: "/" }, { label: movie.name }]}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center gap-4 lg:items-start"
          >
            <div className="relative w-full max-w-[280px] overflow-hidden rounded-xl border border-border shadow-2xl">
              <img
                src={movie.posterUrl || movie.thumbUrl || ""}
                alt={movie.name}
                className="w-full object-cover"
              />
            </div>
            <div className="flex w-full max-w-[280px] flex-col gap-2">
              <button
                onClick={() => isAuthenticated && wishlistMutation.mutate()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Heart className="h-4 w-4" />
                {wishlistQuery.data?.wished
                  ? "Bỏ khỏi danh sách xem sau"
                  : "Xem sau"}
              </button>
              <button
                onClick={goToEpisodes}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Plus className="h-4 w-4" /> Danh sách tập
              </button>
              <button
                onClick={() => setShareDialogOpen(true)}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-secondary py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <Share2 className="h-4 w-4" /> Chia sẻ phim
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-bold tracking-wide text-foreground">
                {movie.name}{" "}
                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-primary/20 px-2 py-0.5 align-middle text-sm font-semibold text-primary">
                  <Star className="h-3.5 w-3.5 fill-current" />{" "}
                  {movie.quality || "HD"}
                </span>
              </h2>
              <p className="mt-2 text-muted-foreground">
                {stripHtml(rawMovie?.content) || "Đang cập nhật nội dung."}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />{" "}
                  {String(rawMovie?.time || "Chưa rõ")}
                </span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                {categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full border border-border px-3 py-0.5 text-xs font-medium text-foreground"
                  >
                    {category}
                  </span>
                ))}
                <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                <span>{movie.year || "Chưa rõ"}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-xl font-bold tracking-wide text-foreground">
                  Chi tiết
                </h3>
                <div className="space-y-2 text-sm">
                  {directors ? (
                    <div className="flex gap-2">
                      <span className="min-w-[100px] font-medium text-muted-foreground">
                        Đạo diễn:
                      </span>
                      <span className="text-foreground">{directors}</span>
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <span className="min-w-[100px] font-medium text-muted-foreground">
                      Quốc gia:
                    </span>
                    <span className="text-foreground">{countries}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="min-w-[100px] font-medium text-muted-foreground">
                      Ngôn ngữ:
                    </span>
                    <span className="text-foreground">
                      {movie.lang || "Vietsub"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="min-w-[100px] font-medium text-muted-foreground">
                      Trạng thái:
                    </span>
                    <span className="text-foreground">
                      {movie.episodeCurrent ||
                        rawMovie?.status ||
                        "Đang cập nhật"}
                    </span>
                  </div>
                </div>
              </div>

              {actors.length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-xl font-bold tracking-wide text-foreground">
                      Diễn viên
                    </h3>
                    {actors.length > 6 ? (
                      <button
                        type="button"
                        onClick={() => setShowAllActors((current) => !current)}
                        className="text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                      >
                        {showAllActors
                          ? "Thu gọn"
                          : `Xem thêm (${actors.length - 6})`}
                      </button>
                    ) : null}
                  </div>
                  <div className="space-y-3">
                    {visibleActors.map((actor: string) => (
                      <div key={actor} className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold text-foreground">
                          {actor.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {actor}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            {episodes.length ? (
              <div id="episodes" className="space-y-3">
                <h3 className="text-xl font-bold tracking-wide text-foreground">
                  Danh sách tập
                </h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {episodes.flatMap(
                    (server, serverIndex) =>
                      server.server_data?.map((episode, index) => (
                        <button
                          key={`${server.server_name}-${episode.slug}-${index}`}
                          type="button"
                          onClick={() => goToWatchPage(serverIndex, index)}
                          className="rounded-xl border border-border bg-secondary/40 p-4 transition-colors hover:bg-secondary"
                        >
                          <p className="font-semibold text-foreground">
                            {episode.name || `Tập ${index + 1}`}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {server.server_name || "Nguồn phát"}
                          </p>
                        </button>
                      )) || [],
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        </div>

        {similarMovies.length > 0 ? (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
                <Film className="h-5 w-5 text-primary" /> Phim tương tự
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {similarMovies.map((item, index) => (
                <div
                  key={item.slug}
                  onClick={() => navigate(`/movie/${item.slug}`)}
                  className="cursor-pointer"
                >
                  <MovieCard movie={item} index={index} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <ShareMovieDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        movie={{
          name: movie.name,
          originName: movie.originName,
          slug: movie.slug,
          posterUrl: movie.posterUrl,
          thumbUrl: movie.thumbUrl,
        }}
      />
    </div>
  );
};

export default MovieDetail;
