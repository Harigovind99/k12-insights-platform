import React, { useRef, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { CHART_DEFAULTS, buildRiskDonutDatasets } from '@/utils/chartHelpers';
import { CHART_COLORS } from '@/utils/constants';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * DonutChart — risk distribution.
 * Props:
 *   counts    { low, atRisk, moderate, chronic }
 *   height    number
 *   showLegend bool
 */
export default function DonutChart({ counts = {}, height = 240, showLegend = true }) {
  const chartRef = useRef(null);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  const total = (counts.low ?? 0) + (counts.atRisk ?? 0) + (counts.moderate ?? 0) + (counts.chronic ?? 0);

  if (!total) return (
    <div style={{ height }} className="flex items-center justify-center text-txt-light text-sm bg-surface-bg rounded-lg">
      No data available.
    </div>
  );

  const chartData = buildRiskDonutDatasets(counts);

  const options = {
    ...CHART_DEFAULTS,
    cutout: '68%',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        display: showLegend,
        position: 'bottom',
        ...CHART_DEFAULTS.plugins.legend,
      },
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: {
          label: (ctx) => {
            const pct = ((ctx.parsed / total) * 100).toFixed(1);
            return ` ${ctx.label}: ${ctx.parsed} students (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height }} className="w-full relative">
      <Doughnut ref={chartRef} data={chartData} options={options} />
      {/* Centre label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ paddingBottom: showLegend ? 40 : 0 }}>
        <div className="text-center">
          <p className="text-2xl font-bold text-txt-primary">{total}</p>
          <p className="text-xs text-txt-muted">Students</p>
        </div>
      </div>
    </div>
  );
}
