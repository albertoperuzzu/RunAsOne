import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import logo from "../assets/runasone.png";
import Footer from "../components/Footer";

function LandingPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="glass rounded-2xl p-10 flex flex-col items-center w-full max-w-xs">
        <img src={logo} alt="RunAsOne logo" className="w-32 h-32 mb-6 drop-shadow-lg" />
        <h1 className="text-white font-bold text-2xl mb-1 tracking-wide">RunAsOne</h1>
        <p className="text-white/60 text-sm mb-8">Corri insieme al tuo team</p>
        <Button variant="primary" onClick={() => navigate("/login")}>
          Login
        </Button>
        <Button variant="primary" onClick={() => navigate("/register")}>
          Registrati
        </Button>
      </div>
      <Footer />
    </div>
  );
}

export default LandingPage;
