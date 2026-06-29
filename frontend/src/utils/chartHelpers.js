import { CHART_COLORS } from './constants';

// ─── Shared Chart.js defaults ─────────────────────────────────────────────────
export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  animation: { duration: 400 },
  plugins: {
    legend: {
      labels: {
        font: { family: 'Inter', size: 12 },
        color: '#64748b',
        boxWidth: 12,
        padding: 16,
      },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      titleColor: '#f1f5f9',
      bodyColor: '#cbd5e1',
      padding: 10,
      cornerRadius: 8,
      titleFont: { family: 'Inter', size: 12, weight: '600' },
      bodyFont:  { family: 'Inter', size: 12 },
    },
  },
};

// ─── Scale presets ────────────────────────────────────────────────────────────
export const PERCENTAGE_Y_SCALE = {
  min: 0,
  max: 100,
  ticks: {
    callback: (v) => `${v}%`,
    font: { family: 'Inter', size: 11 },
    color: '#94a3b8',
  },
  grid: { color: '#f1f5f9' },
};

export const COUNT_Y_SCALE = {
  beginAtZero: true,
  ticks: {
    font: { family: 'Inter', size: 11 },
    color: '#94a3b8',
  },
  grid: { color: '#f1f5f9' },
};

export const CATEGORY_X_SCALE = {
  ticks: {
    font: { family: 'Inter', size: 11 },
    color: '#64748b',
  },
  grid: { display: false },
};

// ─── Dataset builders ─────────────────────────────────────────────────────────
/**
 * Build a stacked bar dataset array from risk-level counts per category.
 * @param {object[]} data - Array of { label, low, atRisk, moderate, chronic }
 */
export function buildRiskStackedDatasets(data) {
  return [
    {
      label: 'Low',
      data: data.map((d) => d.low ?? 0),
      backgroundColor: CHART_COLORS.low,
      borderRadius: 2,
    },
    {
      label: 'At Risk',
      data: data.map((d) => d.atRisk ?? 0),
      backgroundColor: CHART_COLORS.atRisk,
      borderRadius: 2,
    },
    {
      label: 'Moderate',
      data: data.map((d) => d.moderate ?? 0),
      backgroundColor: CHART_COLORS.moderate,
      borderRadius: 2,
    },
    {
      label: 'Chronic',
      data: data.map((d) => d.chronic ?? 0),
      backgroundColor: CHART_COLORS.chronic,
      borderRadius: 2,
    },
  ];
}

/**
 * Build a line chart dataset for monthly attendance trend.
 * @param {object[]} data - Array of { month, rate }
 */
export function buildTrendDataset(data, label = 'Attendance Rate') {
  return {
    label,
    data: data.map((d) => d.rate ?? d.value ?? 0),
    borderColor: CHART_COLORS.brand,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    pointBackgroundColor: CHART_COLORS.brand,
    pointRadius: 4,
    pointHoverRadius: 6,
    fill: true,
    tension: 0.4,
  };
}

/**
 * Build a donut dataset for risk distribution.
 * @param {{ low, atRisk, moderate, chronic }} counts
 */
export function buildRiskDonutDatasets(counts) {
  return {
    labels: ['Low', 'At Risk', 'Moderate', 'Chronic'],
    datasets: [{
      data: [counts.low ?? 0, counts.atRisk ?? 0, counts.moderate ?? 0, counts.chronic ?? 0],
      backgroundColor: [
        CHART_COLORS.low,
        CHART_COLORS.atRisk,
        CHART_COLORS.moderate,
        CHART_COLORS.chronic,
      ],
      borderWidth: 0,
      hoverOffset: 4,
    }],
  };
}

// ─── Heatmap intensity colour ─────────────────────────────────────────────────
/**
 * Return a Tailwind-compatible inline style for a heatmap cell.
 * @param {number} value  - 0-1 intensity
 */
export function heatmapColor(value) {
  const intensity = Math.min(Math.max(value, 0), 1);
  // Blue scale: low intensity = light, high = dark brand
  const r = Math.round(239 - intensity * 168);
  const g = Math.round(246 - intensity * 127);
  const b = Math.round(255 - intensity * 30);
  return `rgb(${r},${g},${b})`;
}
