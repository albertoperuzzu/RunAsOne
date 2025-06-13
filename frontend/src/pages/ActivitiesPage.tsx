import { useEffect, useState } from "react";

type Activity = {
  id: number;
  name: string;
  distance: number; // in metri
};

export default function AttivitaPage() {
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
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Le tue attività</h1>
      <ul className="space-y-2">
        {activities.map((a) => (
          <li key={a.id} className="bg-white shadow rounded p-4">
            <p className="text-lg font-semibold">{a.name}</p>
            <p className="text-sm text-gray-600">
              Distanza: {(a.distance / 1000).toFixed(2)} km
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}