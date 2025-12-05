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
        body: new URLSearchParams({
          username: email,
          password: password
        })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.access_token, {
          nickname: data.nickname,
          profile_img_url: data.profile_img_url,
          strava_connected: data.strava_connected
        });

        navigate("/home");
      } else {
        setErrorMessage(data.detail || "Errore nel login.");
      }
    } catch (error) {
      setErrorMessage("Errore di rete o del server.");
    }
  };

  return (
    <div className="max-w-md mx-auto pt-6">
      <div className="max-w-md bg-white/70 mx-auto p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {errorMessage && (
          <p className="text-red-600 text-sm mb-3">{errorMessage}</p>
        )}

        <button
          onClick={handleLogin}
          className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
        >
          Accedi
        </button>

        <div className="mt-10 text-center">
          <p className="text-sm text-gray-700 mb-2">Non hai ancora un account?</p>
          <button
            onClick={() => navigate("/register")}
            className="w-40 bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
          >
            Registrati
          </button>
        </div>
      </div>
    </div>
  );
}