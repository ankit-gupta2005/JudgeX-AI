import { useNavigate, Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, Code2, Users, Trophy, Swords } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const userRole = user?.role || localStorage.getItem("role") || "developer";
  const userName = user?.name || localStorage.getItem("name") || "Developer Node";

  const handleLogoutSession = () => {
    logout();
    navigate("/login");
  };

  const isCurrentPath = (path) => location.pathname === path;

  return (
    <nav className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-md sticky top-0 z-50 px-6 py-3">
      <div className="flex items-center justify-between mx-auto max-w-7xl">
        <Link to="/problems" className="flex items-center gap-3 font-bold text-xl text-slate-100 group select-none">
          <img
            src="/logo.png"
            alt=""
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="tracking-tight">Judge<span className="text-indigo-500">X</span></span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-4">
          <Link
            to="/problems"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isCurrentPath("/problems") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Challenges</span>
          </Link>

          <Link
            to="/contests"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isCurrentPath("/contests") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Swords className="h-4 w-4" />
            <span>Contests</span>
          </Link>

          <Link
            to="/leaderboard"
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              isCurrentPath("/leaderboard") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Trophy className="h-4 w-4" />
            <span>Leaderboard</span>
          </Link>

          {(userRole === "org_admin" || userRole === "super_admin") && (
            <>
              <Link
                to="/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isCurrentPath("/dashboard") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>SaaS Analytics</span>
              </Link>

              <Link
                to="/org-settings"
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isCurrentPath("/org-settings") ? "bg-slate-800 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Users className="h-4 w-4" />
                <span>Assessment Control</span>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 border-l border-slate-800 pl-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-sm font-semibold text-slate-200">{userName}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border mt-0.5 ${
              userRole === "org_admin" || userRole === "super_admin"
                ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            }`}>
              {userRole === "org_admin" ? "Org Admin" : userRole === "super_admin" ? "Super Admin" : "Developer"}
            </span>
          </div>

          <button
            onClick={handleLogoutSession}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200"
            title="Terminate Core Session"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;