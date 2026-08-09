import { useState, useEffect } from "react";
import { X, Mail, Code2, Clock, Cpu, ChevronDown, ChevronUp } from "lucide-react";
import StatusBadge from "../submissions/StatusBadge";
import api from "../../services/api";

const BUCKET_LABELS = {
  accepted: "Accepted Submissions",
  wrong_answer: "Wrong Answer Submissions",
  errors: "Runtime / Timeout Faults",
};

function SubmissionDetailModal({ bucket, onClose }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      try {
        const response = await api.get(`/dashboard/submissions?bucket=${bucket}`);
        if (!ignore) {
          setSubmissions(response.data.submissions || []);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Failed to load submission details.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => { ignore = true; };
  }, [bucket]);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
          <h3 className="text-lg font-bold text-slate-100">
            {BUCKET_LABELS[bucket] || "Submissions"}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-xs text-slate-500">Loading records...</p>
            </div>
          ) : error ? (
            <div className="text-center py-16 text-sm text-rose-400">{error}</div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-16 text-sm text-slate-500">No submissions found in this category.</div>
          ) : (
            <div className="space-y-2.5">
              {submissions.map((sub) => {
                const isExpanded = expandedId === sub._id;
                return (
                  <div
                    key={sub._id}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleExpand(sub._id)}
                      className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 text-left hover:bg-slate-900/40 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-slate-200">
                            {sub.user?.name || "Unknown developer"}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {sub.user?.email || "—"}
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-slate-400 font-medium">{sub.problem?.title || "Unknown problem"}</span>
                          <span className="text-slate-600">·</span>
                          <span className="uppercase font-mono text-indigo-400 flex items-center gap-1">
                            <Code2 className="h-3 w-3" />
                            {sub.language}
                          </span>
                          <StatusBadge status={sub.status} />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {sub.executionTime ?? 0}ms
                          </span>
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> {sub.memoryUsed ?? 0}MB
                          </span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-slate-800 p-4 bg-slate-950/60">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Submitted Solution
                          </span>
                          <span className="text-[10px] text-slate-600">
                            {sub.passedCount ?? 0} / {sub.totalCount ?? 0} cases passed
                          </span>
                        </div>
                        <pre className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300 font-mono overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto">
                          {sub.code || "No code recorded."}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionDetailModal;