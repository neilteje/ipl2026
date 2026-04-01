"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface UserContextType {
  userName: string | null;
  setUserName: (name: string) => void;
  isReady: boolean; // false until localStorage has been read
}

const UserContext = createContext<UserContextType>({
  userName: null,
  setUserName: () => {},
  isReady: false,
});

export function UserProvider({ children }: { children: ReactNode }) {
  const [userName, setUserNameState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("ipl_username");
    if (stored?.trim()) setUserNameState(stored.trim());
    setIsReady(true);
  }, []);

  const setUserName = useCallback((name: string) => {
    const trimmed = name.trim();
    localStorage.setItem("ipl_username", trimmed);
    setUserNameState(trimmed);
  }, []);

  return (
    <UserContext.Provider value={{ userName, setUserName, isReady }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
