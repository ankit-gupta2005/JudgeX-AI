function AnalyticsChart({ data = [] }) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md p-6">
      <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-900 pb-4 mb-6">
        System Submission Load Velocity Metrics
      </h3>
      <div className="flex h-48 items-end gap-2 pt-4">
        {data.map((item, idx) => {
          const heightPct = `${(item.value / maxVal) * 100}%`;
          return (
            <div key={idx} className="flex flex-1 flex-col items-center h-full justify-end group">
              <div className="w-full bg-indigo-600/20 group-hover:bg-indigo-500/40 rounded-t-lg transition-all duration-300 relative border-t border-indigo-500/30" style={{ height: heightPct }}>
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 border border-slate-800 text-[10px] text-indigo-400 px-1.5 py-0.5 rounded font-mono transition-opacity shadow-xl z-10 whitespace-nowrap">
                  {item.value} runs
                </div>
              </div>
              <span className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-tight">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AnalyticsChart;