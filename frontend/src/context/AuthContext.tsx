import { createContext, useContext, useState, useEffect } from "react";
import API_BASE_URL from "../config";

type User = {
  nickname: string;
  profile_img_url: string | null;
  strava_connected: boolean;
};

type AuthContextType = {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (accessToken: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch(`${API_BASE_URL}/me`, {
          credentials: "include", // include refresh token cookie
        });

        if (res.ok) {
          const data = await res.json();

          // Se il backend ha rinnovato l'access token
          if (data.new_access_token) {
            setToken(data.new_access_token);
          }

          // Popola dati utente
          setUser({
            nickname: data.nickname,
            profile_img_url: data.profile_img_url,
            strava_connected: data.strava_connected,
          });

          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.error("Errore nel check session:", err);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = (accessToken: string, userData: User) => {
    setToken(accessToken);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Errore logout:", err);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        token,
        login,
        logout,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
};