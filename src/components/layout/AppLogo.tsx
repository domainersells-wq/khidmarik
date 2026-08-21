
import type { SVGProps } from 'react';

export function AppLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      aria-label="Khidmatik Logo"
      {...props}
    >
      {/* Background Circle */}
      <circle cx="50" cy="50" r="48" fill="hsl(var(--primary))" />

      {/* Shopping Bag Shape (Simplified as a rounded rectangle) */}
      <rect
        x="20"
        y="30"
        width="60"
        height="45"
        rx="5"
        ry="5"
        fill="hsl(var(--primary-foreground))"
      />

      {/* Map Pin Icon */}
      <path
        d="M50 20 Q50 20 50 20 L50 20 C42 20 35 27 35 35 C35 47 50 60 50 60 C50 60 65 47 65 35 C65 27 58 20 50 20 Z"
        fill="hsl(var(--primary-foreground))"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
      />
      <circle cx="50" cy="35" r="6" fill="hsl(var(--primary))" />
      
      {/* Curved line below map pin (simplified) */}
       <path
        d="M38 55 Q50 62 62 55"
        fill="none"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Text "Khidmatik" */}
      <text
        x="50"
        y="83" 
        fontFamily="PT Sans, sans-serif"
        fontSize="12"
        fontWeight="bold"
        fill="hsl(var(--primary))"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        Khidmatik
      </text>
    </svg>
  );
}
