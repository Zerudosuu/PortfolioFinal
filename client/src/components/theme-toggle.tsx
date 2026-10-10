import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/60 bg-muted/40 text-foreground/55 transition-all hover:bg-muted hover:text-foreground"
    >
      {isDark ? <Sun className="h-[14px] w-[14px]" /> : <Moon className="h-[14px] w-[14px]" />}
    </button>
  )
}
