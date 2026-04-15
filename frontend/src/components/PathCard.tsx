import MapPreview from "./MapPreview";
import API_BASE_URL from "../config";

type PathUser = {
  id: number;
  name: string;
  profile_img_url: string;
};

export type PathData = {
  id: number;
  name: string;
  photo_url: string | null;
  summary_polyline: string | null;
  distance: number | null;
  elevation_gain: number | null;
  gpx_url?: string | null;
  created_at: string;
  user?: PathUser;
};

type Props = {
  path: PathData;
  onDelete?: () => void;
};

function resolveUrl(url: string): string {
  if (url.startsWith("http") || url.startsWith("/")) return url.startsWith("/") ? `${API_BASE_URL}${url}` : url;
  return `${API_BASE_URL}/uploads/${url}`;
}

export default function PathCard({ path, onDelete }: Props) {
  return (
    <div className="glass rounded-xl p-5 hover:shadow-xl transition">
      {/* ── Top: foto + autore + titolo ── */}
      <div className="flex items-start gap-3 mb-1">
        {path.photo_url && (
          <img
            src={resolveUrl(path.photo_url)}
            alt={path.name}
            className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          {path.user && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <img
                src={resolveUrl(path.user.profile_img_url)}
                alt={path.user.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-white/50 text-xs">{path.user.name}</span>
            </div>
          )}
          <p className="text-white font-semibold text-lg leading-tight">{path.name}</p>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="text-white/30 hover:text-accent transition text-xs ml-1 flex-shrink-0"
            title="Elimina"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Distanza + D+ ── */}
      {(path.distance != null || path.elevation_gain != null) && (
        <p className="text-white/70 text-sm mb-3">
          {path.distance != null && `${(path.distance / 1000).toFixed(2)} km`}
          {path.distance != null && path.elevation_gain != null && "  ·  "}
          {path.elevation_gain != null && `D+ ${Math.round(path.elevation_gain)} m`}
        </p>
      )}

      {/* ── Mappa ── */}
      {path.summary_polyline && (
        <div className="rounded-lg overflow-hidden mb-3">
          <MapPreview encodedPolyline={path.summary_polyline} />
        </div>
      )}

      {/* ── Data + Scarica GPX ── */}
      <div className="flex items-center justify-between">
        <p className="text-white/40 text-xs">
          {new Date(path.created_at).toLocaleDateString("it-IT")}
        </p>
        {path.gpx_url && (
          <a
            href={resolveUrl(path.gpx_url)}
            download
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indaco/70 hover:text-indaco border border-indaco/30 hover:border-indaco/60 px-3 py-1 rounded-lg transition"
          >
            Scarica GPX
          </a>
        )}
      </div>
    </div>
  );
}
