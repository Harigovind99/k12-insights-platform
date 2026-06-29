import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Filler, Tooltip, Legend,
} from 'chart.js';
import { CHART_DEFAULTS, PERCENTAGE_Y_SCALE, CATEGORY_X_SCALE, buildTrendDataset } from '@/utils/chartHelpers';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * LineChart — monthly attendance rate trend.
 * Props:
 *   data      { month: string, rate: number }[]
 *   label     string
 *   height    number (px)
 *   showLegend bool
 */
export default function LineChart({ data = [], label = 'Attendance Rate', height = 280, showLegend = false }) {
  const chartRef = useRef(null);

  // Destroy on unmount to prevent Chart.js memory leak
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!data.length) return (
    <EmptyChart height={height} />
  );

  const chartData = {
    labels: data.map((d) => d.month ?? d.label),
    datasets: [buildTrendDataset(data, label)],
  };

  const options = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { display: showLegend, ...CHART_DEFAULTS.plugins.legend },
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}%` },
      },
    },
    scales: {
      x: CATEGORY_X_SCALE,
      y: { ...PERCENTAGE_Y_SCALE, min: 70, max: 100 },
    },
  };

  return (
    <div style={{ height }} className="w-full">
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}

function EmptyChart({ height }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-txt-light text-sm bg-surface-bg rounded-lg"
    >
      No data available for the selected filters.
    </div>
  );
}
