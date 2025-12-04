import { createContext, useContext, useState, useEffect } from "react";

type UserContextType = {
  nickname: string | null;
  profile_img_url: string | null;
  strava_connected: boolean;
  setUserData: (nickname: string, profile_img_url: string, strava_connected: boolean) => void;
  clearUserData: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [nickname, setNickname] = useState<string | null>(null);
  const [profile_img_url, setprofileImgUrl] = useState<string | null>(null);
  const [strava_connected, setStravaConnected] = useState<boolean>(false);

  useEffect(() => {
    // Ripristina da localStorage se presente
    const storedNickname = localStorage.getItem("nickname");
    const storedImage = localStorage.getItem("profile_img_url");
    const storedStrava = localStorage.getItem("strava_connected");
    if (storedNickname) setNickname(storedNickname);
    if (storedImage) setprofileImgUrl(storedImage);
    if (storedStrava) setStravaConnected(storedStrava === "true");
  }, []);

  const setUserData = (nickname: string, profile_img_url: string, strava_connected: boolean) => {
    setNickname(nickname);
    setprofileImgUrl(profile_img_url);
    setStravaConnected(strava_connected);
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("profile_img_url", profile_img_url);
    localStorage.setItem("strava_connected", String(strava_connected));
  };

  const clearUserData = () => {
    setNickname(null);
    setprofileImgUrl(null);
    setStravaConnected(false);
    localStorage.removeItem("nickname");
    localStorage.removeItem("profile_img_url");
    localStorage.removeItem("strava_connected");
  };

  return (
    <UserContext.Provider value={{ nickname, profile_img_url, strava_connected, setUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};