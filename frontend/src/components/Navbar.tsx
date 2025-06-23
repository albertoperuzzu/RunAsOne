import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Chiusura menu cliccando fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-magenta p-2 rounded-md text-white shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <ul className="absolute right-0 mt-2 bg-magenta/95 shadow-xl rounded-lg p-4 space-y-2 w-36 text-right transition duration-500 transform scale-100 opacity-100 z-50">
          <li>
            <Link
              to="/home"
              onClick={() => setIsOpen(false)}
              className="block hover:underline"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              to="/activities"
              onClick={() => setIsOpen(false)}
              className="block hover:underline"
            >
              Attività
            </Link>
          </li>
          <li>
            <Link
              to="/teams"
              onClick={() => setIsOpen(false)}
              className="block hover:underline"
            >
              Teams
            </Link>
          </li>
          <li>
            <button
              onClick={handleLogout}
              className="w-full text-right hover:underline"
            >
              Logout
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}