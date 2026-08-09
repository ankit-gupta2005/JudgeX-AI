import { useState, useEffect } from "react";
import { UserPlus, Mail, ShieldAlert, CheckCircle} from "lucide-react";
import api from "../../services/api";

export default function DeveloperManager() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [developers, setDevelopers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const showNotice = (msg, type) => {
    setNotification({ message: msg, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 4000);
  };

  useEffect(() => {
    let isMounted = true;

    async function loadWorkspaceRoster() {
      try {
        const response = await api.get("/org/developers");
        if (isMounted) {
          setDevelopers(response.data || []);
        }
      } catch (err) {
        if (isMounted) {
          showNotice("Could not load organization roster.", "error");
          console.log(err);
        }
      }
    }

    loadWorkspaceRoster();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleManualRefresh = async () => {
    try {
      const response = await api.get("/org/developers");
      setDevelopers(response.data || []);
    } catch (err) {
      showNotice("Could not sync organization roster.", "error");
      console.log(err)
    }
  };

  const handleAddDeveloper = async (e) => {
    e.preventDefault();
    if (!email || !name) return;
    setIsLoading(true);

    try {
      await api.post("/org/developers/add", { email, name });
      showNotice("Developer added to organization registry successfully.", "success");
      setEmail("");
      setName("");
      await handleManualRefresh();
    } catch (err) {
      showNotice(err.response?.data?.message || "Failed to provision user context.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-8 p-6 bg-slate-950/40 border border-slate-900 rounded-2xl backdrop-blur-md">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-100 font-mono flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-indigo-400" />
          Developer Registry Control
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Provision access nodes for students or candidates to allocate challenges.
        </p>
      </div>

      {notification.message && (
        <div className={`flex items-center gap-2 rounded-xl p-3 text-sm border ${
          notification.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {notification.type === "success" ? <CheckCircle className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
          <span>{notification.message}</span>
        </div>
      )}

      <form onSubmit={handleAddDeveloper} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 px-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email Address</label>
          <div className="relative mt-1">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="candidate@gmail.com"
              className="block w-full rounded-xl border border-slate-800 bg-slate-950 py-2.5 pl-9 pr-3 text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg disabled:opacity-50"
        >
          {isLoading ? "Provisioning..." : "Provision Node Access"}
        </button>
      </form>

      <div className="border-t border-slate-900 pt-6">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Active Organization Roster</h3>
        <div className="overflow-hidden rounded-xl border border-slate-900 bg-slate-950/20">
          <table className="min-w-full divide-y divide-slate-900 font-mono text-xs">
            <thead className="bg-slate-900/40 text-slate-400 uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              {developers.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-slate-500">
                    No active developer entities mapped to this workspace boundary.
                  </td>
                </tr>
              ) : (
                developers.map((dev, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-100">{dev.name}</td>
                    <td className="px-6 py-4 text-slate-400">{dev.email}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                        ACTIVE NODE
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}