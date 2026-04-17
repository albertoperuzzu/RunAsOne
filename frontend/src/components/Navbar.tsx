import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Bell } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API_BASE_URL from "../config";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { logout, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchUnread = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
        credentials: "include",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count);
      }
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const id = setInterval(fetchUnread, 30_000);
    return () => clearInterval(id);
  }, [token]);

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
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2" ref={menuRef}>
      {/* Campanella notifiche */}
      <button
        onClick={() => { setIsOpen(false); location.pathname === "/notifications" ? navigate(-1) : navigate("/notifications"); }}
        className="relative glass-dark text-white p-2 rounded-lg shadow-lg"
        aria-label="Notifiche"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Hamburger */}
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
        <ul className="absolute top-full right-0 mt-1 glass-dark rounded-xl p-4 space-y-3 w-40 text-right z-50">
          {[
            { to: "/home", label: "Home" },
            { to: "/calendar", label: "Calendario" },
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
