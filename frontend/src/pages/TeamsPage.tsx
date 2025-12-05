import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Team = {
  id: number;
  name: string;
  members: { id: number; email: string }[];
  image_url: string;
};

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getTeams`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Errore nel caricamento dei team");
        return res.json();
      })
      .then((data) => {
        setTeams(data);
      })
      .catch((err) => {
        console.error(err);
        setError("Errore nel caricamento dei team");
      });
  }, []);

  return (
    <div className="p-4">
      <Navbar />
      <h1 className="text-2xl font-bold mb-8">I tuoi team</h1>

      {error && <p className="text-red-500">{error}</p>}

      {teams.length === 0 ? (
        <div className="text-center mt-8">
          <p className="mb-4">Non fai ancora parte di nessun team.</p>
          <Button variant="primary" onClick={() => navigate("/createTeam")}>
            Crea un team
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team.id} className="rounded-md shadow">
              <ul className="space-y-4">
                {teams.map((team) => (
                  <li key={team.id}>
                    <div
                      onClick={() => navigate(`/teams/${team.id}`)}
                      className="cursor-pointer border rounded-lg p-4 bg-white/60 shadow hover:shadow-lg transition flex items-center gap-4"
                    >
                      <img
                        src={`${API_BASE_URL}/uploads/${team.image_url}`}
                        alt={team.name}
                        className="w-16 h-16 object-cover rounded-full"
                      />
                      <span className="text-lg font-semibold">{team.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}