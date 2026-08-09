import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LandingPage from "./components/landing/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ProblemGrid from "./pages/ProblemGrid";
import ProblemWorkspace from "./pages/ProblemWorkspace";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Organization from "./pages/Organization";
import NotFound from "./pages/NotFound";
import ContestLeaderboard from "./pages/ContestLeaderboard";
import ContestWorkspace from "./pages/ContestWorkspace";
import Contests from "./pages/Contests";

import { useAuth } from "./hooks/useAuth";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Syncing secure workspace parameters...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = user?.role || localStorage.getItem("role") || "";

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(currentRole)
  ) {
    return <Navigate to="/problems" replace />;
  }

  return children;
};

function App() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing core framework routing...
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <Routes>
          <Route path="/" element={<LandingPage />} />

          <Route
            path="/login"
            element={
              !token ? (
                <Login />
              ) : (
                <Navigate to="/problems" replace />
              )
            }
          />

          <Route
            path="/signup"
            element={
              !token ? (
                <Signup />
              ) : (
                <Navigate to="/problems" replace />
              )
            }
          />

          <Route
            path="/problems"
            element={
              <ProtectedRoute>
                <ProblemGrid />
              </ProtectedRoute>
            }
          />

          <Route
            path="/workspace/:id"
            element={
              <ProtectedRoute>
                <ProblemWorkspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                allowedRoles={["org_admin", "super_admin"]}
              >
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/org-settings"
            element={
              <ProtectedRoute
                allowedRoles={["org_admin", "super_admin"]}
              >
                <Organization />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contests"
            element={
              <ProtectedRoute>
                <Contests />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contests/:id/workspace"
            element={
              <ProtectedRoute>
                <ContestWorkspace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/contests/:id/leaderboard"
            element={
              <ProtectedRoute>
                <ContestLeaderboard />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;