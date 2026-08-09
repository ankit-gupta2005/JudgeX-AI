import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

function PricingCards() {
  const navigate = useNavigate();

  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8 bg-slate-950 border-t border-slate-900/60">
      <div className="mx-auto max-w-5xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-500 font-mono">SaaS Commercial Scales</h2>
          <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">Clear pipelines, zero hardware overhead.</p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 items-stretch">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/5 p-8 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-200">Developer Sandbox</h3>
              <p className="text-xs text-slate-500 mt-1">Perfect for custom algorithm engineering and code evaluation traces.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-100 font-mono">$0</span>
                <span className="text-xs text-slate-500">/ forever free</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-slate-400">
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Launch sandbox challenges</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> Full Monaco editor support</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-emerald-500 shrink-0" /> 100 monthly compilation container tasks</li>
              </ul>
            </div>
            <button onClick={() => navigate("/signup")} className="mt-8 block w-full rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800 text-sm font-semibold text-slate-200 py-3 text-center transition-all">
              Initialize Local Node
            </button>
          </div>

          <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-8 flex flex-col justify-between relative backdrop-blur-md">
            <div className="absolute top-0 right-6 -translate-y-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-indigo-400/20 shadow-lg shadow-indigo-600/20">
              Enterprise Verified
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Corporate Tenant</h3>
              <p className="text-xs text-indigo-300/60 mt-1">For technology schools, recruitment portals, and high-load platforms.</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-100 font-mono">$49</span>
                <span className="text-xs text-slate-400">/ monthly cluster</span>
              </div>
              <ul className="mt-8 space-y-3 text-sm text-slate-300">
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-indigo-400 shrink-0" /> Isolated tenant organization spaces</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-indigo-400 shrink-0" /> Custom question matrix configurator</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-indigo-400 shrink-0" /> Infinite concurrent docker workspace sessions</li>
                <li className="flex items-center gap-2.5"><Check className="h-4 w-4 text-indigo-400 shrink-0" /> Multi-seat developer invite codes</li>
              </ul>
            </div>
            <button onClick={() => navigate("/signup")} className="mt-8 block w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white py-3 text-center transition-all shadow-lg shadow-indigo-600/20">
              Provision Multi-Tenant Cluster
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PricingCards;