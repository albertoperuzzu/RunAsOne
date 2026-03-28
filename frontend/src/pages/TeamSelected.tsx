import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import LeaderBox from "../components/LeaderBox";
import TeamActivityCard from "../components/TeamActivityCard";
import { HomeIcon, UsersIcon, ActivityIcon, CalendarIcon } from "lucide-react";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

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
  user: { username: string; profile_img_url?: string };
};

type Team = {
  id: number;
  name: string;
  image_url: string;
  is_admin: boolean;
  members: Member[];
  activities: Activity[];
};

type Event = {
  id: number;
  creator_id: number;
  name: string;
  date: string;
  hour: string;
  description: string;
  start_place: string;
  end_place?: string;
  event_type?: string;
  distance_km?: number | null;
  event_img_url?: string | null;
};

type Tab = "home" | "members" | "activities" | "events";

export default function TeamSelected() {
  const { id } = useParams<{ id: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [selectedTab, setSelectedTab] = useState<Tab>("home");
  const [emailToInvite, setEmailToInvite] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [pastEvents, setPastEvents] = useState<Event[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: "", description: "", date: "", hour: "", start_place: "", end_place: "", event_type: "", distance_km: "",
  });
  const [newEventImage, setNewEventImage] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", date: "", hour: "", start_place: "", end_place: "", event_type: "", distance_km: "",
  });
  const [editEventImage, setEditEventImage] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { token } = useAuth();
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
    fetch(`${API_BASE_URL}/db/teams/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setTeam)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/teams/${id}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setStats)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/teams/${id}/events`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setEvents)
      .catch(console.error);
    fetch(`${API_BASE_URL}/db/teams/${id}/past_events`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setPastEvents)
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getUserInfo`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setCurrentUserId(data.id))
      .catch(console.error);
  }, []);

  const handleInvite = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/handle_invites/teams/${id}/invite`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: new URLSearchParams({ email: emailToInvite }),
      });
      const data = await res.json();
      setInviteMessage(res.ok ? "Invito inviato!" : data.detail || "Errore");
      if (res.ok) setEmailToInvite("");
    } catch { setInviteMessage("Errore di rete"); }
  };

  const buildEventFormData = (fields: typeof newEvent, image: File | null) => {
    const fd = new FormData();
    fd.append("name", fields.name);
    fd.append("description", fields.description);
    fd.append("date", fields.date);
    fd.append("hour", fields.hour);
    fd.append("start_place", fields.start_place);
    if (fields.end_place) fd.append("end_place", fields.end_place);
    if (fields.event_type) fd.append("event_type", fields.event_type);
    if (fields.distance_km) fd.append("distance_km", fields.distance_km);
    if (image) fd.append("image", image);
    return fd;
  };

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.description || !newEvent.date || !newEvent.hour || !newEvent.start_place) {
      setCreateError("Compila tutti i campi obbligatori.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/create_event`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: buildEventFormData(newEvent, newEventImage),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.detail || "Errore nella creazione dell'evento.");
        return;
      }
      const created: Event = await res.json();
      setEvents((prev) => [...prev, created]);
      setShowCreateForm(false);
      setNewEvent({ name: "", description: "", date: "", hour: "", start_place: "", end_place: "", event_type: "", distance_km: "" });
      setNewEventImage(null);
      setCreateError(null);
    } catch {
      setCreateError("Errore di rete.");
    }
  };

  const openEditForm = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      name: event.name,
      description: event.description,
      date: event.date,
      hour: event.hour?.slice(0, 5) ?? "",
      start_place: event.start_place,
      end_place: event.end_place ?? "",
      event_type: event.event_type ?? "",
      distance_km: event.distance_km != null ? String(event.distance_km) : "",
    });
    setEditEventImage(null);
    setEditError(null);
  };

  const handleEditEvent = async () => {
    if (!editingEvent) return;
    if (!editForm.name || !editForm.description || !editForm.date || !editForm.hour || !editForm.start_place) {
      setEditError("Compila tutti i campi obbligatori.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/events/${editingEvent.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: buildEventFormData(editForm, editEventImage),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.detail || "Errore nella modifica dell'evento.");
        return;
      }
      const updated: Event = await res.json();
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setEditingEvent(null);
      setEditError(null);
    } catch {
      setEditError("Errore di rete.");
    }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    if (!window.confirm(`Vuoi cancellare l'evento "${editingEvent.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/events/${editingEvent.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.detail || "Errore nella cancellazione.");
        return;
      }
      setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
      setEditingEvent(null);
    } catch {
      setEditError("Errore di rete.");
    }
  };

  const handleRemoveMember = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/handle_invites/${id}/remove_member/${userId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTeam((p) => p ? { ...p, members: p.members.filter((m) => m.id !== userId) } : null);
    else alert("Errore nella rimozione del membro");
  };

  if (!team) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/70">Caricamento...</p>
    </div>
  );

  const tabs: { key: Tab; icon: typeof HomeIcon; label: string }[] = [
    { key: "home", icon: HomeIcon, label: "Home" },
    { key: "members", icon: UsersIcon, label: "Membri" },
    { key: "activities", icon: ActivityIcon, label: "Attività" },
    { key: "events", icon: CalendarIcon, label: "Eventi" },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Navbar />

      <div className="flex-grow px-4 pt-8 pb-4 max-w-xl mx-auto w-full">

        {/* ── HOME TAB ── */}
        {selectedTab === "home" && (
          <div className="text-center">
            <img
              src={`${API_BASE_URL}/uploads/${team.image_url}`}
              alt={team.name}
              className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-white/30 shadow-lg"
            />
            <h1 className="text-indaco text-xl font-bold mb-4">{team.name}</h1>

            {stats ? (
              <div>
                <div className="glass rounded-xl p-4 mb-4 flex justify-around">
                  <div>
                    <div className="text-white/50 text-xs">Km totali</div>
                    <div className="text-white font-bold text-lg">{stats.total_distance_km}</div>
                  </div>
                  <div className="border-l border-white/20" />
                  <div>
                    <div className="text-white/50 text-xs">Dislivello</div>
                    <div className="text-white font-bold text-lg">{stats.total_elevation_m} m</div>
                  </div>
                </div>

                <div className="flex overflow-x-auto gap-4 px-1 py-2 snap-x scroll-smooth">
                  {[
                    { title: "Distanza totale (km)", data: stats.leaderboards.distance, unit: "km" },
                    { title: "Dislivello totale (m)", data: stats.leaderboards.elevation, unit: "m" },
                    { title: "Velocità max (km/h)", data: stats.leaderboards.max_speed, unit: "km/h" },
                    { title: "Altitudine max (m)", data: stats.leaderboards.elev_high, unit: "m" },
                  ].map(({ title, data, unit }) => (
                    <div key={title} className="flex-shrink-0 w-4/5 snap-center">
                      <LeaderBox title={title} data={data} unit={unit} members={team.members} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-white/50 text-sm">Calcolo statistiche...</p>
            )}
          </div>
        )}

        {/* ── MEMBERS TAB ── */}
        {selectedTab === "members" && (
          <div>
            <h2 className="text-indaco text-xl font-semibold mb-4 text-center">Membri del team</h2>
            <ul className="space-y-3">
              {team.members.map((member) => (
                <li key={member.id} className="glass rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={member.profile_img_url.startsWith("/uploads/")
                        ? `${API_BASE_URL}${member.profile_img_url}`
                        : member.profile_img_url}
                      alt={member.name}
                      className="w-9 h-9 rounded-full object-cover border border-white/30"
                    />
                    <div>
                      <p className="text-white font-medium text-sm">{member.name}</p>
                      <p className="text-white/40 text-xs">{member.role}</p>
                    </div>
                  </div>
                  {team.is_admin && member.role !== "admin" && (
                    <button
                      className="text-xs bg-white/10 border border-white/20 text-white/70 px-3 py-1 rounded-lg hover:bg-red-500/40 transition"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Rimuovi
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {team.is_admin && (
              <div className="glass rounded-xl p-4 mt-5 text-center">
                <h2 className="text-white font-semibold mb-3">Invita nel team</h2>
                <input
                  type="email"
                  placeholder="Email utente"
                  value={emailToInvite}
                  onChange={(e) => setEmailToInvite(e.target.value)}
                  className="glass-input mb-2"
                />
                <button onClick={handleInvite} className="btn-gradient px-6 py-2 rounded-lg">
                  Invita
                </button>
                {inviteMessage && (
                  <p className="mt-2 text-white/70 text-sm">{inviteMessage}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── ACTIVITIES TAB ── */}
        {selectedTab === "activities" && (
          <div>
            <h2 className="text-indaco text-xl font-semibold mb-4 text-center">Attività del team</h2>
            <ul className="space-y-4">
              {team.activities.map((act) => (
                <li key={act.id}>
                  <TeamActivityCard activity={act} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── EVENTS TAB ── */}
        {selectedTab === "events" && (
          <div>
            <h2 className="text-indaco text-xl font-semibold mb-4 text-center">Eventi del team</h2>

            {/* Lista eventi attivi */}
            {events.length > 0 ? (
              <ul className="space-y-3">
                {events.map((event) =>
                  editingEvent?.id === event.id ? (
                    /* ── Form modifica inline ── */
                    <li key={event.id} className="glass rounded-2xl p-5 space-y-3">
                      <h3 className="text-white font-semibold text-center mb-1">Modifica evento</h3>
                      <input className="glass-input" placeholder="Nome evento *" value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                      <textarea className="glass-input resize-none" placeholder="Descrizione *" rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                      <div className="flex gap-2">
                        <input className="glass-input mb-0 flex-1" type="date" value={editForm.date}
                          onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
                        <input className="glass-input mb-0 flex-1" type="time" value={editForm.hour}
                          onChange={(e) => setEditForm((p) => ({ ...p, hour: e.target.value }))} />
                      </div>
                      <input className="glass-input" placeholder="Luogo di partenza *" value={editForm.start_place}
                        onChange={(e) => setEditForm((p) => ({ ...p, start_place: e.target.value }))} />
                      <input className="glass-input" placeholder="Luogo di arrivo (opzionale)" value={editForm.end_place}
                        onChange={(e) => setEditForm((p) => ({ ...p, end_place: e.target.value }))} />
                      <input className="glass-input" placeholder="Tipo evento (es. corsa, ciclismo…)" value={editForm.event_type}
                        onChange={(e) => setEditForm((p) => ({ ...p, event_type: e.target.value }))} />
                      <input className="glass-input" type="number" min="0" step="0.1" placeholder="Km evento (opzionale)"
                        value={editForm.distance_km}
                        onChange={(e) => setEditForm((p) => ({ ...p, distance_km: e.target.value }))} />
                      <div>
                        <p className="text-white/50 text-xs mb-1">Immagine evento (opzionale)</p>
                        <input className="glass-input" type="file" accept="image/*"
                          onChange={(e) => setEditEventImage(e.target.files?.[0] ?? null)} />
                      </div>
                      {editError && <p className="text-accent text-sm">{editError}</p>}
                      <div className="flex gap-3 pt-1">
                        <button className="btn-gradient flex-1 py-2 rounded-lg" onClick={handleEditEvent}>Conferma</button>
                        <button className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition"
                          onClick={() => { setEditingEvent(null); setEditError(null); }}>Annulla</button>
                      </div>
                      <button
                        className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 transition text-sm"
                        onClick={handleDeleteEvent}
                      >
                        Cancella evento
                      </button>
                    </li>
                  ) : (
                    /* ── Card evento ── */
                    <li key={event.id} className="glass rounded-xl overflow-hidden">
                      <div className="flex items-start gap-4 p-4">
                        {event.event_img_url ? (
                          <img src={`${API_BASE_URL}/uploads/${event.event_img_url}`} alt={event.name}
                            className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-7 h-7 text-white/30" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-white font-semibold leading-tight">{event.name}</p>
                            {currentUserId === event.creator_id && (
                              <button
                                className="text-xs text-white/50 hover:text-white border border-white/20 px-2 py-0.5 rounded-md transition flex-shrink-0"
                                onClick={() => openEditForm(event)}
                              >
                                Modifica
                              </button>
                            )}
                          </div>
                          <p className="text-white/50 text-xs">📅 {event.date} · {event.hour?.slice(0, 5)}</p>
                          <p className="text-white/70 text-xs mt-0.5">
                            📍 {event.start_place}{event.end_place ? ` → ${event.end_place}` : ""}
                          </p>
                          {event.distance_km != null && (
                            <p className="text-white/50 text-xs mt-0.5">🏃 {event.distance_km} km</p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 pb-4 text-center border-t border-white/10 pt-3">
                        <p className="text-white/80 text-sm">{event.description}</p>
                      </div>
                    </li>
                  )
                )}
              </ul>
            ) : (
              <div className="glass rounded-2xl p-8 text-center">
                <p className="text-white/50">Nessun evento in programma.</p>
              </div>
            )}

            {/* Form creazione evento */}
            {showCreateForm ? (
              <div className="glass rounded-2xl p-5 mt-5 space-y-3">
                <h3 className="text-white font-semibold text-center mb-1">Nuovo evento</h3>
                <input className="glass-input" placeholder="Nome evento *" value={newEvent.name}
                  onChange={(e) => setNewEvent((p) => ({ ...p, name: e.target.value }))} />
                <textarea className="glass-input resize-none" placeholder="Descrizione *" rows={3}
                  value={newEvent.description}
                  onChange={(e) => setNewEvent((p) => ({ ...p, description: e.target.value }))} />
                <div className="flex gap-2">
                  <input className="glass-input mb-0 flex-1" type="date" value={newEvent.date}
                    onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} />
                  <input className="glass-input mb-0 flex-1" type="time" value={newEvent.hour}
                    onChange={(e) => setNewEvent((p) => ({ ...p, hour: e.target.value }))} />
                </div>
                <input className="glass-input" placeholder="Luogo di partenza *" value={newEvent.start_place}
                  onChange={(e) => setNewEvent((p) => ({ ...p, start_place: e.target.value }))} />
                <input className="glass-input" placeholder="Luogo di arrivo (opzionale)" value={newEvent.end_place}
                  onChange={(e) => setNewEvent((p) => ({ ...p, end_place: e.target.value }))} />
                <input className="glass-input" placeholder="Tipo evento (es. corsa, ciclismo…)" value={newEvent.event_type}
                  onChange={(e) => setNewEvent((p) => ({ ...p, event_type: e.target.value }))} />
                <input className="glass-input" type="number" min="0" step="0.1" placeholder="Km evento (opzionale)"
                  value={newEvent.distance_km}
                  onChange={(e) => setNewEvent((p) => ({ ...p, distance_km: e.target.value }))} />
                <div>
                  <p className="text-white/50 text-xs mb-1">Immagine evento (opzionale)</p>
                  <input className="glass-input" type="file" accept="image/*"
                    onChange={(e) => setNewEventImage(e.target.files?.[0] ?? null)} />
                </div>
                {createError && <p className="text-accent text-sm">{createError}</p>}
                <div className="flex gap-3 pt-1">
                  <button className="btn-gradient flex-1 py-2 rounded-lg" onClick={handleCreateEvent}>Conferma</button>
                  <button className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition"
                    onClick={() => { setShowCreateForm(false); setCreateError(null); }}>Annulla</button>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-center">
                <button className="btn-gradient px-6 py-2 rounded-lg" onClick={() => setShowCreateForm(true)}>
                  + Crea evento
                </button>
              </div>
            )}

            {/* ── Sezione eventi conclusi ── */}
            {pastEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-white/40 text-sm font-semibold mb-3 text-center uppercase tracking-widest">
                  Eventi conclusi
                </h3>
                <ul className="space-y-3">
                  {pastEvents.map((event) => (
                    <li key={event.id} className="glass rounded-xl overflow-hidden opacity-60">
                      <div className="flex items-start gap-4 p-4">
                        {event.event_img_url ? (
                          <img src={`${API_BASE_URL}/uploads/${event.event_img_url}`} alt={event.name}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 grayscale" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                            <CalendarIcon className="w-6 h-6 text-white/20" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white/70 font-semibold leading-tight">{event.name}</p>
                          <p className="text-white/40 text-xs mt-1">📅 {event.date} · {event.hour?.slice(0, 5)}</p>
                          <p className="text-white/40 text-xs mt-0.5">
                            📍 {event.start_place}{event.end_place ? ` → ${event.end_place}` : ""}
                          </p>
                          {event.distance_km != null && (
                            <p className="text-white/30 text-xs mt-0.5">🏃 {event.distance_km} km</p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 pb-4 text-center border-t border-white/10 pt-3">
                        <p className="text-white/50 text-sm">{event.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dark z-50">
        <div className="flex justify-around py-3 max-w-xl mx-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setSelectedTab(key)}
              className={`flex flex-col items-center text-xs transition ${
                selectedTab === key ? "text-accent font-semibold" : "text-white/50 hover:text-white/80"
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
