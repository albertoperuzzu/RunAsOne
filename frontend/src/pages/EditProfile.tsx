import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../config";
import { useAuth } from "../context/AuthContext";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function EditProfile() {
  const navigate = useNavigate();
  const query = useQuery();
  const field = query.get("field");
  const [user, setUser] = useState<any>(null);
  const { token } = useAuth();

  useEffect(() => {
    fetch(`${API_BASE_URL}/db/getUserInfo`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then(setUser);
  }, []);

  const handleUpdateName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newName = (form.elements.namedItem("name") as HTMLInputElement).value.trim();
    if (!newName) { alert("Il campo Nome non può essere vuoto!"); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error();
      navigate("/profile");
    } catch { alert("Errore durante il salvataggio."); }
  };

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const newEmail = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    if (!newEmail) { alert("Il campo Email non può essere vuoto!"); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_email`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) throw new Error();
      navigate("/profile");
    } catch { alert("Errore durante il salvataggio."); }
  };

  const handleUpdatePwd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const oldpwd = (form.elements.namedItem("old_pwd") as HTMLInputElement).value.trim();
    const newpwd = (form.elements.namedItem("new_pwd") as HTMLInputElement).value.trim();
    if (!oldpwd || !newpwd) { alert("I campi non possono essere vuoti!"); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ old_password: oldpwd, new_password: newpwd }),
      });
      if (!res.ok) throw new Error();
      navigate("/profile");
    } catch { alert("Errore durante il salvataggio."); }
  };

  const handleUploadImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const file = (form.elements.namedItem("image") as HTMLInputElement)?.files?.[0];
    if (!file) { alert("Seleziona un file."); return; }
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch(`${API_BASE_URL}/handle_profile/upload_image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!uploadRes.ok) throw new Error();
      const { filename } = await uploadRes.json();

      const updateRes = await fetch(`${API_BASE_URL}/handle_profile/update_image`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profile_img_url: filename }),
      });
      if (!updateRes.ok) throw new Error();
      navigate("/profile");
    } catch { alert("Errore durante l'aggiornamento dell'immagine."); }
  };

  if (!user || !field) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-white/70">Caricamento...</p>
    </div>
  );

  const fieldLabels: Record<string, string> = {
    name: "Nome", email: "Email", pwd: "Password", image: "Immagine profilo",
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass rounded-2xl p-8 w-full max-w-sm">
        <button
          onClick={() => navigate("/profile")}
          className="text-white/50 hover:text-white text-sm mb-4 block"
        >
          ← Indietro
        </button>
        <h2 className="text-white text-xl font-bold mb-6">
          Modifica {fieldLabels[field] ?? field}
        </h2>

        {field === "name" && (
          <form onSubmit={handleUpdateName}>
            <label className="text-white/60 text-xs mb-1 block">Nuovo nome</label>
            <input type="text" name="name" defaultValue={user.name} className="glass-input" />
            <button type="submit" className="btn-gradient w-full py-2 mt-2">Salva</button>
          </form>
        )}

        {field === "email" && (
          <form onSubmit={handleUpdateEmail}>
            <label className="text-white/60 text-xs mb-1 block">Nuova email</label>
            <input type="email" name="email" defaultValue={user.email} className="glass-input" />
            <button type="submit" className="btn-gradient w-full py-2 mt-2">Salva</button>
          </form>
        )}

        {field === "pwd" && (
          <form onSubmit={handleUpdatePwd}>
            <label className="text-white/60 text-xs mb-1 block">Vecchia password</label>
            <input type="password" name="old_pwd" placeholder="••••••••" className="glass-input" />
            <label className="text-white/60 text-xs mb-1 block">Nuova password</label>
            <input type="password" name="new_pwd" placeholder="••••••••" className="glass-input" />
            <button type="submit" className="btn-gradient w-full py-2 mt-2">Aggiorna</button>
          </form>
        )}

        {field === "image" && (
          <form onSubmit={handleUploadImage}>
            <label className="text-white/60 text-xs mb-1 block">Carica nuova immagine</label>
            <input type="file" name="image" accept="image/*" className="glass-input" required />
            <button type="submit" className="btn-gradient w-full py-2 mt-2">Carica immagine</button>
          </form>
        )}
      </div>
    </div>
  );
}
