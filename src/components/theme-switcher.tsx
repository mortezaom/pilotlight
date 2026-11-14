import { MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// The <head> script in base.astro applies the saved theme before first paint
export const ThemeSwitcher = (props: { className?: string }) => {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // storage blocked: the theme just won't persist
    }
    setDark(next);
  };

  return (
    <button
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "hover:bg-accent cursor-pointer rounded-md p-2 transition-colors",
        props.className
      )}
      onClick={toggle}
      type="button"
    >
      {dark ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
    </button>
  );
};
