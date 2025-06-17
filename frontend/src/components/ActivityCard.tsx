import Button from "./Button";

type Activity = {
  id: number;
  name: string;
  distance: number;
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
      <Button
        variant="primary"
        onClick={() => {
          const url = `http://localhost:8000/activities/${activity.id}/export_gpx`;
          window.location.href = url;
        }}
      >
        Scarica GPX
      </Button>
    </div>
  );
}