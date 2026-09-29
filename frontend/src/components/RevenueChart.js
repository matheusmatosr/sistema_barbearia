import React, { useEffect, useRef, useState } from 'react';
import { formatPrice } from './ServiceCard';

const HEIGHT = 280;
const MARGIN = { top: 30, right: 8, bottom: 30, left: 64 };
const BAR_MAX = 24;
const GAP = 2;
const RADIUS = 4;

const compactCurrency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });

export const monthLabel = (key, withYear = false) => {
  const [year, month] = key.split('-').map(Number);
  const label = new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return withYear ? `${label}/${String(year).slice(2)}` : label;
};

// Escala "redonda" para o eixo Y (0, 50, 100…).
const niceScale = (max) => {
  if (max <= 0) return { top: 100, ticks: [0, 25, 50, 75, 100] };
  const raw = max / 4;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].find(factor => factor * magnitude >= raw) * magnitude;
  const top = Math.ceil(max / step) * step;
  return { top, ticks: Array.from({ length: Math.round(top / step) + 1 }, (_, index) => index * step) };
};

// Retângulo com cantos arredondados só no topo (base reta no eixo).
const roundedTop = (x, y, w, h, r) => {
  const radius = Math.min(r, h, w / 2);
  return `M${x},${y + h}V${y + radius}A${radius},${radius} 0 0 1 ${x + radius},${y}H${x + w - radius}A${radius},${radius} 0 0 1 ${x + w},${y + radius}V${y + h}Z`;
};

/**
 * Colunas empilhadas por mês. `series` vai da base para o topo: [{ key, label, color }].
 */
const RevenueChart = ({ data, series, selected, onSelect }) => {
  const wrapperRef = useRef(null);
  const [width, setWidth] = useState(720);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element || typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const innerWidth = Math.max(width - MARGIN.left - MARGIN.right, 120);
  const innerHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const totals = data.map(month => series.reduce((sum, item) => sum + month[item.key], 0));
  const { top, ticks } = niceScale(Math.max(...totals, 0));
  const band = innerWidth / data.length;
  const barWidth = Math.min(BAR_MAX, band * 0.56);
  const toY = (value) => innerHeight - (value / top) * innerHeight;
  const showEvery = band < 38 ? 2 : 1;
  const activeIndex = hovered ?? data.findIndex(month => month.month === selected);
  const tooltip = hovered !== null ? data[hovered] : null;
  const tooltipLeft = hovered !== null ? Math.min(Math.max(MARGIN.left + band * (hovered + 0.5), 100), width - 100) : 0;

  return (
    <div className="revenue-chart" ref={wrapperRef}>
      <div className="chart-legend">
        {[...series].reverse().map(item => (
          <span key={item.key}><i style={{ background: item.color }} />{item.label}</span>
        ))}
      </div>
      <div className="chart-canvas">
        <svg width={width} height={HEIGHT} role="img" aria-label="Faturamento mensal">
          <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
            {ticks.map(tick => (
              <g key={tick} transform={`translate(0,${toY(tick)})`}>
                <line x1={0} x2={innerWidth} className="chart-grid" />
                <text x={-10} dy="0.32em" textAnchor="end" className="chart-tick">{compactCurrency.format(tick)}</text>
              </g>
            ))}

            {data.map((month, index) => {
              const x = band * index + (band - barWidth) / 2;
              const isActive = index === activeIndex;
              const topSeries = [...series].reverse().find(item => month[item.key] > 0);
              let base = 0;
              return (
                <g key={month.month}>
                  <g opacity={activeIndex === -1 || isActive ? 1 : 0.5}>
                  {series.map((item, seriesIndex) => {
                    const value = month[item.key];
                    if (value <= 0) return null;
                    const y0 = toY(base);
                    base += value;
                    const y1 = toY(base);
                    // Espaço de 2px entre segmentos empilhados.
                    const height = Math.max(y0 - y1 - (seriesIndex > 0 ? GAP : 0), 1);
                    return item === topSeries
                      ? <path key={item.key} d={roundedTop(x, y1, barWidth, height, RADIUS)} fill={item.color} />
                      : <rect key={item.key} x={x} y={y1} width={barWidth} height={height} fill={item.color} />;
                  })}
                  </g>
                  {month.month === selected && totals[index] > 0 && (
                    <text x={x + barWidth / 2} y={toY(totals[index]) - 8} textAnchor="middle" className="chart-value">{compactCurrency.format(totals[index])}</text>
                  )}
                  {index % showEvery === 0 && (
                    <text x={band * index + band / 2} y={innerHeight + 20} textAnchor="middle" className={`chart-tick${month.month === selected ? ' is-selected' : ''}`}>
                      {monthLabel(month.month, index === 0 || month.month.endsWith('-01'))}
                    </text>
                  )}
                  <rect
                    x={band * index}
                    y={0}
                    width={band}
                    height={innerHeight}
                    fill="transparent"
                    className="chart-hit"
                    tabIndex={0}
                    aria-label={`${monthLabel(month.month, true)}: ${formatPrice(totals[index])}`}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    onClick={() => onSelect(month.month)}
                    onKeyDown={event => (event.key === 'Enter' || event.key === ' ') && onSelect(month.month)}
                  />
                </g>
              );
            })}
            <line x1={0} x2={innerWidth} y1={innerHeight} y2={innerHeight} className="chart-axis" />
          </g>
        </svg>

        {tooltip && (
          <div className="chart-tooltip" style={{ left: tooltipLeft, top: MARGIN.top + toY(totals[hovered]) }}>
            <strong>{monthLabel(tooltip.month, true)}</strong>
            <div className="chart-tooltip-row"><span>Faturamento</span><b>{formatPrice(totals[hovered])}</b></div>
            {[...series].reverse().map(item => (
              <div key={item.key} className="chart-tooltip-row"><span><i style={{ background: item.color }} />{item.label}</span><b>{formatPrice(tooltip[item.key])}</b></div>
            ))}
            <div className="chart-tooltip-row is-muted"><span>Atendimentos</span><b>{tooltip.completed}</b></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueChart;
