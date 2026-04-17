import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

type User = {
  id: number;
  name: string;
  email: string;
  profile_img_url: string;
  paths_count: number;
  teams_count: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const { token } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getUserInfo`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then(setUser)
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen pb-8">
      <Navbar />
      <div className="px-4 pt-8 max-w-sm mx-auto">
        <h1 className="text-indaco text-2xl font-bold drop-shadow mb-6">
          Il tuo profilo
        </h1>

        {user && (
          <div className="glass rounded-2xl p-5 space-y-4">

            {/* Avatar + nome */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={
                    user.profile_img_url.startsWith("profiles/")
                      ? `${API_BASE_URL}/uploads/${user.profile_img_url}`
                      : user.profile_img_url
                  }
                  alt="Profile"
                  className="w-14 h-14 rounded-full object-cover border-2 border-white/30 shadow"
                />
                <span className="text-white font-semibold">{user.name}</span>
              </div>
              <button
                onClick={() => navigate("/edit-profile?field=image")}
                className="text-white/50 hover:text-accent transition"
              >
                <Pencil size={17} />
              </button>
            </div>

            <div className="border-t border-white/10" />

            {/* Campi */}
            {[
              { label: "Email", value: user.email, field: "email" },
              { label: "Nome", value: user.name, field: "name" },
              { label: "Password", value: "••••••••", field: "pwd" },
            ].map(({ label, value, field }) => (
              <div key={field} className="flex justify-between items-center">
                <div>
                  <div className="text-white/50 text-xs">{label}</div>
                  <div className="text-white text-sm">{value}</div>
                </div>
                <button
                  onClick={() => navigate(`/edit-profile?field=${field}`)}
                  className="text-white/50 hover:text-accent transition"
                >
                  <Pencil size={17} />
                </button>
              </div>
            ))}

            <div className="border-t border-white/10" />

            {/* Stats */}
            <div className="grid grid-cols-2 text-center">
              <div>
                <div className="text-white/50 text-xs">Percorsi</div>
                <div className="text-white font-bold text-lg">{user.paths_count}</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">Team</div>
                <div className="text-white font-bold text-lg">{user.teams_count}</div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
