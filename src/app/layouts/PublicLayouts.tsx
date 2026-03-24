import React from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/shared/components/PublicHeader/Header";
import Footer from "@/shared/components/PublicFooter/Footer";
import HeroSection from "@/shared/components/Banner/HeroSection";

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <HeroSection />

      <main className="container mx-auto px-4 md:px-8 py-8 space-y-12">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
