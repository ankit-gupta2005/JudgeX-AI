import { useState, useEffect } from "react";
import { UserPlus, Mail, ShieldAlert, CheckCircle2, Users, ArrowRight, Award, PlusCircle, Building, Link2 } from "lucide-react";
import api from "../services/api";

export default function OrgSettings() {
  const [developerEmail, setDeveloperEmail] = useState("");
  const [selectedProblemId, setSelectedProblemId] = useState("");
  const [developersList, setDevelopersList] = useState([]);
  const [problemsList, setProblemsList] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function initializeWorkspaceData() {
      try {
        const [devsResponse, problemsResponse] = await Promise.all([
          api.get("/org/developers"),
          api.get("/problems")
        ]);

        if (isMounted) {
          const extractedDevs = Array.isArray(devsResponse.data) 
            ? devsResponse.data 
            : devsResponse.data?.developers || [];
            
          const extractedProblems = Array.isArray(problemsResponse.data) 
            ? problemsResponse.data 
            : problemsResponse.data?.problems || [];

          setDevelopersList(extractedDevs);
          setProblemsList(extractedProblems);
        }
      } catch (err) {
        console.error("Failed to sync workspace directories.", err);
      }
    }

    initializeWorkspaceData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      const [devsResponse, problemsResponse] = await Promise.all([
        api.get("/org/developers"),
        api.get("/problems")
      ]);
      
      const extractedDevs = Array.isArray(devsResponse.data) 
        ? devsResponse.data 
        : devsResponse.data?.developers || [];
        
      const extractedProblems = Array.isArray(problemsResponse.data) 
        ? problemsResponse.data 
        : problemsResponse.data?.problems || [];

      setDevelopersList(extractedDevs);
      setProblemsList(extractedProblems);
    } catch (err) {
      console.error("Failed to manual re-sync workspace directories.", err);
    }
  };

  const handleAllocateTest = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!selectedProblemId || !developerEmail) {
      setError("Please select a problem and enter a valid user email.");
      return;
    }
    setIsLoading(true);

    try {
      const response = await api.post("/problems/allocate", { 
        problemId: selectedProblemId, 
        developerEmail: developerEmail.trim().toLowerCase() 
      });
      setSuccess(response.data.message || "Test successfully assigned to the user.");
      setDeveloperEmail("");
      setSelectedProblemId("");
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to assign the test.");
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
      const response = await api.post("/org/add-member", { email: developerEmail });
      setSuccess(response.data.message || "Team member successfully added.");
      setDeveloperEmail("");
      await handleManualRefresh();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add team member.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Main Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Control Panel</h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your organization, assign coding assessments to candidates, and monitor your current team roster.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-xl max-w-sm shrink-0">
            <Building className="h-5 w-5 text-indigo-400 shrink-0" />
            <div className="truncate">
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Active Company Account</p>
              <h4 className="text-sm font-semibold text-slate-200 truncate">Verified Organization Network</h4>
            </div>
          </div>
        </div>

        {/* Global Notifications Alert Guard */}
        {(error || success) && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-200">
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

        {/* Dynamic Two-Column Workspace Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT COLUMN: Actions Forms Layer Panel */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Form Module: Assign Test */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Assign Coding Test</h2>
              </div>
              <p className="text-xs text-slate-400">Select an assessment challenge from your library and invite a candidate to take it via email.</p>

              <form onSubmit={handleAllocateTest} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Choose Coding Problem</label>
                  <select
                    value={selectedProblemId}
                    onChange={(e) => setSelectedProblemId(e.target.value)}
                    className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm mt-2 transition-colors cursor-pointer"
                  >
                    <option value="">-- Select from Problem Bank --</option>
                    {Array.isArray(problemsList) && problemsList.map((prob) => (
                      <option key={prob?._id} value={prob?._id}>
                        {prob?.title || "Untitled Test"} [{prob?.difficulty || "General"}]
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Candidate Email Address</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={developerEmail}
                      onChange={(e) => setDeveloperEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="candidate@email.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-md active:scale-[0.98]"
                >
                  <PlusCircle className="h-4 w-4" />
                  Send Test Invite
                </button>
              </form>
            </div>

            {/* Form Module: Add Member */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Add New Team Member</h2>
              </div>
              <p className="text-xs text-slate-400">Add an existing registered developer directly into your organization workspace roster.</p>

              <form onSubmit={handleAddDeveloper} className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Member Email</label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={developerEmail}
                      onChange={(e) => setDeveloperEmail(e.target.value)}
                      className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-10 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
                      placeholder="team-member@company.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group flex w-full justify-center items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  Add to Organization
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: Directory Cards Layer Panels */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Onboarding Invitation Token Panel */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Link2 className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold">Team Invitation Link</h2>
              </div>
              <p className="text-xs text-slate-400">Provide this secure token registration hash to users to grant automatic roster clearance during signup.</p>
              <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl text-xs font-mono text-slate-400 select-all tracking-wide break-all border-dashed text-center">
                JUGDEX-WORKSPACE-INVITE-TOKEN-HASH-DEFAULT
              </div>
            </div>

            {/* Registered Team Members List */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-semibold">Registered Team Directory</h2>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-medium">
                  {developersList.length} Active Members
                </span>
              </div>

              {!Array.isArray(developersList) || developersList.length === 0 ? (
                <div className="text-center py-16 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20 text-sm">
                  No active members bound to your organization account yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-120 overflow-y-auto pr-1">
                  {developersList.map((dev) => (
                    <div 
                      key={dev?._id} 
                      className="p-4 bg-slate-950 border border-slate-900 rounded-xl hover:border-slate-800 transition-all flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {dev?.name || "Team Member"}
                        </h3>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {dev?.email || "No Email"}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-md bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 shrink-0">
                        Developer
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}