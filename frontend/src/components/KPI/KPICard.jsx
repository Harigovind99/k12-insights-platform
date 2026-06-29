import React, { useEffect, useRef, useState } from 'react';

/**
 * KPICard — animated counter card, pixel-matched to original prototype.
 *
 * Props:
 *   label      string
 *   value      number | string
 *   suffix     string   e.g. '%'
 *   prefix     string   e.g. '$'
 *   delta      number   positive = good, negative = bad
 *   deltaLabel string
 *   icon       ReactElement
 *   color      'blue'|'green'|'yellow'|'red'|'purple'
 *   loading    bool
 */
export default function KPICard({
  label,
  value,
  suffix = '',
  prefix = '',
  delta,
  deltaLabel,
  icon,
  color = 'blue',
  loading = false,
  className = '',
}) {
  const [displayed, setDisplayed] = useState(0);
  const prevValue = useRef(null);
  const cardRef   = useRef(null);

  /* Icon background colours — matching original color palette */
  const colorMap = {
    blue:   { bg: '#eff6ff', text: '#2563eb' },
    green:  { bg: '#d1fae5', text: '#047857' },
    yellow: { bg: '#fef3c7', text: '#d97706' },
    red:    { bg: '#fee2e2', text: '#dc2626' },
    purple: { bg: '#ede9fe', text: '#7c3aed' },
  };
  const iconStyle = colorMap[color] || colorMap.blue;

  const numericValue = typeof value === 'number' ? value : parseFloat(value);
  const isNumeric    = !isNaN(numericValue);

  /* Animate counter on value change */
  useEffect(() => {
    if (!isNumeric) return;
    const start = prevValue.current ?? 0;
    prevValue.current = numericValue;
    if (start === numericValue) return;

    /* Flash the card — exact original kpiFlash animation */
    if (cardRef.current && start !== 0) {
      cardRef.current.classList.remove('kpi-flash');
      void cardRef.current.offsetWidth; // reflow
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
    : `${prefix}${value}${suffix}`;

  return (
    <div ref={cardRef} className={`kpi-card${className ? ' ' + className : ''}`}>
      {/* Label + icon row */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-txt-muted leading-snug">{label}</p>
        {icon && (
          <div
            className="rounded-lg p-2 flex-shrink-0"
            style={{ background: iconStyle.bg, color: iconStyle.text }}
          >
            {icon}
          </div>
        )}
      </div>

      {/* Value */}
      {loading ? (
        <div className="mt-3 flex items-center gap-1">
          <span className="loading-dot" />
          <span className="loading-dot" />
          <span className="loading-dot" />
        </div>
      ) : (
        <p className="text-2xl font-bold mt-2 text-txt-primary">
          {displayText}
        </p>
      )}

      {/* Delta */}
      {delta !== undefined && !loading && (
        <p
          className="mt-1 text-xs font-medium flex items-center gap-1"
          style={{ color: delta >= 0 ? '#059669' : '#dc2626' }}
        >
          <span>{delta >= 0 ? '▲' : '▼'}</span>
          <span>{Math.abs(delta).toFixed(1)}%</span>
          {deltaLabel && (
            <span style={{ color: '#94a3b8', fontWeight: 400 }}>{deltaLabel}</span>
          )}
        </p>
      )}
    </div>
  );
}
