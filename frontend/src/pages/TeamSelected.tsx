import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LeaderBox from "../components/LeaderBox";
import TeamActivityCard from "../components/TeamActivityCard";
import { HomeIcon, UsersIcon, ActivityIcon } from "lucide-react"; // Usa lucide o FontAwesome
import API_BASE_URL from "../config";

type Member = {
  id: number;
  name: string;
  profile_img_url: string;
  role: string;
};

type Activity = {
  id: number;
  name: string;
  distance: number;
  elevation?: number;
  avg_speed?: number;
  activity_type?: string;
  date: string;
  summary_polyline?: string;
  user: {
    username: string;
    profile_img_url?: string;
  };
};

type Team = {
  id: number;
  name: string;
  image_url: string;
  is_admin: boolean;
  members: Member[];
  activities: Activity[];
};

export default function TeamSelected() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTab, setSelectedTab] = useState<"home" | "members" | "activities">("home");
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [stats, setStats] = useState<{
    total_distance_km: number;
    total_elevation_m: number;
    leaderboards: {
      distance: { user_id: number; value: number }[];
      elevation: { user_id: number; value: number }[];
      max_speed: { user_id: number; value: number }[];
      elev_high: { user_id: number; value: number }[];
    };
  } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/db/teams/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      //.then(setTeam)
      .then((data) => {
        //console.log("Team JSON:", data);
        setTeam(data); 
      })
      .catch((err) => console.error("Errore nel caricamento del team", err));
  }, [id]);

  useEffect(() => {
  const token = localStorage.getItem("token");
  fetch(`${API_BASE_URL}/db/teams/${id}/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then(setStats)
    .catch((err) => console.error("Errore nel caricamento statistiche", err));
}, [id]);

  const handleInvite = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/handle_invites/teams/${id}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ email: emailToInvite }),
      });

      const data = await res.json();
      if (res.ok) {
        setInviteMessage("Invito inviato con successo!");
        setEmailToInvite("");
      } else {
        setInviteMessage(data.detail || "Errore nell'invio dell'invito");
      }
    } catch {
      setInviteMessage("Errore di rete");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `${API_BASE_URL}/handle_invites/${id}/remove_member/${userId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.ok) {
      setTeam((prev) =>
        prev
          ? { ...prev, members: prev.members.filter((m) => m.id !== userId) }
          : null
      );
    } else {
      alert("Errore nella rimozione del membro");
    }
  };

  if (!team) return <p>Caricamento...</p>;

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Navbar />

      <div className="flex-grow px-6 pt-8 pb-4">
        {selectedTab === "home" && (
          <div className="text-center mt-4">
            <img
              src={`${API_BASE_URL}/uploads/${team.image_url}`}
              alt={team.name}
              className="w-32 h-32 rounded-full object-cover mb-4 mx-auto"
            />
            <div className="p-4 text-sm sm:text-base sm:p-6 lg:p-8">
              <h1 className="text-lg font-semibold">{team.name}</h1>
            </div>
            {stats ? (
              <div>
                <div className="mt-4 text-center">
                  <p className="text-lg">🚴 Totale km percorsi: <strong>{stats.total_distance_km} km</strong></p>
                  <p className="text-lg">⛰️ Totale dislivello: <strong>{stats.total_elevation_m} m</strong></p>
                </div>
                
                <div className="flex overflow-x-auto gap-4 px-4 py-2 snap-x scroll-smooth">
                  <div className="flex-shrink-0 w-4/5 snap-center">
                      <LeaderBox
                        title="Distanza totale (km)"
                        data={stats.leaderboards.distance}
                        unit="km"
                        members={team.members}
                      />
                  </div>
                  <div className="flex-shrink-0 w-4/5 snap-center">
                    <LeaderBox
                      title="Dislivello totale (m)"
                      data={stats.leaderboards.elevation}
                      unit="m"
                      members={team.members}
                    />
                  </div>
                  <div className="flex-shrink-0 w-4/5 snap-center">
                    <LeaderBox
                      title="Velocità max (km/h)"
                      data={stats.leaderboards.max_speed}
                      unit="km/h"
                      members={team.members}
                    />
                  </div>
                  <div className="flex-shrink-0 w-4/5 snap-center">
                    <LeaderBox
                      title="Altitudine massima (m)"
                      data={stats.leaderboards.elev_high}
                      unit="m"
                      members={team.members}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-sm text-gray-500">Calcolo statistiche in corso...</p>
            )}
          </div>
        )}

        {selectedTab === "members" && (
          <div>
            <h2 className="text-xl font-semibold mb-6 text-center">Membri del team</h2>
            <ul className="divide-y divide-gray-200">
              {team.members.map((member) => (
                <li key={member.id} className="py-2 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={
                        member.profile_img_url.startsWith("/uploads/")
                          ? `${API_BASE_URL}${member.profile_img_url}`
                          : member.profile_img_url
                      }
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.role}</p>
                    </div>
                  </div>
                  {team.is_admin && member.role !== "admin" && (
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Rimuovi
                    </button>
                  )}
                </li>
              ))}
            </ul>

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
        )}

        {selectedTab === "activities" && (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-6">Attività del team</h2>
            <ul className="space-y-4">
              {team.activities.map((act) => (
                <li key={act.id}>
                  <TeamActivityCard activity={act} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md z-50">
        <div className="flex justify-around py-3">
          <button onClick={() => setSelectedTab("home")} className="flex flex-col items-center text-sm">
            <HomeIcon className="w-5 h-5" />
            Home
          </button>
          <button onClick={() => setSelectedTab("members")} className="flex flex-col items-center text-sm">
            <UsersIcon className="w-5 h-5" />
            Membri
          </button>
          <button onClick={() => setSelectedTab("activities")} className="flex flex-col items-center text-sm">
            <ActivityIcon className="w-5 h-5" />
            Attività
          </button>
        </div>
      </nav>
    </div>
  );
}