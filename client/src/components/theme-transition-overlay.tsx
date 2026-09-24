import { useEffect, useState } from "react"
import { useTheme } from "./theme-provider"
import { PixelSwap } from "./pixel-swap"

export function ThemeTransitionOverlay() {
  const { theme } = useTheme()
  const [displayTheme, setDisplayTheme] = useState(theme)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const isDark = displayTheme === "dark" || (displayTheme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  useEffect(() => {
    if (theme !== displayTheme) {
      setIsTransitioning(true)
    }
  }, [theme, displayTheme])

  const handleTransitionComplete = (newActive: boolean) => {
    setDisplayTheme(theme)
    setIsTransitioning(false)
  }

  if (!isTransitioning) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <PixelSwap
        active={isDark}
        onActiveChange={() => {}}
        onComplete={handleTransitionComplete}
        trigger="manual"
        pattern="center"
        pixelSize={48}
        pixelSpin={360}
        pixelScale={0.5}
        duration={700}
        pixelDuration={350}
        fade={true}
        firstContent={
          <div className="fixed inset-0 bg-foreground/5" />
        }
        secondContent={
          <div className="fixed inset-0 bg-foreground/5" />
        }
        className="fixed inset-0"
        style={{ width: '100vw', height: '100vh' }}
      />
    </div>
  )
}
