import React from "react";
import PublicLayout from "@/app/layouts/PublicLayouts";
import NotFound from "@/features/public-site/pages/NotFound";
import HomePage from "@/features/public-site/pages/HomePage";
import MovieDetail from "@/features/public-site/pages/MovieDetails";

const publicRouters = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: "/movie/:id",
    element: <MovieDetail />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default publicRouters;
