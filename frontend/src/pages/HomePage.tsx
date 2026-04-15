import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useUser } from "../context/UserContext";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";
import logo from "../assets/runasone.png";

function HomePage() {
  const [pendingInvites, setPendingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const navigate = useNavigate();

  const { nickname } = useUser();
  const { token, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) return;
    fetch(`${API_BASE_URL}/handle_invites/check_invites`, {
      credentials: "include",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => { setPendingInvites(data); setLoadingInvites(false); })
      .catch(() => setLoadingInvites(false));
  }, [isAuthenticated, token]);

  return (
    <div className="min-h-screen text-white">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)]">

        <div className="glass rounded-2xl p-8 flex flex-col items-center w-full max-w-xs">
          <img src={logo} alt="RunAsOne logo" className="w-28 h-28 mb-4 drop-shadow-lg" />
          <h1 className="text-white text-xl font-bold mb-6">Ciao {nickname}!</h1>

          {/* Garmin integration hidden — pending API approval
          <Button variant="garmin" onClick={() => navigate("/garmin-connect")}>
            Connetti a Garmin
          </Button>
          <Button variant="primary" onClick={() => navigate("/activities")}>
            Attività
          </Button>
          */}
          <div className="flex flex-col items-center space-y-3 w-full">
            <Button variant="primary" onClick={() => navigate("/paths")}>
              Percorsi
            </Button>
            <Button variant="primary" onClick={() => navigate("/teams")}>
              Team
            </Button>
          </div>

          {!loadingInvites && pendingInvites.length > 0 && (
            <div className="mt-5 text-center">
              <p className="text-accent text-sm font-semibold mb-2">
                Hai {pendingInvites.length} invito{pendingInvites.length > 1 ? "i" : ""} a un team!
              </p>
              <Button variant="primary" onClick={() => navigate("/invites")}>
                Visualizza
              </Button>
            </div>
          )}
        </div>

      </div>
      <Footer />
    </div>
  );
}

export default HomePage;
