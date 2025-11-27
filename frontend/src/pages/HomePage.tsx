import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Navbar from "../components/Navbar";
import { useUser } from "../context/UserContext";
import API_BASE_URL from "../config";
import logo from "../assets/runasone.png";

function HomePage() {

  const [isStravaConnected, setIsStravaConnected] = useState(false);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const navigate = useNavigate();
  const { nickname } = getUserInfo();

  useEffect(() => {
    const connected = localStorage.getItem("strava_connected") === "true";
    setIsStravaConnected(connected);

    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE_URL}/handle_invites/check_invites`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setPendingInvites(data);
          setLoadingInvites(false);
        })
        .catch(() => setLoadingInvites(false));
    }

  }, []);

  function getUserInfo() {
    const { nickname, profile_img_url } = useUser();
    return {
      nickname,
      profile_img_url,
    };
  }

  return (
    <div className="min-h-screen text-gray-800">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">
        <h1 className="text-2xl mb-8 font-bold">Ciao { nickname }!</h1>
        <img
          src={logo}
          //src={ profile_img_url || "" }
          alt="RunAsOne logo"
          className="w-40 h-40 mb-8"
        />
        {!isStravaConnected ? (
          <div className="flex flex-col items-center space-y-4">
            <Button
              variant="strava"
              onClick={() => {
                const token = localStorage.getItem("token");
                window.location.href = `${API_BASE_URL}/strava_login?token=${token}`;
              }}
            >
              Connetti a Strava
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate("/teams")}
            >
              Team
            </Button>
          </div>
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
              onClick={() => navigate("/teams")}
            >
              Team
            </Button>
          </div>
        )}
        {!loadingInvites && pendingInvites.length > 0 && (
          <div className="mb-4 text-center">
            <p className="text-md font-medium text-red-600">
              Hai {pendingInvites.length} invito
              {pendingInvites.length > 1 ? "i" : ""} ad un team!
              {pendingInvites.length > 1 ? "i" : ""}
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/invites")}
            >
              Visualizza Inviti
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;