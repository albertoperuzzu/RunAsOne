import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

function resolveTeamImg(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/uploads/${url}`;
}

type Notif = {
  id: number;
  team_id: number;
  team_image_url: string | null;
  post_id: number | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "adesso";
  if (minutes < 60) return `${minutes} min fa`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}g fa`;
  return new Date(dateStr).toLocaleDateString("it-IT");
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/notifications/`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: Notif[]) => { setNotifications(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  const handleClick = (n: Notif) => {
    if (!n.is_read) {
      fetch(`${API_BASE_URL}/notifications/${n.id}/read`, {
        method: "POST",
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x))
      );
    }
    navigate(`/teams/${n.team_id}`);
  };

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <h1 className="text-indaco text-2xl font-bold drop-shadow mb-5">Notifiche</h1>

        {loading ? (
          <p className="text-white/50 text-sm text-center mt-10">Caricamento...</p>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/50 text-sm">Nessuna notifica</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const teamImg = resolveTeamImg(n.team_image_url);
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full text-left glass rounded-xl p-4 transition active:opacity-70 flex items-center gap-3 ${
                    !n.is_read ? "border-l-2 border-accent" : "opacity-50"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm leading-snug">{n.message}</p>
                    <p className="text-white/40 text-xs mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  {teamImg && (
                    <img
                      src={teamImg}
                      alt=""
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-white/20"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
