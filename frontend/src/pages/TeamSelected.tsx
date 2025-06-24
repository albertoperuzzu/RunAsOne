import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";

type Member = {
  id: number;
  email: string;
  role: string;
};

type Team = {
  id: number;
  name: string;
  image_url: string;
  is_admin: boolean;
  members: Member[];
};

export default function TeamSelected() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const navigate = useNavigate();

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

  const handleRemoveMember = async (userId: number, team: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:8000/handle_invites/${id}/remove_member/${userId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (res.ok) {
      navigate(`/teams/${team}`);
    } else {
      alert("Errore nella rimozione del membro");
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
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2 text-center">Membri del team</h2>
        <ul className="divide-y divide-gray-200">
          {team.members.map((member) => (
            <li key={member.id} className="py-2 flex justify-between items-center">
              <span>👤 {member.email}</span>
              {team.is_admin && member.role !== "admin" && (
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  onClick={() => handleRemoveMember(member.id, team.id)}
                >
                  Rimuovi
                </button>
              )}
              <span className="text-sm text-gray-600">{member.role}</span>
            </li>
          ))}
        </ul>
      </div>
      {team.is_admin && (
        <div className="mt-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Invita nel team</h2>
          <input
            type="email"
            placeholder="Email utente"
            value={emailToInvite}
            onChange={(e) => setEmailToInvite(e.target.value)}
            className="border rounded px-4 py-2 mr-2"
          />
          <button
            onClick={handleInvite}
            className="bg-blue-500 text-white mt-2 px-4 py-2 rounded hover:bg-blue-600"
          >
            Invita
          </button>
          {inviteMessage && (
            <p className="mt-2 text-sm text-gray-700">{inviteMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}