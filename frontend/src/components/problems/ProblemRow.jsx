import { Code2, Trash2, Edit2 } from "lucide-react";

function ProblemRow({ problem, onLaunchSandbox, onDeleteProblem, onTriggerEditFlow }) {
  const userRole = localStorage.getItem("role") || "developer";

  const getDifficultyStyles = (tier) => {
    switch (tier) {
      case "Easy": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Medium": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Hard": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      default: return "text-slate-400 bg-slate-500/10";
    }
  };

  return (
    <tr className="hover:bg-slate-900/40 transition-colors group">
      <td className="px-6 py-4 font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-slate-600 group-hover:text-indigo-500 transition-colors" />
          <span>{problem.title}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getDifficultyStyles(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1.5">
          {problem.tags && problem.tags.map((tag, i) => (
            <span key={i} className="rounded-lg bg-slate-800/80 border border-slate-700/30 px-2 py-0.5 text-xs text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={() => onLaunchSandbox(problem._id)}
            className="rounded-lg bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-indigo-600 hover:text-white px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 shadow-sm whitespace-nowrap"
          >
            Run
          </button>
          {(userRole === "org_admin" || userRole === "super_admin") && (
            <>
              <button
                onClick={() => onTriggerEditFlow(problem._id)}
                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg border border-transparent hover:border-amber-500/20 transition-all shrink-0"
                title="Modify Problem Configuration"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDeleteProblem(problem._id)}
                className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-transparent hover:border-rose-500/20 transition-all shrink-0"
                title="Purge Challenge Registry"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

export default ProblemRow;