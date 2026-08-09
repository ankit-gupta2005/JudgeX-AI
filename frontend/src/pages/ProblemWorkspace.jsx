import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { io } from "socket.io-client";
import { Terminal, Play, CheckCircle2, XCircle, AlertTriangle, Clock, Cpu, ChevronLeft, Layers, Timer, RotateCcw, GripVertical, GripHorizontal, ChevronsLeft, ChevronsRight, ChevronsUp, ChevronsDown } from "lucide-react";
import Navbar from "../components/common/Navbar";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";

const MIN_LEFT_PCT = 20;
const MAX_LEFT_PCT = 70;
const MIN_CONSOLE_PCT = 10;
const MAX_CONSOLE_PCT = 70;

function ProblemWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [activeCaseIdx, setActiveCaseIdx] = useState(0);

  const [now, setNow] = useState(() => Date.now());
  const [restartToken, setRestartToken] = useState(0);
  const [isRestarting, setIsRestarting] = useState(false);

  const [leftWidthPct, setLeftWidthPct] = useState(45);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [consoleHeightPct, setConsoleHeightPct] = useState(33);
  const [consoleCollapsed, setConsoleCollapsed] = useState(false);

  const socketRef = useRef(null);
  const pendingSubmissionIdRef = useRef(null);
  const codeRef = useRef("");
  const languageRef = useRef("javascript");
  const splitContainerRef = useRef(null);
  const rightPanelRef = useRef(null);
  const isDraggingHRef = useRef(false);
  const isDraggingVRef = useRef(false);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    let isMounted = true;

    const fetchProblemData = async () => {
      try {
        const response = await api.get(`/problems/${id}`);
        if (isMounted) {
          const targetProblemData = response.data?.problem
            ? response.data.problem
            : response.data;
          setProblem(targetProblemData);

          if (targetProblemData?.boilerplates?.javascript) {
            setCode(targetProblemData.boilerplates.javascript);
          } else {
            setCode("// Write your solution here...");
          }

          setLanguage("javascript");
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setError("Failed to fetch problem definition rules.");
          setLoading(false);
        }
      }
    };

    fetchProblemData();
    return () => { isMounted = false; };
  }, [id]);

  const getTimerStorageKey = () => `judgex_timer_${id}_${user?._id || user?.id}`;

  const timerConfig = useMemo(() => {
    if (!problem?.solveTimeLimit) return null;

    const storageKey = getTimerStorageKey();
    const totalSeconds = problem.solveTimeLimit * 60;

    let startedAtStr = localStorage.getItem(storageKey);
    if (!startedAtStr) {
      // eslint-disable-next-line react-hooks/purity
      startedAtStr = Date.now().toString();
      localStorage.setItem(storageKey, startedAtStr);
    }

    return { totalSeconds, startedAt: Number(startedAtStr), storageKey };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problem, id, user, restartToken]);

  useEffect(() => {
    if (!timerConfig) return;

    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [timerConfig]);

  const timeRemaining = timerConfig
    ? Math.max(0, timerConfig.totalSeconds - Math.floor((now - timerConfig.startedAt) / 1000))
    : null;
  const isTimeUp = timerConfig ? timeRemaining <= 0 : false;

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5001", {
      transports: ["websocket"],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      const token = localStorage.getItem("token");
      socket.emit("join_workspace", { problemId: id, token });
    });

    socket.on("reconnect", () => {
      const token = localStorage.getItem("token");
      socket.emit("join_workspace", { problemId: id, token });
    });

    socket.on("submission_update", (data) => {
      if (data.problemId === id) {
        setEvaluationResult(data);
        if (data.status !== "Processing") {
          setIsSubmitting(false);
          pendingSubmissionIdRef.current = null;
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    let fallbackIntervalId;

    if (isSubmitting) {
      const pollStartDelay = setTimeout(() => {
        fallbackIntervalId = setInterval(async () => {
          try {
            const submissionId = pendingSubmissionIdRef.current;
            if (!submissionId) return;

            const statusResponse = await api.get(`/submissions/${submissionId}`);
            const record = statusResponse.data?.submission;

            if (record && record.status !== "Pending" && record.status !== "Running" && record.status !== "Processing") {
              setEvaluationResult({
                status: record.status,
                problemId: id,
                message: record.errorLog || "All verification testing assertions evaluated successfully.",
                metrics: {
                  runtime: record.executionTime || 0,
                  memory: record.memoryUsed || 512,
                },
              });
              setIsSubmitting(false);
              pendingSubmissionIdRef.current = null;
              clearInterval(fallbackIntervalId);
            }
          } catch (err) {
            console.error("Fallback poll error:", err.message);
          }
        }, 1500);
      }, 4000);

      return () => {
        clearTimeout(pollStartDelay);
        if (fallbackIntervalId) clearInterval(fallbackIntervalId);
      };
    }
  }, [isSubmitting, id]);

  // --- Horizontal resize (left description panel vs right editor panel) ---
  const handleHorizontalDragStart = useCallback(() => {
    if (leftCollapsed) return;
    isDraggingHRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, [leftCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingHRef.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(MAX_LEFT_PCT, Math.max(MIN_LEFT_PCT, pct));
      setLeftWidthPct(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingHRef.current) {
        isDraggingHRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // --- Vertical resize (editor vs console output panel) ---
  const handleVerticalDragStart = useCallback(() => {
    if (consoleCollapsed) return;
    isDraggingVRef.current = true;
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
  }, [consoleCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingVRef.current || !rightPanelRef.current) return;
      const rect = rightPanelRef.current.getBoundingClientRect();
      const pct = ((rect.bottom - e.clientY) / rect.height) * 100;
      const clamped = Math.min(MAX_CONSOLE_PCT, Math.max(MIN_CONSOLE_PCT, pct));
      setConsoleHeightPct(clamped);
    };

    const handleMouseUp = () => {
      if (isDraggingVRef.current) {
        isDraggingVRef.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (problem?.boilerplates?.[lang]) {
      setCode(problem.boilerplates[lang]);
    } else {
      const defaults = {
        python: "# Write your Python 3 solution here...",
        cpp: "// Write your C++ solution here...",
        javascript: "// Write your solution here...",
        java: "class Solution {\n    public int[] solution(int[] nums, int target) {\n        \n    }\n}"
      };
      setCode(defaults[lang] || "");
    }
  };

  const handleExecuteCodeSubmit = async () => {
    if (!code.trim() || isTimeUp) return;

    setIsSubmitting(true);
    setEvaluationResult({
      status: "Processing",
      message: "Queuing code payload across worker matrix...",
    });
    pendingSubmissionIdRef.current = null;

    try {
      const response = await api.post("/submissions", {
        problemId: id,
        language,
        code,
      });

      if (response.data?.submissionId) {
        pendingSubmissionIdRef.current = response.data.submissionId;
      }
    } catch {
      setError("Execution request rejected by safety rate limit or routing gate.");
      setIsSubmitting(false);
      setEvaluationResult(null);
    }
  };

  const handleRestartProblem = async () => {
    setIsRestarting(true);

    try {
      await api.post("/submissions/timeout", {
        problemId: id,
        language: languageRef.current,
        code: codeRef.current,
      });
    } catch (err) {
      console.error("Failed to log timeout event:", err.message);
    }

    localStorage.setItem(getTimerStorageKey(), Date.now().toString());
    setNow(Date.now());
    setRestartToken((t) => t + 1);
    setEvaluationResult(null);

    if (problem?.boilerplates?.[language]) {
      setCode(problem.boilerplates[language]);
    } else {
      setCode("// Write your solution here...");
    }

    setIsRestarting(false);
  };

  const formatTime = (totalSeconds) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const s = (totalSeconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-slate-500 font-mono text-xs">
            Mounting workspace...
          </p>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-slate-950 px-4">
        <Navbar />
        <div className="mx-auto max-w-md p-8 text-center mt-20 border border-slate-800 bg-slate-900/50 rounded-2xl">
          <AlertTriangle className="mx-auto h-12 w-12 text-rose-500 mb-4" />
          <h3 className="text-lg font-bold text-slate-200">Workspace Error</h3>
          <p className="text-sm text-slate-400 mt-2">
            {error || "Requested challenge could not be localized."}
          </p>
          <button
            onClick={() => navigate("/problems")}
            className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:underline"
          >
            <ChevronLeft className="h-4 w-4" /> Return to challenges
          </button>
        </div>
      </div>
    );
  }

  const sampleTestCases = Array.isArray(problem?.testCases)
    ? problem.testCases.filter((tc) => tc.isSample)
    : [];

  const isLowTime = timeRemaining !== null && timeRemaining <= 60 && timeRemaining > 0;

  const effectiveLeftPct = leftCollapsed ? 3 : leftWidthPct;
  const effectiveConsolePct = consoleCollapsed ? 0 : consoleHeightPct;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col h-screen overflow-hidden">
      <Navbar />

      <div ref={splitContainerRef} className="flex-1 flex flex-col md:flex-row overflow-hidden md:h-full">
        {/* Left Panel: Description & Test Cases */}
        <div
          className="w-full md:h-full border-b md:border-b-0 md:border-r border-slate-900 bg-slate-950 overflow-hidden flex flex-col relative"
          style={{ flexBasis: `${effectiveLeftPct}%`, minWidth: leftCollapsed ? "0" : undefined }}
        >
          <button
            type="button"
            onClick={() => setLeftCollapsed((prev) => !prev)}
            className="hidden md:flex absolute top-3 right-2 z-10 h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
            title={leftCollapsed ? "Expand description panel" : "Collapse description panel"}
          >
            {leftCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
          </button>

          {!leftCollapsed && (
            <div className="p-4 sm:p-6 overflow-y-auto flex flex-col space-y-5 sm:space-y-6 flex-1">
              <div>
                <button
                  onClick={() => navigate("/problems")}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-300 transition-colors mb-4"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back to Catalog
                </button>
                <div className="flex items-start justify-between gap-3 pr-6">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
                    {problem.title}
                  </h1>

                  {problem.solveTimeLimit && timeRemaining !== null && (
                    <span
                      className={`shrink-0 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-mono font-bold whitespace-nowrap ${
                        isTimeUp
                          ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                          : isLowTime
                          ? "text-amber-400 bg-amber-500/10 border-amber-500/20 animate-pulse"
                          : "text-indigo-400 bg-indigo-500/10 border-indigo-500/20"
                      }`}
                    >
                      <Timer className="h-4 w-4" />
                      {isTimeUp ? "Time's Up" : formatTime(timeRemaining)}
                    </span>
                  )}
                </div>
                <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${
                      problem.difficulty === "Easy"
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : problem.difficulty === "Medium"
                        ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                        : "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    }`}
                  >
                    {problem.difficulty}
                  </span>
                  <div className="flex gap-x-2.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {problem.timeLimit}ms
                    </span>
                    <span className="flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5" /> {problem.memoryLimit}MB
                    </span>
                    {problem.solveTimeLimit && (
                      <span className="flex items-center gap-1">
                        <Timer className="h-3.5 w-3.5" /> {problem.solveTimeLimit} min limit
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-t border-slate-900 pt-5 sm:pt-6">
                {problem.description}
              </div>

              <div className="border-t border-slate-900 pt-5 sm:pt-6 space-y-4">
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Layers className="h-4.5 w-4.5 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Sample Test Cases
                  </h3>
                </div>

                {sampleTestCases.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono italic px-1">
                    No sample assertions assigned to this environment.
                  </p>
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 border-b border-slate-900 pb-2.5">
                      {sampleTestCases.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveCaseIdx(idx)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all ${
                            activeCaseIdx === idx
                              ? "bg-slate-900 text-indigo-400 border border-slate-800"
                              : "text-slate-500 hover:text-slate-300 hover:bg-slate-900/40"
                          }`}
                        >
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>

                    {sampleTestCases[activeCaseIdx] && (
                      <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 sm:p-4 space-y-3 font-mono text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold block mb-1.5">
                            Standard Input (stdin):
                          </span>
                          <pre className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-slate-300 overflow-x-auto whitespace-pre-wrap">
                            {sampleTestCases[activeCaseIdx].input}
                          </pre>
                        </div>
                        <div>
                          <span className="text-slate-500 font-semibold block mb-1.5">
                            Expected Output:
                          </span>
                          <pre className="bg-slate-950 border border-slate-900 rounded-lg p-2.5 text-indigo-400 overflow-x-auto whitespace-pre-wrap">
                            {sampleTestCases[activeCaseIdx].expectedOutput}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Horizontal drag handle (desktop only) */}
        {!leftCollapsed && (
          <div
            onMouseDown={handleHorizontalDragStart}
            className="hidden md:flex w-1.5 shrink-0 cursor-col-resize items-center justify-center bg-slate-900 hover:bg-indigo-500/30 transition-colors group relative"
          >
            <div className="absolute inset-y-0 -left-1 -right-1" />
            <GripVertical className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
          </div>
        )}

        {/* Right Panel: Editor & Console */}
        <div
          ref={rightPanelRef}
          className="w-full bg-slate-900/20 flex flex-col md:h-full overflow-hidden"
          style={{ flex: leftCollapsed ? "1 1 auto" : `1 1 ${100 - effectiveLeftPct}%` }}
        >
          {/* Editor Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border-b border-slate-900 bg-slate-950">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4 w-4 text-indigo-400" />
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={isTimeUp}
                className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="javascript">JavaScript (Node.js)</option>
                <option value="python">Python 3</option>
                <option value="cpp">C++ (GCC)</option>
                <option value="java">Java</option>
              </select>
            </div>

            <button
              onClick={handleExecuteCodeSubmit}
              disabled={isSubmitting || isTimeUp}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-5 py-1.5 text-xs font-bold transition-all shadow-md active:scale-95 w-full sm:w-auto"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>{isSubmitting ? "Evaluating..." : "Run Execution"}</span>
            </button>
          </div>

          {isTimeUp && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-rose-500/20 bg-rose-500/5">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-rose-400">Time's up</p>
                  <p className="text-xs text-slate-400">
                    Your solving window has ended. This attempt has been logged. Restart to try again with a fresh timer.
                  </p>
                </div>
              </div>
              <button
                onClick={handleRestartProblem}
                disabled={isRestarting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-2 text-xs font-bold transition-all shadow-md active:scale-95 w-full sm:w-auto shrink-0"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isRestarting ? "Restarting..." : "Restart Problem"}
              </button>
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="bg-slate-950 min-h-75 md:min-h-0" style={{ flex: `1 1 ${100 - effectiveConsolePct}%` }}>
            <Editor
              height="100%"
              language={language === "java" ? "java" : language}
              theme="vs-dark"
              value={code}
              onChange={(val) => !isTimeUp && setCode(val || "")}
              options={{
                minimap: { enabled: false },
                fontSize: window.innerWidth < 640 ? 12 : 14,
                fontFamily: "Fira Code, Menlo, Monaco, Consolas, monospace",
                lineHeight: window.innerWidth < 640 ? 18 : 22,
                padding: { top: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                readOnly: isTimeUp,
                scrollbar: {
                    vertical: 'visible',
                    horizontal: 'visible'
                }
              }}
            />
          </div>

          {/* Vertical drag handle */}
          {!consoleCollapsed && (
            <div
              onMouseDown={handleVerticalDragStart}
              className="hidden md:flex h-1.5 shrink-0 cursor-row-resize items-center justify-center bg-slate-900 hover:bg-indigo-500/30 transition-colors group relative"
            >
              <div className="absolute inset-x-0 -top-1 -bottom-1" />
              <GripHorizontal className="h-4 w-4 text-slate-700 group-hover:text-indigo-400 transition-colors" />
            </div>
          )}

          {/* Console Output Panel */}
          <div
            className="border-t md:border-t-0 border-slate-900 bg-slate-950 overflow-hidden flex flex-col"
            style={{ flex: consoleCollapsed ? "0 0 auto" : `0 0 ${effectiveConsolePct}%`, height: consoleCollapsed ? "auto" : undefined }}
          >
            <div className="flex items-center justify-between px-4 pt-3 pb-2.5 border-b border-slate-900 shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Console Output
              </span>
              <button
                type="button"
                onClick={() => setConsoleCollapsed((prev) => !prev)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-900 transition-colors"
                title={consoleCollapsed ? "Expand console" : "Collapse console"}
              >
                {consoleCollapsed ? <ChevronsUp className="h-3.5 w-3.5" /> : <ChevronsDown className="h-3.5 w-3.5" />}
              </button>
            </div>

            {!consoleCollapsed && (
              <div className="p-4 overflow-y-auto flex-1 font-mono">
                <div className="flex-1 flex flex-col justify-center h-full">
                  {!evaluationResult ? (
                    <div className="text-slate-600 text-xs text-center py-8 italic px-2">
                      Awaiting instruction processing pipeline execution traces...
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      <div className="flex items-center gap-2.5 text-sm font-bold">
                        {evaluationResult.status === "Accepted" && (
                          <span className="text-emerald-400 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4.5 w-4.5" /> Challenge Passed
                          </span>
                        )}
                        {evaluationResult.status === "Wrong Answer" && (
                          <span className="text-rose-400 flex items-center gap-1.5">
                            <XCircle className="h-4.5 w-4.5" /> Assertion Mismatch
                          </span>
                        )}
                        {evaluationResult.status === "Processing" && (
                          <span className="text-indigo-400 animate-pulse flex items-center gap-1.5">
                            <Terminal className="h-4.5 w-4.5 animate-spin" /> Worker Evaluating...
                          </span>
                        )}
                        {["Time Limit Exceeded", "Memory Limit Exceeded", "Runtime Error"].includes(
                          evaluationResult.status
                        ) && (
                          <span className="text-amber-400 flex items-center gap-1.5">
                            <AlertTriangle className="h-4.5 w-4.5" />  Fault: {evaluationResult.status}
                          </span>
                        )}
                      </div>

                      {evaluationResult.message && (
                        <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto scrollbar-thin">
                          {evaluationResult.message}
                        </div>
                      )}

                      {evaluationResult.metrics && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-500 pt-1">
                          <span>
                            Speed:{" "}
                            <strong className="text-slate-400">
                              {evaluationResult.metrics.runtime} ms
                            </strong>
                          </span>
                          <span>
                            Memory:{" "}
                            <strong className="text-slate-400">
                              {evaluationResult.metrics.memory} MB
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProblemWorkspace;