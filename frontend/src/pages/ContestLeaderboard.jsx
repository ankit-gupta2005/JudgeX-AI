import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { Trophy, Medal } from "lucide-react";
import Navbar from "../components/common/Navbar";
import api from "../services/api";

function ContestLeaderboard() {
  const { id: contestId } = useParams();
  const [rows, setRows] = useState([]);

  const fetchLeaderboard = async () => {
    const response = await api.get(`/contests/${contestId}/leaderboard`);
    setRows(response.data.leaderboard || []);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLeaderboard();

    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5001", { transports: ["websocket"] });
    socket.on("connect", () => socket.emit("join_contest_room", { contestId }));
    socket.on("leaderboard_update", () => fetchLeaderboard());

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contestId]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2 mb-6">
          <Trophy className="text-amber-400 h-6 w-6" /> Live Contest Leaderboard
        </h1>
        <div className="rounded-xl border border-slate-800 bg-slate-900/20 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50 text-xs uppercase text-slate-400">
                <th className="px-6 py-3">Rank</th>
                <th className="px-6 py-3">Developer</th>
                <th className="px-6 py-3 text-center">Solved</th>
                <th className="px-6 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm text-slate-300">
              {rows.map((r) => (
                <tr key={r.userId}>
                  <td className="px-6 py-3">{r.rank <= 3 ? <Medal className="h-4 w-4 text-amber-400" /> : r.rank}</td>
                  <td className="px-6 py-3">{r.name}</td>
                  <td className="px-6 py-3 text-center">{r.stagesSolved}/{r.totalStages}</td>
                  <td className="px-6 py-3 text-right font-mono">{Math.floor(r.elapsedSeconds / 60)}m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default ContestLeaderboard;