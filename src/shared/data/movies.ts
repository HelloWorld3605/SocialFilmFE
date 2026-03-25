import poster1 from "@/assets/poster-1.jpg";
import poster2 from "@/assets/poster-2.jpg";
import poster3 from "@/assets/poster-3.jpg";
import poster4 from "@/assets/poster-4.jpg";
import poster5 from "@/assets/poster-5.jpg";
import poster6 from "@/assets/poster-6.jpg";
import poster7 from "@/assets/poster-7.jpg";
import poster8 from "@/assets/poster-8.jpg";
import poster9 from "@/assets/poster-9.jpg";
import poster10 from "@/assets/poster-10.jpg";
import poster11 from "@/assets/poster-11.jpg";
import poster12 from "@/assets/poster-12.jpg";

export interface Movie {
  id: number;
  title: string;
  year: number;
  rating: number;
  poster: string;
  genre: string[];
}

export const movies: Movie[] = [
  {
    id: 1,
    title: "Shadow Agent",
    year: 2024,
    rating: 5.0,
    poster: poster1,
    genre: ["Action", "Fiction"],
  },
  {
    id: 2,
    title: "Titan Rising",
    year: 2023,
    rating: 4.8,
    poster: poster2,
    genre: ["Action", "Adventure"],
  },
  {
    id: 3,
    title: "Speed Circuit",
    year: 2023,
    rating: 4.0,
    poster: poster3,
    genre: ["Action", "Adventure"],
  },
  {
    id: 4,
    title: "Iron Colossus",
    year: 2023,
    rating: 4.8,
    poster: poster4,
    genre: ["Action", "Fiction"],
  },
  {
    id: 5,
    title: "Jungle Ops",
    year: 2023,
    rating: 4.0,
    poster: poster5,
    genre: ["Action", "Adventure"],
  },
  {
    id: 6,
    title: "Time Breach",
    year: 2021,
    rating: 4.0,
    poster: poster6,
    genre: ["Fiction", "Adventure"],
  },
  {
    id: 7,
    title: "Crimson Guardian",
    year: 2015,
    rating: 4.1,
    poster: poster7,
    genre: ["Heroes", "Action"],
  },
  {
    id: 8,
    title: "Lightning Strike",
    year: 2014,
    rating: 4.5,
    poster: poster8,
    genre: ["Heroes", "Action"],
  },
  {
    id: 9,
    title: "Emerald Arrow",
    year: 2012,
    rating: 4.7,
    poster: poster9,
    genre: ["Heroes", "Action"],
  },
  {
    id: 10,
    title: "Dark Squad",
    year: 2019,
    rating: 4.8,
    poster: poster10,
    genre: ["Heroes", "Action"],
  },
  {
    id: 11,
    title: "Fist of Fury",
    year: 2018,
    rating: 5.0,
    poster: poster11,
    genre: ["Action", "Comedy"],
  },
  {
    id: 12,
    title: "The Fallen",
    year: 2023,
    rating: 4.5,
    poster: poster12,
    genre: ["Fiction", "Heroes"],
  },
];

export const genres = [
  "Action",
  "Adventure",
  "Animation",
  "Fiction",
  "Heroes",
  "Comedy",
];

export const popularMovies = movies.slice(0, 12);
export const trendingMovies = [...movies]
  .sort((a, b) => b.year - a.year)
  .slice(0, 12);
export const topRatedMovies = [...movies]
  .sort((a, b) => b.rating - a.rating)
  .slice(0, 12);
export const actionMovies = movies
  .filter((m) => m.genre.includes("Action"))
  .slice(0, 12);
export const sciFiMovies = movies
  .filter((m) => m.genre.includes("Fiction"))
  .slice(0, 12);
export const dramaMovies = movies.slice(4, 11); // Fallback for drama
export const seriesMovies = movies.slice(6, 12);
