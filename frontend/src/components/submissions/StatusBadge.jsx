import { CheckCircle2, XCircle, AlertTriangle, Terminal } from "lucide-react";

function StatusBadge({ status }) {
  const configureBadgeMap = (statusType) => {
    switch (statusType) {
      case "Accepted":
        return { text: "Accepted", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle2 };
      case "Wrong Answer":
        return { text: "Wrong Answer", color: "text-rose-400 bg-rose-500/10 border-rose-500/20", icon: XCircle };
      case "Processing":
        return { text: "Evaluating", color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20 animate-pulse", icon: Terminal };
      default:
        return { text: statusType || "Runtime Fault", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: AlertTriangle };
    }
  };

  const config = configureBadgeMap(status);
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      <Icon className="h-3 w-3 shrink-0" />
      <span>{config.text}</span>
    </span>
  );
}

export default StatusBadge;