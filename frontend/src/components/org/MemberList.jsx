import { User, Shield, ShieldAlert } from "lucide-react";

function MemberList({ members = [] }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-900 bg-slate-900/50">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Active Team Seat Allocations
        </h3>
      </div>
      <ul className="divide-y divide-slate-800/60 max-h-64 overflow-y-auto">
        {members.length === 0 ? (
          <li className="p-6 text-center text-xs text-slate-600">No external developer seats allocated yet.</li>
        ) : (
          members.map((member) => (
            <li key={member._id} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-900/20 transition-colors">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-sm font-semibold text-slate-200 block">{member.name}</span>
                  <span className="text-xs text-slate-500 font-mono block">{member.email}</span>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase border tracking-wider ${
                member.role === "org_admin" || member.role === "super_admin"
                  ? "text-indigo-400 bg-indigo-500/5 border-indigo-500/10"
                  : "text-slate-400 bg-slate-950 border-slate-800"
              }`}>
                {member.role === "org_admin" ? (
                  <Shield className="h-2.5 w-2.5" />
                ) : member.role === "super_admin" ? (
                  <ShieldAlert className="h-2.5 w-2.5" />
                ) : null}
                <span>{member.role === "org_admin" ? "Admin" : member.role === "super_admin" ? "Root" : "Developer"}</span>
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default MemberList;