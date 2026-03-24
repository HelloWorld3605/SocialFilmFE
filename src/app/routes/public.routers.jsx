import React from "react";
import PublicLayout from "@/app/layouts/PublicLayouts";
import NotFound from "@/features/public-site/pages/NotFound";
import HomePage from "@/features/public-site/pages/HomePage";

const publicRouters = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [{ index: true, element: <HomePage /> }],
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default publicRouters;
