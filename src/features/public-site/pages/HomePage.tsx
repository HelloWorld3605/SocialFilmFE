import CategoryTabs from "@/shared/components/CategoryTabs";
import GenreChips from "@/shared/components/GenreChips";
import MovieRow from "@/shared/components/Row/MovieRow";
import FeaturedCard from "@/shared/components/FeaturedCard";
import { trendingMovies, seriesMovies, movies } from "@/shared/data/movies";

const HomePage = () => {
  return (
    <>
      <CategoryTabs />
      <GenreChips />
      <MovieRow movies={trendingMovies} />
      <MovieRow movies={seriesMovies} />
      <MovieRow movies={[...movies].reverse().slice(0, 6)} />
      <FeaturedCard />
      <MovieRow movies={movies.slice(0, 6)} />

      <div className="flex justify-center py-6">
        <button className="flex items-center gap-2 px-8 py-3 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
          Show More
        </button>
      </div>
    </>
  );
};

export default HomePage;
