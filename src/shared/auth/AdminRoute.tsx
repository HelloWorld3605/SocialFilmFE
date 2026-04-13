import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/shared/auth/AuthContext";

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { isReady, isAuthenticated, user } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background px-6 py-12 text-sm text-muted-foreground">
        Đang kiểm tra quyền quản trị...
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/settings" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
