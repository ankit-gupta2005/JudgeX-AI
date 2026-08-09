import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Users,
  Code2,
  CheckCircle2,
  ShieldAlert,
  RefreshCcw,
  TrendingUp,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import MetricsCard from "../components/dashboard/MetricsCard";
import AnalyticsChart from "../components/dashboard/AnalyticsChart";
import SubmissionDetailModal from "../components/dashboard/SubmissionDetailModal";
import api from "../services/api";

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [refreshToken, setRefreshToken] = useState(0);
  const [activeBucket, setActiveBucket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get("/dashboard/stats");
        if (!ignore) {
          setStats(response.data.stats);
          setError(null);
        }
      } catch (err) {
        if (!ignore) {
          const backendMessage = err.response?.data?.message;
          const statusCode = err.response?.status;
          setError({
            message: backendMessage || "Administrative credentials refused or backend dashboard metrics uninitialized.",
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
  }, [refreshToken]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshToken((t) => t + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setLoading(true);
    setRefreshToken((t) => t + 1);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-2 border-slate-800" />
            <div className="absolute inset-0 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
          <p className="text-sm text-slate-500 tracking-wide">Aggregating platform telemetry streams...</p>
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
          <h3 className="text-lg font-bold text-slate-200">Unable to Load Dashboard</h3>
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

  const chartData = stats?.weeklySubmissions?.length ? stats.weeklySubmissions : [];
  const hasChartData = chartData.length > 0;

  const totalSubmissions = stats?.totalSubmissions || 0;
  const acceptedSubmissions = stats?.acceptedSubmissions || 0;
  const wrongAnswerSubmissions = stats?.wrongAnswerSubmissions || 0;
  const errorSubmissions = stats?.errorSubmissions || 0;

  const passRate = totalSubmissions > 0
    ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
    : 0;

  const pct = (count) => (totalSubmissions > 0 ? (count / totalSubmissions) * 100 : 0);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                <BarChart3 className="text-indigo-400 h-5 w-5" />
              </span>
              Workspace  Control Panel
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Real-time multi-tenant runtime insights and system performance distributions.
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

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricsCard title="Active Developers" value={stats?.totalUsers || 0} subtext="Registered tenant nodes" icon={Users} />
          <MetricsCard title="Evaluated Problems" value={stats?.totalProblems || 0} subtext="Challenge architectures" icon={Code2} />
          <MetricsCard title="Total Submissions" value={totalSubmissions} subtext="Global code pipeline events" icon={BarChart3} />
          <MetricsCard
            title="System Pass Rate"
            value={`${passRate}%`}
            subtext="Accepted verification files"
            icon={CheckCircle2}
            trendColor={passRate >= 50 ? "text-emerald-400" : "text-amber-400"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            {hasChartData ? (
              <AnalyticsChart data={chartData} />
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-6 h-full flex flex-col">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-4 mb-4">
                  System Submission Load Velocity Metrics
                </h3>
                <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                  <TrendingUp className="h-8 w-8 text-slate-700 mb-3" />
                  <p className="text-sm text-slate-500">No submission activity recorded yet.</p>
                  <p className="text-xs text-slate-600 mt-1">Data will populate once candidates start submitting solutions.</p>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-6 flex flex-col">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-4 mb-5">
              Sandbox Exit Code Status Vectors
            </h3>

            {totalSubmissions === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6">
                <AlertTriangle className="h-7 w-7 text-slate-700 mb-3" />
                <p className="text-sm text-slate-500">No verdicts logged yet.</p>
              </div>
            ) : (
              <div className="space-y-5 flex-1 flex flex-col justify-center">
                <StatusVector
                  icon={CheckCircle2}
                  label="Accepted (AC)"
                  count={acceptedSubmissions}
                  percent={pct(acceptedSubmissions)}
                  colorText="text-emerald-400"
                  colorBar="bg-emerald-500"
                  onClick={() => setActiveBucket("accepted")}
                />
                <StatusVector
                  icon={XCircle}
                  label="Wrong Answer (WA)"
                  count={wrongAnswerSubmissions}
                  percent={pct(wrongAnswerSubmissions)}
                  colorText="text-rose-400"
                  colorBar="bg-rose-500"
                  onClick={() => setActiveBucket("wrong_answer")}
                />
                <StatusVector
                  icon={AlertTriangle}
                  label="Runtime / Timeout Faults"
                  count={errorSubmissions}
                  percent={pct(errorSubmissions)}
                  colorText="text-amber-400"
                  colorBar="bg-amber-500"
                  onClick={() => setActiveBucket("errors")}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {activeBucket && (
        <SubmissionDetailModal bucket={activeBucket} onClose={() => setActiveBucket(null)} />
      )}
    </div>
  );
}

function StatusVector({ icon: Icon, label, count, percent, colorText, colorBar, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={count === 0}
      className="w-full text-left group disabled:cursor-default"
    >
      <div className="flex items-center justify-between text-xs font-medium mb-1.5">
        <span className={`flex items-center gap-1.5 ${colorText} ${count > 0 ? "group-hover:underline" : ""}`}>
          <Icon className="h-3.5 w-3.5" />
          {label}
        </span>
        <span className="text-slate-400 font-bold font-mono">{count}</span>
      </div>
      <div className="w-full bg-slate-950 rounded-full h-2 border border-slate-900 overflow-hidden">
        <div className={`${colorBar} h-full rounded-full transition-all duration-700 ease-out`} style={{ width: `${percent}%` }} />
      </div>
    </button>
  );
}

export default Dashboard;