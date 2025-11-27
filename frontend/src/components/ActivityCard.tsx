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
    <div className="bg-arancio/60 shadow-md rounded-xl p-6 border border-gray-200 hover:shadow-lg transition">
      <p className="text-lg font-semibold">{activity.name}</p>
      <p className="text-sm text-gray-600">
        Distanza: {(activity.distance / 1000).toFixed(2)} km
      </p>
      {activity.summary_polyline && (
        <MapPreview encodedPolyline={activity.summary_polyline} />
      )}
      <Button
        variant="primary"
        onClick={() => {
          const url = `${API_BASE_URL}/strava_api/${activity.id}/export_gpx`;
          window.location.href = url;
        }}
      >
        Scarica GPX
      </Button>
    </div>
  );
}