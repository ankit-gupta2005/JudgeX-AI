import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import {
  Terminal,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Trophy,
  SkipForward,
  FlaskConical,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import api from "../services/api";

function ContestWorkspace() {
  const { id: contestId } = useParams();
  const navigate = useNavigate();

  const [participation, setParticipation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [refreshToken, setRefreshToken] = useState(0);

  const socketRef = useRef(null);
  const pendingSubmissionIdRef = useRef(null);
  const pendingDryRunIdRef = useRef(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get(`/contests/${contestId}/participation`);
        if (!ignore) {
          setParticipation(response.data);
          if (response.data.currentProblem?.boilerplates?.javascript) {
            setCode(response.data.currentProblem.boilerplates.javascript);
          }
          setLanguage("javascript");
          setEvaluationResult(null);
          setDryRunResult(null);
          setLoading(false);
        }
      } catch {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [contestId, refreshToken]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5001", { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      const problemId = participation?.currentProblem?._id;
      if (problemId) socket.emit("join_workspace", { problemId });
    });

    socket.on("submission_update", (data) => {
      if (pendingSubmissionIdRef.current && data.problemId === participation?.currentProblem?._id) {
        setEvaluationResult(data);
        setIsSubmitting(false);
        if (data.status === "Accepted") {
          setTimeout(() => setRefreshToken((t) => t + 1), 800);
        }
      }
    });

    socket.on("dry_run_update", (data) => {
      if (pendingDryRunIdRef.current && data.dryRunId === pendingDryRunIdRef.current) {
        setDryRunResult(data);
        setIsDryRunning(false);
        pendingDryRunIdRef.current = null;
      }
    });

    return () => socket.disconnect();
   
  }, [participation?.currentProblem?._id]);

  const deadline = useMemo(() => {
    if (!participation?.stageStartedAt || !participation?.solveTimeLimit) return null;
    return new Date(participation.stageStartedAt).getTime() + participation.solveTimeLimit * 60 * 1000;
  }, [participation]);

  useEffect(() => {
    if (!deadline) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const secondsLeft = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : null;
  const isTimeUp = secondsLeft !== null && secondsLeft <= 0;

  useEffect(() => {
    if (isTimeUp && participation?.participant?.status === "in_progress") {
      api.post(`/contests/${contestId}/stages/${participation.participant.currentStageIndex}/skip`, { reason: "timeout" })
        .then(() => setRefreshToken((t) => t + 1))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimeUp]);

  const handleDryRun = async () => {
    if (!code.trim() || isDryRunning || isTimeUp) return;
    setIsDryRunning(true);
    setDryRunResult(null);
    try {
      const response = await api.post(
        `/contests/${contestId}/stages/${participation.participant.currentStageIndex}/dry-run`,
        { language, code }
      );
      pendingDryRunIdRef.current = response.data.dryRunId;
    } catch {
      setIsDryRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || isSubmitting || isTimeUp) return;
    setIsSubmitting(true);
    setEvaluationResult({ status: "Processing", message: "Evaluating..." });
    try {
      const response = await api.post(
        `/contests/${contestId}/stages/${participation.participant.currentStageIndex}/submit`,
        { language, code }
      );
      pendingSubmissionIdRef.current = response.data.submissionId;
    } catch {
      setIsSubmitting(false);
      setEvaluationResult(null);
    }
  };

  const handleSkip = async () => {
    if (!window.confirm("Skip this stage? You cannot return to it.")) return;
    await api.post(`/contests/${contestId}/stages/${participation.participant.currentStageIndex}/skip`, { reason: "manual" });
    setRefreshToken((t) => t + 1);
  };
  const handleLanguageChange = (lang) => {
  setLanguage(lang);
  if (participation?.currentProblem?.boilerplates?.[lang]) {
    setCode(participation.currentProblem.boilerplates[lang]);
  } else {
    const defaults = {
      javascript: "// Write your solution here...",
      python: "# Write your Python 3 solution here...",
      cpp: "// Write your C++ solution here...",
      java: "class Solution {\n    // Write your solution here\n}",
    };
    setCode(defaults[lang] || "");
  }
  setEvaluationResult(null);
  setDryRunResult(null);
};

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (participation?.participant?.status === "completed") {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="max-w-md mx-auto mt-24 text-center rounded-2xl border border-slate-800 bg-slate-900/50 p-10">
          <Trophy className="mx-auto h-12 w-12 text-amber-400 mb-4" />
          <h2 className="text-xl font-bold text-slate-100">Contest Completed</h2>
          <p className="text-sm text-slate-400 mt-2">
            {participation.participant.stages.filter((s) => s.status === "solved").length} / {participation.participant.totalStages} stages solved
          </p>
          <button
            onClick={() => navigate(`/contests/${contestId}/leaderboard`)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    );
  }

  const problem = participation?.currentProblem;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col h-screen overflow-hidden">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 border-r border-slate-900 bg-slate-950 p-6 overflow-y-auto space-y-5">
          <div className="flex items-center gap-2">
            {participation.participant.stages.map((s, idx) => (
              <div
                key={idx}
                className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                  s.status === "solved" ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : idx === participation.participant.currentStageIndex ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                  : s.status === "skipped" || s.status === "timed_out" ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : "bg-slate-900 border-slate-800 text-slate-600"
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {secondsLeft !== null && (
            <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-mono font-bold ${
              secondsLeft <= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse" : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
            }`}>
              {formatTime(secondsLeft)}
            </div>
          )}

          <h1 className="text-xl font-bold text-slate-100">{problem?.title}</h1>
          <p className="text-sm text-slate-300 whitespace-pre-wrap">{problem?.description}</p>

          {problem?.testCases?.length > 0 && (
            <div className="border-t border-slate-900 pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Sample Test Cases</h3>
              {problem.testCases.map((tc) => (
                <div key={tc._id} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 space-y-2 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block mb-1">Input:</span>
                    <pre className="bg-slate-950 border border-slate-900 rounded-lg p-2 text-slate-300 overflow-x-auto whitespace-pre-wrap">{tc.input}</pre>
                  </div>
                  <div>
                    <span className="text-slate-500 block mb-1">Expected Output:</span>
                    <pre className="bg-slate-950 border border-slate-900 rounded-lg p-2 text-indigo-400 overflow-x-auto whitespace-pre-wrap">{tc.expectedOutput}</pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-900">
           <select value={language}
             onChange={(e) => handleLanguageChange(e.target.value)}
             disabled={isTimeUp}
             className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed">
  <option value="javascript">JavaScript</option>
  <option value="python">Python</option>
  <option value="cpp">C++</option>
  <option value="java">Java</option>
</select>
            <div className="flex gap-2">
              <button
                onClick={handleDryRun}
                disabled={isDryRunning || isTimeUp}
                className="flex items-center gap-1.5 rounded-xl border border-slate-800 hover:bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {isDryRunning ? "Running..." : "Dry Run"}
              </button>
              <button
                onClick={handleSkip}
                disabled={isTimeUp}
                className="flex items-center gap-1 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SkipForward className="h-3.5 w-3.5" /> Skip
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isTimeUp}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-1.5 text-xs font-bold text-white disabled:bg-slate-800 disabled:text-slate-500 transition-all"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> {isSubmitting ? "Evaluating..." : "Submit"}
              </button>
            </div>
          </div>

          {isTimeUp && (
            <div className="flex items-center gap-2.5 p-3 border-b border-rose-500/20 bg-rose-500/5">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <p className="text-xs text-rose-400 font-semibold">Time's up for this stage. Advancing...</p>
            </div>
          )}

          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={language === "java" ? "java" : language}
              theme="vs-dark"
              value={code}
              onChange={(v) => !isTimeUp && setCode(v || "")}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
                readOnly: isTimeUp,
              }}
            />
          </div>

          {dryRunResult && (
            <div className="border-t border-slate-900 bg-slate-950 p-4 max-h-48 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <FlaskConical className="h-3.5 w-3.5 text-indigo-400" /> Dry Run Results
                </span>
                <span className="text-xs text-slate-500">
                  {dryRunResult.results.filter((r) => r.passed).length} / {dryRunResult.results.length} sample cases passed
                </span>
              </div>
              <div className="space-y-2">
                {dryRunResult.results.map((r, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg border p-2.5 text-xs font-mono ${
                      r.passed ? "border-emerald-500/20 bg-emerald-500/5" : "border-rose-500/20 bg-rose-500/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      {r.passed ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                      )}
                      <span className={r.passed ? "text-emerald-400" : "text-rose-400"}>
                        Case {idx + 1}: {r.status}
                      </span>
                    </div>
                    {!r.passed && (
                      <div className="text-slate-400 space-y-0.5">
                        <div>Expected: <span className="text-slate-300">{r.expectedOutput}</span></div>
                        <div>Got: <span className="text-slate-300">{r.actualOutput || "—"}</span></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-1/3 border-t border-slate-900 p-4 overflow-y-auto shrink-0">
            {evaluationResult?.status === "Accepted" && (
              <span className="text-emerald-400 flex items-center gap-1.5 text-sm font-bold">
                <CheckCircle2 className="h-4 w-4" /> Stage Solved <ChevronRight className="h-4 w-4" />
              </span>
            )}
            {evaluationResult?.status === "Wrong Answer" && (
              <span className="text-rose-400 flex items-center gap-1.5 text-sm font-bold">
                <XCircle className="h-4 w-4" /> Wrong Answer
              </span>
            )}
            {evaluationResult?.status === "Processing" && (
              <span className="text-indigo-400 flex items-center gap-1.5 text-sm animate-pulse">
                <Terminal className="h-4 w-4" /> Evaluating...
              </span>
            )}
            {["Runtime Error", "Time Limit Exceeded", "Compilation Error"].includes(evaluationResult?.status) && (
              <span className="text-amber-400 flex items-center gap-1.5 text-sm font-bold">
                <AlertTriangle className="h-4 w-4" /> {evaluationResult.status}
              </span>
            )}
            {evaluationResult?.message && (
              <p className="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{evaluationResult.message}</p>
            )}
            {!evaluationResult && (
              <p className="text-xs text-slate-600 italic text-center py-6">
                Run a dry test against sample cases, then submit when ready.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContestWorkspace;