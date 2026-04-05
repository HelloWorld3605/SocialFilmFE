import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/shared/components/Banner/HeroSection";
import ContinueWatchingRow from "@/shared/components/Row/ContinueWatchingRow";
import MovieRow from "@/shared/components/Row/MovieRow";
import FeaturedCard from "@/shared/components/FeaturedCard";
import MovieCardSkeleton from "@/shared/components/CardFilm/MovieCardSkeleton";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useAuth } from "@/shared/auth/AuthContext";
import { api } from "@/shared/lib/api";

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

const FeaturedCardSkeleton = () => (
  <section className="layout-margin relative my-10 overflow-hidden rounded-xl">
    <Skeleton className="h-[420px] w-full md:h-[500px] lg:h-[560px]" />
    <div className="absolute bottom-0 left-0 right-0 space-y-4 p-6 md:p-10">
      <div className="flex gap-2">
        <Skeleton className="h-6 w-12 rounded" />
        <Skeleton className="h-6 w-14 rounded" />
        <Skeleton className="h-6 w-24 rounded" />
      </div>
      <Skeleton className="h-9 w-72 max-w-[80%]" />
      <Skeleton className="h-4 w-80 max-w-[90%]" />
      <Skeleton className="h-4 w-64 max-w-[75%]" />
      <div className="flex gap-3 pt-2">
        <Skeleton className="h-11 w-32 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
    </div>
  </section>
);

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
            <HomeRowSkeleton title="Xu hướng" />
            <HomeRowSkeleton title="Phim bộ" />
            <HomeRowSkeleton title="Phim lẻ" />
            <HomeRowSkeleton title="Hoạt hình" />
            <HomeRowSkeleton title="Chương trình TV" />
            <FeaturedCardSkeleton />
          </>
        ) : (
          <>
            {token ? (
              <ContinueWatchingRow
                items={continueWatchingItems}
                isLoading={historyQuery.isLoading && !historyQuery.data}
              />
            ) : null}
            <MovieRow title="Xu hướng" movies={data?.latest ?? []} />
            <MovieRow title="Phim bộ" movies={data?.series ?? []} />
            <MovieRow title="Phim lẻ" movies={data?.single ?? []} />
            <MovieRow title="Hoạt hình" movies={data?.animation ?? []} />
            <MovieRow title="Chương trình TV" movies={data?.tvShows ?? []} />
            <FeaturedCard
              movie={data?.latest?.[1] ?? data?.series?.[0] ?? null}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
