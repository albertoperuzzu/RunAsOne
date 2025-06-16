//import { Link } from "react-router-dom";
import Button from "../components/Button";

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800">
      <img
        src="/runasone.png"
        alt="RunAsOne logo"
        className="w-40 h-40 mb-8"
      />
      <Button
        variant="strava"
        onClick={() => {
          window.location.href = "http://localhost:8000/login";
        }}
      >
        Accedi con Strava
      </Button>
    </div>
  );
}

export default LandingPage;