import { useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/shared/components/ui/sonner";
import { Toaster } from "@/shared/components/ui/toaster";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { AuthProvider } from "@/shared/auth/AuthContext";
import { createAppQueryClient, persistAppQueryClient } from "@/shared/lib/queryClient";
import routes from "./app/routes/routes.tsx";

const queryClient = createAppQueryClient();

const App = () => {
  useEffect(() => persistAppQueryClient(queryClient), []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={routes} />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
