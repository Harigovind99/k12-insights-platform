import React from 'react';

export default function LoadingDots({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`} aria-label="Loading">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
