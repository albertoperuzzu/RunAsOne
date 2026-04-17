import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Notif = {
  id: number;
  team_id: number;
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
    const headers = { Authorization: `Bearer ${token}` };

    fetch(`${API_BASE_URL}/notifications/`, { credentials: "include", headers })
      .then((r) => r.json())
      .then((data: Notif[]) => {
        setNotifications(data);
        setLoading(false);
        // segna tutte come lette in background
        fetch(`${API_BASE_URL}/notifications/read-all`, {
          method: "POST",
          credentials: "include",
          headers,
        });
      })
      .catch(() => setLoading(false));
  }, [token]);

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <h1 className="text-xl font-bold text-indaco mb-5">Notifiche</h1>

        {loading ? (
          <p className="text-white/50 text-sm text-center mt-10">Caricamento...</p>
        ) : notifications.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/50 text-sm">Nessuna notifica</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => navigate(`/teams/${n.team_id}`)}
                className={`w-full text-left glass rounded-xl p-4 transition active:opacity-70 ${
                  !n.is_read ? "border-l-2 border-accent" : ""
                }`}
              >
                <p className="text-white/90 text-sm leading-snug">{n.message}</p>
                <p className="text-white/40 text-xs mt-1">{timeAgo(n.created_at)}</p>
              </button>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
