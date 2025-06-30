import { useState } from "react";
import Navbar from "../components/Navbar";

export default function ProfilePage() {
  const [newPassword, setNewPassword] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handlePasswordChange = () => {
    // TODO: API call per cambiare la password
    alert("Password cambiata!");
  };

  const handleImageUpload = () => {
    if (!selectedFile) return;
    // TODO: API call per caricare immagine
    alert(`Immagine caricata: ${selectedFile.name}`);
  };

  const handleLeaveTeam = () => {
    // TODO: API call per uscire dal team
    if (confirm("Sei sicuro di voler lasciare il team?")) {
      alert("Hai lasciato il team.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
        <Navbar />
      <h1 className="text-2xl font-bold text-center">Il tuo profilo</h1>

      {/* Cambia password */}
      <section className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Cambia password</h2>
        <input
          type="password"
          placeholder="Nuova password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          onClick={handlePasswordChange}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Aggiorna password
        </button>
      </section>

      {/* Carica immagine profilo */}
      <section className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Immagine del profilo</h2>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          className="w-full"
        />
        <button
          onClick={handleImageUpload}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Carica immagine
        </button>
      </section>

      {/* Lascia team */}
      <section className="bg-white p-4 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold text-red-600">Lascia il team</h2>
        <p className="text-sm text-gray-600">Questa azione non è reversibile.</p>
        <button
          onClick={handleLeaveTeam}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          Esci dal team
        </button>
      </section>
    </div>
  );
}