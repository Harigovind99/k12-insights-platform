import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';

/**
 * Accessible tooltip — renders children with a tooltip on hover/focus.
 * Usage: <Tooltip content="Explanation text"><button>...</button></Tooltip>
 */
export default function Tooltip({ content, children, placement = 'top', className }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 80);
  }, []);

  const placementClasses = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full  left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full  top-1/2 -translate-y-1/2 ml-2',
  };

  if (!content) return children;

  return (
    <span
      className={clsx('relative inline-flex', className)}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}
      {visible && (
        <span
          role="tooltip"
          className={clsx(
            'absolute z-50 whitespace-nowrap rounded-lg px-2.5 py-1.5',
            'bg-slate-800 text-white text-xs font-medium pointer-events-none',
            'shadow-lg animate-fade-in',
            placementClasses[placement]
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}
