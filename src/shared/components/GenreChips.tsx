import { useEffect, useState } from "react";

interface GenreChipsProps {
  genres?: string[];
}

const GenreChips = ({ genres = [] }: GenreChipsProps) => {
  const [active, setActive] = useState<string | null>(genres[0] ?? null);

  useEffect(() => {
    setActive(genres[0] ?? null);
  }, [genres]);

  if (!genres.length) {
    return null;
  }

  return (
    <div className="scrollbar-hide flex items-center gap-3 overflow-x-auto layout-padding py-4">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => setActive(genre)}
          className={`flex-shrink-0 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
            active === genre
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          {genre}
        </button>
      ))}
    </div>
  );
};

export default GenreChips;
