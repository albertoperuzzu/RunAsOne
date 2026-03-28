import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  const handleCreateTeam = async () => {
    if (!name || !image) {
      setError("Inserisci nome e immagine del team");
      return;
    }
    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);
    try {
      const res = await fetch(`${API_BASE_URL}/db/create_team`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      navigate("/teams");
    } catch {
      setError("Errore nella creazione del team");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h2 className="text-white text-2xl font-bold mb-6 text-center">Crea un team</h2>

        {error && <p className="text-accent text-sm mb-3">{error}</p>}

        <input
          className="glass-input"
          placeholder="Nome team"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="glass-input"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        <button
          className="btn-gradient w-full py-2 mt-2 mb-2"
          onClick={handleCreateTeam}
        >
          Crea Team
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/teams")}
            className="text-white/50 hover:text-white/80 text-sm"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
