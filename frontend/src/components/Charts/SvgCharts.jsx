import React, { useState } from 'react';

// ── Shared tooltip hook ──────────────────────────────────────────────────────
function useTip() {
  const [tip, setTip] = useState(null);
  const show = (e, html) => setTip({ x: e.clientX, y: e.clientY, html });
  const move = (e)       => setTip(t => t ? { ...t, x: e.clientX, y: e.clientY } : null);
  const hide = ()        => setTip(null);
  return { tip, show, move, hide };
}

function Tooltip({ tip }) {
  if (!tip) return null;
  const lines = tip.html.split('\n');
  return (
    <div
      className="tooltip-box"
      style={{ position:'fixed', left: tip.x - 80, top: tip.y - 60, zIndex: 9999, pointerEvents:'none' }}
    >
      {lines.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  );
}

function pct(n)  { return `${Number(n).toFixed(1)}%`; }
function num(n)  { return Number(n).toLocaleString(); }

// ── Empty chart placeholder ─────────────────────────────────────────────────
export function EmptyChart({ height = 200 }) {
  return (
    <div
      className="flex flex-col items-center justify-center text-center"
      style={{ height }}
    >
      <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-2">
        <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm font-semibold text-txt-primary">No data available</p>
      <p className="text-xs text-txt-muted mt-0.5">Try adjusting your filters.</p>
    </div>
  );
}

// ── 1. Stacked Horizontal Bar (School Attendance Breakdown) ─────────────────
// data: [{ school, present, excused, unexcused, tardy }]  — all values in %
export function StackedHBarChart({ data = [], w = 540, h = 220 }) {
  const { tip, show, move, hide } = useTip();
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:10, r:20, b:40, l:140 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const barH = Math.min(28, ch / data.length - 6);

  const segs = [
    { key:'present',   label:'Present',   color:'#3b82f6' },
    { key:'excused',   label:'Excused',   color:'#f59e0b' },
    { key:'unexcused', label:'Unexcused', color:'#ef4444' },
    { key:'tardy',     label:'Tardy',     color:'#8b5cf6' },
  ];

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ overflow:'visible' }}>
        {data.map((d, i) => {
          const y = margin.t + i * (ch / data.length) + (ch / data.length - barH) / 2;
          const lbl = d.school?.length > 18 ? d.school.slice(0, 16) + '…' : (d.school || '');
          let ox = margin.l;
          return (
            <g key={d.school || i}>
              <text x={margin.l - 8} y={y + barH / 2 + 4} fill="#64748b" fontSize={11} textAnchor="end" fontFamily="Inter,sans-serif">{lbl}</text>
              {segs.map(s => {
                const bw = ((d[s.key] || 0) / 100) * cw;
                const bx = ox;
                ox += bw;
                if (bw <= 0) return null;
                return (
                  <rect
                    key={s.key} x={bx} y={y} width={bw} height={barH} fill={s.color}
                    style={{ cursor:'default' }}
                    onMouseEnter={e => show(e, `${d.school}\n${s.label}: ${pct(d[s.key])}`)}
                    onMouseMove={move} onMouseLeave={hide}
                  />
                );
              })}
            </g>
          );
        })}
        {[0,1,2,3,4].map(i => {
          const x = margin.l + (i / 4) * cw;
          return (
            <g key={i}>
              <line x1={x} y1={margin.t} x2={x} y2={h - margin.b} stroke="#e2e8f0" strokeWidth={1} />
              <text x={x} y={h - margin.b + 16} fill="#94a3b8" fontSize={10} textAnchor="middle" fontFamily="Inter,sans-serif">{i * 25}%</text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-4 mt-3 justify-center">
        {segs.map(s => (
          <div key={s.key} className="flex items-center gap-1.5 text-xs text-txt-muted">
            <div className="w-3 h-3 rounded-sm" style={{ background: s.color }} />
            {s.label}
          </div>
        ))}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 2. Donut Chart ──────────────────────────────────────────────────────────
// data: [{ label, pct, count, color }]
export function DonutSvgChart({ data = [], centerText = '', w = 280, h = 280 }) {
  const { tip, show, move, hide } = useTip();
  if (!data.length || data.every(d => !d.count && !d.pct)) return <EmptyChart height={h} />;

  const cx = w / 2, cy = h / 2, r = 90, inner = 55;
  let startAngle = -90;

  const slices = data.map(d => {
    const angle = (d.pct / 100) * 360;
    const end   = startAngle + angle;
    const large = angle > 180 ? 1 : 0;
    const toRad = a => a * Math.PI / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(end));
    const y2 = cy + r * Math.sin(toRad(end));
    const ix1 = cx + inner * Math.cos(toRad(end));
    const iy1 = cy + inner * Math.sin(toRad(end));
    const ix2 = cx + inner * Math.cos(toRad(startAngle));
    const iy2 = cy + inner * Math.sin(toRad(startAngle));
    const path = `M${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} L${ix1},${iy1} A${inner},${inner} 0 ${large},0 ${ix2},${iy2} Z`;
    const slice = { ...d, path };
    startAngle = end;
    return slice;
  });

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ maxWidth: 280, display:'block', margin:'0 auto' }}>
        {slices.map(s => s.pct > 0 && (
          <path
            key={s.label} d={s.path} fill={s.color}
            style={{ cursor:'default' }}
            onMouseEnter={e => show(e, `${s.label}\n${num(s.count)} (${s.pct}%)`)}
            onMouseMove={move} onMouseLeave={hide}
          />
        ))}
        <text x={cx} y={cy - 6}  fill="#1e293b" fontSize={22} fontWeight={700} textAnchor="middle" fontFamily="Inter,sans-serif">{centerText}</text>
        <text x={cx} y={cy + 14} fill="#64748b" fontSize={11}                  textAnchor="middle" fontFamily="Inter,sans-serif">Total</text>
      </svg>
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {data.filter(d => d.pct > 0).map(d => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs text-txt-muted">
            <div className="w-3 h-3 rounded-sm" style={{ background: d.color }} />
            {d.label} ({d.pct}%)
          </div>
        ))}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 3. Vertical Bar (Day of Week) ───────────────────────────────────────────
// data: [{ day, count }]
export function VerticalBarChart({ data = [], w = 520, h = 260 }) {
  const { tip, show, move, hide } = useTip();
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:10, r:20, b:40, l:50 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const maxVal  = Math.max(...data.map(d => d.count), 1) * 1.15;
  const barW    = Math.min(48, cw / data.length - 12);
  const total   = data.reduce((s, d) => s + d.count, 0) || 1;
  const friPct  = Math.round((data.find(d => d.day === 'Fri')?.count || 0) / total * 100);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0,1,2,3,4].map(i => {
          const y = margin.t + (i / 4) * ch;
          return (
            <g key={i}>
              <line x1={margin.l} y1={y} x2={w - margin.r} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={margin.l - 8} y={y + 4} fill="#94a3b8" fontSize={10} textAnchor="end" fontFamily="Inter,sans-serif">{num(Math.round(maxVal * (1 - i / 4)))}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const x    = margin.l + i * (cw / data.length) + (cw / data.length - barW) / 2;
          const bh   = (d.count / maxVal) * ch;
          const y    = margin.t + ch - bh;
          const color = d.day === 'Fri' ? '#ef4444' : '#3b82f6';
          return (
            <g key={d.day}>
              <rect x={x} y={y} width={barW} height={bh} fill={color} rx={2}
                onMouseEnter={e => show(e, `${d.day}: ${num(d.count)} absences\n${pct(d.count / total * 100)} of weekly total`)}
                onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
              <text x={x + barW / 2} y={h - margin.b + 16} fill="#64748b" fontSize={11} textAnchor="middle" fontFamily="Inter,sans-serif">{d.day}</text>
            </g>
          );
        })}
      </svg>
      {friPct > 0 && (
        <div className="text-xs text-danger-500 font-medium mt-2 text-center">
          Fridays account for {friPct}% of all absences
        </div>
      )}
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 4. Line Chart (Monthly Trend) ───────────────────────────────────────────
// data: [{ m, cur, prev }]  — cur/prev are numbers (rate or count)
// isRate: true → Y-axis shows %, false → raw count
export function LineSvgChart({ data = [], w = 540, h = 280, isRate = true, goalLine = 96 }) {
  const { tip, show, move, hide } = useTip();
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:20, r:30, b:40, l:45 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const allVals = data.flatMap(d => [d.cur, d.prev].filter(v => v > 0));
  const yMin = isRate ? Math.max(70, Math.floor(Math.min(...allVals, 100)) - 3) : Math.max(0, Math.floor(Math.min(...allVals)) * 0.9);
  const yMax = isRate ? Math.min(100, Math.ceil(Math.max(...allVals, 70)) + 2)  : Math.ceil(Math.max(...allVals, 1)) * 1.1;

  const getX = i => margin.l + (i / (data.length - 1 || 1)) * cw;
  const getY = v => margin.t + ((yMax - v) / (yMax - yMin || 1)) * ch;

  const areaPath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${getX(i)},${getY(d.cur)}`).join(' ')
    + ` L${getX(data.length - 1)},${margin.t + ch} L${getX(0)},${margin.t + ch} Z`;

  const showGoal = isRate && goalLine >= yMin && goalLine <= yMax;
  const goalY = showGoal ? getY(goalLine) : null;
  const hasPrev = data.some(d => d.prev > 0);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0,1,2,3,4,5].map(i => {
          const y = margin.t + (i / 5) * ch;
          const val = yMax - (i / 5) * (yMax - yMin);
          return (
            <g key={i}>
              <line x1={margin.l} y1={y} x2={w - margin.r} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={margin.l - 8} y={y + 4} fill="#94a3b8" fontSize={10} textAnchor="end" fontFamily="Inter,sans-serif">
                {isRate ? pct(val) : num(Math.round(val))}
              </text>
            </g>
          );
        })}
        {showGoal && (
          <>
            <line x1={margin.l} y1={goalY} x2={w - margin.r} y2={goalY} stroke="#10b981" strokeWidth={1} strokeDasharray="6,4" />
            <text x={w - margin.r + 4} y={goalY + 3} fill="#10b981" fontSize={9} fontFamily="Inter,sans-serif">Goal</text>
          </>
        )}
        <path d={areaPath} fill="#3b82f6" opacity={0.08} />
        {hasPrev && (
          <polyline
            points={data.filter(d => d.prev > 0).map((d, i) => `${getX(i)},${getY(d.prev)}`).join(' ')}
            fill="none" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6,4"
          />
        )}
        <polyline
          points={data.map((d, i) => `${getX(i)},${getY(d.cur)}`).join(' ')}
          fill="none" stroke="#3b82f6" strokeWidth={2.5}
        />
        {data.map((d, i) => (
          <g key={d.m || i}>
            <circle cx={getX(i)} cy={getY(d.cur)} r={4} fill="#3b82f6" stroke="#fff" strokeWidth={2}
              onMouseEnter={e => show(e, `${d.m}\nCurrent: ${isRate ? pct(d.cur) : num(d.cur)}${hasPrev ? `\nPrior: ${isRate ? pct(d.prev) : num(d.prev)}` : ''}`)}
              onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
            {hasPrev && d.prev > 0 && <circle cx={getX(i)} cy={getY(d.prev)} r={3} fill="#94a3b8" stroke="#fff" strokeWidth={1.5} />}
            <text x={getX(i)} y={h - margin.b + 16} fill="#64748b" fontSize={10} textAnchor="middle" fontFamily="Inter,sans-serif">{d.m}</text>
          </g>
        ))}
      </svg>
      <div className="flex gap-5 mt-2 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-txt-muted"><div className="w-4 h-0.5 bg-brand-500 rounded" />Current Year</div>
        {hasPrev && <div className="flex items-center gap-1.5 text-xs text-txt-muted"><div className="w-4 h-0.5 rounded" style={{ borderTop:'1px dashed #94a3b8' }} />Prior Year</div>}
        {showGoal && <div className="flex items-center gap-1.5 text-xs text-txt-muted"><div className="w-4 h-0.5 rounded" style={{ borderTop:'1px dashed #10b981' }} />Goal ({goalLine}%)</div>}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 5. Heatmap (School × Month) ─────────────────────────────────────────────
// data: [{ school, data: number[] }]  cols: string[]
export function HeatmapChart({ data = [], cols = [], h: hProp }) {
  const { tip, show, move, hide } = useTip();
  const w = 680;
  const h = hProp || Math.max(180, data.length * 36 + 46);
  if (!data.length || !cols.length) return <EmptyChart height={h} />;

  const margin = { t:30, r:20, b:10, l:110 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const cellW = cw / cols.length;
  const cellH = ch / data.length;
  const allVals = data.flatMap(d => d.data);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals, 0.1);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {cols.map((c, i) => (
          <text key={c} x={margin.l + i * cellW + cellW / 2} y={margin.t - 8} fill="#64748b" fontSize={10} textAnchor="middle" fontFamily="Inter,sans-serif">{c}</text>
        ))}
        {data.map((row, ri) => (
          <g key={row.school || ri}>
            <text x={margin.l - 8} y={margin.t + ri * cellH + cellH / 2 + 4} fill="#64748b" fontSize={11} textAnchor="end" fontFamily="Inter,sans-serif">{row.school}</text>
            {row.data.map((val, ci) => {
              const intensity = maxV > minV ? (val - minV) / (maxV - minV) : 0;
              const r2  = Math.round(255 - intensity * (255 - 220));
              const g2  = Math.round(255 - intensity * (255 - 50));
              const b2  = Math.round(255 - intensity * (255 - 50));
              return (
                <g key={ci}>
                  <rect
                    x={margin.l + ci * cellW + 1} y={margin.t + ri * cellH + 1}
                    width={cellW - 2} height={cellH - 2}
                    fill={`rgb(${r2},${g2},${b2})`} rx={3}
                    onMouseEnter={e => show(e, `${row.school}\n${cols[ci]}: ${pct(val)}`)}
                    onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }}
                  />
                  <text
                    x={margin.l + ci * cellW + cellW / 2} y={margin.t + ri * cellH + cellH / 2 + 4}
                    fill={intensity > 0.5 ? '#fff' : '#1e293b'} fontSize={10} fontWeight={600}
                    textAnchor="middle" fontFamily="Inter,sans-serif"
                  >{pct(val)}</text>
                </g>
              );
            })}
          </g>
        ))}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 6. Horizontal Bar (Chronic by Group) ────────────────────────────────────
// data: [{ group, rate }]   threshold: number (%)
export function HorizontalBarChart({ data = [], w = 500, threshold = 10 }) {
  const { tip, show, move, hide } = useTip();
  const h = Math.max(200, data.length * 32 + 40);
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:10, r:60, b:20, l:160 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const maxVal = Math.max(...data.map(d => d.rate), 0.1) * 1.15;
  const barH   = Math.min(22, ch / data.length - 4);
  const thX    = margin.l + (threshold / maxVal) * cw;

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        <line x1={thX} y1={margin.t} x2={thX} y2={h - margin.b} stroke="#ef4444" strokeWidth={1} strokeDasharray="4,3" />
        <text x={thX} y={margin.t - 4} fill="#ef4444" fontSize={9} textAnchor="middle" fontFamily="Inter,sans-serif">{threshold}%</text>
        {data.map((d, i) => {
          const y    = margin.t + i * (ch / data.length) + (ch / data.length - barH) / 2;
          const bw   = (d.rate / maxVal) * cw;
          const color = d.rate >= threshold ? '#ef4444' : d.rate >= threshold * 0.7 ? '#f59e0b' : '#3b82f6';
          const lbl  = d.group?.length > 22 ? d.group.slice(0, 20) + '…' : (d.group || '');
          return (
            <g key={d.group || i}>
              <text x={margin.l - 8} y={y + barH / 2 + 4} fill="#64748b" fontSize={10} textAnchor="end" fontFamily="Inter,sans-serif">{lbl}</text>
              <rect x={margin.l} y={y} width={Math.max(0, bw)} height={barH} fill={color} rx={2}
                onMouseEnter={e => show(e, `${d.group}: ${pct(d.rate)}`)}
                onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
              <text x={margin.l + bw + 6} y={y + barH / 2 + 4} fill="#1e293b" fontSize={10} fontWeight={600} fontFamily="Inter,sans-serif">{pct(d.rate)}</text>
            </g>
          );
        })}
      </svg>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 7. Grouped H-Bar (At-Risk & Chronic by Grade) ───────────────────────────
// data: [{ g, atRisk, chronic }]
export function GroupedHBarChart({ data = [], w = 540 }) {
  const { tip, show, move, hide } = useTip();
  const h = Math.max(200, data.length * 34 + 40);
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:10, r:60, b:20, l:40 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const maxVal = Math.max(...data.flatMap(d => [d.atRisk, d.chronic]), 1) * 1.2;
  const groupH = ch / data.length;
  const barH   = Math.min(10, groupH / 2 - 2);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {data.map((d, i) => {
          const y   = margin.t + i * groupH;
          const arW = ((d.atRisk  || 0) / maxVal) * cw;
          const crW = ((d.chronic || 0) / maxVal) * cw;
          return (
            <g key={d.g || i}>
              <text x={margin.l - 6} y={y + groupH / 2 + 4} fill="#64748b" fontSize={10} textAnchor="end" fontFamily="Inter,sans-serif">{d.g}</text>
              <rect x={margin.l} y={y + groupH / 2 - barH - 1} width={arW} height={barH} fill="#3b82f6" rx={1}
                onMouseEnter={e => show(e, `Grade ${d.g}\nAt-Risk: ${d.atRisk}`)}
                onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
              <text x={margin.l + arW + 4} y={y + groupH / 2 - barH / 2 + 3} fill="#64748b" fontSize={9} fontFamily="Inter,sans-serif">{d.atRisk}</text>
              <rect x={margin.l} y={y + groupH / 2 + 1} width={crW} height={barH} fill="#ef4444" rx={1}
                onMouseEnter={e => show(e, `Grade ${d.g}\nChronic: ${d.chronic}`)}
                onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
              <text x={margin.l + crW + 4} y={y + groupH / 2 + barH / 2 + 5} fill="#64748b" fontSize={9} fontFamily="Inter,sans-serif">{d.chronic}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2 justify-center">
        <div className="flex items-center gap-1.5 text-xs text-txt-muted"><div className="w-3 h-3 rounded-sm bg-brand-500" />At-Risk</div>
        <div className="flex items-center gap-1.5 text-xs text-txt-muted"><div className="w-3 h-3 rounded-sm bg-danger-500" />Chronic</div>
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}

// ── 8. Quarterly Line (Chronic Rate by School per Quarter) ──────────────────
// data: [{ school, q: [q1,q2,q3,q4], color }]
export function QuarterlyLineChart({ data = [], w = 540, h = 280 }) {
  const { tip, show, move, hide } = useTip();
  if (!data.length) return <EmptyChart height={h} />;

  const margin = { t:20, r:30, b:40, l:45 };
  const cw = w - margin.l - margin.r;
  const ch = h - margin.t - margin.b;
  const quarters = ['Q1','Q2','Q3','Q4'];
  const yMax = Math.max(20, ...data.flatMap(d => d.q)) * 1.2;
  const getX = i => margin.l + (i / 3) * cw;
  const getY = v => margin.t + ((yMax - v) / yMax) * ch;
  const tY    = getY(10);

  return (
    <div>
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} className="w-full">
        {[0,1,2,3,4].map(i => {
          const y = margin.t + (i / 4) * ch;
          return (
            <g key={i}>
              <line x1={margin.l} y1={y} x2={w - margin.r} y2={y} stroke="#e2e8f0" strokeWidth={1} />
              <text x={margin.l - 8} y={y + 4} fill="#94a3b8" fontSize={10} textAnchor="end" fontFamily="Inter,sans-serif">{pct(yMax - (i / 4) * yMax)}</text>
            </g>
          );
        })}
        {quarters.map((q, i) => (
          <text key={q} x={getX(i)} y={h - margin.b + 16} fill="#64748b" fontSize={11} textAnchor="middle" fontFamily="Inter,sans-serif">{q}</text>
        ))}
        <line x1={margin.l} y1={tY} x2={w - margin.r} y2={tY} stroke="#ef4444" strokeWidth={1} strokeDasharray="5,4" />
        <text x={w - margin.r + 2} y={tY + 3} fill="#ef4444" fontSize={9} fontFamily="Inter,sans-serif">10%</text>
        {data.map(school => (
          <g key={school.school}>
            <polyline
              points={school.q.map((v, i) => `${getX(i)},${getY(v)}`).join(' ')}
              fill="none" stroke={school.color} strokeWidth={2}
            />
            {school.q.map((v, i) => (
              <circle key={i} cx={getX(i)} cy={getY(v)} r={4} fill={school.color} stroke="#fff" strokeWidth={2}
                onMouseEnter={e => show(e, `${school.school}\n${quarters[i]}: ${pct(v)}`)}
                onMouseMove={move} onMouseLeave={hide} style={{ cursor:'default' }} />
            ))}
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-2 justify-center">
        {data.map(s => (
          <div key={s.school} className="flex items-center gap-1.5 text-xs text-txt-muted">
            <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
            {s.school}
          </div>
        ))}
      </div>
      <Tooltip tip={tip} />
    </div>
  );
}
