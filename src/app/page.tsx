import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesSection } from "@/components/landing/features-section";
import { TournamentsSection } from "@/components/landing/tournaments-section";
import { TestimonialsSection } from "@/components/landing/testimonials-section";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col gap-24">
      <HeroSection />
      <FeaturesSection />
      <TournamentsSection />
      <TestimonialsSection />
      <Footer />
    </main>
  );
}
