import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API_BASE_URL from "../config";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function EditProfile() {
  const navigate = useNavigate();
  const query = useQuery();
  const field = query.get("field");

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/db/getUserInfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    })
      .then((res) => res.json())
      .then((data) => setUser(data));
  }, []);

  const handleUpdateName = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const nameInput = form.elements.namedItem("name") as HTMLInputElement;
    const newName = nameInput.value.trim();
    if (!newName) {
      alert("Il campo Nome non può essere vuoto!");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_name`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) throw new Error("Errore durante l'aggiornamento del nome");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const newEmail = emailInput.value.trim();
    if (!newEmail) {
      alert("Il campo Email non può essere vuoto!");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_email`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: newEmail }),
      });
      if (!res.ok) throw new Error("Errore durante l'aggiornamento dell'email");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleUpdatePwd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const oldpwd = form.elements.namedItem("old_pwd") as HTMLInputElement;
    const oldpwdtrim = oldpwd.value.trim();
    const newpwd = form.elements.namedItem("new_pwd") as HTMLInputElement;
    const newpwdtrim = newpwd.value.trim();
    if (!oldpwdtrim || !newpwdtrim) {
      alert("I campi non possono essere vuoti!");
      return;
    }
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_BASE_URL}/handle_profile/update_password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ old_password: oldpwdtrim , new_password: newpwdtrim }),
      });
      if (!res.ok) throw new Error("Errore durante l'aggiornamento dell'email");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Errore durante il salvataggio.");
    }
  };

  const handleUploadImage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("image") as HTMLInputElement;
    const file = fileInput?.files?.[0];
    if (!file) {
      alert("Seleziona un file.");
      return;
    }
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    try {
      const uploadRes = await fetch(`${API_BASE_URL}/handle_profile/upload_image`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Errore durante l'upload dell'immagine");
      const { filename } = await uploadRes.json();

      const updateRes = await fetch(`${API_BASE_URL}/handle_profile/update_image`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ profile_img_url: filename }),
      });

      if (!updateRes.ok) throw new Error("Errore durante l'aggiornamento del profilo");
      navigate("/profile");
    } catch (err) {
      console.error(err);
      alert("Errore durante l'aggiornamento dell'immagine.");
    }
  };

  if (!user || !field) return <p>Caricamento...</p>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <button onClick={() => navigate("/profile")} className="text-blue-500">← Torna indietro</button>
      <h2 className="text-xl font-bold">Modifica {field}</h2>

      {field === "name" && (
        <form onSubmit={handleUpdateName}>
          <label className="block mb-2 text-sm text-gray-700">Nuovo Nome</label>
          <input
            type="text"
            name="name"
            defaultValue={user.name}
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded">
            Salva
          </button>
        </form>
      )}

      {field === "email" && (
        <form onSubmit={handleUpdateEmail}>
          <label className="block mb-2 text-sm text-gray-700">Nuova Email</label>
          <input
            type="text"
            name="email"
            defaultValue={user.email}
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded">
            Salva
          </button>
        </form>
      )}

      {field === "pwd" && (
        <form onSubmit={handleUpdatePwd}>
          <label className="block mb-2 text-sm text-gray-700">Vecchia password</label>
          <input
            type="password"
            name="old_pwd"
            placeholder="••••••••"
            className="w-full border px-3 py-2 rounded mb-4"
          />
          <label className="block mb-2 text-sm text-gray-700">Nuova password</label>
          <input
            type="password"
            name="new_pwd"
            placeholder="••••••••"
            className="w-full border px-3 py-2 rounded"
          />
          <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded">
            Aggiorna
          </button>
        </form>
      )}

      {field === "image" && (
        <form onSubmit={handleUploadImage}>
          <label className="block mb-2 text-sm text-gray-700">Carica nuova immagine</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            className="w-full border px-3 py-2 rounded"
            required
          />
          <button type="submit" className="mt-3 bg-blue-600 text-white py-2 px-4 rounded">
            Carica immagine
          </button>
        </form>
    )}
    </div>
  );
}