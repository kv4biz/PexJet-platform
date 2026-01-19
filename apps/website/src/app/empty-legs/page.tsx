//app/empty-legs/page.tsx
import HeroSection from "@/components/empty-leg/HeroSection";
import { EmptyLegDealsSection } from "@/components/empty-leg/EmptyLegDealsSection";
import { EmptyLegFAQ } from "@/components/empty-leg/EmptyLegFAQ";
import Navbar from "@/components/layout/navbar";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import Footer from "@/components/layout/footer";

export default function EmptyLegsPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <Navbar />
      <main>
        <HeroSection />
        <EmptyLegDealsSection />
        <EmptyLegFAQ />
        <NewsletterCTA />
      </main>
      <Footer />
    </div>
  );
}
