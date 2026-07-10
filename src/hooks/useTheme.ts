import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("olym-theme") as "dark" | "light";
    if (savedTheme) {
      setThemeState(savedTheme);
    }
  }, []);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("olym-theme", newTheme);
  };

  return [theme, setTheme] as const;
}
