import { useEffect, useState } from "react";
import ActivityCard from "../components/ActivityCard";
import Navbar from "../components/Navbar";

type Activity = {
  id: number;
  name: string;
  distance: number;
};

export default function AttivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/activities/getActivities", {
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nel caricamento");
        return res.json();
      })
      .then((data) => {
        setActivities(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Errore nel caricamento delle attività.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Caricamento...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="bg-neutral p-4">
      <Navbar />
      <h1 className="text-2xl font-bold mb-4">Le tue attività</h1>
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