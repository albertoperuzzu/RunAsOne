import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <button onClick={handleLogout} className="font-semibold px-4 py-2 rounded-md transition bg-magenta text-white hover:bg-magenta/90">
      Logout
    </button>
  );
}