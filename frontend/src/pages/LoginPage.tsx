import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: new URLSearchParams({ username: email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        login(data.access_token, {
          nickname: data.nickname,
          profile_img_url: data.profile_img_url,
          garmin_connected: data.garmin_connected,
        });
        navigate("/home");
      } else {
        setErrorMessage(data.detail || "Errore nel login.");
      }
    } catch {
      setErrorMessage("Errore di rete o del server.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h2 className="text-white text-2xl font-bold mb-6 text-center">Accedi</h2>

        <input
          className="glass-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="glass-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMessage && (
          <p className="text-accent text-sm mb-3">{errorMessage}</p>
        )}

        <button onClick={handleLogin} className="btn-gradient w-full py-2 mt-1 mb-2">
          Accedi
        </button>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm mb-3">Non hai ancora un account?</p>
          <button
            onClick={() => navigate("/register")}
            className="text-white/80 border border-white/30 rounded-lg px-6 py-2 text-sm hover:bg-white/10 transition"
          >
            Registrati
          </button>
        </div>
      </div>
    </div>
  );
}
