import React, { Suspense } from "react";
import { Navigate } from "react-router-dom";
import AdminLayout from "@/app/layouts/AdminLayouts";
import AdminRoute from "@/shared/auth/AdminRoute";
import { Skeleton } from "@/shared/components/ui/skeleton";

const AdminDashboardPage = React.lazy(
  () => import("@/features/admin/pages/AdminDashboardPage"),
);
const AdminUsersPage = React.lazy(
  () => import("@/features/admin/pages/AdminUsersPage"),
);
const AdminPendingRegistrationsPage = React.lazy(
  () => import("@/features/admin/pages/AdminPendingRegistrationsPage"),
);

const AdminRouteFallback = () => (
  <div className="space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-10 w-80 max-w-full" />
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={`admin-skeleton-${index}`} className="h-32 rounded-[28px]" />
      ))}
    </div>
  </div>
);

const withSuspense = (element: React.ReactNode) => (
  <Suspense fallback={<AdminRouteFallback />}>{element}</Suspense>
);

const adminRouters = [
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: "overview", element: withSuspense(<AdminDashboardPage />) },
      { path: "users", element: withSuspense(<AdminUsersPage />) },
      {
        path: "pending-registrations",
        element: withSuspense(<AdminPendingRegistrationsPage />),
      },
    ],
  },
];

export default adminRouters;
