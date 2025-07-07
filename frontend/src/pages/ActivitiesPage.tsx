import { useEffect, useState } from "react";
import ActivityCard from "../components/ActivityCard";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import { RefreshCcw } from "lucide-react";

type Activity = {
  id: number;
  name: string;
  distance: number;
};

export default function AttivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("token");

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/db/getDBActivities", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Errore nel caricamento delle attività");
      const data = await res.json();
      setActivities(data);
    } catch (err) {
      console.error(err);
      setError("Errore nel caricamento delle attività.");
    } finally {
      setLoading(false);
    }
  };

  const syncWithStrava = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/strava_api/syncActivities", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!res.ok) throw new Error("Errore durante la sincronizzazione con Strava");
      await fetchActivities();
    } catch (err) {
      console.error(err);
      setError("Errore durante la sincronizzazione con Strava.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-4">
      <Navbar />
      <div className="mb-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">Le tue attività</h1>
          <Button
            variant="syncStrava"
            onClick={syncWithStrava}
          >
            <RefreshCcw size={16} className="text-white" />
          </Button>
        </div>
      </div>
      <ul className="space-y-2">
        {activities.map((activity) => (
          <li key={activity.id}>
            <ActivityCard activity={activity} />
          </li>
        ))}
      </ul>
    </div>
  );
}