import API_BASE_URL from "../config";
import MapPreview from "./MapPreview";
import Button from "./Button";

import {
  MapPinIcon,            // distanza
  ArrowTrendingUpIcon,   // elevazione
  BoltIcon,              // velocità media
  CalendarDaysIcon       // data
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
    <div className="bg-arancio/60 shadow-md rounded-xl p-5 border border-gray-200 w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <img
          src={activity.user?.profile_img_url || "/public/default_user_img.jpg"}
          alt="user"
          className="w-10 h-10 rounded-full object-cover border border-white shadow"
        />
        <h2 className="text-md font-bold text-right">{activity.name}</h2>
      </div>
      <div className="grid grid-cols-2 gap-y-4 text-gray-800 text-center">
        <div className="flex flex-col items-center">
          <MapPinIcon className="w-6 h-6 text-blue-700 mb-1" />
          <span className="text-base font-semibold">
            {(activity.distance / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex flex-col items-center">
          <ArrowTrendingUpIcon className="w-6 h-6 text-green-700 mb-1" />
          <span className="text-base font-semibold">
            {activity.elevation ? activity.elevation.toFixed(0) : "—"} m
          </span>
        </div>
        <div className="flex flex-col items-center">
          <BoltIcon className="w-6 h-6 text-yellow-600 mb-1" />
          <span className="text-base font-semibold">
            {activity.avg_speed ? activity.avg_speed.toFixed(1) : "—"} km/h
          </span>
        </div>
        <div className="flex flex-col items-center">
          <CalendarDaysIcon className="w-6 h-6 text-red-700 mb-1" />
          <span className="text-base font-semibold">
            {new Date(activity.date).toLocaleDateString()}
          </span>
        </div>
      </div>
      {activity.summary_polyline && (
        <div className="rounded-lg overflow-hidden shadow mx-auto w-full">
          <MapPreview encodedPolyline={activity.summary_polyline} />
        </div>
      )}
      <div className="flex justify-center pt-1">
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
    </div>
  );
}