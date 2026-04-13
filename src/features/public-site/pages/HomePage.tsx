import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/shared/components/Banner/HeroSection";
import ContinueWatchingRow from "@/shared/components/Row/ContinueWatchingRow";
import MovieRow from "@/shared/components/Row/MovieRow";
import EditorialPick from "@/shared/components/EditorialPick";
import MovieCardSkeleton from "@/shared/components/CardFilm/MovieCardSkeleton";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";
import {
  buildCatalogHref,
  CATALOG_LATEST_SOURCE,
  CATALOG_LATEST_VERSION,
} from "@/shared/lib/catalog";
import type { MovieSummary } from "@/shared/types/api";

const HomeRowSkeleton = ({ title }: { title: string }) => (
  <section className="relative pb-6 pt-8">
    <div className="layout-padding mb-6 space-y-3">
      <div className="text-2xl font-bold uppercase tracking-wider text-foreground sm:text-3xl">
        {title}
      </div>
      <Skeleton className="h-4 w-64" />
    </div>

    <div className="layout-padding flex gap-3 overflow-hidden pb-3 pt-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <MovieCardSkeleton key={`${title}-skeleton-${index}`} />
      ))}
    </div>
  </section>
);

const EditorialPickSkeleton = () => (
  <section className="layout-margin my-10 overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.03] p-6 md:p-8">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
      <div className="space-y-5">
        <Skeleton className="h-8 w-40 rounded-full" />
        <div className="space-y-3">
          <Skeleton className="h-11 w-4/5" />
          <Skeleton className="h-5 w-2/5" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-4/6" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={`editorial-meta-${index}`}
              className="h-24 w-full rounded-[24px]"
            />
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-12 w-32 rounded-2xl" />
          <Skeleton className="h-12 w-28 rounded-2xl" />
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[30px]">
        <Skeleton className="h-[380px] w-full" />
        <div className="absolute right-5 top-5 hidden lg:block">
          <Skeleton className="h-64 w-44 rounded-[24px]" />
        </div>
      </div>
    </div>
  </section>
);

const mergeUniqueMovies = (...groups: Array<MovieSummary[] | undefined>) => {
  const seen = new Set<string>();
  const merged: MovieSummary[] = [];

  groups.forEach((group) => {
    group?.forEach((movie) => {
      if (!movie.slug || seen.has(movie.slug)) {
        return;
      }

      seen.add(movie.slug);
      merged.push(movie);
    });
  });

  return merged;
};

const HomePage = () => {
  const { token } = useAuth();
  const { data, isLoading, error } = useQuery({
    queryKey: ["home"],
    queryFn: api.home,
  });
  const historyQuery = useQuery({
    queryKey: ["history", token],
    queryFn: () => api.history(token as string),
    enabled: Boolean(token),
    staleTime: 0,
    refetchOnMount: "always",
  });
  const isInitialLoading = isLoading && !data;
  const hasErrorWithoutData = Boolean(error && !data);
  const continueWatchingItems = (historyQuery.data ?? []).slice(0, 8);
  const topTenMovies = useMemo(
    () =>
      mergeUniqueMovies(
        data?.latest,
        data?.series,
        data?.single,
        data?.tvShows,
        data?.animation,
      ).slice(0, 10),
    [data],
  );
  const editorialMovie = useMemo(() => {
    const topSlug = topTenMovies[0]?.slug;

    return (
      mergeUniqueMovies(
        data?.single,
        data?.series,
        data?.animation,
        data?.tvShows,
        data?.latest,
      ).find((movie) => movie.slug !== topSlug) ??
      topTenMovies[1] ??
      null
    );
  }, [data, topTenMovies]);

  const latestCatalogHref = buildCatalogHref(
    {
      source: CATALOG_LATEST_SOURCE,
      version: CATALOG_LATEST_VERSION,
    },
    { includeDefaults: false },
  );
  const browseCatalogHref = buildCatalogHref({}, { includeDefaults: false });
  const seriesCatalogHref = buildCatalogHref(
    { type: "phim-bo" },
    { includeDefaults: false },
  );
  const singleCatalogHref = buildCatalogHref(
    { type: "phim-le" },
    { includeDefaults: false },
  );
  const animationCatalogHref = buildCatalogHref(
    { type: "hoat-hinh" },
    { includeDefaults: false },
  );
  const tvCatalogHref = buildCatalogHref(
    { type: "tv-shows" },
    { includeDefaults: false },
  );

  return (
    <div className="bg-background">
      <HeroSection movies={data?.latest ?? []} />
      <div className="relative z-10 space-y-8 pb-16 pt-4">
        {error && data ? (
          <div className="layout-padding text-sm text-red-400">
            Không thể làm mới toàn bộ dữ liệu trang chủ. Đang hiển thị dữ liệu
            gần nhất.
          </div>
        ) : null}

        {hasErrorWithoutData ? (
          <div className="layout-padding text-red-400">
            {(error as Error).message || "Không thể tải trang chủ."}
          </div>
        ) : null}

        {isInitialLoading ? (
          <>
            {token ? <ContinueWatchingRow items={[]} isLoading /> : null}
            <HomeRowSkeleton title="Top 10 hôm nay" />
            <HomeRowSkeleton title="Mới cập nhật" />
            <EditorialPickSkeleton />
            <HomeRowSkeleton title="Phim bộ" />
            <HomeRowSkeleton title="Phim lẻ" />
            <HomeRowSkeleton title="Hoạt hình" />
            <HomeRowSkeleton title="Chương trình TV" />
          </>
        ) : (
          <>
            {token ? (
              <ContinueWatchingRow
                items={continueWatchingItems}
                isLoading={historyQuery.isLoading && !historyQuery.data}
              />
            ) : null}

            <MovieRow
              title="Top 10 hôm nay"
              subtitle="10 lựa chọn nổi bật được ưu tiên trên trang chủ hôm nay, gom từ các kho phim đang được cập nhật mạnh nhất."
              movies={topTenMovies}
              variant="rank"
              viewAllHref={browseCatalogHref}
            />

            <MovieRow
              title="Mới cập nhật"
              subtitle="Những phim vừa được đẩy lên feed mới nhất để bạn mở ngay khi cần một lựa chọn nhanh."
              movies={data?.latest ?? []}
              viewAllHref={latestCatalogHref}
            />

            <EditorialPick movie={editorialMovie} />

            <MovieRow
              title="Phim bộ"
              subtitle="Các series nổi bật để theo dõi dài hơi với nhịp xem liên tục theo từng tập."
              movies={data?.series ?? []}
              viewAllHref={seriesCatalogHref}
            />

            <MovieRow
              title="Phim lẻ"
              subtitle="Những phim xem trọn vẹn trong một lần, phù hợp khi bạn muốn vào phim nhanh và gọn."
              movies={data?.single ?? []}
              viewAllHref={singleCatalogHref}
            />

            <MovieRow
              title="Hoạt hình"
              subtitle="Kho hoạt hình từ nhiều phong cách kể chuyện, phù hợp cả xem giải trí lẫn binge-watch."
              movies={data?.animation ?? []}
              viewAllHref={animationCatalogHref}
            />

            <MovieRow
              title="Chương trình TV"
              subtitle="Talk show, reality và các format giải trí nhiều tập để đổi nhịp sau các hàng phim truyện."
              movies={data?.tvShows ?? []}
              viewAllHref={tvCatalogHref}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
