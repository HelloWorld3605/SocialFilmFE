import React from "react";
import PublicLayout from "@/app/layouts/PublicLayouts";
import NotFound from "@/features/public-site/pages/NotFound";
import HomePage from "@/features/public-site/pages/HomePage";
import MovieDetail from "@/features/public-site/pages/MovieDetails";
import WatchPage from "@/features/public-site/pages/WatchPage";
import CatalogPage from "@/features/public-site/pages/CatalogPage";
import WishlistPage from "@/features/public-site/pages/WishlistPage";
import AuthPage from "@/features/public-site/pages/AuthPage";
import CompleteRegistrationPage from "@/features/public-site/pages/CompleteRegistrationPage";
import ProfilePage from "@/features/public-site/pages/ProfilePage";
import ValidateRegistrationTokenPage from "@/features/public-site/pages/ValidateRegistrationTokenPage";

const publicRouters = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "catalog", element: <CatalogPage /> },
      { path: "wishlist", element: <WishlistPage /> },
      { path: "auth", element: <AuthPage /> },
      { path: "complete-registration", element: <CompleteRegistrationPage /> },
      { path: "profile", element: <ProfilePage /> },
      { path: "validate-token/:token", element: <ValidateRegistrationTokenPage /> },
    ],
  },
  {
    path: "/movie/:slug",
    element: <PublicLayout />,
    children: [{ index: true, element: <MovieDetail /> }],
  },
  {
    path: "/movie/:slug/watch",
    element: <PublicLayout />,
    children: [{ index: true, element: <WatchPage /> }],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default publicRouters;
