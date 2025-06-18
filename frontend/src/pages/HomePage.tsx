import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Navbar from "../components/Navbar";

function HomePage() {

  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const connected = localStorage.getItem("strava_connected") === "true";
    setIsStravaConnected(connected);
  }, []);

  return (
    <div className="min-h-screen text-gray-800">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <img
          src="/runasone.png"
          alt="RunAsOne logo"
          className="w-40 h-40 mb-8"
        />
        {!isStravaConnected ? (
          <Button
            variant="strava"
            onClick={() => {
              window.location.href = "http://localhost:8000/strava_login";
            }}
          >
            Importa da Strava
          </Button>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <Button
              variant="primary"
              onClick={() => navigate("/activities")}
            >
              Attività
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/home")}
            >
              Il mio Team
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;