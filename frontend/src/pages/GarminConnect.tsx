import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useUser } from "../context/UserContext";
import Navbar from "../components/Navbar";
import API_BASE_URL from "../config";

export default function GarminConnect() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { token } = useAuth();
  const { setUserData, nickname, profile_img_url } = useUser();
  const navigate = useNavigate();

  const handleConnect = async () => {
    if (!email || !password) {
      setErrorMessage("Inserisci email e password Garmin.");
      return;
    }
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE_URL}/garmin/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUserData(nickname ?? "", profile_img_url, true);
        navigate("/activities", { replace: true });
      } else {
        setErrorMessage(data.detail || "Errore durante la connessione a Garmin.");
      }
    } catch {
      setErrorMessage("Errore di rete o del server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Navbar />
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h2 className="text-white text-2xl font-bold mb-2 text-center">Connetti Garmin</h2>
        <p className="text-white/60 text-sm mb-6 text-center">
          Le credenziali vengono usate solo per ottenere un token sicuro — non vengono salvate.
        </p>

        <input
          className="glass-input"
          type="email"
          placeholder="Email Garmin Connect"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="glass-input"
          type="password"
          placeholder="Password Garmin Connect"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMessage && (
          <p className="text-accent text-sm mb-3">{errorMessage}</p>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          className="btn-gradient w-full py-2 mt-1 mb-2"
        >
          {loading ? "Connessione in corso..." : "Connetti a Garmin"}
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/home")}
            className="text-white/50 hover:text-white/80 text-sm"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
}
