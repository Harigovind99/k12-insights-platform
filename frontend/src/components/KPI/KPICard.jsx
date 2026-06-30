import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

/**
 * KPICard — animated counter card matching the original prototype style.
 *
 * Props:
 *   label      string   – small uppercase label
 *   value      number|string
 *   suffix     string   – e.g. '%'
 *   prefix     string   – e.g. '$'
 *   sub        string   – sub-text below the value
 *   badge      string   – badge pill text (e.g. '↑ On Track')
 *   badgeColor 'green'|'yellow'|'red'|'blue'|'purple'
 *   delta      number   – positive = good, negative = bad
 *   deltaLabel string
 *   loading    bool
 */
export default function KPICard({
  label = '',
  value,
  suffix = '',
  prefix = '',
  sub,
  badge,
  badgeColor = 'blue',
  delta,
  deltaLabel,
  loading = false,
  className = '',
}) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(null);
  const cardRef   = useRef(null);

  const badgeStyles = {
    green:  { bg: '#d1fae5', text: '#065f46' },
    yellow: { bg: '#fef3c7', text: '#92400e' },
    red:    { bg: '#fee2e2', text: '#991b1b' },
    blue:   { bg: '#dbeafe', text: '#1e40af' },
    purple: { bg: '#ede9fe', text: '#5b21b6' },
  };
  const bs = badgeStyles[badgeColor] || badgeStyles.blue;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric    = !isNaN(numericValue);

  useEffect(() => {
    if (!isNumeric) return;
    const start = prevValue.current ?? 0;
    prevValue.current = numericValue;
    if (start === numericValue) return;

    if (cardRef.current && start !== 0) {
      cardRef.current.classList.remove('kpi-flash');
      void cardRef.current.offsetWidth;
      cardRef.current.classList.add('kpi-flash');
    }

    let frame;
    const duration  = 400;
    const startTime = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - startTime) / duration);
      const eased    = 1 - Math.pow(1 - progress, 3);
      setDisplayed(start + (numericValue - start) * eased);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [numericValue]); // eslint-disable-line

  const displayText = loading
    ? '—'
    : isNumeric
    ? `${prefix}${displayed.toFixed(suffix === '%' ? 1 : 0)}${suffix}`
    : `${prefix}${value ?? '—'}${suffix}`;

  return (
    <div ref={cardRef} className={`kpi-card relative${className ? ' ' + className : ''}`}>
      {/* Badge pill — top right */}
      {badge && !loading && (
        <span
          className="absolute top-3 right-3 text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: bs.bg, color: bs.text }}
        >
          {badge}
        </span>
      )}

      {/* Label */}
      <p className="text-xs uppercase tracking-wider text-txt-muted font-medium mb-2 pr-20 leading-snug">
        {label}
      </p>

      {/* Value */}
      {loading ? (
        <div className="flex items-center gap-1 my-2">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      ) : (
        <p className="text-3xl font-bold text-txt-primary mb-1">
          {displayText}
        </p>
      )}

      {/* Sub text */}
      {sub && !loading && (
        <p className="text-sm text-txt-muted">{sub}</p>
      )}

      {/* Delta trend */}
      {delta !== undefined && !loading && (
        <p
          className="text-xs mt-2 font-medium flex items-center gap-1"
          style={{ color: delta >= 0 ? '#059669' : '#dc2626' }}
        >
          {delta >= 0
            ? <TrendingUp size={12} />
            : <TrendingDown size={12} />}
          <span>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}%</span>
          {deltaLabel && (
            <span className="text-txt-muted font-normal">{deltaLabel}</span>
          )}
        </p>
      )}
    </div>
  );
}
