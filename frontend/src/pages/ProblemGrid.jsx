import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Code2, Plus, SlidersHorizontal, Layers, AlertCircle, Trash2, ChevronDown, Building2, Timer, Sparkles, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import Navbar from "../components/common/Navbar";
import ProblemRow from "../components/problems/ProblemRow";
import api from "../services/api";

function groupProblemsByOrganization(problems) {
  const groups = {};
  problems.forEach((problem) => {
    const orgName = problem.organization?.name || "Global Challenges";
    if (!groups[orgName]) groups[orgName] = [];
    groups[orgName].push(problem);
  });
  return groups;
}

function DeveloperProblemList({ problems, onLaunchSandbox }) {
  const grouped = groupProblemsByOrganization(problems);
  const orgNames = Object.keys(grouped).sort();

  const [selectedOrg, setSelectedOrg] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOrg = orgNames.includes(selectedOrg) ? selectedOrg : orgNames[0];
  const activeProblems = grouped[activeOrg] || [];

  return (
    <div className="space-y-6">
      <div className="relative inline-block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full min-w-65 items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-2.5 text-sm font-semibold text-slate-100 transition-all hover:border-slate-700 hover:bg-slate-900"
        >
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-indigo-400" />
            <span>{activeOrg || "No organizations"}</span>
          </span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
              {activeProblems.length}
            </span>
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {isOpen && orgNames.length > 0 && (
          <div className="absolute z-10 mt-2 w-full min-w-65 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-2xl shadow-black/40">
            {orgNames.map((orgName) => (
              <button
                key={orgName}
                type="button"
                onClick={() => {
                  setSelectedOrg(orgName);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                  orgName === activeOrg
                    ? "bg-indigo-600/10 text-indigo-300"
                    : "text-slate-300 hover:bg-slate-800/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                  {orgName}
                </span>
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-400">
                  {grouped[orgName].length}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">Challenge Title Mapping</th>
              <th className="px-6 py-4">Difficulty Level</th>
              <th className="px-6 py-4">Topic Categorization Tags</th>
              <th className="px-6 py-4 text-right">Action Gate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
            {activeProblems.map((problem) => (
              <ProblemRow
                key={problem?._id}
                problem={problem}
                onLaunchSandbox={onLaunchSandbox}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProblemGrid() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userRole] = useState(localStorage.getItem("role") || "developer");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProblemId, setEditingProblemId] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("Easy");
  const [tags, setTags] = useState("");
  const [timeLimit, setTimeLimit] = useState(2000);
  const [memoryLimit, setMemoryLimit] = useState(512);
  const [solveTimeLimit, setSolveTimeLimit] = useState("");
  const [testCases, setTestCases] = useState([{ input: "", expectedOutput: "", isSample: true }]);

  const [activeTab, setActiveTab] = useState("javascript");
  const [boilerplates, setBoilerplates] = useState({
    javascript: `function solution(nums, target) {\n  // Write your code here\n  return [];\n}`,
    python: `def solution(nums, target):\n    # Write your code here\n    return []`,
    cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        return {};\n    }\n};`,
    java: `class Solution {\n    public int[] solution(int[] nums, int target) {\n        return new int[0];\n    }\n}`
  });

  const [drivers, setDrivers] = useState({
    javascript: "",
    python: "",
    cpp: "",
    java: ""
  });

  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingDrivers, setIsGeneratingDrivers] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [aiGeneratedFlag, setAiGeneratedFlag] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [isValidating, setIsValidating] = useState(false);
  const [driverFailures, setDriverFailures] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchChallenges = async () => {
      try {
        const response = await api.get("/problems");
        if (isMounted) {
          const extractedProblems = Array.isArray(response.data)
            ? response.data
            : response.data?.problems || [];

          setProblems(extractedProblems);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError("Failed to retrieve coding problems matrix from core endpoint.");
          setLoading(false);
        }
      }
    };

    fetchChallenges();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      const response = await api.get("/problems");
      const extractedProblems = Array.isArray(response.data)
        ? response.data
        : response.data?.problems || [];
      setProblems(extractedProblems);
    } catch (err) {
      console.error("Failed to re-sync coding problems matrix:", err);
    }
  };

  const handleLaunchSandbox = (problemId) => {
    navigate(`/workspace/${problemId}`);
  };

  const handleTriggerEditFlow = async (problemId) => {
    try {
      setError("");
      const response = await api.get(`/problems/${problemId}`);
      const problem = response.data;

      setEditingProblemId(problemId);
      setTitle(problem.title || "");
      setDescription(problem.description || "");
      setDifficulty(problem.difficulty || "Easy");
      setTags(Array.isArray(problem.tags) ? problem.tags.join(", ") : "");
      setTimeLimit(problem.timeLimit || 2000);
      setMemoryLimit(problem.memoryLimit || 512);
      setSolveTimeLimit(problem.solveTimeLimit ? String(problem.solveTimeLimit) : "");
      setAiGeneratedFlag(false);
      setValidationReport(null);
      setDriverFailures([]);

      if (problem.boilerplates) {
        setBoilerplates(prev => ({ ...prev, ...problem.boilerplates }));
      }
      if (problem.drivers) {
        setDrivers(prev => ({ ...prev, ...problem.drivers }));
      }
      if (Array.isArray(problem.testCases) && problem.testCases.length > 0) {
        setTestCases(problem.testCases);
      }

      setShowCreateModal(true);
    } catch {
      setError("Failed to parse full workspace attributes for customization staging.");
    }
  };

  const handleDeleteProblem = async (problemId) => {
    setError("");
    const confirmPurge = window.confirm("Are you sure you want to permanently delete this challenge from the registry?");
    if (!confirmPurge) return;

    try {
      await api.delete(`/problems/${problemId}`);
      setProblems(prev => prev.filter(p => p._id !== problemId));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete the challenge.");
    }
  };

  const handleAddTestCaseRow = () => {
    setTestCases([...testCases, { input: "", expectedOutput: "", isSample: false }]);
  };

  const handleRemoveTestCaseRow = (index) => {
    if (testCases.length === 1) return;
    setTestCases(testCases.filter((_, idx) => idx !== index));
  };

  const handleTestCaseChange = (index, field, value) => {
    const updated = [...testCases];
    updated[index][field] = value;
    setTestCases(updated);
  };

  const handleUpdateBoilerplateText = (lang, value) => {
    setBoilerplates((prev) => ({ ...prev, [lang]: value }));
  };

  const handleUpdateDriverText = (lang, value) => {
    setDrivers((prev) => ({ ...prev, [lang]: value }));
  };

  const resetFormState = () => {
    setEditingProblemId(null);
    setTitle("");
    setDescription("");
    setTags("");
    setTimeLimit(2000);
    setMemoryLimit(512);
    setSolveTimeLimit("");
    setDrivers({ javascript: "", python: "", cpp: "", java: "" });
    setTestCases([{ input: "", expectedOutput: "", isSample: true }]);
    setAiPrompt("");
    setShowAiPanel(false);
    setAiGeneratedFlag(false);
    setValidationReport(null);
    setDriverFailures([]);
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    setError("");
    setValidationReport(null);
    setDriverFailures([]);

    try {
      const response = await api.post("/ai/generate-problem", { prompt: aiPrompt });
      const generated = response.data.problem;

      setTitle(generated.title || "");
      setDescription(generated.description || "");
      setDifficulty(generated.difficulty || "Easy");
      setTags(Array.isArray(generated.tags) ? generated.tags.join(", ") : "");
      setBoilerplates((prev) => ({ ...prev, ...generated.boilerplates }));

      const newTestCases = Array.isArray(generated.testCases)
        ? generated.testCases.map((tc) => ({
            input: tc.input || "",
            expectedOutput: tc.expectedOutput || "",
            isSample: !!tc.isSample,
          }))
        : [];
      setTestCases(newTestCases);

      setAiGeneratedFlag(true);
      setShowAiPanel(false);
      setAiPrompt("");
    } catch (err) {
      setError(err.response?.data?.message || "AI generation failed. Try rephrasing your prompt.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateDrivers = async () => {
  const sampleTestCase = testCases.find((tc) => tc.isSample && tc.input && tc.expectedOutput);
  if (!sampleTestCase) {
    setError("Add at least one sample test case with input and expected output before generating drivers.");
    return;
  }

  setIsGeneratingDrivers(true);
  setError("");
  setDriverFailures([]);

  try {
    const response = await api.post("/ai/generate-drivers", { boilerplates, sampleTestCase });
    const generatedDrivers = response.data.drivers || {};
    const failures = response.data.failures || [];

    setDrivers((prev) => ({ ...prev, ...generatedDrivers }));
    setAiGeneratedFlag(true);
    setDriverFailures(failures);

    if (failures.length > 0) {
      setError(
        `AI generated drivers for ${Object.keys(generatedDrivers).join(", ") || "none"}, but failed for: ${failures.join(", ")}. Write those manually below.`
      );
    }
  } catch (err) {
    setError(err.response?.data?.message || "Driver generation failed. Try writing drivers manually.");
  } finally {
    setIsGeneratingDrivers(false);
  }
};

  const handleCreateProblemSubmit = async (e) => {
    e.preventDefault();
    try {
      const parsedTags = typeof tags === "string" ? tags.split(",").map((t) => t.trim()).filter(Boolean) : tags;
      const payload = {
        title,
        description,
        difficulty,
        tags: parsedTags,
        timeLimit: Number(timeLimit),
        memoryLimit: Number(memoryLimit),
        solveTimeLimit: solveTimeLimit ? Number(solveTimeLimit) : null,
        boilerplates,
        drivers,
        testCases,
      };

      if (editingProblemId) {
        await api.put(`/problems/${editingProblemId}`, payload);
      } else {
        await api.post("/problems", payload);
      }

      setShowCreateModal(false);
      resetFormState();
      setLoading(true);
      await handleManualRefresh();
      setLoading(false);
    } catch (err) {
      alert(err.response?.data?.message || "Error submitting target problem blueprint configuration");
    }
  };

  const hasNoHiddenTestCases = aiGeneratedFlag && testCases.length > 0 && testCases.every((tc) => tc.isSample);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-900 pb-6 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
              <Code2 className="text-indigo-400 h-6 w-6" />
              <span>Challenge Architecture Registry</span>
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Select an isolated multi-tenant execution track or construct unique problems.
            </p>
          </div>

          {(userRole === "org_admin" || userRole === "super_admin") && (
            <button
              onClick={() => {
                resetFormState();
                setShowCreateModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/10 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Programming Challenge</span>
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 mb-6">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm text-slate-500">Parsing multi-tenant matrix catalogs...</p>
          </div>
        ) : !Array.isArray(problems) || problems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-sm font-semibold text-slate-200">No challenge nodes loaded</h3>
            <p className="mt-1 text-sm text-slate-500">
              Your organization environment has not provisioned any code assessment parameters.
            </p>
          </div>
        ) : userRole === "developer" ? (
          <DeveloperProblemList problems={problems} onLaunchSandbox={handleLaunchSandbox} />
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-6 py-4">Challenge Title Mapping</th>
                  <th className="px-6 py-4">Difficulty Level</th>
                  <th className="px-6 py-4">Topic Categorization Tags</th>
                  <th className="px-6 py-4 text-right">Action Gate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
                {problems.map((problem) => (
                  <ProblemRow
                    key={problem?._id}
                    problem={problem}
                    onLaunchSandbox={handleLaunchSandbox}
                    onDeleteProblem={handleDeleteProblem}
                    onTriggerEditFlow={handleTriggerEditFlow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6 md:p-8 shadow-2xl my-8">
              <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
                <SlidersHorizontal className="text-indigo-400 h-5 w-5" />
                <span>{editingProblemId ? "Modify Problem Blueprint" : "Configure New Evaluation Problem"}</span>
              </h3>

              {!editingProblemId && (
                <div className="mb-6">
                  {!showAiPanel ? (
                    <button
                      type="button"
                      onClick={() => setShowAiPanel(true)}
                      className="flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 transition-all w-full sm:w-auto"
                    >
                      <Sparkles className="h-4 w-4" />
                      Generate with AI
                    </button>
                  ) : (
                    <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-4 space-y-3">
                      <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Describe the problem you want
                      </label>
                      <textarea
                        rows={2}
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. medium difficulty array problem about finding pairs that sum to a target"
                        className="block w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleGenerateWithAI}
                          disabled={isGenerating || !aiPrompt.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 text-xs font-bold transition-all"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          {isGenerating ? "Generating..." : "Generate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAiPanel(false);
                            setAiPrompt("");
                          }}
                          className="text-xs font-semibold text-slate-500 hover:text-slate-300"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-600">
                        Generates title, description, tags, boilerplates and sample test cases. Use "Generate Drivers with AI" afterwards to produce drivers and run validation.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {aiGeneratedFlag && (
                <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
                  <Sparkles className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-400 leading-relaxed">
                    AI-generated draft — review the description and mark hidden test cases below. See the validation report for driver correctness.
                  </p>
                </div>
              )}

              {isValidating && (
                <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-3.5">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent shrink-0" />
                  <p className="text-xs text-indigo-400">
                    Running generated drivers against a sample case for each successfully generated language...
                  </p>
                </div>
              )}

              {validationReport && (
                <div className="mb-5 rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Driver Validation Report
                  </p>
                  {["javascript", "python", "cpp", "java"].map((lang) => {
                    const entry = validationReport.report?.[lang];
                    const wasSkipped = driverFailures.includes(lang) && !entry;
                    if (!entry && !wasSkipped) return null;
                    const compileOk = entry && !["Compilation Error", "Runtime Error", "Timeout"].includes(entry.status);
                    return (
                      <div
                        key={lang}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs ${
                          wasSkipped
                            ? "bg-slate-900/40 border border-slate-800"
                            : compileOk
                            ? "bg-emerald-500/5 border border-emerald-500/20"
                            : "bg-rose-500/5 border border-rose-500/20"
                        }`}
                      >
                        <span className="font-mono capitalize text-slate-300 flex items-center gap-1.5">
                          {wasSkipped ? (
                            <AlertTriangle className="h-3.5 w-3.5 text-slate-500" />
                          ) : compileOk ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          {lang === "cpp" ? "C++" : lang}
                        </span>
                        <span className={wasSkipped ? "text-slate-500" : compileOk ? "text-emerald-400" : "text-rose-400"}>
                          {wasSkipped ? "AI generation failed — write manually" : compileOk ? "Runs correctly" : `${entry.status} — needs manual fix`}
                        </span>
                      </div>
                    );
                  })}
                  {!validationReport.allLanguagesPassed && (
                    <p className="text-[11px] text-amber-400 pt-1">
                      Some languages need manual driver fixes before this problem is safe to publish. Switch to the affected language tab, correct the driver, then re-test with Dry Run in the workspace.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleCreateProblemSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Title Header</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Reverse Linked List Core"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Difficulty Grade</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="Easy">Easy Level</option>
                      <option value="Medium">Medium Level</option>
                      <option value="Hard">Hard Level</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Context Markdown Description
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 p-4 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                    placeholder="Provide complete parameter constraints, edge behaviors, and clear algorithmic prompt definitions..."
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Categorization Tags (Comma Delimited)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="Linked-List, Pointers, Algorithms"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Time Execution Cap (ms)
                    </label>
                    <input
                      type="number"
                      required
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Memory Envelope Cap (MB)
                    </label>
                    <input
                      type="number"
                      required
                      value={memoryLimit}
                      onChange={(e) => setMemoryLimit(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5 text-indigo-400" />
                      Solve Time Limit (min, optional)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={solveTimeLimit}
                      onChange={(e) => setSolveTimeLimit(e.target.value)}
                      placeholder="Untimed"
                      className="mt-1.5 block w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Starting Function Boilerplates & Drivers
                      </label>
                      <div className="rounded-xl border border-slate-850 bg-slate-950/60 p-1 flex gap-2 w-max">
                        {["javascript", "python", "cpp", "java"].map((lang) => {
                          const langFailed =
                            (validationReport?.report?.[lang] &&
                              ["Compilation Error", "Runtime Error", "Timeout"].includes(
                                validationReport.report[lang].status
                              )) ||
                            driverFailures.includes(lang);
                          return (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setActiveTab(lang)}
                              className={`relative px-3 py-1 rounded-lg text-xs font-mono capitalize transition-all ${
                                activeTab === lang
                                  ? "bg-slate-800 border border-slate-700 text-indigo-400"
                                  : "text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              {lang === "cpp" ? "C++" : lang === "java" ? "Java" : lang}
                              {langFailed && (
                                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-rose-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGenerateDrivers}
                      disabled={isGeneratingDrivers || isValidating}
                      className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/5 hover:bg-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-semibold text-indigo-400 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {isGeneratingDrivers
                        ? "Generating..."
                        : isValidating
                        ? "Validating..."
                        : "Generate Drivers with AI"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Boilerplate (Visible to Candidate)
                      </label>
                      <textarea
                        rows={6}
                        value={boilerplates[activeTab]}
                        onChange={(e) => handleUpdateBoilerplateText(activeTab, e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 p-3 mt-1.5 text-slate-200 font-mono text-xs focus:border-indigo-500 focus:outline-none whitespace-pre"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Hidden Driver main() Code (Optional)
                      </label>
                      <textarea
                        rows={6}
                        value={drivers[activeTab]}
                        onChange={(e) => handleUpdateDriverText(activeTab, e.target.value)}
                        className="block w-full rounded-xl border border-slate-800 bg-slate-950 p-3 mt-1.5 text-slate-400 font-mono text-xs focus:border-indigo-500 focus:outline-none whitespace-pre"
                        placeholder="// Leave empty to use system default parser template..."
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Verification Assertions Sandbox Array
                    </label>
                    <button
                      type="button"
                      onClick={handleAddTestCaseRow}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Case Tuple
                    </button>
                  </div>

                  {hasNoHiddenTestCases && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                      <p className="text-[11px] text-amber-400">
                        All test cases are currently visible to candidates. Uncheck "Sample UI trace" on at least one to keep it hidden for grading.
                      </p>
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
                    {testCases.map((tc, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 gap-2 rounded-xl bg-slate-950 p-3 border border-slate-800 sm:grid-cols-12 items-center relative"
                      >
                        <div className="sm:col-span-5">
                          <textarea
                            rows={1}
                            required
                            placeholder="Raw Console Input parameters"
                            value={tc.input}
                            onChange={(e) => handleTestCaseChange(index, "input", e.target.value)}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono resize-none"
                          />
                        </div>
                        <div className="sm:col-span-4">
                          <textarea
                            rows={1}
                            required
                            placeholder="Expected String Output assertion"
                            value={tc.expectedOutput}
                            onChange={(e) => handleTestCaseChange(index, "expectedOutput", e.target.value)}
                            className="w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs text-slate-100 focus:border-indigo-500 focus:outline-none font-mono resize-none"
                          />
                        </div>
                        <div className="sm:col-span-3 flex items-center justify-between pl-2">
                          <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={tc.isSample}
                              onChange={(e) => handleTestCaseChange(index, "isSample", e.target.checked)}
                              className="rounded border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0"
                            />
                            <span>Sample UI trace</span>
                          </label>
                          {testCases.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveTestCaseRow(index)}
                              className="text-rose-500 hover:text-rose-400 p-1"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-800 pt-5 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      resetFormState();
                    }}
                    className="rounded-xl border border-slate-800 bg-transparent px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10"
                  >
                    {editingProblemId ? "Update Problem Node" : "Commit Problem Node"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ProblemGrid;