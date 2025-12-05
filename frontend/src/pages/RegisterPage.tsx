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
    <div className="max-w-md mx-auto pt-6">
      <div className="max-w-md bg-white/70 mx-auto p-6 shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Registrati</h2>
        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          className="border bg-white border-gray-300 p-2 rounded w-full mb-3"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-primary text-white p-2 rounded hover:bg-primary/90 transition" onClick={handleRegister}>
          Registrati
        </button>
        <div className="mt-10 text-center">
          <p className="text-sm text-gray-700 mb-2">Hai già un Account?</p>
          <button
            onClick={() => navigate("/login")}
            className="w-40 bg-primary text-white p-2 rounded hover:bg-primary/90 transition"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}