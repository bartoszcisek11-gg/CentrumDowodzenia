import React from 'react';

export default function RadioIcon({ className = "radio-icon-svg", style = {} }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="radioBroadcastGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#e50066" />
          <stop offset="22%" stopColor="#d80077" />
          <stop offset="48%" stopColor="#802cc2" />
          <stop offset="75%" stopColor="#2264e5" />
          <stop offset="100%" stopColor="#00a2ff" />
        </linearGradient>
      </defs>

      {/* Środkowy punkt */}
      <circle cx="50" cy="50" r="7.5" fill="url(#radioBroadcastGrad)" />

      {/* Lewe fale (Magenta -> Fiolet) */}
      <path
        d="M 39.7 37.8 A 16 16 0 0 0 39.7 62.2"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 32.8 25.5 A 30 30 0 0 0 32.8 74.5"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 25.8 13.2 A 44 44 0 0 0 25.8 86.8"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />

      {/* Prawe fale (Fiolet -> Niebieski -> Cyjan) */}
      <path
        d="M 60.3 37.8 A 16 16 0 0 1 60.3 62.2"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 67.2 25.5 A 30 30 0 0 1 67.2 74.5"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M 74.2 13.2 A 44 44 0 0 1 74.2 86.8"
        stroke="url(#radioBroadcastGrad)"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
