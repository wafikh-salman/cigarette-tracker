import { useState, useId } from 'react';
import { useTheme } from '../context/ThemeContext';

function formatShortDate(dateStr) {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return dateStr;
  }
}

function buildSmoothPath(points) {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) {
    const cp1x = points[0].x + (points[1].x - points[0].x) * 0.45;
    const cp2x = points[0].x + (points[1].x - points[0].x) * 0.55;
    return `M ${points[0].x} ${points[0].y} C ${cp1x.toFixed(1)} ${points[0].y.toFixed(1)}, ${cp2x.toFixed(1)} ${points[1].y.toFixed(1)}, ${points[1].x} ${points[1].y}`;
  }
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = i > 0 ? points[i - 1] : points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = i < points.length - 2 ? points[i + 2] : p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function BrandTrendChart({ usageData }) {
  const [activeIdx, setActiveIdx] = useState(null);
  const chartId = useId();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const accentColor = isDark ? '#8FB7FF' : '#01285F';
  const areaOpacityStart = isDark ? 0.13 : 0.05;
  const areaOpacityEnd = isDark ? 0.01 : 0.003;

  if (!usageData || usageData.length === 0) {
    return (
      <div className="btc-empty-state">
        <p className="btc-empty-title">No usage recorded yet</p>
        <p className="btc-empty-text">Usage data will appear here once cigarettes are logged for this brand.</p>
      </div>
    );
  }

  const totalUsage = usageData.reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  const svgW = 600;
  const svgH = 160;
  const pad = { top: 20, right: 28, bottom: 34, left: 28 };
  const cW = svgW - pad.left - pad.right;
  const cH = svgH - pad.top - pad.bottom;
  const baselineY = pad.top + cH;
  const midGuideY = pad.top + cH * 0.5;

  const maxQty = Math.max(...usageData.map((d) => Number(d.quantity) || 0), 1);
  const yCeiling = Math.max(4, Math.ceil(maxQty * 1.22));

  const points = usageData.map((item, idx) => {
    const x = usageData.length === 1 ? pad.left + cW / 2 : pad.left + (idx / (usageData.length - 1)) * cW;
    const y = pad.top + cH - ((Number(item.quantity) || 0) / yCeiling) * cH;
    return { ...item, x: Number(x.toFixed(1)), y: Number(y.toFixed(1)), label: formatShortDate(item.date), qty: Number(item.quantity) || 0 };
  });

  const linePath = buildSmoothPath(points);
  const areaPath = points.length > 1 ? `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z` : '';
  const hovered = activeIdx !== null ? points[activeIdx] : null;
  const labelStep = usageData.length <= 5 ? 1 : Math.ceil(usageData.length / 5);
  const visibleLabelIndices = new Set(points.map((_, i) => i).filter((i) => i % labelStep === 0 || i === points.length - 1));

  return (
    <div className="btc-wrapper">
      <div className="btc-header">
        <div className="btc-title-block">
          <span className="btc-kicker">Activity</span>
          <h4 className="btc-title">Usage Trend</h4>
          <span className="btc-subtitle">Daily cigarette usage</span>
        </div>
        <div className="btc-summary">
          <span className="btc-summary-value">{totalUsage}</span>
          <span className="btc-summary-unit">total recorded</span>
        </div>
      </div>

      <div className="btc-canvas">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="btc-svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Usage trend: ${totalUsage} total cigarettes`}>
          <defs>
            <linearGradient id={`btc-area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={areaOpacityStart} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={areaOpacityEnd} />
            </linearGradient>
          </defs>
          <line x1={pad.left} y1={midGuideY} x2={pad.left + cW} y2={midGuideY} className="btc-guide" />
          <line x1={pad.left} y1={baselineY} x2={pad.left + cW} y2={baselineY} className="btc-baseline" />
          {areaPath && <path d={areaPath} fill={`url(#btc-area-${chartId})`} />}
          <path d={linePath} className="btc-line" />
          {hovered && <line x1={hovered.x} y1={pad.top} x2={hovered.x} y2={baselineY} className="btc-scrubber" />}
          {points.map((p, idx) => {
            const isActive = activeIdx === idx;
            return (
              <g key={p.date || idx} onMouseEnter={() => setActiveIdx(idx)} onMouseLeave={() => setActiveIdx(null)} onTouchStart={() => setActiveIdx(idx)} onTouchEnd={() => setActiveIdx(null)} tabIndex={0} role="button" aria-label={`${p.label}: ${p.qty} ${p.qty === 1 ? 'cigarette' : 'cigarettes'}`} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setActiveIdx(isActive ? null : idx); }}>
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" />
                <circle cx={p.x} cy={p.y} r={isActive ? 5.5 : 3.2} className={`btc-dot${isActive ? ' btc-dot--active' : ''}`} />
                {visibleLabelIndices.has(idx) && (
                  <text x={p.x} y={svgH - 10} textAnchor="middle" className={`btc-date-label${isActive ? ' btc-date-label--active' : ''}`}>{p.label}</text>
                )}
              </g>
            );
          })}
          {hovered && (() => {
            const tipW = 110;
            const halfTip = tipW / 2;
            const clampedX = Math.max(pad.left + halfTip, Math.min(hovered.x, pad.left + cW - halfTip));
            const tipY = Math.max(pad.top + 4, hovered.y - 42);
            return (
              <g className="btc-tooltip-group" transform={`translate(${clampedX}, ${tipY})`}>
                <rect x={-halfTip} y={-18} width={tipW} height={34} rx="9" className="btc-tooltip-bg" />
                <text x="0" y="-5" textAnchor="middle" className="btc-tooltip-date">{hovered.label}</text>
                <text x="0" y="9" textAnchor="middle" className="btc-tooltip-value">{hovered.qty} {hovered.qty === 1 ? 'cigarette' : 'cigarettes'}</text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
}
