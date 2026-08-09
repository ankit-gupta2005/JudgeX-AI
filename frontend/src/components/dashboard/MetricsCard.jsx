function MetricsCard({ title, value, subtext, icon: Icon, trendColor = "text-indigo-400" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`rounded-xl bg-slate-950 p-2 border border-slate-800 ${trendColor}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{value}</h3>
        <p className="text-xs text-slate-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

export default MetricsCard;