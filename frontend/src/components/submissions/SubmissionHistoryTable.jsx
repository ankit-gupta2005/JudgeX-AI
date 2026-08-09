import { Clock, Cpu, Code2 } from "lucide-react";
import StatusBadge from "./StatusBadge";

function SubmissionHistoryTable({ submissions = [] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/10 backdrop-blur-md">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/50 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <th className="px-6 py-4">Submission Id Vector</th>
            <th className="px-6 py-4">Programming Track</th>
            <th className="px-6 py-4">Evaluation Verdict</th>
            <th className="px-6 py-4">Execution Latency</th>
            <th className="px-6 py-4 text-right">Memory Ceiling</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-sm font-mono text-slate-300">
          {submissions.map((sub) => (
            <tr key={sub._id} className="hover:bg-slate-900/40 transition-colors">
              <td className="px-6 py-4 text-slate-500 text-xs truncate max-w-30">
                {sub._id}
              </td>
              <td className="px-6 py-4">
                <span className="flex items-center gap-1.5 text-slate-200">
                  <Code2 className="h-3.5 w-3.5 text-indigo-400" />
                  <span className="uppercase text-xs font-bold">{sub.language}</span>
                </span>
              </td>
              <td className="px-6 py-4">
                <StatusBadge status={sub.status} />
              </td>
              <td className="px-6 py-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-slate-600" /> {sub.metrics?.runtime ?? "--"} ms</span>
              </td>
              <td className="px-6 py-4 text-right text-xs text-slate-400">
                <span className="inline-flex items-center gap-1"><Cpu className="h-3 w-3 text-slate-600" /> {sub.metrics?.memory ?? "--"} MB</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SubmissionHistoryTable;