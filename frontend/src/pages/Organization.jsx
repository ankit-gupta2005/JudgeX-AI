import { useState, useEffect } from "react";
import Navbar from "../components/common/Navbar";
import OrgSettings from "../components/org/OrgSettings";
import api from "../services/api";

function Organization() {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);


  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerDataFetchSync = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchOrganizationDetails = async () => {
      try {
        const response = await api.get("/org/details");
        if (isMounted) {
          setOrgData(response.data.org);
        }
      } catch (err) {
        console.error("Failed to fetch organization context details.", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrganizationDetails();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <Navbar />
        <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-500 font-mono text-xs">Syncing control framework workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Pass down orgData along with our sync mechanism triggers */}
        <OrgSettings 
          orgData={orgData} 
          onProblemCreated={triggerDataFetchSync} 
        />
      </main>
    </div>
  );
}

export default Organization;