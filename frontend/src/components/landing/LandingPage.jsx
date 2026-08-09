import HeroSection from "./HeroSection";
import TechMarquee from "./TechMarquee";
import FeaturesGrid from "./FeaturesGrid";
import PricingCards from "./PricingCards";
import Footer from "../common/Footer";

function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col antialiased selection:bg-indigo-500/20">
      <header className="border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 font-bold text-xl text-slate-100 select-none">
          <img 
            src="/logo.png" 
            alt="JudgeX Logo" 
            className="h-9 w-auto object-contain"
          />
          <span className="tracking-tight">Judge<span className="text-indigo-500">X</span></span>
        </div>
        <div className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
          SaaS Workspace Suite 
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <TechMarquee />
        <FeaturesGrid />
        <PricingCards />
      </main>

      <Footer />
    </div>
  );
}

export default LandingPage;