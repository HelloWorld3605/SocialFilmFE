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

const INITIAL_SIMILAR_MOVIES = 6;
const SIMILAR_MOVIES_STEP = 6;
const SIMILAR_MOVIE_FETCH_LIMIT = 24;
const SIMILAR_CANDIDATE_POOL_SIZE = 30;
const MAX_SIMILAR_MOVIES = 18;
const SIMILAR_DETAIL_SAMPLE_BASE =
  INITIAL_SIMILAR_MOVIES + SIMILAR_MOVIES_STEP;
const CONTENT_STOP_WORDS = new Set([
  "va",
  "voi",
  "cua",
  "cho",
  "khi",
  "nhung",
  "mot",
  "nhieu",
  "nguoi",
  "trong",
  "tren",
  "duoc",
  "khong",
  "phan",
  "the",
  "la",
  "theo",
  "day",
  "nay",
  "kia",
  "roi",
  "sau",
  "anh",
  "co",
  "cung",
  "about",
  "after",
  "before",
  "from",
  "into",
  "over",
  "with",
  "without",
  "their",
  "there",
  "where",
  "when",
  "while",
  "about",
  "this",
  "that",
  "them",
  "they",
  "are",
  "was",
  "were",
  "have",
  "has",
  "into",
]);

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
    limit: String(SIMILAR_MOVIE_FETCH_LIMIT),
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

const normalizeComparableText = (value: string) =>
  value.toLowerCase().replace(/\s+/g, " ").trim();

const extractComparablePeople = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .flatMap((item) =>
            typeof item === "string"
              ? item.split(/[,;/|&]+/)
              : [],
          )
          .map((item) => normalizeComparableText(item))
          .filter(Boolean),
      ),
    );
  }

  if (typeof value === "string") {
    return Array.from(
      new Set(
        value
          .split(/[,;/|&]+/)
          .map((item) => normalizeComparableText(item))
          .filter(Boolean),
      ),
    );
  }

  return [] as string[];
};

