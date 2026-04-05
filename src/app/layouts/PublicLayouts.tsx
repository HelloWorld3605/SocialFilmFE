import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "@/shared/components/PublicHeader/Header";
import Footer from "@/shared/components/PublicFooter/Footer";

const PublicLayout = () => {
  const location = useLocation();
  const isMovieDetailPage = /^\/movie\/[^/]+$/.test(location.pathname);
  const isOverlayHeader = location.pathname === "/" || isMovieDetailPage;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header overlay={isOverlayHeader} />
      <main className={isOverlayHeader ? "" : "pt-16"}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
