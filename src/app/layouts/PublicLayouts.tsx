import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/shared/components/PublicHeader/Header";
import Footer from "@/shared/components/PublicFooter/Footer";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
