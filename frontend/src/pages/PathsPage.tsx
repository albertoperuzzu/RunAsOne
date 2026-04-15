import { useEffect, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import PathCard from "../components/PathCard";
import type { PathData } from "../components/PathCard";
import { Upload, ChevronDown, ChevronUp } from "lucide-react";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

export default function PathsPage() {
  const { token } = useAuth();
  const [paths, setPaths] = useState<PathData[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [gpxFile, setGpxFile] = useState<File | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const gpxRef = useRef<HTMLInputElement>(null);

  const fetchPaths = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/paths/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setPaths(await res.json());
    } catch {
      setError("Errore nel caricamento dei percorsi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPaths(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpxFile || !name.trim()) {
      setError("Inserisci un nome e seleziona un file GPX.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("name", name.trim());
      form.append("gpx_file", gpxFile);
      if (photo) form.append("photo", photo);

      const res = await fetch(`${API_BASE_URL}/paths/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      if (!res.ok) throw new Error();
      const created: PathData = await res.json();
      setPaths((prev) => [created, ...prev]);
      setName("");
      setGpxFile(null);
      setPhoto(null);
      if (gpxRef.current) gpxRef.current.value = "";
      if (photoRef.current) photoRef.current.value = "";
      setFormOpen(false);
    } catch {
      setError("Errore durante il caricamento del percorso.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/paths/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaths((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Errore durante l'eliminazione.");
    }
  };

  return (
    <div className="min-h-screen pb-8">
      <Navbar />
      <div className="px-4 pt-8 max-w-xl mx-auto">
        <h1 className="text-indaco text-2xl font-bold drop-shadow mb-5">I tuoi percorsi</h1>

        {/* ── Upload form ── */}
        <div className="glass rounded-xl mb-6 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-white font-semibold text-sm"
            onClick={() => setFormOpen((o) => !o)}
          >
            <span className="flex items-center gap-2">
              <Upload size={16} />
              Carica percorso
            </span>
            {formOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {formOpen && (
            <form onSubmit={handleUpload} className="px-4 pb-4 space-y-3 border-t border-white/10 pt-3">
              <input
                className="glass-input w-full"
                placeholder="Nome percorso"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div>
                <p className="text-white/50 text-xs mb-1">File GPX *</p>
                <input
                  ref={gpxRef}
                  className="glass-input w-full"
                  type="file"
                  accept=".gpx"
                  onChange={(e) => setGpxFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div>
                <p className="text-white/50 text-xs mb-1">Foto copertina (opzionale)</p>
                <input
                  ref={photoRef}
                  className="glass-input w-full"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
                />
              </div>
              {error && <p className="text-accent text-sm">{error}</p>}
              <button
                type="submit"
                disabled={uploading}
                className="btn-gradient w-full py-2 rounded-lg text-sm font-semibold"
              >
                {uploading ? "Caricamento…" : "Carica"}
              </button>
            </form>
          )}
        </div>

        {error && !formOpen && <p className="text-accent text-sm mb-4">{error}</p>}

        {/* ── Lista percorsi ── */}
        {loading ? (
          <p className="text-indaco/70 text-center">Caricamento...</p>
        ) : paths.length === 0 ? (
          <p className="text-white/40 text-center text-sm mt-8">
            Nessun percorso caricato. Carica il tuo primo GPX!
          </p>
        ) : (
          <ul className="space-y-4">
            {paths.map((path) => (
              <li key={path.id}>
                <PathCard path={path} onDelete={() => handleDelete(path.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
