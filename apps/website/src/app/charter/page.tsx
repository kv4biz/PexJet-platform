//app/charter/page.tsx
import type { Metadata } from "next";
import { CharterBenefits } from "@/components/charter/CharterBenefits";
import { CharterFAQ } from "@/components/charter/CharterFAQ";
import HeroSection from "@/components/charter/HeroSection";
import { MultiStepFormSection } from "@/components/charter/MultiStepFormSection";
import Navbar from "@/components/layout/navbar";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import Footer from "@/components/layout/footer";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.charter.title,
  description: seoData.pages.charter.description,
};

export default function Charter() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar />
      <main>
        <HeroSection />
        <MultiStepFormSection />
        <CharterBenefits />
        <CharterFAQ />
        <NewsletterCTA />
      </main>
      <Footer />
    </div>
  );
}
