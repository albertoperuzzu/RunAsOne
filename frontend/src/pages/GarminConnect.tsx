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
    <div className="min-h-screen text-gray-800">
      <Navbar />
      <div className="max-w-md mx-auto pt-10">
        <div className="bg-white/70 mx-auto p-6 shadow-md rounded-lg">
          <h2 className="text-2xl font-bold mb-2">Connetti Garmin</h2>
          <p className="text-sm text-gray-600 mb-4">
            Inserisci le tue credenziali di Garmin Connect. La password non verrà salvata:
            verrà usata solo per ottenere un token di accesso sicuro.
          </p>

          <input
            className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
            type="email"
            placeholder="Email Garmin Connect"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
            type="password"
            placeholder="Password Garmin Connect"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMessage && (
            <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
          )}

          <button
            onClick={handleConnect}
            disabled={loading}
            className="w-full bg-garmin text-white p-2 rounded hover:bg-garmin/90 transition disabled:opacity-50"
          >
            {loading ? "Connessione in corso..." : "Connetti a Garmin"}
          </button>

          <div className="mt-4 text-center">
            <button
              onClick={() => navigate("/home")}
              className="text-sm text-gray-500 hover:underline"
            >
              Annulla
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
