import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/sections/HeroSection';
import WhyChooseUs from '@/components/sections/WhyChooseUs';
import PriceSection from '@/components/sections/PriceSection';
import ReviewsSection from '@/components/sections/ReviewsSection';

export default function HomePage() {
  return (
    <>
      <Header />
      <HeroSection />
      <WhyChooseUs />
      <PriceSection />
      <ReviewsSection />
      <Footer />
    </>
  );
}
