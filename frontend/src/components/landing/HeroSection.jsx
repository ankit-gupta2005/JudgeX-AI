
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 pt-32 pb-20 text-center flex flex-col items-center justify-center overflow-hidden">
    
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-125 h-125 bg-zinc-900/40 rounded-full blur-[120px] pointer-events-none" />

     
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/60 text-zinc-400 text-xs font-medium tracking-wide mb-6">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        Automated Technical Evaluation Platform
      </div>

    
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl text-transparent bg-clip-text bg-linear-to-b from-white to-zinc-400 leading-[1.15] mb-6">
        Conduct Screened Coding Contests & Interviews Effortlessly
      </h1>


      <p className="text-base sm:text-lg text-zinc-400 max-w-2xl font-normal leading-relaxed mb-10">
        Stop grading submissions manually. Create programming assessments, manage custom organization hubs, and evaluate candidate solutions instantly with cheat-proof, automated grading.
      </p>

      
      <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
        <button
          onClick={() => navigate("/signup")}
          className="w-full sm:w-auto px-8 py-3.5 bg-white text-black font-semibold text-sm rounded-lg hover:bg-zinc-200 active:scale-[0.98] transition-all duration-150"
        >
          Create Free Organization Hub
        </button>
        <button
          onClick={() => navigate("/login")}
          className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 text-zinc-300 font-semibold text-sm rounded-lg border border-zinc-800 hover:bg-zinc-850 hover:text-white active:scale-[0.98] transition-all duration-150"
        >
          Watch Demo Evaluation
        </button>
      </div>
    </section>
  );
}