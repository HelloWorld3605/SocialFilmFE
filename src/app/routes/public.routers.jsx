import React, { Suspense } from "react";
import PublicLayout from "@/app/layouts/PublicLayouts";
import { Skeleton } from "@/shared/components/ui/skeleton";

const NotFound = React.lazy(() => import("@/features/public-site/pages/NotFound"));
const HomePage = React.lazy(() => import("@/features/public-site/pages/HomePage"));
const MovieDetail = React.lazy(() => import("@/features/public-site/pages/MovieDetails"));
const WatchPage = React.lazy(() => import("@/features/public-site/pages/WatchPage"));
const CatalogPage = React.lazy(() => import("@/features/public-site/pages/CatalogPage"));
const WishlistPage = React.lazy(() => import("@/features/public-site/pages/WishlistPage"));
const AuthPage = React.lazy(() => import("@/features/public-site/pages/AuthPage"));
const CompleteRegistrationPage = React.lazy(
  () => import("@/features/public-site/pages/CompleteRegistrationPage"),
);
const ProfilePage = React.lazy(() => import("@/features/public-site/pages/ProfilePage"));
const SettingsPage = React.lazy(() => import("@/features/public-site/pages/SettingsPage"));
const ValidateRegistrationTokenPage = React.lazy(
  () => import("@/features/public-site/pages/ValidateRegistrationTokenPage"),
);

const RouteLoadingFallback = () => (
  <div className="content-shell layout-padding py-10">
    <div className="space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-64 max-w-full" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={`route-skeleton-${index}`} className="space-y-3">
            <Skeleton className="aspect-[2/3] rounded-lg" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3.5 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const withSuspense = (element) => (
  <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>
);

const publicRouters = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(<HomePage />) },
      { path: "catalog", element: withSuspense(<CatalogPage />) },
      { path: "wishlist", element: withSuspense(<WishlistPage />) },
      { path: "auth", element: withSuspense(<AuthPage />) },
      {
        path: "complete-registration",
        element: withSuspense(<CompleteRegistrationPage />),
      },
      { path: "profile", element: withSuspense(<ProfilePage />) },
      { path: "settings", element: withSuspense(<SettingsPage />) },
      {
        path: "validate-token/:token",
        element: withSuspense(<ValidateRegistrationTokenPage />),
      },
    ],
  },
  {
    path: "/movie/:slug",
    element: <PublicLayout />,
    children: [{ index: true, element: withSuspense(<MovieDetail />) }],
  },
  {
    path: "/movie/:slug/watch",
    element: <PublicLayout />,
    children: [{ index: true, element: withSuspense(<WatchPage />) }],
  },
  {
    path: "*",
    element: withSuspense(<NotFound />),
  },
];

export default publicRouters;
