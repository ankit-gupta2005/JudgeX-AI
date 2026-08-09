import { Link, useLocation } from "react-router-dom";
import { Code2, LayoutDashboard, Building2, Terminal } from "lucide-react";

function Sidebar() {
  const location = useLocation();
  const userRole = localStorage.getItem("role") || "developer";
  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-64 border-r border-slate-900 bg-slate-950 p-4 flex flex-col max-md:hidden shrink-0">
      <div className="space-y-1.5 flex-1">
        <Link
          to="/problems"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
            isActive("/problems")
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Code2 className="h-4 w-4" />
          <span>Challenges</span>
        </Link>

        {(userRole === "org_admin" || userRole === "super_admin") && (
          <>
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive("/dashboard")
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>SaaS Telemetry</span>
            </Link>

            <Link
              to="/org-settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive("/org-settings")
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/10"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
              }`}
            >
              <Building2 className="h-4 w-4" />
              <span>Tenant Admin</span>
            </Link>
          </>
        )}
      </div>

      <div className="border-t border-slate-900 pt-4 flex items-center gap-2.5 px-2">
        <Terminal className="h-4 w-4 text-slate-600" />
        <span className="text-[11px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Node Secure Engine
        </span>
      </div>
    </aside>
  );
}

export default Sidebar;