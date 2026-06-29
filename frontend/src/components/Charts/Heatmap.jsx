import React from 'react';
import clsx from 'clsx';
import Tooltip from '@/components/Common/Tooltip';
import { heatmapColor } from '@/utils/chartHelpers';

/**
 * Heatmap — day-of-week × school (or grade) absence intensity matrix.
 * Props:
 *   data     { rowLabel: string, cells: { colLabel: string, value: number, count: number }[] }[]
 *   title    string
 *   maxValue number  (used to normalise cell intensity)
 */
export default function Heatmap({ data = [], title, maxValue }) {
  if (!data.length) return null;

  const cols   = data[0]?.cells ?? [];
  const maxVal = maxValue ?? Math.max(...data.flatMap((r) => r.cells.map((c) => c.value ?? 0)), 1);

  return (
    <div className="animate-fade-in">
      {title && <h3 className="text-sm font-semibold text-txt-muted mb-3">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-1 text-xs" role="grid" aria-label={title ?? 'Heatmap'}>
          <thead>
            <tr>
              <th className="w-28 text-left text-txt-muted font-normal pb-1 pr-2" />
              {cols.map((c) => (
                <th key={c.colLabel} className="text-center text-txt-muted font-medium w-10 pb-1">
                  {c.colLabel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.rowLabel}>
                <td className="text-txt-muted pr-2 text-right font-medium whitespace-nowrap">
                  {row.rowLabel}
                </td>
                {row.cells.map((cell) => {
                  const intensity = (cell.value ?? 0) / maxVal;
                  const bgStyle   = { backgroundColor: heatmapColor(intensity) };
                  const textColor = intensity > 0.6 ? '#1e40af' : '#64748b';
                  return (
                    <td key={cell.colLabel} className="p-0">
                      <Tooltip content={`${cell.count ?? cell.value} absences`} placement="top">
                        <div
                          className={clsx(
                            'heatmap-cell',
                            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500'
                          )}
                          style={{ ...bgStyle, color: textColor }}
                          tabIndex={0}
                          role="gridcell"
                          aria-label={`${row.rowLabel} ${cell.colLabel}: ${cell.count ?? cell.value} absences`}
                        >
                          {cell.count ?? cell.value}
                        </div>
                      </Tooltip>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