const buildContentKeywordSet = (value: unknown) => {
  if (typeof value !== "string") {
    return new Set<string>();
  }

  const normalizedText = stripHtml(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ");
  const keywordSet = new Set<string>();

  normalizedText.split(/\s+/).forEach((token) => {
    const normalizedToken = normalizeComparableText(token);
    if (
      normalizedToken.length < 3 ||
      CONTENT_STOP_WORDS.has(normalizedToken) ||
      keywordSet.size >= 48
    ) {
      return;
    }

    keywordSet.add(normalizedToken);
  });

  return keywordSet;
};

const countSharedValues = (left: Set<string>, right: Set<string>) => {
  if (!left.size || !right.size) {
    return 0;
  }

  const [smaller, larger] =
    left.size <= right.size ? [left, right] : [right, left];
  let matches = 0;

  smaller.forEach((value) => {
    if (larger.has(value)) {
      matches += 1;
    }
  });

  return matches;
};

const MovieDetail = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, isAuthenticated } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [showAllActors, setShowAllActors] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [visibleSimilarCount, setVisibleSimilarCount] = useState(
    INITIAL_SIMILAR_MOVIES,
  );

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
  const actorSignalSet = useMemo(
    () => new Set(extractComparablePeople(rawMovie?.actor)),
    [rawMovie],
  );
  const directorSignalSet = useMemo(
    () => new Set(extractComparablePeople(rawMovie?.director)),
    [rawMovie],
  );
  const contentKeywordSet = useMemo(
    () => buildContentKeywordSet(rawMovie?.content),
    [rawMovie],
  );
  const hasExtendedSimilarSignals =
    actorSignalSet.size > 0 ||
    directorSignalSet.size > 0 ||
    contentKeywordSet.size > 0;

  const visibleActors = useMemo(
    () => (showAllActors ? actors : actors.slice(0, 6)),
    [actors, showAllActors],
  );

  useEffect(() => {
    setShowAllActors(false);
    setVisibleSimilarCount(INITIAL_SIMILAR_MOVIES);
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

  const coarseSimilarEntries = useMemo(() => {
    if (!movie) return [];

    const currentCategories = new Set(
      categories.map((category) => category.toLowerCase()),
    );
    const currentCountries = new Set(
      (movie.countries ?? []).map((country) => country.toLowerCase()),
    );
    const ranked = new Map<
      string,
      {
        item: MovieSummary;
        sourceScore: number;
        score: number;
        sharedCategories: number;
        sharedCountry: boolean;
        sameType: boolean;
        sameLang: boolean;
        matchedSources: Set<string>;
      }
    >();

    const applyCandidate = (
      item: MovieSummary,
      sourceKey: string,
      sourceBoost: number,
    ) => {
      if (item.slug === movie.slug) {
        return;
      }

      const current = ranked.get(item.slug) ?? {
        item,
        sourceScore: 0,
        score: 0,
        sharedCategories: 0,
        sharedCountry: false,
        sameType: false,
        sameLang: false,
        matchedSources: new Set<string>(),
      };
      const sharedCategories = (item.categories ?? []).filter((category) =>
        currentCategories.has(category.toLowerCase()),
      ).length;
      const sharedCountry = (item.countries ?? []).some((country) =>
        currentCountries.has(country.toLowerCase()),
      );

      current.item = item;
      if (!current.matchedSources.has(sourceKey)) {
        current.matchedSources.add(sourceKey);
        current.sourceScore += sourceBoost;
      }

      current.sharedCategories = Math.max(
        current.sharedCategories,
        sharedCategories,
      );
      current.sharedCountry = current.sharedCountry || sharedCountry;
      current.sameType =
        current.sameType || Boolean(movie.type && item.type === movie.type);
      current.sameLang =
        current.sameLang || Boolean(movie.lang && item.lang === movie.lang);
      current.score =
        current.sourceScore +
        current.sharedCategories * 4 +
        (current.sharedCountry ? 2.5 : 0) +
        (current.sameType ? 1.5 : 0) +
        (current.sameLang ? 0.5 : 0);

      ranked.set(item.slug, current);
    };

    relatedCategoryQueries.forEach((query, index) => {
      const sourceBoost = index === 0 ? 5.5 : 4.5 - index * 0.25;
      (query.data?.items ?? []).forEach((item) =>
        applyCandidate(
          item,
          `category:${relatedCategorySlugs[index]}`,
          sourceBoost,
        ),
      );
    });

    (relatedCountryQuery.data?.items ?? []).forEach((item) =>
      applyCandidate(item, `country:${primaryCountrySlug}`, 3.5),
    );

    return Array.from(ranked.values())
      .filter(
        (entry) => entry.sharedCategories > 0 || entry.sharedCountry,
      )
      .sort(
        (left, right) =>
          right.score - left.score ||
          right.matchedSources.size - left.matchedSources.size ||
          Number(right.item.year ?? 0) - Number(left.item.year ?? 0) ||
          left.item.name.localeCompare(right.item.name, "vi"),
      )
      .slice(0, SIMILAR_CANDIDATE_POOL_SIZE);
  }, [
    categories,
    movie,
    primaryCountrySlug,
    relatedCategorySlugs,
    relatedCategoryQueries,
    relatedCountryQuery.data?.items,
  ]);

  const similarDetailSampleSize = Math.min(
    coarseSimilarEntries.length,
    Math.max(SIMILAR_DETAIL_SAMPLE_BASE, visibleSimilarCount),
  );
  const detailedSimilarCandidates = useMemo(
    () => coarseSimilarEntries.slice(0, similarDetailSampleSize),
    [coarseSimilarEntries, similarDetailSampleSize],
  );
  const similarDetailQueries = useQueries({
    queries: detailedSimilarCandidates.map((entry) => ({
      queryKey: ["movie", entry.item.slug],
      queryFn: () => api.movie(entry.item.slug),
      enabled: hasExtendedSimilarSignals && Boolean(entry.item.slug),
      staleTime: 1000 * 60 * 10,
    })),
  });

  const similarMovies = useMemo(() => {
    if (!coarseSimilarEntries.length) {
      return [];
    }

    const detailBySlug = new Map(
      detailedSimilarCandidates.map((entry, index) => [
        entry.item.slug,
        similarDetailQueries[index]?.data,
      ]),
    );

    return coarseSimilarEntries
      .map((entry) => {
        const detailData = detailBySlug.get(entry.item.slug);
        const detailMovie = detailData?.movie ?? entry.item;
        const detailRawMovie = detailData?.raw?.movie as
          | Record<string, unknown>
          | undefined;
        const candidateActorSet = new Set(
          extractComparablePeople(detailRawMovie?.actor),
        );
        const candidateDirectorSet = new Set(
          extractComparablePeople(detailRawMovie?.director),
        );
        const candidateContentSet = buildContentKeywordSet(
          detailRawMovie?.content,
        );
        const sharedActors = countSharedValues(
          actorSignalSet,
          candidateActorSet,
        );
        const sharedDirectors = countSharedValues(
          directorSignalSet,
          candidateDirectorSet,
        );
        const sharedContentKeywords = countSharedValues(
          contentKeywordSet,
          candidateContentSet,
        );
        const contentCoverage =
          sharedContentKeywords > 0 &&
          contentKeywordSet.size > 0 &&
          candidateContentSet.size > 0
            ? sharedContentKeywords /
              Math.sqrt(contentKeywordSet.size * candidateContentSet.size)
            : 0;
        const actorScore = Math.min(sharedActors, 3) * 3;
        const directorScore = Math.min(sharedDirectors, 2) * 4;
        const contentScore =
          Math.min(sharedContentKeywords, 8) * 0.35 +
          (contentCoverage >= 0.22 ? 1.25 : contentCoverage >= 0.14 ? 0.6 : 0);
        const synergyBonus =
          sharedActors > 0 && sharedDirectors > 0
            ? 1.5
            : sharedActors > 0 && sharedContentKeywords > 0
              ? 0.75
              : 0;

        return {
          ...entry,
          item: detailMovie,
          sharedActors,
          sharedDirectors,
          sharedContentKeywords,
          enhancedScore:
            entry.score + actorScore + directorScore + contentScore + synergyBonus,
        };
      })
      .sort(
        (left, right) =>
          right.enhancedScore - left.enhancedScore ||
          right.sharedActors - left.sharedActors ||
          right.sharedDirectors - left.sharedDirectors ||
          right.sharedContentKeywords - left.sharedContentKeywords ||
          right.score - left.score ||
          right.matchedSources.size - left.matchedSources.size ||
          Number(right.item.year ?? 0) - Number(left.item.year ?? 0) ||
          left.item.name.localeCompare(right.item.name, "vi"),
      )
      .map((entry) => entry.item)
      .slice(0, MAX_SIMILAR_MOVIES);
  }, [
    actorSignalSet,
    coarseSimilarEntries,
    contentKeywordSet,
    detailedSimilarCandidates,
    directorSignalSet,
    similarDetailQueries,
  ]);

  const visibleSimilarMovies = useMemo(
    () => similarMovies.slice(0, visibleSimilarCount),
    [similarMovies, visibleSimilarCount],
  );

  const hasMoreSimilarMovies = visibleSimilarCount < similarMovies.length;
  const canCollapseSimilarMovies =
    similarMovies.length > INITIAL_SIMILAR_MOVIES &&
    visibleSimilarCount > INITIAL_SIMILAR_MOVIES;
  const similarMoviesLoading =
    relatedCategoryQueries.some((query) => query.isLoading) ||
    relatedCountryQuery.isLoading;

  const similarMovieSignals = useMemo(() => {
    const signals: string[] = [];

    if (relatedCategorySlugs.length) {
      signals.push(`ưu tiên ${relatedCategorySlugs.length} thể loại gần nhất`);
    }
    if (primaryCountrySlug) {
      signals.push("khớp quốc gia");
    }
    if (actorSignalSet.size) {
      signals.push("khớp diễn viên");
    }
    if (directorSignalSet.size) {
      signals.push("khớp đạo diễn");
    }
    if (contentKeywordSet.size) {
      signals.push("tương đồng nội dung");
    }

    return signals;
  }, [
    actorSignalSet.size,
    contentKeywordSet.size,
    directorSignalSet.size,
    primaryCountrySlug,
    relatedCategorySlugs.length,
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

        {similarMovies.length > 0 || similarMoviesLoading ? (
          <div className="mt-16">
            <div className="mb-6 flex items-center justify-between">
              <div className="space-y-2">
                <h3 className="flex items-center gap-2 text-2xl font-bold tracking-wide text-foreground">
                  <Film className="h-5 w-5 text-primary" /> Phim tương tự
                </h3>
                {similarMovieSignals.length ? (
                  <p className="text-sm text-muted-foreground">
                    Gợi ý dựa trên {similarMovieSignals.join(", ")}.
                  </p>
                ) : null}
              </div>
              {similarMovies.length ? (
                <span className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {similarMovies.length} đề xuất
                </span>
              ) : null}
            </div>
            {visibleSimilarMovies.length ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {visibleSimilarMovies.map((item, index) => (
                    <MovieCard key={item.slug} movie={item} index={index} />
                  ))}
                </div>
                {hasMoreSimilarMovies || canCollapseSimilarMovies ? (
                  <div className="mt-8 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleSimilarCount((current) =>
                          hasMoreSimilarMovies
                            ? Math.min(
                                current + SIMILAR_MOVIES_STEP,
                                similarMovies.length,
                              )
                            : INITIAL_SIMILAR_MOVIES,
                        )
                      }
                      className="rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      {hasMoreSimilarMovies
                        ? `Xem thêm (+${Math.min(SIMILAR_MOVIES_STEP, similarMovies.length - visibleSimilarCount)})`
                        : "Thu gọn"}
                    </button>
                  </div>
                ) : null}
              </>
            ) : similarMoviesLoading ? (
              <div className="rounded-3xl border border-border bg-secondary/20 px-5 py-6 text-sm text-muted-foreground">
                Đang tối ưu danh sách gợi ý phù hợp cho phim này...
              </div>
            ) : null}
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
