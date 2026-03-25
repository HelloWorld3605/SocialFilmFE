import { useState } from "react";
import { genres } from "@/shared/data/movies";

const GenreChips = () => {
  const [active, setActive] = useState<string | null>("Action");

  return (
    <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide layout-padding py-4">
      {genres.map((genre) => (
        <button
          key={genre}
          onClick={() => setActive(genre)}
          className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-colors ${
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
