import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Invite = {
  id: number;
  team_id: number;
  team: { name: string };
};

export default function InvitesPage() {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE_URL}/handle_invites/check_invites`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setInvites)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const acceptInvite = async (inviteId: number) => {
    const res = await fetch(`${API_BASE_URL}/handle_invites/invites/${inviteId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { setInvites((p) => p.filter((i) => i.id !== inviteId)); navigate("/home"); }
    else alert("Errore nell'accettare l'invito");
  };

  const rejectInvite = async (inviteId: number) => {
    const res = await fetch(`${API_BASE_URL}/handle_invites/invites/${inviteId}/reject`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) { setInvites((p) => p.filter((i) => i.id !== inviteId)); navigate("/home"); }
    else alert("Errore nel rifiutare l'invito");
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/70">Caricamento inviti...</p>
    </div>
  );

  return (
    <div className="min-h-screen pb-8">
      <Navbar />
      <div className="px-4 pt-8 max-w-xl mx-auto">
        <h1 className="text-white text-2xl font-bold drop-shadow mb-6 text-center">
          I tuoi inviti
        </h1>

        {invites.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-white/60">Nessun invito disponibile</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {invites.map((invite) => (
              <li key={invite.id} className="glass rounded-xl p-4 flex justify-between items-center">
                <p className="text-white font-semibold">
                  {invite.team?.name || `Team #${invite.team_id}`}
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptInvite(invite.id)}
                    className="btn-gradient px-4 py-1 text-sm rounded-lg"
                  >
                    Accetta
                  </button>
                  <button
                    onClick={() => rejectInvite(invite.id)}
                    className="bg-white/10 border border-white/20 text-white/80 px-4 py-1 text-sm rounded-lg hover:bg-red-500/40 transition"
                  >
                    Rifiuta
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
