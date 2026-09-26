import { useState, useId } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * Builds a smooth cubic Bézier curve path through 2D points.
 */
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

/**
 * Generates all 7 days of the current calendar week (Monday through Sunday),
 * mapping any existing daily_usage points and defaulting missing days to 0.
 */
function buildFullWeekDays(dailyUsage = []) {
  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ...
  const distanceToMonday = (currentDayOfWeek + 6) % 7; // Monday = 0, Sunday = 6

  const monday = new Date(today);
  monday.setDate(today.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const usageMap = new Map();
  if (Array.isArray(dailyUsage)) {
    dailyUsage.forEach((item) => {
      if (item && item.date) {
        usageMap.set(item.date, Number(item.quantity) || 0);
      }
    });
  }

  const shortNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const fullNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    days.push({
      date: dateStr,
      shortLabel: shortNames[i],
      fullLabel: fullNames[i],
      formattedDate: new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }).format(d),
      quantity: usageMap.get(dateStr) || 0,
    });
  }
  return days;
}

export function InsightsTrendChart({ dailyUsage = [] }) {
  const [activePoint, setActivePoint] = useState(null);
  const chartId = useId();
  const { theme } = useTheme();

  const weekDays = buildFullWeekDays(dailyUsage);
  const totalWeekUsage = weekDays.reduce((sum, d) => sum + d.quantity, 0);
  const maxUsage = Math.max(...weekDays.map((d) => d.quantity), 0);

  // SVG dimensions
  const svgWidth = 640;
  const svgHeight = 180;
  const padding = { top: 24, right: 32, bottom: 38, left: 32 };

  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const baselineY = padding.top + chartHeight;

  // Vertical scaling ceiling (ensures zero chart has nice headroom)
  const yCeiling = Math.max(4, Math.ceil(maxUsage * 1.2));

  // Compute point positions
  const points = weekDays.map((item, idx) => {
    const x = padding.left + (idx / 6) * chartWidth;
    const y = padding.top + chartHeight - (item.quantity / yCeiling) * chartHeight;
    return {
      ...item,
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
    };
  });

  const smoothLineD = getSmoothPath(points);
  const smoothAreaD = `${smoothLineD} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  const midGuideY = padding.top + chartHeight * 0.5;
  const currentHovered = activePoint !== null ? points[activePoint] : null;

  // Theming
  const areaTint = theme === 'dark' ? '#8FB7FF' : '#01285F';
  const areaOpacityStart = theme === 'dark' ? 0.12 : 0.05;
  const areaOpacityEnd = theme === 'dark' ? 0.01 : 0.005;

  return (
    <section className="insights-chart-card" aria-labelledby="insights-trend-heading">
      <div className="insights-chart-header">
        <div className="insights-chart-title-block">
          <span className="insights-chart-kicker">7-Day Trajectory</span>
          <h2 id="insights-trend-heading" className="insights-chart-title">Weekly Usage Trend</h2>
        </div>
        <div className="insights-chart-meta">
          <span className="insights-chart-stat-number">{totalWeekUsage}</span>
          <span className="insights-chart-stat-unit">total cigarettes</span>
        </div>
      </div>

      <div className="insights-chart-container">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="insights-chart-svg"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="7-Day cigarette usage trend line chart"
        >
          <defs>
            <linearGradient id={`insights-area-${chartId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={areaTint} stopOpacity={areaOpacityStart} />
              <stop offset="100%" stopColor={areaTint} stopOpacity={areaOpacityEnd} />
            </linearGradient>
          </defs>

          {/* Guide lines */}
          <line
            x1={padding.left}
            y1={midGuideY}
            x2={padding.left + chartWidth}
            y2={midGuideY}
            className="insights-chart-guide"
          />
          <line
            x1={padding.left}
            y1={baselineY}
            x2={padding.left + chartWidth}
            y2={baselineY}
            className="insights-chart-baseline"
          />

          {/* Area fill under curve */}
          <path
            d={smoothAreaD}
            fill={`url(#insights-area-${chartId})`}
            className="insights-chart-area"
          />

          {/* Progressive animated trend line */}
          <path
            d={smoothLineD}
            className="insights-chart-path"
          />

          {/* Interactive Scrubber line */}
          {currentHovered && (
            <line
              x1={currentHovered.x}
              y1={padding.top}
              x2={currentHovered.x}
              y2={baselineY}
              className="insights-chart-scrubber"
            />
          )}

          {/* Data Points & Day Labels */}
          {points.map((p, idx) => {
            const isHovered = activePoint === idx;
            return (
              <g
                key={p.date}
                className="insights-chart-point-group"
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
                onTouchStart={() => setActivePoint(idx)}
                tabIndex={0}
                role="button"
                aria-label={`${p.formattedDate}: ${p.quantity} cigarettes`}
              >
                {/* Generous touch target */}
                <circle cx={p.x} cy={p.y} r={22} fill="transparent" className="insights-hitbox" />

                {/* Node dot */}
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={isHovered ? 5.5 : 3.5}
                  className={`insights-chart-dot ${isHovered ? 'active' : ''}`}
                />

                {/* Day of Week Label */}
                <text
                  x={p.x}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  className={`insights-chart-axis-label ${isHovered ? 'active' : ''}`}
                >
                  {p.shortLabel}
                </text>
              </g>
            );
          })}

          {/* Apple Floating Tooltip */}
          {currentHovered && (
            <g
              className="insights-tooltip-group"
              transform={`translate(${currentHovered.x}, ${Math.max(22, currentHovered.y - 36)})`}
            >
              <rect
                x="-58"
                y="-20"
                width="116"
                height="32"
                rx="8"
                className="insights-tooltip-box"
              />
              <text x="0" y="-7" textAnchor="middle" className="insights-tooltip-date">
                {currentHovered.shortLabel} · {currentHovered.date.slice(5)}
              </text>
              <text x="0" y="6" textAnchor="middle" className="insights-tooltip-val">
                {currentHovered.quantity} {currentHovered.quantity === 1 ? 'cigarette' : 'cigarettes'}
              </text>
            </g>
          )}
        </svg>
      </div>

      {totalWeekUsage === 0 && (
        <div className="insights-empty-notice">
          <p className="insights-empty-msg">
            No usage recorded this week. Start logging entries to see your weekly trend.
          </p>
        </div>
      )}
    </section>
  );
}
