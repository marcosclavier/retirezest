import LandingNav from '@/components/landing/LandingNav';
import HeroSection from '@/components/landing/HeroSection';
import ProblemSection from '@/components/landing/ProblemSection';
import SolutionSection from '@/components/landing/SolutionSection';
import FeaturesShowcase from '@/components/landing/FeaturesShowcase';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import TrustSection from '@/components/landing/TrustSection';
import FAQSection from '@/components/landing/FAQSection';
import FinalCTASection from '@/components/landing/FinalCTASection';
import LandingFooter from '@/components/landing/LandingFooter';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <LandingNav />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <FeaturesShowcase />
      <HowItWorksSection />
      <TrustSection />
      <FAQSection />
      <FinalCTASection />
      <LandingFooter />
    </div>
  );
}
