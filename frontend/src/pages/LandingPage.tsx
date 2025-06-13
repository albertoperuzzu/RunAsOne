import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-gray-800">
      <img
        src="/runasone.png"
        alt="RunAsOne logo"
        className="w-40 h-40 mb-8"
      />
      <h1 className="text-3xl font-bold mb-6">Benvenuto su RunAsOne</h1>
      <button 
            onClick={() => { window.location.href = "http://localhost:8000/login"; }} 
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-lg shadow">
        Accedi con Strava
      </button>
    </div>
  );
}

export default LandingPage;