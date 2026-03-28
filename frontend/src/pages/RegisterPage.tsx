import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    const res = await fetch(`${API_BASE_URL}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: nickname }),
    });

    if (res.ok) {
      alert("Registrazione completata. Ora effettua il login.");
      navigate("/login");
    } else {
      alert("Errore durante la registrazione");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <h2 className="text-white text-2xl font-bold mb-6 text-center">Registrati</h2>

        <input
          className="glass-input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="glass-input"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="glass-input"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="btn-gradient w-full py-2 mt-1 mb-2"
          onClick={handleRegister}
        >
          Crea account
        </button>

        <div className="mt-6 text-center">
          <p className="text-white/60 text-sm mb-3">Hai già un account?</p>
          <button
            onClick={() => navigate("/login")}
            className="text-white/80 border border-white/30 rounded-lg px-6 py-2 text-sm hover:bg-white/10 transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
