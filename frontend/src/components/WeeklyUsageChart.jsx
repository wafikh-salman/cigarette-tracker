import { useState, useId } from 'react';
import { useTheme } from '../context/ThemeContext';

function formatDate(dateStr) {
  try {
    const date = new Date(`${dateStr}T00:00:00`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  } catch {
    return dateStr;
  }
}

function getSmoothPath(points) {
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

export function WeeklyUsageChart({ weeklyUsage = [] }) {
  const [activePoint, setActivePoint] = useState(null);
  const chartId = useId();
  const { theme } = useTheme();

  if (!weeklyUsage || weeklyUsage.length === 0) {
    return (
      <section className="surface-group apple-chart-section" aria-labelledby="weekly-trend-heading">
        <div className="apple-chart-header">
          <div className="apple-chart-title-wrap">
            <h2 id="weekly-trend-heading" className="apple-chart-title">Weekly Trend</h2>
            <span className="apple-chart-subtitle">Past 7 days activity</span>
          </div>
        </div>
        <div className="apple-chart-empty">
          <p className="apple-chart-empty-text">No usage recorded for this week</p>
        </div>
      </section>
    );
  }

  // Calculate 7-day summary metrics
  const totalWeeklyQuantity = weeklyUsage.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const activeDaysCount = weeklyUsage.length;
  const dailyAverage = (totalWeeklyQuantity / (activeDaysCount || 1)).toFixed(1);

  // SVG layout metrics
  const svgWidth = 640;
  const svgHeight = 170;
  const padding = { top: 22, right: 32, bottom: 36, left: 32 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const baselineY = padding.top + chartHeight;

  // Dynamic vertical scaling
  const maxQuantity = Math.max(...weeklyUsage.map((d) => Number(d.quantity) || 0), 1);
  const yCeiling = Math.max(4, Math.ceil(maxQuantity * 1.18));

  // Compute point positions
  const points = weeklyUsage.map((item, idx) => {
    const x =
      weeklyUsage.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (idx / (weeklyUsage.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((Number(item.quantity) || 0) / yCeiling) * chartHeight;
    return {
      ...item,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      formattedDate: formatDate(item.date),
      displayQuantity: Number(item.quantity) || 0,
    };
  });

  const smoothLineD = getSmoothPath(points);
  const smoothAreaD =
    points.length > 1
      ? `${smoothLineD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
      : '';

  const midGuideY = padding.top + chartHeight * 0.5;
  const currentHovered = activePoint !== null ? points[activePoint] : null;

  // Area tint colors
  const areaTint = theme === 'dark' ? '#8FB7FF' : '#01285F';
  const areaOpacityStart = theme === 'dark' ? 0.12 : 0.045;
  const areaOpacityEnd = theme === 'dark' ? 0.01 : 0.005;

  return (
    <section className="surface-group apple-chart-section" aria-labelledby="weekly-trend-heading">
      <div className="apple-chart-header">
        <div className="apple-chart-title-wrap">
          <span className="apple-chart-kicker">Activity Trend</span>
          <h2 id="weekly-trend-heading" className="apple-chart-title">Weekly Usage</h2>
        </div>
        <div className="apple-chart-meta">
          <span className="apple-chart-stat-number">{totalWeeklyQuantity}</span>
          <span className="apple-chart-stat-unit">total · avg {dailyAverage}/day</span>
        </div>
      </div>

      <div className="apple-chart-canvas-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="apple-chart-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="Weekly cigarette usage trend"
        >
          <defs>
            <linearGradient id={`area-tint-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaTint} stopOpacity={areaOpacityStart} />
              <stop offset="100%" stopColor={areaTint} stopOpacity={areaOpacityEnd} />
            </linearGradient>
          </defs>

          {/* Hairline guide lines */}
          <line
            x1={padding.left}
            y1={midGuideY}
            x2={padding.left + chartWidth}
            y2={midGuideY}
            className="apple-chart-guide"
          />
          <line
            x1={padding.left}
            y1={baselineY}
            x2={padding.left + chartWidth}
            y2={baselineY}
            className="apple-chart-baseline"
          />

          {/* Area tint */}
          {smoothAreaD && (
            <path
              d={smoothAreaD}
              fill={`url(#area-tint-${chartId})`}
              className="apple-chart-area"
            />
          )}

          {/* Animated trend line */}
          <path
            d={smoothLineD}
            className="apple-chart-path"
          />

          {/* Interactive scrubber indicator */}
          {currentHovered && (
            <line
              x1={currentHovered.x}
              y1={padding.top}
              x2={currentHovered.x}
              y2={baselineY}
              className="apple-chart-scrubber-line"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => {
            const isHovered = activePoint === idx;
            return (
              <g
                key={p.date || idx}
                className="apple-chart-node-group"
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
                onTouchStart={() => setActivePoint(idx)}
                tabIndex={0}
                role="button"
                aria-label={`${p.formattedDate}: ${p.displayQuantity} cigarettes`}
              >
                <circle cx={p.x} cy={p.y} r={20} fill="transparent" className="apple-hitbox" />

                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  className={`apple-chart-dot ${isHovered ? 'active' : ''}`}
                />

                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`apple-chart-date-label ${isHovered ? 'active' : ''}`}
                >
                  {p.formattedDate}
                </text>
              </g>
            );
          })}

          {/* Restrained Apple Floating Tooltip */}
          {currentHovered && (
            <g
              className="apple-tooltip-group"
              transform={`translate(${currentHovered.x}, ${Math.max(20, currentHovered.y - 36)})`}
            >
              <rect
                x="-52"
                y="-20"
                width="104"
                height="32"
                rx="8"
                className="apple-tooltip-bubble"
              />
              <text x="0" y="-7" textAnchor="middle" className="apple-tooltip-date">
                {currentHovered.formattedDate}
              </text>
              <text x="0" y="6" textAnchor="middle" className="apple-tooltip-count">
                {currentHovered.displayQuantity} {currentHovered.displayQuantity === 1 ? 'cigarette' : 'cigarettes'}
              </text>
            </g>
          )}
        </svg>
      </div>
    </section>
  );
}
