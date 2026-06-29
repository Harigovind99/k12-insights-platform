import React from 'react';
import clsx from 'clsx';

export default function LoadingSpinner({ className, size = 32 }) {
  return (
    <div className={clsx('flex justify-center items-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-brand-500"
        aria-label="Loading"
        role="status"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
        <path
          d="M12 2a10 10 0 0 1 10 10"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
