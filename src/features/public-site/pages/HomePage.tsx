import { useQuery } from "@tanstack/react-query";
import HeroSection from "@/shared/components/Banner/HeroSection";
import MovieRow from "@/shared/components/Row/MovieRow";
import FeaturedCard from "@/shared/components/FeaturedCard";
import { api } from "@/shared/lib/api";

const HomePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["home"],
    queryFn: api.home,
  });

  return (
    <div className="bg-background">
      <HeroSection movies={data?.latest ?? []} />
      <div className="relative z-10 space-y-12 pb-16 pt-4">
        {isLoading ? (
          <div className="layout-padding text-muted-foreground">
            Đang tải dữ liệu phim...
          </div>
        ) : null}

        {error ? (
          <div className="layout-padding text-red-400">
            {(error as Error).message || "Không thể tải trang chủ."}
          </div>
        ) : null}

        <MovieRow title="Xu hướng" movies={data?.latest ?? []} />
        <MovieRow title="Phim bộ" movies={data?.series ?? []} />
        <MovieRow title="Phim lẻ" movies={data?.single ?? []} />
        <MovieRow title="Hoạt hình" movies={data?.animation ?? []} />
        <MovieRow title="Chương trình TV" movies={data?.tvShows ?? []} />
        <FeaturedCard movie={data?.latest?.[1] ?? data?.series?.[0] ?? null} />
      </div>
    </div>
  );
};

export default HomePage;
