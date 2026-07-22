import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setThemeState] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const savedTheme = localStorage.getItem("olym-theme") as "dark" | "light";
    if (savedTheme) {
      setThemeState(savedTheme);
    }

    const handleThemeChange = (e: Event) => {
      const customEvent = e as CustomEvent<"dark" | "light">;
      setThemeState(customEvent.detail);
    };

    window.addEventListener("olym-theme-changed", handleThemeChange);
    return () => {
      window.removeEventListener("olym-theme-changed", handleThemeChange);
    };
  }, []);

  const setTheme = (newTheme: "dark" | "light") => {
    setThemeState(newTheme);
    localStorage.setItem("olym-theme", newTheme);
    window.dispatchEvent(new CustomEvent("olym-theme-changed", { detail: newTheme }));
  };

  return [theme, setTheme] as const;
}
