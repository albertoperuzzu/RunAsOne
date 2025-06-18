import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen text-gray-800">
      <img
        src="/runasone.png"
        alt="RunAsOne logo"
        className="w-40 h-40 mb-8"
      />
      <Button variant="primary" onClick={() => navigate("/login")}>
        Login
      </Button>
      <Button variant="primary" onClick={() => navigate("/register")}>
        Registrati
      </Button>
    </div>
  );
}

export default LandingPage;