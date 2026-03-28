import Button from "./Button";
import MapPreview from "./MapPreview";
import API_BASE_URL from "../config";

type Activity = {
  id: number;
  name: string;
  distance: number;
  summary_polyline?: string;
};

type Props = {
  activity: Activity;
};

export default function ActivityCard({ activity }: Props) {
  return (
    <div className="glass rounded-xl p-5 hover:shadow-xl transition">
      <p className="text-white font-semibold text-lg mb-1">{activity.name}</p>
      <p className="text-white/70 text-sm mb-3">
        Distanza: {(activity.distance / 1000).toFixed(2)} km
      </p>
      {activity.summary_polyline && (
        <div className="rounded-lg overflow-hidden mb-3">
          <MapPreview encodedPolyline={activity.summary_polyline} />
        </div>
      )}
      <Button
        variant="primary"
        onClick={() => {
          const url = `${API_BASE_URL}/garmin_api/${activity.id}/export_gpx`;
          window.location.href = url;
        }}
      >
        Scarica GPX
      </Button>
    </div>
  );
}
