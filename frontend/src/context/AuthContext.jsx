import { createContext, useState, useEffect } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export { AuthContext };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      
      if (!storedToken) {
        localStorage.clear();
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        const response = await api.get("/auth/me");
        
        setToken(storedToken);
        setUser(response.data.user);
      } catch (err) {
        console.error("Auth initialization sync failed:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.clear();
          setToken(null);
          setUser(null);
        } else {
          const backupRole = localStorage.getItem("role");
          const backupName = localStorage.getItem("name");
          if (backupRole && backupName) {
            setUser({ name: backupName, role: backupRole });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, userToken) => {
    localStorage.setItem("token", userToken);
    localStorage.setItem("role", userData.role);
    localStorage.setItem("name", userData.name);
    
    api.defaults.headers.common["Authorization"] = `Bearer ${userToken}`;
    
    setToken(userToken);
    setUser(userData);
    window.dispatchEvent(new Event("storage"));
  };

  const logout = () => {
    localStorage.clear();
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAuthenticated: !!user }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}