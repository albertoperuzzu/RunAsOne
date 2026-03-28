import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type Team = {
  id: number;
  name: string;
  members: { id: number; email: string }[];
  image_url: string;
  is_admin: boolean;
};

export default function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editName, setEditName] = useState("");
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getTeams`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setTeams)
      .catch(() => setError("Errore nel caricamento dei team"));
  }, []);

  const openEdit = (e: React.MouseEvent, team: Team) => {
    e.stopPropagation();
    setEditingTeam(team);
    setEditName(team.name);
    setEditImage(null);
    setEditError(null);
  };

  const handleSave = async () => {
    if (!editingTeam) return;
    if (!editName.trim()) { setEditError("Il nome non può essere vuoto."); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", editName.trim());
      if (editImage) fd.append("image", editImage);

      const res = await fetch(`${API_BASE_URL}/db/teams/${editingTeam.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.detail || "Errore nel salvataggio.");
        return;
      }
      const updated = await res.json();
      setTeams((prev) =>
        prev.map((t) => t.id === updated.id ? { ...t, name: updated.name, image_url: updated.image_url } : t)
      );
      setEditingTeam(null);
    } catch {
      setEditError("Errore di rete.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Navbar />
      <div className="px-4 pt-8 max-w-xl mx-auto">
        <h1 className="text-indaco text-2xl font-bold drop-shadow mb-6">I tuoi team</h1>

        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        {teams.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-indaco/70 mb-5">Non fai ancora parte di nessun team.</p>
            <Button variant="primary" onClick={() => navigate("/createTeam")}>
              Crea un team
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) =>
              editingTeam?.id === team.id ? (
                /* ── Form modifica team ── */
                <div key={team.id} className="glass rounded-xl p-5 space-y-3">
                  <h3 className="text-white font-semibold text-center">Modifica team</h3>

                  <input
                    className="glass-input"
                    placeholder="Nome team"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />

                  {/* Anteprima immagine corrente + input file */}
                  <div className="flex items-center gap-4">
                    <img
                      src={
                        editImage
                          ? URL.createObjectURL(editImage)
                          : `${API_BASE_URL}/uploads/${team.image_url}`
                      }
                      alt="anteprima"
                      className="w-14 h-14 rounded-full object-cover border border-white/30 flex-shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-white/50 text-xs mb-1">Nuova immagine (opzionale)</p>
                      <input
                        ref={fileInputRef}
                        className="glass-input mb-0"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setEditImage(e.target.files?.[0] ?? null)}
                      />
                    </div>
                  </div>

                  {editError && <p className="text-accent text-sm">{editError}</p>}

                  <div className="flex gap-3 pt-1">
                    <button
                      className="btn-gradient flex-1 py-2 rounded-lg"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Salvataggio…" : "Conferma"}
                    </button>
                    <button
                      className="flex-1 py-2 rounded-lg border border-white/20 text-white/70 hover:bg-white/10 transition"
                      onClick={() => { setEditingTeam(null); setEditError(null); }}
                    >
                      Annulla
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Card team ── */
                <div
                  key={team.id}
                  onClick={() => navigate(`/teams/${team.id}`)}
                  className="glass rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:shadow-xl transition"
                >
                  <img
                    src={`${API_BASE_URL}/uploads/${team.image_url}`}
                    alt={team.name}
                    className="w-14 h-14 object-cover rounded-full border border-white/30 shadow flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-white font-semibold text-base">{team.name}</span>
                    <p className="text-white/50 text-xs mt-0.5">{team.members.length} membri</p>
                  </div>
                  {team.is_admin && (
                    <button
                      onClick={(e) => openEdit(e, team)}
                      className="text-xs text-white/50 hover:text-white border border-white/20 px-2 py-1 rounded-md transition flex-shrink-0"
                    >
                      Modifica
                    </button>
                  )}
                </div>
              )
            )}
            <div className="pt-2 text-center">
              <Button variant="primary" onClick={() => navigate("/createTeam")}>
                Crea un team
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
