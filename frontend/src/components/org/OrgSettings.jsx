import { useState, useEffect } from "react";
import { UserPlus, Mail, ShieldAlert, CheckCircle2, Users, ArrowRight, Award, PlusCircle, Trash2, UserMinus, X, AlertTriangle } from "lucide-react";
import api from "../../services/api";

function ConfirmBadge({ type, onConfirm, onCancel, isLoading }) {
  const config = {
    remove_problem: {
      label: "Remove assigned problem?",
      confirmLabel: "Yes, remove",
      color: "amber",
    },
    remove_member: {
      label: "Remove from workspace?",
      confirmLabel: "Yes, remove",
      color: "red",
    },
  }[type];

  const colorClasses = {
    amber: {
      wrapper: "bg-amber-500/10 border-amber-500/20",
      label: "text-amber-400",
      confirm: "bg-amber-600 hover:bg-amber-500 text-white",
      cancel: "bg-slate-800 hover:bg-slate-700 text-slate-300",
    },
    red: {
      wrapper: "bg-red-500/10 border-red-500/20",
      label: "text-red-400",
      confirm: "bg-red-600 hover:bg-red-500 text-white",
      cancel: "bg-slate-800 hover:bg-slate-700 text-slate-300",
    },
  }[config.color];

  return (
    <div className={`mt-2 rounded-lg border p-2 space-y-2 ${colorClasses.wrapper}`}>
      <div className={`flex items-center gap-1.5 text-xs font-mono ${colorClasses.label}`}>
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        {config.label}
      </div>
      <div className="flex gap-1.5">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={`flex-1 rounded-md py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${colorClasses.confirm}`}
        >
          {isLoading ? "Removing..." : config.confirmLabel}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className={`flex-1 rounded-md py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${colorClasses.cancel}`}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function OrgSettings() {
  const [candidateEmail, setCandidateEmail] = useState("");
  const [newDevEmail, setNewDevEmail] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [developersList, setDevelopersList] = useState([]);
  const [problemsList, setProblemsList] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [confirmState, setConfirmState] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    let isMounted = true;

    async function initializeWorkspaceData() {
      try {
        const [devsResponse, problemsResponse] = await Promise.all([
          api.get("/org/developers"),
          api.get("/problems")
        ]);
        if (isMounted) {
          setDevelopersList(devsResponse.data || []);
          setProblemsList(problemsResponse.data || []);
        }
      } catch (err) {
        console.error("Failed to sync workspace directories.", err);
      }
    }

    initializeWorkspaceData();
    return () => { isMounted = false; };
  }, []);

  const handleManualRefresh = async () => {
    try {
      const [devsResponse, problemsResponse] = await Promise.all([
        api.get("/org/developers"),
        api.get("/problems")
      ]);
      setDevelopersList(devsResponse.data || []);
      setProblemsList(problemsResponse.data || []);
    } catch (err) {
      console.error("Failed to manual re-sync workspace directories.", err);
    }
  };

  const handleAllocateTest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedProblemId || !candidateEmail) {
      setError("Please select a target problem and enter a valid developer email.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post("/problems/allocate", {
        problemId: selectedProblemId,
        developerEmail: candidateEmail.trim().toLowerCase()
      });
      setSuccess(response.data.message || "Challenge successfully allocated to user node.");
      setCandidateEmail("");
      setSelectedProblemId("");
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision target assessment parameters.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDeveloper = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      const response = await api.post("/org/add-member", { email: newDevEmail.trim().toLowerCase() });
      setSuccess(response.data.message);
      setNewDevEmail("");
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to provision workspace mapping boundaries.");
    } finally {
      setIsLoading(false);
    }
  };

  const requestConfirm = (devId, type) => {
    setConfirmState((prev) => ({ ...prev, [devId]: type }));
  };

  const cancelConfirm = (devId) => {
    setConfirmState((prev) => {
      const next = { ...prev };
      delete next[devId];
      return next;
    });
  };

  const handleDeallocateProblem = async (dev) => {
    setActionLoading((prev) => ({ ...prev, [dev._id]: true }));
    setError("");
    setSuccess("");
    try {
      const response = await api.post("/problems/deallocate", {
        developerEmail: dev.email,
      });
      setSuccess(response.data.message || "Problem removed from developer.");
      cancelConfirm(dev._id);
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove problem assignment.");
      cancelConfirm(dev._id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [dev._id]: false }));
    }
  };

  const handleRemoveMember = async (dev) => {
    setActionLoading((prev) => ({ ...prev, [dev._id]: true }));
    setError("");
    setSuccess("");
    try {
      const response = await api.delete(`/org/member/${encodeURIComponent(dev.email)}`);
      setSuccess(response.data.message || "Developer removed from workspace.");
      cancelConfirm(dev._id);
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove developer from workspace.");
      cancelConfirm(dev._id);
    } finally {
      setActionLoading((prev) => ({ ...prev, [dev._id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-6xl mx-auto space-y-8">

        <div>
          <h1 className="text-3xl font-bold tracking-tight font-mono">Organization Control </h1>
          <p className="text-sm text-slate-400 mt-1">
           Allocate specific testing evaluations, and track custom contests.
          </p>
        </div>

        {(error || success) && (
          <div className="max-w-none">
            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                <ShieldAlert className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{success}</span>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="space-y-6 lg:col-span-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Deploy Targeted Test</h2>
              </div>

              <form onSubmit={handleAllocateTest} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Select Assessment Challenge</label>
                  <select
                    value={selectedProblemId}
                    onChange={(e) => setSelectedProblemId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-2"
                  >
                    <option value="">-- Choose Challenge Architecture --</option>
                    {problemsList.map((prob) => (
                      <option key={prob._id} value={prob._id}>{prob.title} ({prob.difficulty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Target Email</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={candidateEmail}
                      onChange={(e) => setCandidateEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="candidate@evaluation.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md"
                >
                  <PlusCircle className="h-4 w-4" />
                  Allocate Problem Node
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Provision Workspace Developer</h2>
              </div>

              <form onSubmit={handleAddDeveloper} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Developer Email Address</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={newDevEmail}
                      onChange={(e) => setNewDevEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
                      placeholder="dev@workspace.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full justify-center items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  Bind to Workspace
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl h-fit">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Active Developer Registry</h2>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-mono bg-slate-950 border border-slate-800 text-slate-400">
                {developersList.length} Nodes Loaded
              </span>
            </div>

            {developersList.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 font-mono text-xs">
                No active developer nodes bound to this workspace environment parameter yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-130 overflow-y-auto pr-1">
                {developersList.map((dev) => {
                  const pending = confirmState[dev._id];
                  const devLoading = !!actionLoading[dev._id];

                  return (
                    <div
                      key={dev._id}
                      className="p-4 bg-slate-950 border border-slate-900 rounded-xl hover:border-slate-800 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="truncate pr-1 flex-1">
                          <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors font-mono">
                            {dev.name}
                          </h3>
                          <p className="text-xs text-slate-400 truncate mt-0.5 font-mono">{dev.email}</p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {dev.allocatedProblemId ? (
                            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/5 text-indigo-400 border border-indigo-500/10">
                              Active Node
                            </span>
                          ) : (
                            <span className="text-[10px] uppercase font-mono tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/5 text-emerald-400 border border-emerald-500/10">
                              Idle / Ready
                            </span>
                          )}

                          {dev.allocatedProblemId && !pending && (
                            <button
                              onClick={() => requestConfirm(dev._id, "remove_problem")}
                              title="Remove assigned problem"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {!pending && (
                            <button
                              onClick={() => requestConfirm(dev._id, "remove_member")}
                              title="Remove from workspace"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <UserMinus className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {pending && !devLoading && (
                            <button
                              onClick={() => cancelConfirm(dev._id)}
                              title="Cancel"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {pending && (
                        <ConfirmBadge
                          type={pending}
                          isLoading={devLoading}
                          onConfirm={() =>
                            pending === "remove_problem"
                              ? handleDeallocateProblem(dev)
                              : handleRemoveMember(dev)
                          }
                          onCancel={() => cancelConfirm(dev._id)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}