import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/runasone.png";
import Footer from "../components/Footer";

function LandingPage() {
  const navigate = useNavigate();
  localStorage.removeItem("strava_connected");
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800">
      <img
        src={logo}
        alt="RunAsOne logo"
        className="w-40 h-40 mb-8"
      />
      <Button variant="primary" onClick={() => navigate("/login")}>
        Login
      </Button>
      <Button variant="primary" onClick={() => navigate("/register")}>
        Registrati
      </Button>
      <Footer />
    </div>
  );
}

export default LandingPage;