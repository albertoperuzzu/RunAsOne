import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type Team = {
  id: number;
  name: string;
  image_url: string;
};

export default function TeamSelected() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");

    fetch(`http://localhost:8000/db/teams/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setTeam)
      .catch((err) => console.error("Errore nel caricamento del team", err));
  }, [id]);

  const handleInvite = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8000/handle_invites/teams/${id}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: new URLSearchParams({ email: emailToInvite }),
      });

      const data = await res.json();

      if (res.ok) {
        setInviteMessage("Invito inviato con successo!");
        setEmailToInvite("");
      } else {
        setInviteMessage(data.detail || "Errore nell'invio dell'invito");
      }
    } catch (err) {
      setInviteMessage("Errore di rete");
    }
  };

  if (!team) return <p>Caricamento...</p>;

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Navbar/>
      <img
        src={`http://localhost:8000/uploads/${team.image_url}`}
        alt={team.name}
        className="w-32 h-32 rounded-full object-cover mb-4 mx-auto"
      />
      <h1 className="text-3xl font-bold text-center">{team.name}</h1>

      <div className="mt-6 text-center">
        <h2 className="text-xl font-semibold mb-2">Invita un membro al team</h2>
        <input
          type="email"
          placeholder="Email utente"
          value={emailToInvite}
          onChange={(e) => setEmailToInvite(e.target.value)}
          className="border rounded px-4 py-2 mr-2"
        />
        <button
          onClick={handleInvite}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Invia invito
        </button>
        {inviteMessage && (
          <p className="mt-2 text-sm text-gray-700">{inviteMessage}</p>
        )}
      </div>
    </div>
  );
}