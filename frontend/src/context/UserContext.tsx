import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

type UserContextType = {
  nickname: string | null;
  profile_img_url: string | null;
  garmin_connected: boolean;
  setUserData: (nickname: string, profile_img_url: string | null, garmin_connected: boolean) => void;
  clearUserData: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [nickname, setNickname] = useState<string | null>(null);
  const [profile_img_url, setProfileImgUrl] = useState<string | null>(null);
  const [garmin_connected, setGarminConnected] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setProfileImgUrl(user.profile_img_url);
      setGarminConnected(user.garmin_connected);
    } else {
      // Logout
      setNickname(null);
      setProfileImgUrl(null);
      setGarminConnected(false);
    }
  }, [user]);

  const setUserData = (nickname: string, profile_img_url: string | null, garmin_connected: boolean) => {
    setNickname(nickname);
    setProfileImgUrl(profile_img_url);
    setGarminConnected(garmin_connected);
  };

  const clearUserData = () => {
    setNickname(null);
    setProfileImgUrl(null);
    setGarminConnected(false);
  };

  return (
    <UserContext.Provider
      value={{ nickname, profile_img_url, garmin_connected, setUserData, clearUserData }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};