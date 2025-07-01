import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

type User = {
    id: number;
    name: string;
    email: string;
    profile_img_url: string;
    activities_count: number;
    teams_count: number;
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  //const [fieldToEdit, setFieldToEdit] = useState<null | string>(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
        fetch("http://localhost:8000/db/getUserInfo", {
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
        }
        })
        .then(async (res) => {
            if (!res.ok) throw new Error("Errore nel caricamento dei team");
            return res.json();
        })
        .then((data) => {
            setUser(data);
            console.log(data);
        })
        .catch((err) => {
            console.error(err);
        });
  }, []);

  return (

    <div className="max-w-md mx-auto p-4 space-y-6">
      <Navbar />
      <h1 className="text-2xl font-bold text-center mb-4">Il tuo profilo</h1>
      {user && (
        <div className="bg-white rounded-xl shadow p-4 space-y-4">
            {/* Foto profilo */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <img
                    src={
                        user.profile_img_url.startsWith("profiles/")
                          ? `http://localhost:8000/uploads/${user.profile_img_url}`
                          : user.profile_img_url
                      }
                    alt="Profile"
                    className="w-14 h-14 rounded-full object-cover"
                    />
                    <span className="font-medium">{user.name}</span>
                </div>
                <button onClick={() => navigate("/edit-profile?field=image")}><Pencil size={18} /></button>
            </div>

            {/* Email */}
            <div className="flex justify-between items-center">
                <div className="text-sm">
                    <div className="text-gray-500">Email</div>
                    <div>{user.email}</div>
                </div>
                <button onClick={() => navigate("/edit-profile?field=email")}><Pencil size={18} /></button>
            </div>

            {/* Nome */}
            <div className="flex justify-between items-center">
                <div className="text-sm">
                    <div className="text-gray-500">Nome</div>
                    <div>{user.name}</div>
                </div>
                <button onClick={() => navigate("/edit-profile?field=name")}><Pencil size={18} /></button>
            </div>

            {/* Password */}
            <div className="flex justify-between items-center">
                <div className="text-sm">
                    <div className="text-gray-500">Password</div>
                    <div>••••••••</div>
                </div>
                <button onClick={() => navigate("/edit-profile?field=pwd")}><Pencil size={18} /></button>
            </div>

            {/* Statistiche */}
            <div className="grid grid-cols-2 text-center text-sm mt-4 border-t pt-4">
            <div>
                <div className="text-gray-500">Attività</div>
                <div className="font-semibold">{user.activities_count}</div>
            </div>
            <div>
                <div className="text-gray-500">Team</div>
                <div className="font-semibold">{user.teams_count}</div>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}