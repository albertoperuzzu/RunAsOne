import { useEffect, useState } from "react";

type Activity = {
  id: number;
  name: string;
  distance: number; // in metri
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
        console.log(data);
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
            <button 
                    onClick={() => { 
                        let url = "http://localhost:8000/activities/" + a.id + "/export_gpx";
                        window.location.href = url; 
                    }} 
                    className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow">
                Scarica GPX
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}