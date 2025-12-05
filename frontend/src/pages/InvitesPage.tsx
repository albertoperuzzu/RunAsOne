import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Invite = {
  id: number;
  team_id: number;
  team: {
    name: string;
  };
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE_URL}/handle_invites/check_invites`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then(setInvites)
      .catch((err) => console.error("Errore nel caricamento degli inviti:", err))
      .finally(() => setLoading(false));
  }, []);

  const acceptInvite = async (inviteId: number) => {
    const res = await fetch(`${API_BASE_URL}/handle_invites/invites/${inviteId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      navigate("/home"); 
    } else {
      alert("Errore nell'accettare l'invito");
    }
  };

  const rejectInvite = async (inviteId: number) => {

    const res = await fetch(`${API_BASE_URL}/handle_invites/invites/${inviteId}/reject`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== inviteId));
      navigate("/home"); 
    } else {
      alert("Errore nel rifiutare l'invito");
    }
  };

  if (loading) return <p className="text-center mt-8">Caricamento inviti...</p>;
  if (invites.length === 0) return <p className="text-center mt-8">Nessun invito disponibile</p>;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Navbar/>
      <h1 className="text-2xl font-bold mb-4 text-center">I tuoi inviti ai team</h1>
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="border rounded p-4 mb-4 flex justify-between items-center"
        >
          <div>
            <p className="text-lg font-semibold">Team: {invite.team?.name || invite.team_id}</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => acceptInvite(invite.id)}
              className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
            >
              Accetta
            </button>
            <button
              onClick={() => rejectInvite(invite.id)}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Rifiuta
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}