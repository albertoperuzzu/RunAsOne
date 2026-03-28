import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <button onClick={handleLogout} className="btn-gradient font-semibold px-4 py-2 rounded-lg">
      Logout
    </button>
  );
}