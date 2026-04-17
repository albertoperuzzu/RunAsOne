import { useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PathCard from "../components/PathCard";
import type { PathData } from "../components/PathCard";
// import LeaderBox from "../components/LeaderBox";          // nascosto — integrazione Garmin
// import TeamActivityCard from "../components/TeamActivityCard"; // nascosto — integrazione Garmin
import { HomeIcon, UsersIcon, CalendarIcon, Map, ChevronLeft, ChevronRight, X } from "lucide-react";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Member = {
  id: number;
  name: string;
  profile_img_url: string;
  role: string;
};

// Attività Garmin — mantenuto per futura reintegrazione
// type Activity = {
//   id: number; name: string; distance: number; elevation?: number;
//   avg_speed?: number; activity_type?: string; date: string;
//   summary_polyline?: string;
//   user: { username: string; profile_img_url?: string };
// };

type Team = {
  id: number;
  name: string;
  image_url: string;
  is_admin: boolean;
  members: Member[];
  // activities: Activity[]; // nascosto — integrazione Garmin
};

type Photo = { id: number; photo_url: string; user_id: number };

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
  path_id?: number | null;
  photos?: Photo[];
};

type Post = {
  id: number;
  title: string;
  description: string;
  photo_url: string | null;
  event_id: number | null;
  created_at: string;
  user: { id: number; name: string; profile_img_url: string };
  event?: { id: number; name: string } | null;
  photos?: Photo[];
};

// type Tab = "home" | "members" | "activities" | "events"; // nascosto — integrazione Garmin
type Tab = "home" | "members" | "paths" | "events";

function resolveUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `${API_BASE_URL}${url}`;
  return `${API_BASE_URL}/uploads/${url}`;
}

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
    name: "", description: "", date: "", hour: "", start_place: "",
    end_place: "", event_type: "", distance_km: "", path_id: "",
  });
  const [newEventImage, setNewEventImage] = useState<File | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", date: "", hour: "", start_place: "",
    end_place: "", event_type: "", distance_km: "", path_id: "",
  });
  const [editEventImage, setEditEventImage] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const { token } = useAuth();

  // ── Nuovi: percorsi del team + bacheca ───────────────────────────────────
  const [teamPaths, setTeamPaths] = useState<PathData[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  // Post — form crea
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", description: "", event_id: null as number | null });
  const [newPostPhoto, setNewPostPhoto] = useState<File | null>(null);
  const newPostPhotoRef = useRef<HTMLInputElement>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSubmitting, setPostSubmitting] = useState(false);

  // Post — form modifica
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editPost, setEditPost] = useState({ title: "", description: "", event_id: null as number | null });
  const [editPostPhoto, setEditPostPhoto] = useState<File | null>(null);
  const editPostPhotoRef = useRef<HTMLInputElement>(null);
  const [postEditError, setPostEditError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; index: number } | null>(null);

  // Stats attività Garmin — nascosto
  // const [stats, setStats] = useState<{...} | null>(null);

  // ── Fetch helpers ────────────────────────────────────────────────────────
  const fetchEvents = async () => {
    try {
      const [futureRes, pastRes] = await Promise.all([
        fetch(`${API_BASE_URL}/db/teams/${id}/events`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/db/teams/${id}/past_events`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (futureRes.ok) setEvents(await futureRes.json());
      if (pastRes.ok) setPastEvents(await pastRes.json());
    } catch { /* silent */ }
  };

  const navigateToEvent = (eventId: number) => {
    setSelectedTab("events");
    setTimeout(() => {
      document.getElementById(`event-${eventId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
  };

  const fetchTeamPaths = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/paths/team/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTeamPaths(await res.json());
    } catch { /* silent */ }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPosts(await res.json());
    } catch { /* silent */ }
  };

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${API_BASE_URL}/db/teams/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setTeam)
      .catch(console.error);
  }, [id]);

  // Stats Garmin — nascosto
  // useEffect(() => {
  //   fetch(`${API_BASE_URL}/db/teams/${id}/stats`, { headers: { Authorization: `Bearer ${token}` } })
  //     .then((res) => res.json()).then(setStats).catch(console.error);
  // }, [id]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/teams/${id}/events`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setEvents).catch(console.error);
    fetch(`${API_BASE_URL}/db/teams/${id}/past_events`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then(setPastEvents).catch(console.error);
  }, [id]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getUserInfo`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json()).then((data) => setCurrentUserId(data.id)).catch(console.error);
  }, []);

  useEffect(() => {
    fetchTeamPaths();
    fetchPosts();
  }, [id]);

  // ── Statistiche percorsi (calcolate client-side) ──────────────────────────
  const totalKm = teamPaths.reduce((s, p) => s + (p.distance ?? 0), 0) / 1000;
  const totalElevation = teamPaths.reduce((s, p) => s + (p.elevation_gain ?? 0), 0);

  // ── Handlers eventi ──────────────────────────────────────────────────────
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
    if (fields.path_id) fd.append("path_id", fields.path_id);
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
        setCreateError((await res.json()).detail || "Errore nella creazione dell'evento.");
        return;
      }
      setShowCreateForm(false);
      setNewEvent({ name: "", description: "", date: "", hour: "", start_place: "", end_place: "", event_type: "", distance_km: "", path_id: "" });
      setNewEventImage(null);
      setCreateError(null);
      await Promise.all([fetchEvents(), fetchPosts()]);
    } catch { setCreateError("Errore di rete."); }
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
      path_id: event.path_id != null ? String(event.path_id) : "",
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
      if (!res.ok) { setEditError((await res.json()).detail || "Errore nella modifica."); return; }
      setEditingEvent(null);
      setEditError(null);
      await fetchEvents();
    } catch { setEditError("Errore di rete."); }
  };

  const handleDeleteEvent = async () => {
    if (!editingEvent) return;
    if (!window.confirm(`Vuoi cancellare l'evento "${editingEvent.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/events/${editingEvent.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { setEditError((await res.json()).detail || "Errore cancellazione."); return; }
      setEvents((prev) => prev.filter((e) => e.id !== editingEvent.id));
      setEditingEvent(null);
    } catch { setEditError("Errore di rete."); }
  };

  const handleRemoveMember = async (userId: number) => {
    const res = await fetch(`${API_BASE_URL}/handle_invites/${id}/remove_member/${userId}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setTeam((p) => p ? { ...p, members: p.members.filter((m) => m.id !== userId) } : null);
    else alert("Errore nella rimozione del membro");
  };

  // ── Handlers bacheca ─────────────────────────────────────────────────────
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.description.trim()) {
      setPostError("Titolo e descrizione sono obbligatori."); return;
    }
    setPostError(null);
    setPostSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", newPost.title.trim());
      fd.append("description", newPost.description.trim());
      if (newPost.event_id != null) fd.append("event_id", String(newPost.event_id));
      if (newPostPhoto) fd.append("photo", newPostPhoto);
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/posts`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error();
      const created: Post = await res.json();
      setPosts((prev) => [created, ...prev]);
      setNewPost({ title: "", description: "", event_id: null });
      setNewPostPhoto(null);
      if (newPostPhotoRef.current) newPostPhotoRef.current.value = "";
      setShowPostForm(false);
    } catch { setPostError("Errore durante la pubblicazione."); }
    finally { setPostSubmitting(false); }
  };

  const openEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPost({ title: post.title, description: post.description, event_id: post.event_id });
    setEditPostPhoto(null);
    setPostEditError(null);
    if (editPostPhotoRef.current) editPostPhotoRef.current.value = "";
  };

  const handleEditPost = async () => {
    if (!editingPost) return;
    if (!editPost.title.trim() || !editPost.description.trim()) {
      setPostEditError("Titolo e descrizione sono obbligatori."); return;
    }
    try {
      const fd = new FormData();
      fd.append("title", editPost.title.trim());
      fd.append("description", editPost.description.trim());
      if (editPost.event_id != null) fd.append("event_id", String(editPost.event_id));
      if (editPostPhoto) fd.append("photo", editPostPhoto);
      const res = await fetch(`${API_BASE_URL}/db/teams/${id}/posts/${editingPost.id}`, {
        method: "PUT", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!res.ok) throw new Error();
      const updated: Post = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setEditingPost(null);
    } catch { setPostEditError("Errore durante la modifica."); }
  };

  // ── Handlers foto evento/post ─────────────────────────────────────────────
  const handleAddEventPhoto = async (eventId: number, files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("photo", file);
      try {
        const res = await fetch(`${API_BASE_URL}/db/teams/${id}/events/${eventId}/photos`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (!res.ok) continue;
        const p: Photo = await res.json();
        const addFn = (prev: Event[]) =>
          prev.map((e) => e.id === eventId ? { ...e, photos: [...(e.photos ?? []), p] } : e);
        setEvents(addFn);
        setPastEvents(addFn);
      } catch { /* silent */ }
    }
  };

  const handleDeleteEventPhoto = async (eventId: number, photoId: number) => {
    try {
      await fetch(`${API_BASE_URL}/db/teams/${id}/events/${eventId}/photos/${photoId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      const removeFn = (prev: Event[]) =>
        prev.map((e) => e.id === eventId ? { ...e, photos: (e.photos ?? []).filter((p) => p.id !== photoId) } : e);
      setEvents(removeFn);
      setPastEvents(removeFn);
      setLightbox(null);
    } catch { /* silent */ }
  };

  const handleAddPostPhoto = async (postId: number, files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("photo", file);
      try {
        const res = await fetch(`${API_BASE_URL}/db/teams/${id}/posts/${postId}/photos`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
        });
        if (!res.ok) continue;
        const p: Photo = await res.json();
        setPosts((prev) => prev.map((post) => post.id === postId ? { ...post, photos: [...(post.photos ?? []), p] } : post));
      } catch { /* silent */ }
    }
  };

  const handleDeletePostPhoto = async (postId: number, photoId: number) => {
    try {
      await fetch(`${API_BASE_URL}/db/teams/${id}/posts/${postId}/photos/${photoId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.map((post) => post.id === postId
        ? { ...post, photos: (post.photos ?? []).filter((p) => p.id !== photoId) }
        : post));
      setLightbox(null);
    } catch { /* silent */ }
  };

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm("Vuoi eliminare questo post?")) return;
    try {
      await fetch(`${API_BASE_URL}/db/teams/${id}/posts/${postId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      if (editingPost?.id === postId) setEditingPost(null);
    } catch { /* silent */ }
  };

  // ────────────────────────────────────────────────────────────────────────
  if (!team) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/70">Caricamento...</p>
    </div>
  );

  // const tabs: ... "activities" ... // nascosto — integrazione Garmin
  const tabs: { key: Tab; icon: typeof HomeIcon; label: string }[] = [
    { key: "home", icon: HomeIcon, label: "Home" },
    { key: "members", icon: UsersIcon, label: "Membri" },
    { key: "paths", icon: Map, label: "Percorsi" },
    { key: "events", icon: CalendarIcon, label: "Eventi" },
  ];

  const canEditPost = (post: Post) =>
    currentUserId === post.user.id || (team?.is_admin ?? false);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Navbar />

      <div className="flex-grow px-4 pt-8 pb-4 max-w-xl mx-auto w-full">

        {/* ══ HOME TAB ══════════════════════════════════════════════════════ */}
        {selectedTab === "home" && (
          <div>
            <div className="text-center mb-4">
              <img
                src={team.image_url.startsWith("http") ? team.image_url : `${API_BASE_URL}/uploads/${team.image_url}`}
                alt={team.name}
                className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-2 border-white/30 shadow-lg"
              />
              <h1 className="text-indaco text-xl font-bold mb-4">{team.name}</h1>
            </div>

            {/* Stats Garmin — nascosto
            {stats ? (
              <div>
                <div className="glass rounded-xl p-4 mb-4 flex justify-around">
                  <div><div className="text-white/50 text-xs">Km totali</div><div className="text-white font-bold text-lg">{stats.total_distance_km}</div></div>
                  <div className="border-l border-white/20" />
                  <div><div className="text-white/50 text-xs">Dislivello</div><div className="text-white font-bold text-lg">{stats.total_elevation_m} m</div></div>
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
            */}

            {/* ── Statistiche percorsi ── */}
            <div className="glass rounded-xl p-4 mb-6 flex justify-around">
              <div className="text-center">
                <div className="text-white/50 text-xs mb-0.5">Km Caricati</div>
                <div className="text-white font-bold text-lg">{totalKm.toFixed(1)}</div>
              </div>
              <div className="border-l border-white/20" />
              <div className="text-center">
                <div className="text-white/50 text-xs mb-0.5">D+ totale</div>
                <div className="text-white font-bold text-lg">{Math.round(totalElevation)} m</div>
              </div>
            </div>

            {/* ── Bacheca ── */}
            <div>
              <h2 className="text-white font-semibold mb-3">Bacheca</h2>

              {/* Form crea post */}
              {showPostForm ? (
                <form onSubmit={handleCreatePost} className="glass rounded-xl p-4 mb-4 space-y-3">
                  <h3 className="text-white font-semibold text-sm text-center">Nuovo post</h3>
                  <input className="glass-input" placeholder="Titolo *"
                    value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))} />
                  <textarea className="glass-input resize-none" rows={3} placeholder="Descrizione *"
                    value={newPost.description} onChange={(e) => setNewPost((p) => ({ ...p, description: e.target.value }))} />
                  <div>
                    <p className="text-white/50 text-xs mb-1">Collega a un evento (opzionale)</p>
                    <select className="glass-input"
                      value={newPost.event_id ?? ""}
                      onChange={(e) => setNewPost((p) => ({ ...p, event_id: e.target.value ? Number(e.target.value) : null }))}>
                      <option value="">Nessun evento</option>
                      {[...events, ...pastEvents].map((ev) => (
                        <option key={ev.id} value={ev.id}>{ev.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-white/50 text-xs mb-1">Foto (opzionale)</p>
                    <input ref={newPostPhotoRef} className="glass-input" type="file" accept="image/*"
                      onChange={(e) => setNewPostPhoto(e.target.files?.[0] ?? null)} />
                  </div>
                  {postError && <p className="text-accent text-sm">{postError}</p>}
                  <div className="flex gap-3">
                    <button type="submit" disabled={postSubmitting} className="btn-gradient flex-1 py-2 rounded-lg text-sm">
                      {postSubmitting ? "Pubblicazione…" : "Pubblica"}
                    </button>
                    <button type="button" className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition"
                      onClick={() => { setShowPostForm(false); setPostError(null); }}>Annulla</button>
                  </div>
                </form>
              ) : (
                <button className="w-full glass rounded-xl py-2.5 text-white/60 text-sm hover:text-white hover:bg-white/5 transition mb-4"
                  onClick={() => setShowPostForm(true)}>
                  + Scrivi un post
                </button>
              )}

              {/* Lista post */}
              {posts.length === 0 ? (
                <p className="text-white/30 text-sm text-center mt-4">La bacheca è vuota.</p>
              ) : (
                <ul className="space-y-4">
                  {posts.map((post) =>
                    editingPost?.id === post.id ? (
                      /* ── Form modifica post inline ── */
                      <li key={post.id} className="glass rounded-xl p-4 space-y-3">
                        <h3 className="text-white font-semibold text-sm text-center">Modifica post</h3>
                        <input className="glass-input" placeholder="Titolo *"
                          value={editPost.title} onChange={(e) => setEditPost((p) => ({ ...p, title: e.target.value }))} />
                        <textarea className="glass-input resize-none" rows={3}
                          value={editPost.description} onChange={(e) => setEditPost((p) => ({ ...p, description: e.target.value }))} />
                        <div>
                          <p className="text-white/50 text-xs mb-1">Evento collegato</p>
                          <select className="glass-input"
                            value={editPost.event_id ?? ""}
                            onChange={(e) => setEditPost((p) => ({ ...p, event_id: e.target.value ? Number(e.target.value) : null }))}>
                            <option value="">Nessun evento</option>
                            {[...events, ...pastEvents].map((ev) => (
                              <option key={ev.id} value={ev.id}>{ev.name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <p className="text-white/50 text-xs mb-1">Nuova foto (opzionale)</p>
                          <input ref={editPostPhotoRef} className="glass-input" type="file" accept="image/*"
                            onChange={(e) => setEditPostPhoto(e.target.files?.[0] ?? null)} />
                        </div>
                        {postEditError && <p className="text-accent text-sm">{postEditError}</p>}
                        <div className="flex gap-3">
                          <button className="btn-gradient flex-1 py-2 rounded-lg text-sm" onClick={handleEditPost}>Conferma</button>
                          <button className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 text-sm hover:bg-white/10 transition"
                            onClick={() => setEditingPost(null)}>Annulla</button>
                        </div>
                        <button className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 transition text-sm"
                          onClick={() => handleDeletePost(post.id)}>Elimina post</button>
                      </li>
                    ) : (
                      /* ── Card post ── */
                      <li key={post.id} className="glass rounded-xl overflow-hidden">
                        {post.photo_url && (
                          <div className="px-4 pt-4">
                            <img src={resolveUrl(post.photo_url)} alt={post.title}
                              className="w-full h-40 object-cover rounded-xl" />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <img src={resolveUrl(post.user.profile_img_url)} alt={post.user.name}
                                className="w-7 h-7 rounded-full object-cover border border-white/20" />
                              <div>
                                <p className="text-white/70 text-xs">{post.user.name}</p>
                                <p className="text-white/40 text-xs">
                                  {new Date(post.created_at).toLocaleDateString("it-IT")}
                                </p>
                              </div>
                            </div>
                            {canEditPost(post) && (
                              <button className="text-xs text-white/50 hover:text-white border border-white/20 px-2 py-0.5 rounded-md transition flex-shrink-0"
                                onClick={() => openEditPost(post)}>Modifica</button>
                            )}
                          </div>
                          <p className="text-white font-semibold mb-1">{post.title}</p>
                          <p className="text-white/70 text-sm">{post.description}</p>
                          {post.event && (
                            <button
                              onClick={() => navigateToEvent(post.event!.id)}
                              className="mt-2 inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 transition rounded-full px-3 py-1 text-xs text-white/60"
                            >
                              📅 {post.event.name}
                            </button>
                          )}
                          {/* Galleria foto post */}
                          {((post.photos?.length ?? 0) > 0 || canEditPost(post)) && (
                            <div className="mt-3 pt-3 border-t border-white/10">
                              {(post.photos?.length ?? 0) > 0 && (
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {post.photos!.slice(0, 4).map((photo, i) => (
                                    <div key={photo.id} className="relative group">
                                      <button onClick={() => setLightbox({ photos: post.photos!, index: i })}>
                                        <img src={resolveUrl(photo.photo_url)} className="w-14 h-14 object-cover rounded-lg" />
                                      </button>
                                      {canEditPost(post) && (
                                        <button onClick={() => handleDeletePostPhoto(post.id, photo.id)}
                                          className="absolute -top-1 -right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full hidden group-hover:flex items-center justify-center">✕</button>
                                      )}
                                    </div>
                                  ))}
                                  {post.photos!.length > 4 && (
                                    <button onClick={() => setLightbox({ photos: post.photos!, index: 4 })}
                                      className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-xs font-semibold">
                                      +{post.photos!.length - 4}
                                    </button>
                                  )}
                                </div>
                              )}
                              {canEditPost(post) && (
                                <label className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 cursor-pointer transition">
                                  📷 Aggiungi foto
                                  <input type="file" accept="image/*" multiple className="hidden"
                                    onChange={(e) => handleAddPostPhoto(post.id, e.target.files)} />
                                </label>
                              )}
                            </div>
                          )}
                        </div>
                      </li>
                    )
                  )}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ══ MEMBERS TAB ══════════════════════════════════════════════════ */}
        {selectedTab === "members" && (
          <div>
            <h2 className="text-indaco text-2xl font-bold mb-4 text-center">Membri del team</h2>
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
                <input type="email" placeholder="Email utente" value={emailToInvite}
                  onChange={(e) => setEmailToInvite(e.target.value)} className="glass-input mb-2" />
                <button onClick={handleInvite} className="btn-gradient px-6 py-2 rounded-lg">Invita</button>
                {inviteMessage && <p className="mt-2 text-white/70 text-sm">{inviteMessage}</p>}
              </div>
            )}
          </div>
        )}

        {/* ══ ACTIVITIES TAB — nascosto (integrazione Garmin) ══════════════
        {selectedTab === "activities" && (
          <div>
            <h2 className="text-indaco text-xl font-semibold mb-4 text-center">Attività del team</h2>
            <ul className="space-y-4">
              {team.activities.map((act) => (
                <li key={act.id}><TeamActivityCard activity={act} /></li>
              ))}
            </ul>
          </div>
        )}
        */}

        {/* ══ PATHS TAB ════════════════════════════════════════════════════ */}
        {selectedTab === "paths" && (
          <div>
            <h2 className="text-indaco text-2xl font-bold mb-4 text-center">Percorsi del team</h2>
            {teamPaths.length === 0 ? (
              <p className="text-white/40 text-sm text-center mt-8">Nessun percorso caricato dai membri.</p>
            ) : (
              <ul className="space-y-4">
                {teamPaths.map((path) => (
                  <li key={path.id}>
                    <PathCard path={path} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ══ EVENTS TAB ═══════════════════════════════════════════════════ */}
        {selectedTab === "events" && (
          <div>
            <h2 className="text-indaco text-2xl font-bold mb-4 text-center">Eventi del team</h2>

            {/* Lista eventi attivi */}
            {events.length > 0 ? (
              <ul className="space-y-3">
                {events.map((event) =>
                  editingEvent?.id === event.id ? (
                    <li key={event.id} className="glass rounded-2xl p-5 space-y-3">
                      <h3 className="text-white font-semibold text-center mb-1">Modifica evento</h3>
                      <input className="glass-input" placeholder="Nome evento *" value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
                      <textarea className="glass-input resize-none" placeholder="Descrizione *" rows={3}
                        value={editForm.description}
                        onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <p className="text-white/50 text-xs mb-1">Data *</p>
                          <input className="glass-input mb-0 w-full" type="date" value={editForm.date}
                            onChange={(e) => setEditForm((p) => ({ ...p, date: e.target.value }))} />
                        </div>
                        <div className="flex-1">
                          <p className="text-white/50 text-xs mb-1">Ora *</p>
                          <input className="glass-input mb-0 w-full" type="time" value={editForm.hour}
                            onChange={(e) => setEditForm((p) => ({ ...p, hour: e.target.value }))} />
                        </div>
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
                        <p className="text-white/50 text-xs mb-1">Percorso GPX (opzionale)</p>
                        <select className="glass-input" value={editForm.path_id}
                          onChange={(e) => setEditForm((p) => ({ ...p, path_id: e.target.value }))}>
                          <option value="">Nessun percorso</option>
                          {teamPaths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
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
                      <button className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 transition text-sm"
                        onClick={handleDeleteEvent}>Cancella evento</button>
                    </li>
                  ) : (
                    <li key={event.id} id={`event-${event.id}`} className="glass rounded-xl overflow-hidden">
                      <div className="flex items-start gap-4 p-4">
                        {event.event_img_url ? (
                          <img src={event.event_img_url.startsWith("http") ? event.event_img_url : `${API_BASE_URL}/uploads/${event.event_img_url}`} alt={event.name}
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
                              <button className="text-xs text-white/50 hover:text-white border border-white/20 px-2 py-0.5 rounded-md transition flex-shrink-0"
                                onClick={() => openEditForm(event)}>Modifica</button>
                            )}
                          </div>
                          <p className="text-white/50 text-xs">📅 {event.date} · {event.hour?.slice(0, 5)}</p>
                          <p className="text-white/70 text-xs mt-0.5">
                            📍 {event.start_place}{event.end_place ? ` → ${event.end_place}` : ""}
                          </p>
                          {event.distance_km != null && (
                            <p className="text-white/50 text-xs mt-0.5">🏃 {event.distance_km} km</p>
                          )}
                          {event.path_id && teamPaths.find((p) => p.id === event.path_id) && (
                            <p className="text-white/50 text-xs mt-0.5">
                              🗺️ {teamPaths.find((p) => p.id === event.path_id)!.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="px-4 pb-3 text-center border-t border-white/10 pt-3">
                        <p className="text-white/80 text-sm">{event.description}</p>
                      </div>
                      {/* Galleria foto evento */}
                      {((event.photos?.length ?? 0) > 0 || currentUserId === event.creator_id || team.is_admin) && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-3">
                          {(event.photos?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {event.photos!.slice(0, 4).map((photo, i) => (
                                <div key={photo.id} className="relative group">
                                  <button onClick={() => setLightbox({ photos: event.photos!, index: i })}>
                                    <img src={resolveUrl(photo.photo_url)} className="w-16 h-16 object-cover rounded-lg" />
                                  </button>
                                  {(currentUserId === event.creator_id || team.is_admin) && (
                                    <button onClick={() => handleDeleteEventPhoto(event.id, photo.id)}
                                      className="absolute -top-1 -right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full hidden group-hover:flex items-center justify-center">✕</button>
                                  )}
                                </div>
                              ))}
                              {event.photos!.length > 4 && (
                                <button onClick={() => setLightbox({ photos: event.photos!, index: 4 })}
                                  className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-white/60 text-sm font-semibold">
                                  +{event.photos!.length - 4}
                                </button>
                              )}
                            </div>
                          )}
                          {(currentUserId === event.creator_id || team.is_admin) && (
                            <label className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 cursor-pointer transition">
                              📷 Aggiungi foto
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => handleAddEventPhoto(event.id, e.target.files)} />
                            </label>
                          )}
                        </div>
                      )}
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
                  <div className="flex-1">
                    <p className="text-white/50 text-xs mb-1">Data *</p>
                    <input className="glass-input mb-0 w-full" type="date" value={newEvent.date}
                      onChange={(e) => setNewEvent((p) => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/50 text-xs mb-1">Ora *</p>
                    <input className="glass-input mb-0 w-full" type="time" value={newEvent.hour}
                      onChange={(e) => setNewEvent((p) => ({ ...p, hour: e.target.value }))} />
                  </div>
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
                  <p className="text-white/50 text-xs mb-1">Percorso GPX (opzionale)</p>
                  <select className="glass-input" value={newEvent.path_id}
                    onChange={(e) => setNewEvent((p) => ({ ...p, path_id: e.target.value }))}>
                    <option value="">Nessun percorso</option>
                    {teamPaths.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
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

            {/* Sezione eventi conclusi */}
            {pastEvents.length > 0 && (
              <div className="mt-8">
                <h3 className="text-gray-500 text-sm font-semibold mb-3 text-center uppercase tracking-widest">
                  Eventi conclusi
                </h3>
                <ul className="space-y-3">
                  {pastEvents.map((event) => (
                    <li key={event.id} id={`event-${event.id}`} className="glass rounded-xl overflow-hidden opacity-60">
                      <div className="flex items-start gap-4 p-4">
                        {event.event_img_url ? (
                          <img src={event.event_img_url.startsWith("http") ? event.event_img_url : `${API_BASE_URL}/uploads/${event.event_img_url}`} alt={event.name}
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
                      <div className="px-4 pb-3 text-center border-t border-white/10 pt-3">
                        <p className="text-white/50 text-sm">{event.description}</p>
                      </div>
                      {/* Galleria foto evento passato */}
                      {((event.photos?.length ?? 0) > 0 || currentUserId === event.creator_id || team.is_admin) && (
                        <div className="px-4 pb-4 border-t border-white/10 pt-3">
                          {(event.photos?.length ?? 0) > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                              {event.photos!.slice(0, 4).map((photo, i) => (
                                <div key={photo.id} className="relative group">
                                  <button onClick={() => setLightbox({ photos: event.photos!, index: i })}>
                                    <img src={resolveUrl(photo.photo_url)} className="w-16 h-16 object-cover rounded-lg grayscale" />
                                  </button>
                                  {(currentUserId === event.creator_id || team.is_admin) && (
                                    <button onClick={() => handleDeleteEventPhoto(event.id, photo.id)}
                                      className="absolute -top-1 -right-1 bg-black/70 text-white text-xs w-5 h-5 rounded-full hidden group-hover:flex items-center justify-center">✕</button>
                                  )}
                                </div>
                              ))}
                              {event.photos!.length > 4 && (
                                <button onClick={() => setLightbox({ photos: event.photos!, index: 4 })}
                                  className="w-16 h-16 rounded-lg bg-white/10 flex items-center justify-center text-white/50 text-sm font-semibold">
                                  +{event.photos!.length - 4}
                                </button>
                              )}
                            </div>
                          )}
                          {(currentUserId === event.creator_id || team.is_admin) && (
                            <label className="inline-flex items-center gap-1 text-xs text-white/40 hover:text-white/70 cursor-pointer transition">
                              📷 Aggiungi foto
                              <input type="file" accept="image/*" multiple className="hidden"
                                onChange={(e) => handleAddEventPhoto(event.id, e.target.files)} />
                            </label>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute top-2 right-2 z-10 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/80 transition"
              onClick={() => setLightbox(null)}
            >
              <X size={18} />
            </button>
            <img
              src={resolveUrl(lightbox.photos[lightbox.index].photo_url)}
              className="max-h-[80vh] w-full object-contain rounded-xl"
            />
            {lightbox.photos.length > 1 && (
              <>
                <button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition"
                  onClick={() => setLightbox((l) => l ? { ...l, index: (l.index - 1 + l.photos.length) % l.photos.length } : null)}
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-2 hover:bg-black/80 transition"
                  onClick={() => setLightbox((l) => l ? { ...l, index: (l.index + 1) % l.photos.length } : null)}
                >
                  <ChevronRight size={20} />
                </button>
                <p className="text-center text-white/50 text-sm mt-2">
                  {lightbox.index + 1} / {lightbox.photos.length}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-dark z-50">
        <div className="flex justify-around py-3 max-w-xl mx-auto">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setSelectedTab(key)}
              className={`flex flex-col items-center text-xs transition ${
                selectedTab === key ? "text-accent font-semibold" : "text-white/50 hover:text-white/80"
              }`}>
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
