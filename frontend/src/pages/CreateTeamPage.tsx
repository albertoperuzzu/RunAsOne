import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateTeamPage() {
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleCreateTeam = async () => {
    if (!name || !image) {
      setError("Inserisci nome e immagine del team");
      return;
    }

    const formData = new FormData();
    formData.append("name", name);
    formData.append("image", image);

    try {
      const res = await fetch("http://localhost:8000/db/create_team", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) throw new Error("Errore nella creazione");

      navigate("/teams");
    } catch (err) {
      console.error(err);
      setError("Errore nella creazione del team");
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="max-w-md bg-white/70 mx-auto p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Crea un team</h2>
        {error && <p className="text-red-600 mb-3">{error}</p>}

        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          placeholder="Nome Team"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
        />

        <button
          className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
          onClick={handleCreateTeam}
        >
          Crea Team
        </button>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/teams")}
            className="w-40 bg-gray-300 text-black p-2 rounded hover:bg-gray-400 transition"
          >
            Indietro
          </button>
        </div>
      </div>
    </div>
  );
}