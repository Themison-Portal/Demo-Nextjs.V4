"use client";
import { LandingNavbar } from "@/components/landing/LandingNavbar";
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <LandingNavbar />
      <HeroSection />
    </main>
  );
}
