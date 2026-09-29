import React from 'react';

interface CamelloIconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

export function CamelloIcon({ className = 'w-5 h-5', size, ...props }: CamelloIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      width={size}
      height={size}
      {...props}
    >
      <defs>
        <linearGradient id="camelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="camelGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fef3c7" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Stylized Modern Geometric Camel Mark */}
      <path
        d="M 12 48 
           L 16 35 
           L 19 35 
           C 19 35, 19 28, 24 25 
           C 28 22, 31 29, 34 29 
           C 37 29, 39 21, 44 21 
           C 48 21, 51 26, 52 30 
           L 55 24 
           L 58 24 
           L 57 16 
           C 57 14, 55 12, 52 12 
           C 49 12, 47 13, 46 15 
           L 44 19 
           L 41 19 
           C 37 15, 33 15, 29 18 
           C 25 21, 23 21, 20 23 
           L 18 20 
           L 13 22 
           L 15 31 
           L 10 48 
           Z"
        fill="url(#camelGold)"
        filter="url(#glow)"
      />

      {/* Modern Dynamic Lines - Camel Body Geometry */}
      <path
        d="M 16 52 
           L 19 40 
           L 24 40 
           C 26 35, 29 32, 33 34 
           C 36 36, 38 34, 40 31 
           C 43 27, 47 28, 50 32 
           L 53 40 
           L 57 40 
           L 55 52 
           L 50 52 
           L 51 44 
           L 46 44 
           L 42 52 
           L 37 52 
           L 38 43 
           L 32 43 
           L 28 52 
           L 23 52 
           L 25 43 
           L 20 43 
           L 16 52 
           Z"
        fill="currentColor"
        opacity="0.95"
      />

      {/* Electric Spark / Pulse in Head representing Tech & Online Work */}
      <polygon
        points="52,14 55,9 50,11 48,15"
        fill="#fef08a"
      />
      <circle cx="53" cy="15" r="1.5" fill="#1e1b4b" />
      
      {/* Dynamic Speed Dash */}
      <line x1="8" y1="36" x2="14" y2="36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
      <line x1="6" y1="42" x2="13" y2="42" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
