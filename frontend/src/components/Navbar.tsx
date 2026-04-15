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
        className="glass-dark text-white p-2 rounded-lg shadow-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <ul className="absolute right-0 mt-2 glass-dark rounded-xl p-4 space-y-3 w-40 text-right z-50">
          {[
            { to: "/home", label: "Home" },
            { to: "/paths", label: "Percorsi" },
            { to: "/teams", label: "Teams" },
            { to: "/profile", label: "Profilo" },
          ].map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                onClick={() => setIsOpen(false)}
                className="block text-white/90 hover:text-white hover:underline font-medium text-sm"
              >
                {label}
              </Link>
            </li>
          ))}
          <li className="border-t border-white/20 pt-2">
            <button
              onClick={handleLogout}
              className="w-full text-right text-accent hover:text-white text-sm font-semibold"
            >
              Logout
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
