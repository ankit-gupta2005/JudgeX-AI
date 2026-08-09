import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Plus, Layers, AlertCircle, Play, Building2, Trash2, CalendarClock } from "lucide-react";
import Navbar from "../components/common/Navbar";
import api from "../services/api";

function Contests() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole] = useState(localStorage.getItem("role") || "developer");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [problemBank, setProblemBank] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stages, setStages] = useState([]);
  const [durationDays, setDurationDays] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get("/contests");
        if (!ignore) {
          setContests(response.data.contests || []);
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError("Failed to load contests.");
          setLoading(false);
        }
      }
    };

    load();
    return () => { ignore = true; };
  }, []);

  const openCreateModal = useCallback(async () => {
    try {
      const response = await api.get("/problems");
      const list = Array.isArray(response.data) ? response.data : response.data?.problems || [];
      setProblemBank(list);
      setTitle("");
      setDescription("");
      setStages([]);
      setDurationDays("");
      setShowCreateModal(true);
    } catch {
      setError("Failed to load problem bank for contest builder.");
    }
  }, []);

  const toggleStageProblem = (problemId) => {
    setStages((prev) => {
      const exists = prev.find((s) => s.problemId === problemId);
      if (exists) return prev.filter((s) => s.problemId !== problemId);
      return [...prev, { problemId, solveTimeLimit: 20 }];
    });
  };

  const updateStageTime = (problemId, minutes) => {
    setStages((prev) => prev.map((s) => (s.problemId === problemId ? { ...s, solveTimeLimit: minutes } : s)));
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    if (stages.length === 0) {
      alert("Select at least one problem stage.");
      return;
    }

    const startsAt = new Date();
    let endsAt = null;
    if (durationDays && Number(durationDays) > 0) {
      endsAt = new Date(startsAt.getTime() + Number(durationDays) * 24 * 60 * 60 * 1000);
    }

    try {
      await api.post("/contests", {
        title,
        description,
        problems: stages,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt ? endsAt.toISOString() : null,
      });
      setShowCreateModal(false);
      setLoading(true);
      const response = await api.get("/contests");
      setContests(response.data.contests || []);
      setLoading(false);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create contest.");
    }
  };

  const handleJoin = async (contestId) => {
    try {
      await api.post(`/contests/${contestId}/join`);
      navigate(`/contests/${contestId}/workspace`);
    } catch (err) {
      if (err.response?.status === 200) {
        navigate(`/contests/${contestId}/workspace`);
      } else {
        alert(err.response?.data?.message || "Failed to join contest.");
      }
    }
  };

  const handleDeleteContest = async (contestId, force = false) => {
    try {
      await api.delete(`/contests/${contestId}${force ? "?force=true" : ""}`);
      setContests((prev) => prev.filter((c) => c._id !== contestId));
    } catch (err) {
      if (err.response?.status === 409 && err.response?.data?.requiresConfirmation) {
        const confirmForce = window.confirm(
          `${err.response.data.message} Delete anyway? This will remove their progress permanently.`
        );
        if (confirmForce) {
          await handleDeleteContest(contestId, true);
        }
        return;
      }
      alert(err.response?.data?.message || "Failed to delete contest.");
    }
  };

  const formatDaysRemaining = (endsAt) => {
    if (!endsAt) return null;
    // eslint-disable-next-line react-hooks/purity
    const diffMs = new Date(endsAt).getTime() - Date.now();
    if (diffMs <= 0) return "Ended";
    const days = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    return days === 1 ? "Ends in 1 day" : `Ends in ${days} days`;
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Trophy className="text-amber-400 h-6 w-6" />
              <span>Contests</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">Sequential multi-stage challenges, timed per problem.</p>
          </div>
          {(userRole === "org_admin" || userRole === "super_admin") && (
            <button
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all"
            >
              <Plus className="h-4 w-4" /> Create Contest
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" /> <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : contests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <Trophy className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-sm font-semibold text-slate-200">No contests available</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {contests.map((c) => {
              const daysLabel = formatDaysRemaining(c.endsAt);
              return (
                <div
                  key={c._id}
                  className={`rounded-2xl border p-6 flex flex-col ${
                    c.isExpired ? "border-slate-900 bg-slate-900/10 opacity-60" : "border-slate-800 bg-slate-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Building2 className="h-3.5 w-3.5" />
                      {c.organization?.name || "Global"}
                    </div>
                    {(userRole === "org_admin" || userRole === "super_admin") && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete "${c.title}"? This cannot be undone.`)) {
                            handleDeleteContest(c._id);
                          }
                        }}
                        className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                        title="Delete contest"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{c.title}</h3>
                  <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 flex-1">{c.description}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-4 flex-wrap">
                    <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {c.stageCount} stages</span>
                    {daysLabel && (
                      <span className={`flex items-center gap-1 ${c.isExpired ? "text-rose-400" : "text-amber-400"}`}>
                        <CalendarClock className="h-3.5 w-3.5" /> {daysLabel}
                      </span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleJoin(c._id)}
                      disabled={c.isExpired}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white px-4 py-2 text-xs font-bold transition-all"
                    >
                      <Play className="h-3.5 w-3.5 fill-current" /> {c.isExpired ? "Ended" : "Join Contest"}
                    </button>
                    <button
                      onClick={() => navigate(`/contests/${c._id}/leaderboard`)}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 px-4 py-2 text-xs font-bold transition-all"
                    >
                      <Trophy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl my-8">
              <h3 className="text-xl font-bold text-slate-100 mb-6">Create Contest</h3>
              <form onSubmit={handleCreateContest} className="space-y-5">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Title</label>
                  <input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Description</label>
                  <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CalendarClock className="h-3.5 w-3.5 text-indigo-400" />
                    Contest Ends In (days, optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={durationDays}
                    onChange={(e) => setDurationDays(e.target.value)}
                    placeholder="Leave empty for no expiry"
                    className="mt-1.5 block w-full max-w-xs rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 block">Select Stages (in order)</label>
                  <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-3">
                    {problemBank.map((p) => {
                      const staged = stages.find((s) => s.problemId === p._id);
                      return (
                        <div key={p._id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-950 border border-slate-800 px-3 py-2">
                          <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer flex-1">
                            <input type="checkbox" checked={!!staged} onChange={() => toggleStageProblem(p._id)} />
                            {p.title} <span className="text-xs text-slate-500">({p.difficulty})</span>
                          </label>
                          {staged && (
                            <input
                              type="number"
                              min="1"
                              value={staged.solveTimeLimit}
                              onChange={(e) => updateStageTime(p._id, Number(e.target.value))}
                              className="w-16 rounded-lg border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-3 border-t border-slate-800 pt-5">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl border border-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-400">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white">Create Contest</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Contests;