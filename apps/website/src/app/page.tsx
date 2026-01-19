import type { Metadata } from "next";
import EmptyLegDeals from "@/components/home/EmptyLegDeals";
import FleetPreview from "@/components/home/FleetPreview";
import Footer from "@/components/layout/footer";
import HeroSection from "@/components/home/HeroSection";
import MembershipBanner from "@/components/home/MembershipBanner";
import Navbar from "@/components/layout/navbar";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import PartnerLogos from "@/components/home/PartnerLogos";
import SearchComponents from "@/components/home/SearchComponents";
import Testimonials from "@/components/home/Testimonials";
import { seoData } from "@/data";

export const metadata: Metadata = {
  title: seoData.pages.home.title,
  description: seoData.pages.home.description,
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F7F7F7] overflow-x-hidden">
      <Navbar />
      <main className="relative">
        <HeroSection />
        <SearchComponents />
        <EmptyLegDeals />
        <FleetPreview />
        <PartnerLogos />
        <MembershipBanner />
        <Testimonials />
        <NewsletterCTA />
      </main>
      <Footer />
    </div>
  );
}
