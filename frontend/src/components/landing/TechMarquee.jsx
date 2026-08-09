export default function TechMarquee() {
  const supportedLanguages = [
    "Python 3",
    "Java SE",
    "C++ (GCC)",
    "JavaScript (Node)",
    "Go Lang",
    "TypeScript",
    "C# (.NET)",
    "Ruby",
    "Rust Engine"
  ];

  return (
    <div className="w-full bg-slate-950/40 backdrop-blur-sm border-y border-slate-900 py-6 overflow-hidden select-none relative">
      <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

      <div className="flex w-max gap-16 animate-marquee">
        <div className="flex items-center gap-16 text-slate-600 font-mono tracking-widest text-sm uppercase">
          {supportedLanguages.map((lang, index) => (
            <span key={`first-${index}`} className="hover:text-indigo-400 hover:scale-105 transition-all duration-200 cursor-default flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/40" />
              {lang}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-16 text-slate-600 font-mono tracking-widest text-sm uppercase" aria-hidden="true">
          {supportedLanguages.map((lang, index) => (
            <span key={`second-${index}`} className="hover:text-indigo-400 hover:scale-105 transition-all duration-200 cursor-default flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/40" />
              {lang}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}