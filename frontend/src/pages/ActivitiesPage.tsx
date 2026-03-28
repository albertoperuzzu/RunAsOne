import { useEffect, useState } from "react";
import ActivityCard from "../components/ActivityCard";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { RefreshCcw } from "lucide-react";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Activity = {
  id: number;
  name: string;
  distance: number;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/db/getDBActivities`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      setActivities(await res.json());
    } catch {
      setError("Errore nel caricamento delle attività.");
    } finally {
      setLoading(false);
    }
  };

  const syncWithGarmin = async () => {
    setSyncing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/garmin_api/syncActivities`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error();
      await fetchActivities();
    } catch {
      setError("Errore durante la sincronizzazione con Garmin.");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => { fetchActivities(); }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-indaco/70">Caricamento...</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-8">
      <Navbar />
      <div className="px-4 pt-8 max-w-xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <h1 className="text-indaco text-2xl font-bold drop-shadow">Le tue attività</h1>
          <Button
            variant="syncGarmin"
            onClick={syncWithGarmin}
            disabled={syncing}
          >
            <RefreshCcw size={16} className={`text-white ${syncing ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        <ul className="space-y-4">
          {activities.map((activity) => (
            <li key={activity.id}>
              <ActivityCard activity={activity} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
