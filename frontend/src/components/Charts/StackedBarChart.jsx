import React, { useRef, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  BarElement, Tooltip, Legend,
} from 'chart.js';
import { CHART_DEFAULTS, COUNT_Y_SCALE, CATEGORY_X_SCALE, buildRiskStackedDatasets } from '@/utils/chartHelpers';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * StackedBarChart — risk-level breakdown by category (school, grade, etc.)
 * Props:
 *   data       { label, low, atRisk, moderate, chronic }[]
 *   height     number
 *   horizontal bool
 *   showLegend bool
 */
export default function StackedBarChart({ data = [], height = 300, horizontal = false, showLegend = true }) {
  const chartRef = useRef(null);
  useEffect(() => () => { chartRef.current?.destroy(); }, []);

  if (!data.length) return (
    <div style={{ height }} className="flex items-center justify-center text-txt-light text-sm bg-surface-bg rounded-lg">
      No data available for the selected filters.
    </div>
  );

  const chartData = {
    labels: data.map((d) => d.label ?? d.school ?? d.grade),
    datasets: buildRiskStackedDatasets(data),
  };

  const options = {
    ...CHART_DEFAULTS,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        display: showLegend,
        position: 'top',
        ...CHART_DEFAULTS.plugins.legend,
      },
      tooltip: {
        ...CHART_DEFAULTS.plugins.tooltip,
        mode: 'index',
        intersect: false,
      },
    },
    scales: horizontal
      ? {
          x: { ...COUNT_Y_SCALE, stacked: true },
          y: { ...CATEGORY_X_SCALE, stacked: true },
        }
      : {
          x: { ...CATEGORY_X_SCALE, stacked: true },
          y: { ...COUNT_Y_SCALE,    stacked: true },
        },
  };

  return (
    <div style={{ height }} className="w-full">
      <Bar ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
