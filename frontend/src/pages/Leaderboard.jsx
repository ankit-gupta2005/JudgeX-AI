import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  ShieldAlert,
  RefreshCcw,
  Medal,
  Mail,
  CheckCircle2,
  Target,
  Globe,
  Building2,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

function Leaderboard() {
  const [scope, setScope] = useState("global");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get(`/leaderboard/${scope}`);
        if (!ignore) {
          setData(response.data);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          const backendMessage = err.response?.data?.message;
          const statusCode = err.response?.status;
          setError({
            message: backendMessage || "Unable to load rankings.",
            status: statusCode || null,
          });
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [scope, refreshToken]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshToken((t) => t + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setRefreshToken((t) => t + 1);
  }, []);

  const switchScope = (newScope) => {
    if (newScope === scope) return;
    setScope(newScope);
    setLoading(true);
    setData(null);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
          <p className="text-sm text-slate-500 tracking-wide">Compiling developer rankings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="mx-auto max-w-md p-8 text-center mt-24 border border-slate-800 bg-slate-900/50 rounded-2xl shadow-xl shadow-black/20">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20 mb-5">
            <ShieldAlert className="h-7 w-7 text-rose-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">Unable to Load Leaderboard</h3>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">{error.message}</p>
          {error.status && (
            <span className="inline-block mt-3 text-[10px] font-mono uppercase tracking-wider text-slate-600 bg-slate-950 border border-slate-800 rounded-full px-2.5 py-1">
              Status {error.status}
            </span>
          )}
          <div className="mt-7 flex items-center justify-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </button>
            <button
              onClick={() => navigate("/problems")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition-colors"
            >
              Return to Challenges
            </button>
          </div>
        </div>
      </div>
    );
  }

  const rows = data?.leaderboard || [];
  const topThree = rows.slice(0, 3);
  const currentUserId = user?._id || user?.id;
  const orgName = data?.organizationName;
  const emptyMineMessage = data?.message;

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-900 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Trophy className="text-amber-400 h-5 w-5" />
              </span>
              Developer Leaderboard
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {scope === "global"
                ? "Ranked across the public JudgeX workspace."
                : orgName
                ? `Ranked within ${orgName}.`
                : "Ranked by problems solved, verification pass rate, and submission efficiency."}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCcw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="inline-flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-900/40 p-1 mb-8">
          <button
            onClick={() => switchScope("global")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              scope === "global" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Global (JudgeX)
          </button>
          <button
            onClick={() => switchScope("mine")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              scope === "mine" ? "bg-indigo-600 text-white shadow-md" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            My Organization
          </button>
        </div>

        {scope === "mine" && rows.length === 0 && emptyMineMessage ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-16 flex flex-col items-center justify-center text-center">
            <Building2 className="h-10 w-10 text-slate-700 mb-4" />
            <p className="text-sm text-slate-500">{emptyMineMessage}</p>
            <p className="text-xs text-slate-600 mt-1">
              Check the Global (JudgeX) tab to see the public workspace leaderboard instead.
            </p>
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-16 flex flex-col items-center justify-center text-center">
            <Trophy className="h-10 w-10 text-slate-700 mb-4" />
            <p className="text-sm text-slate-500">No developer activity recorded yet.</p>
            <p className="text-xs text-slate-600 mt-1">Rankings will populate once submissions come in.</p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                {topThree.map((dev) => (
                  <PodiumCard key={dev.userId} dev={dev} isCurrentUser={dev.userId === currentUserId} />
                ))}
              </div>
            )}

            <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4 w-16">Rank</th>
                      <th className="px-6 py-4">Developer</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4 text-center">Problems Solved</th>
                      <th className="px-6 py-4 text-center">Submissions</th>
                      <th className="px-6 py-4 text-right">Pass Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                    {rows.map((dev) => {
                      const isMe = dev.userId === currentUserId;
                      return (
                        <tr
                          key={dev.userId}
                          className={`transition-colors ${
                            isMe ? "bg-indigo-500/5 hover:bg-indigo-500/10" : "hover:bg-slate-900/40"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <RankBadge rank={dev.rank} />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar name={dev.name} />
                              <span className="font-semibold text-slate-200 flex items-center gap-2">
                                {dev.name}
                                {isMe && (
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-2 py-0.5">
                                    You
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-400 text-xs font-mono">
                            <span className="flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-slate-600" />
                              {dev.email}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 text-xs font-bold">
                              <CheckCircle2 className="h-3 w-3" />
                              {dev.problemsSolved}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-slate-400 font-mono text-xs">
                            {dev.totalSubmissions}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="inline-flex items-center gap-2">
                              <div className="w-16 bg-slate-950 rounded-full h-1.5 border border-slate-900 overflow-hidden">
                                <div
                                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${dev.passRate}%` }}
                                />
                              </div>
                              <span className="text-xs font-mono font-bold text-slate-300 w-9 text-right">
                                {dev.passRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function RankBadge({ rank }) {
  const medalColors = {
    1: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    2: "text-slate-300 bg-slate-500/10 border-slate-500/20",
    3: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  };

  if (rank <= 3) {
    return (
      <span className={`inline-flex items-center justify-center h-8 w-8 rounded-lg border font-bold text-xs ${medalColors[rank]}`}>
        <Medal className="h-4 w-4" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-slate-800 bg-slate-950 text-slate-500 font-mono font-bold text-xs">
      {rank}
    </span>
  );
}

function Avatar({ name }) {
  const initials = name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold shrink-0">
      {initials}
    </span>
  );
}

function PodiumCard({ dev, isCurrentUser }) {
  const styles = {
    1: { border: "border-amber-500/30", glow: "shadow-lg shadow-amber-500/5", badge: "bg-amber-500/10 border-amber-500/20 text-amber-400", label: "1st Place" },
    2: { border: "border-slate-500/30", glow: "", badge: "bg-slate-500/10 border-slate-500/20 text-slate-300", label: "2nd Place" },
    3: { border: "border-orange-500/30", glow: "", badge: "bg-orange-500/10 border-orange-500/20 text-orange-400", label: "3rd Place" },
  };
  const style = styles[dev.rank];

  return (
    <div className={`rounded-2xl border ${style.border} ${style.glow} bg-slate-900/20 backdrop-blur-md p-6 ${isCurrentUser ? "ring-1 ring-indigo-500/40" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
          <Trophy className="h-3 w-3" />
          {style.label}
        </span>
        <Target className="h-4 w-4 text-slate-700" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-bold shrink-0">
          {dev.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-100 truncate flex items-center gap-2">
            {dev.name}
            {isCurrentUser && <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400">(You)</span>}
          </p>
          <p className="text-xs text-slate-500 truncate">{dev.email}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xl font-bold text-slate-100">{dev.problemsSolved}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Solved</p>
        </div>
        <div>
          <p className="text-xl font-bold text-slate-100">{dev.passRate}%</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider">Pass Rate</p>
        </div>
      </div>
    </div>
  );
}

export default Leaderboard;