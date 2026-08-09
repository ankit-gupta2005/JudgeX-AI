export default function FeaturesGrid() {
  const userBenefits = [
    {
      title: "Automated Grading Sandbox",
      description: "Candidates run and check code instantly against your pre-configured test cases. System validates output accuracy automatically with zero manual tracking.",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: "Isolated Organization Dashboards",
      description: "Separate your classes, hiring camps, or assessment cycles into private hubs. Manage independent problem sets, member access lists, and candidate rosters seamlessly.",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: "Interactive Code Workbench",
      description: "An intuitive, browser-based editor featuring auto-formatting and built-in run logs. Candidates write and test solutions seamlessly without downloading custom software.",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      )
    },
    {
      title: "Congestion-Free Test Queues",
      description: "Run massive concurrent events without slowdowns. Your test assessment requests handle scale smoothly, so thousands can code alongside each other without delays.",
      icon: (
        <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-slate-900/60">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white mb-4">
          Everything You Need to Run Seamless Programming Events
        </h2>
        <p className="text-sm sm:text-base text-slate-400">
          Built from the ground up to make creating, scaling, and managing technical tests entirely stress-free for organizers and participants alike.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userBenefits.map((benefit, index) => (
          <div 
            key={index} 
            className="p-6 sm:p-8 bg-slate-900/10 border border-slate-900 rounded-xl hover:border-indigo-500/30 `hover:bg-indigo-500/2` hover:-translate-y-0.5 transition-all duration-300 flex flex-col items-start group shadow-2xl"
          >
            <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center mb-5 group-hover:border-indigo-500/40 group-hover:bg-indigo-500/10 transition-all duration-300">
              {benefit.icon}
            </div>
            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-indigo-400 transition-colors">
              {benefit.title}
            </h3>
            <p className="text-sm text-slate-400 font-normal leading-relaxed">
              {benefit.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}