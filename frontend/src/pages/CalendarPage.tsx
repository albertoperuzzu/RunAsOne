import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { MapPin, Clock, CalendarIcon } from "lucide-react";

type CalendarEvent = {
  id: number;
  team_id: number;
  team_name: string;
  name: string;
  date: string;
  hour: string;
  description: string;
  start_place: string;
  end_place: string | null;
  event_type: string | null;
  distance_km: number | null;
  event_img_url: string | null;
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}

function formatHour(hourStr: string): string {
  return hourStr.slice(0, 5);
}

function resolveEventImg(url: string | null): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}/uploads/${url}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE_URL}/db/calendar`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: CalendarEvent[]) => {
        setEvents(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token]);

  // Raggruppa per data
  const grouped = events.reduce<Record<string, CalendarEvent[]>>((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
  const dates = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 pt-20 pb-24">
        <h1 className="text-indaco text-2xl font-bold drop-shadow mb-5">Calendario</h1>

        {loading ? (
          <p className="text-white/50 text-sm text-center mt-10">Caricamento...</p>
        ) : dates.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-white/50 text-sm">Nessun evento in programma</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date}>
                <p className="text-xs font-semibold text-indaco/80 uppercase tracking-wide mb-2 capitalize">
                  {formatDate(date)}
                </p>
                <div className="space-y-2">
                  {grouped[date].map((ev) => {
                    const imgUrl = resolveEventImg(ev.event_img_url);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => navigate(`/teams/${ev.team_id}`)}
                        className="w-full text-left glass rounded-xl overflow-hidden transition active:opacity-70"
                      >
                        {imgUrl && (
                          <img
                            src={imgUrl}
                            alt={ev.name}
                            className="w-full h-28 object-cover"
                          />
                        )}
                        <div className="p-4 flex items-start gap-3">
                          {!imgUrl && (
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                              <CalendarIcon size={18} className="text-white/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm leading-snug truncate">
                              {ev.name}
                            </p>
                            <p className="text-white text-xs mt-0.5">{ev.team_name}</p>
                            <div className="flex items-center gap-3 mt-1.5 text-white/50 text-xs">
                              <span className="flex items-center gap-1">
                                <Clock size={11} />
                                {formatHour(ev.hour)}
                              </span>
                              <span className="flex items-center gap-1 truncate">
                                <MapPin size={11} className="shrink-0" />
                                <span className="truncate">{ev.start_place}</span>
                              </span>
                            </div>
                          </div>
                          {ev.distance_km && (
                            <span className="text-white/60 text-xs whitespace-nowrap shrink-0">
                              {ev.distance_km} km
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
