import { createContext, useContext, useState, useEffect } from "react";

type UserContextType = {
  nickname: string | null;
  profile_img_url: string | null;
  setUserData: (nickname: string, profile_img_url: string) => void;
  clearUserData: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [nickname, setNickname] = useState<string | null>(null);
  const [profile_img_url, setprofileImgUrl] = useState<string | null>(null);

  useEffect(() => {
    // Ripristina da localStorage se presente
    const storedNickname = localStorage.getItem("nickname");
    const storedImage = localStorage.getItem("profile_img_url");
    if (storedNickname) setNickname(storedNickname);
    if (storedImage) setprofileImgUrl(storedImage);
  }, []);

  const setUserData = (nickname: string, profile_img_url: string) => {
    setNickname(nickname);
    setprofileImgUrl(profile_img_url);
    localStorage.setItem("nickname", nickname);
    localStorage.setItem("profile_img_url", profile_img_url);
  };

  const clearUserData = () => {
    setNickname(null);
    setprofileImgUrl(null);
    localStorage.removeItem("nickname");
    localStorage.removeItem("profile_img_url");
  };

  return (
    <UserContext.Provider value={{ nickname, profile_img_url, setUserData, clearUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};