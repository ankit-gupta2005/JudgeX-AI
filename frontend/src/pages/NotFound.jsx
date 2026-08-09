import { useNavigate } from "react-router-dom";
import { Terminal, Home, ArrowLeft } from "lucide-react";

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <Terminal className="h-8 w-8" />
        <span className="absolute -bottom-1 -right-1 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white">404</span>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-slate-100 sm:text-4xl">
        Route Vector Unresolved
      </h1>
      <p className="mt-3 text-sm text-slate-400 max-w-md">
        The requested virtual workspace coordinate does not exist or has been restricted by system access policies.
      </p>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Step Back Execution</span>
        </button>
        <button
          onClick={() => navigate("/problems")}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10"
        >
          <Home className="h-4 w-4" />
          <span>Return to Hub</span>
        </button>
      </div>
    </div>
  );
}

export default NotFound;