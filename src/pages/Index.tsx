import { Header } from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import CategoryTabs from "@/components/CategoryTabs";
import GenreChips from "@/components/GenreChips";
import MovieRow from "@/components/MovieRow";
import FeaturedCard from "@/components/FeaturedCard";
import Footer from "@/components/Footer";
import { trendingMovies, seriesMovies, movies } from "@/data/movies";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-4 md:px-8 py-8 space-y-12">
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
      </main>

      <Footer />
    </div>
  );
};

export default Index;
