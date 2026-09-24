import React from "react"

export function AbstractGeometry() {
  return (
    <svg
      viewBox="0 0 200 240"
      className="w-full h-full"
      style={{ filter: "drop-shadow(0 0 20px rgba(0,0,0,0.1))" }}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: "hsl(66, 100%, 50%)", stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: "hsl(66, 100%, 50%)", stopOpacity: 0.2 }} />
        </linearGradient>
      </defs>

      {/* Floating circles */}
      <circle cx="160" cy="30" r="28" fill="none" stroke="hsl(66, 100%, 50%)" strokeWidth="1.5" opacity="0.4" />
      <circle cx="30" cy="180" r="35" fill="none" stroke="hsl(66, 100%, 50%)" strokeWidth="1.2" opacity="0.3" />

      {/* Abstract lines and connections */}
      <line x1="160" y1="30" x2="80" y2="120" stroke="hsl(66, 100%, 50%)" strokeWidth="1" opacity="0.2" strokeDasharray="4,4" />
      <line x1="30" y1="180" x2="140" y2="100" stroke="hsl(66, 100%, 50%)" strokeWidth="1" opacity="0.15" strokeDasharray="3,5" />

      {/* Geometric shapes */}
      <polygon
        points="120,20 140,60 100,65"
        fill="none"
        stroke="hsl(66, 100%, 50%)"
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Curved path */}
      <path
        d="M 40 50 Q 80 30 140 80"
        fill="none"
        stroke="hsl(66, 100%, 50%)"
        strokeWidth="1"
        opacity="0.3"
      />

      {/* Accent dots */}
      <circle cx="160" cy="30" r="3" fill="hsl(66, 100%, 50%)" opacity="0.7" />
      <circle cx="80" cy="120" r="2.5" fill="hsl(66, 100%, 50%)" opacity="0.5" />
      <circle cx="140" cy="100" r="2" fill="hsl(66, 100%, 50%)" opacity="0.4" />

      {/* Gradient filled shape */}
      <polygon
        points="50,150 70,120 90,140 80,160"
        fill="url(#grad1)"
        opacity="0.4"
      />

      {/* Additional minimal lines */}
      <line x1="60" y1="40" x2="100" y2="70" stroke="hsl(66, 100%, 50%)" strokeWidth="0.8" opacity="0.25" />
      <line x1="150" y1="200" x2="120" y2="170" stroke="hsl(66, 100%, 50%)" strokeWidth="0.8" opacity="0.25" />
    </svg>
  )
}
