import HeroSection from "@/shared/components/Banner/HeroSection";
import MovieRow from "@/shared/components/Row/MovieRow";
import CategoryTabs from "@/shared/components/CategoryTabs";
import GenreChips from "@/shared/components/GenreChips";
import FeaturedCard from "@/shared/components/FeaturedCard";
import {
  trendingMovies,
  topRatedMovies,
  actionMovies,
  sciFiMovies,
  dramaMovies,
} from "@/shared/data/movies";

const HomePage = () => {
  return (
    <div className="bg-background">
      <HeroSection />
      <div className="relative z-10 space-y-12 pb-16 pt-4">
        <div className="bg-background">
          <CategoryTabs />
          <GenreChips />
        </div>
        <MovieRow title="Xu hướng" movies={trendingMovies} />
        <MovieRow title="Đánh giá cao" movies={topRatedMovies} />
        <MovieRow title="Hành động" movies={actionMovies} />
        <MovieRow title="Khoa học viễn tưởng" movies={sciFiMovies} />
        <MovieRow title="Chính kịch" movies={dramaMovies} />
        <FeaturedCard />
      </div>
    </div>
  );
};

export default HomePage;
