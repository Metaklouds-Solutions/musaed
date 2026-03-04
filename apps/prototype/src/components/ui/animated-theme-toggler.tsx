import { useCallback, useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";

import { cn } from "@/lib/utils";

export type Theme = "light" | "dark";

interface AnimatedThemeTogglerProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  duration?: number;
  /** Called after theme is applied so parent state can sync */
  onThemeToggle?: (nextTheme: Theme) => void;
  /** localStorage key; use same as layout (e.g. clinic-crm-theme) */
  storageKey?: string;
}

export function AnimatedThemeToggler({
  className,
  duration = 400,
  onThemeToggle,
  storageKey = "theme",
  ...props
}: AnimatedThemeTogglerProps) {
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  const toggleTheme = useCallback(async () => {
    if (!buttonRef.current) return;

    const newTheme: Theme = isDark ? "light" : "dark";

    const applyTheme = () => {
      flushSync(() => {
        setIsDark(newTheme === "dark");
        document.documentElement.classList.toggle("dark", newTheme === "dark");
        document.documentElement.style.colorScheme = newTheme;
        localStorage.setItem(storageKey, newTheme);
        onThemeToggle?.(newTheme);
      });
    };

    if (typeof document.startViewTransition === "function") {
      await document.startViewTransition(applyTheme).ready;

      const { top, left, width, height } = buttonRef.current.getBoundingClientRect();
      const x = left + width / 2;
      const y = top + height / 2;
      const maxRadius = Math.hypot(
        Math.max(left, window.innerWidth - left),
        Math.max(top, window.innerHeight - top)
      );

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    } else {
      applyTheme();
    }
  }, [isDark, duration, onThemeToggle, storageKey]);

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      className={cn(
        "p-2 rounded-lg transition-colors hover:bg-(var(--bg-hover)) hover:text-(var(--text-primary)) focus-visible:ring-2 focus-visible:ring-[var(--ds-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-base)] text-[var(--text-muted)]",
        className
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      {...props}
    >
      {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
