import API_BASE_URL from "../config";
import MapPreview from "./MapPreview";
import Button from "./Button";

import {
  MapPinIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/solid";

type Activity = {
  id: number;
  name: string;
  distance: number;
  elevation?: number;
  avg_speed?: number;
  activity_type?: string;
  date: string;
  summary_polyline?: string;
  user: {
    username: string;
    profile_img_url?: string;
  };
};

type Props = {
  activity: Activity;
};

export default function TeamActivityCard({ activity }: Props) {
  return (
    <div className="glass rounded-xl p-5 w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <img
          src={
            activity.user?.profile_img_url
              ? activity.user.profile_img_url.startsWith("/uploads/")
                ? `${API_BASE_URL}${activity.user.profile_img_url}`
                : activity.user.profile_img_url
              : "/default_user_img.jpg"
          }
          alt="user"
          className="w-10 h-10 rounded-full object-cover border border-white/30 shadow"
        />
        <h2 className="text-white font-bold text-right">{activity.name}</h2>
      </div>

      <div className="grid grid-cols-2 gap-y-4 text-center">
        <div className="flex flex-col items-center">
          <MapPinIcon className="w-5 h-5 text-cool mb-1" />
          <span className="text-white font-semibold text-sm">
            {(activity.distance / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex flex-col items-center">
          <ArrowTrendingUpIcon className="w-5 h-5 text-warm mb-1" />
          <span className="text-white font-semibold text-sm">
            {activity.elevation ? activity.elevation.toFixed(0) : "—"} m
          </span>
        </div>
        <div className="flex flex-col items-center">
          <BoltIcon className="w-5 h-5 text-accent mb-1" />
          <span className="text-white font-semibold text-sm">
            {activity.avg_speed ? activity.avg_speed.toFixed(1) : "—"} km/h
          </span>
        </div>
        <div className="flex flex-col items-center">
          <CalendarDaysIcon className="w-5 h-5 text-viola mb-1" />
          <span className="text-white font-semibold text-sm">
            {new Date(activity.date).toLocaleDateString()}
          </span>
        </div>
      </div>

      {activity.summary_polyline && (
        <div className="rounded-lg overflow-hidden shadow">
          <MapPreview encodedPolyline={activity.summary_polyline} />
        </div>
      )}

      <div className="flex justify-center pt-1">
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
    </div>
  );
}
