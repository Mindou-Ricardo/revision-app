import React from 'react';

export function AppLogo({ className = 'w-9 h-9' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0052ff" />
          <stop offset="65%" stopColor="#0077ff" />
          <stop offset="100%" stopColor="#00aaff" />
        </linearGradient>

        <linearGradient id="capTopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="80%" stopColor="#f2f7ff" />
          <stop offset="100%" stopColor="#e1eeff" />
        </linearGradient>

        <linearGradient id="baseRightGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d4e6fc" />
          <stop offset="100%" stopColor="#b6d5fa" />
        </linearGradient>

        <linearGradient id="baseLeftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eaf3ff" />
        </linearGradient>

        <linearGradient id="rimShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00359e" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#00359e" stopOpacity="0" />
        </linearGradient>

        <linearGradient id="upperPagesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eaf3fe" />
        </linearGradient>

        <linearGradient id="lowerPagesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d8ebff" />
        </linearGradient>

        <linearGradient id="tasselGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#d3e5fa" />
        </linearGradient>
      </defs>

      {/* Fond carré arrondi */}
      <rect x="50" y="50" width="412" height="412" rx="100" fill="url(#bgGradient)" />

      {/* Base du chapeau */}
      <path
        d="M 172,237 L 256,268 L 256,332 C 214,312 186,296 172,280 Z"
        fill="url(#baseLeftGradient)"
      />
      <path
        d="M 256,268 L 340,237 L 340,280 C 326,296 298,312 256,332 Z"
        fill="url(#baseRightGradient)"
      />
      <path
        d="M 172,237 L 256,268 L 340,237 L 340,250 L 256,280 L 172,250 Z"
        fill="url(#rimShadow)"
      />

      {/* Sommet du chapeau */}
      <path
        d="M 252,126 C 254.5,124.5 257.5,124.5 260,126 L 398,189 C 401.5,190.5 401.5,193.5 398,195 L 260,266 C 257.5,267.5 254.5,267.5 252,266 L 114,195 C 110.5,193.5 110.5,190.5 114,189 Z"
        fill="url(#capTopGradient)"
      />

      {/* Pompon / Gland */}
      <path d="M 386,193 L 386,248" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="386" cy="195" r="2.5" fill="#ffffff" />
      <rect x="375" y="246" width="22" height="36" rx="9" fill="url(#tasselGradient)" />

      {/* Livre ouvert / Pages */}
      <path
        d="M 256,376 C 205,324 152,310 126,316 L 107,352 C 142,336 200,348 256,398 C 312,348 370,336 405,352 L 386,316 C 360,310 307,324 256,376 Z"
        fill="url(#upperPagesGradient)"
      />
      <path
        d="M 90,396 C 136,366 198,372 256,420 C 206,390 148,393 90,396 Z"
        fill="url(#lowerPagesGradient)"
      />
      <path
        d="M 422,396 C 376,366 314,372 256,420 C 306,390 364,393 422,396 Z"
        fill="url(#lowerPagesGradient)"
      />
    </svg>
  );
}
