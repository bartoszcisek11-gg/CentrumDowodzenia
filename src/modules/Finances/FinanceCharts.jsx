import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export function PieChart({ przychody, wydatki }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();
    if (przychody === 0 && wydatki === 0) return;

    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Przychody', 'Wydatki'],
        datasets: [{
          data: [przychody, wydatki],
          backgroundColor: ['#2ecc71', '#e74c3c'],
          hoverBackgroundColor: ['#27ae60', '#c0392b'],
          borderWidth: 4,
          borderColor: '#222834',
          hoverOffset: 12,
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${(ctx.parsed || 0).toFixed(2)} zł`
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [przychody, wydatki]);

  return <canvas ref={canvasRef} />;
}

export function LineChart({ stanyKonta }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();
    if (!stanyKonta || stanyKonta.length === 0) return;

    const labels = stanyKonta.map(s => s.data);
    const data = stanyKonta.map(s => s.kwota);

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Stan konta',
          data,
          borderColor: '#3498db',
          borderWidth: 3,
          backgroundColor: 'rgba(52, 152, 219, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 6,
          pointBackgroundColor: '#3498db',
          pointHoverRadius: 9,
          pointHoverBorderWidth: 3,
          pointHoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { ticks: { color: '#8e9aab' }, grid: { color: '#2c3545' } },
          y: { ticks: { color: '#8e9aab' }, grid: { color: '#2c3545' } }
        },
        plugins: {
          tooltip: {
            backgroundColor: '#181c24',
            titleColor: '#f5f6fa',
            bodyColor: '#3498db',
            borderColor: '#3498db',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => `Stan konta: ${context.parsed.y.toFixed(2)} zł`
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [stanyKonta]);

  return <canvas ref={canvasRef} />;
}

export function InvestmentChart({ inwestycje = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();
    if (!inwestycje || inwestycje.length === 0) return;

    const monthlyNet = {};
    inwestycje.forEach(inv => {
      const m = inv.miesiac || 'Inne';
      if (!monthlyNet[m]) monthlyNet[m] = 0;
      const kwotaAbs = Math.abs(parseFloat(inv.kwota) || 0);
      if (inv.typ === 'Profit' || inv.kwota > 0) {
        monthlyNet[m] += kwotaAbs;
      } else {
        monthlyNet[m] -= kwotaAbs;
      }
    });

    const sortedMonths = Object.keys(monthlyNet).sort();

    const POLISH_MONTHS = [
      'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień',
      'Październik', 'Listopad', 'Grudzień', 'Styczeń', 'Luty', 'Marzec'
    ];
    const MONTH_NAMES_PL = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const formatMonthLabel = (mStr) => {
      if (!mStr) return '';
      const parts = mStr.split('-');
      if (parts.length === 2) {
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          return MONTH_NAMES_PL[monthIdx];
        }
      }
      return mStr;
    };

    let currentTotal = 0;
    const barItems = [];
    const barData = [];
    const backgroundColors = [];
    const borderColors = [];
    const labels = [];

    sortedMonths.forEach(m => {
      const change = monthlyNet[m];
      const start = currentTotal;
      const end = currentTotal + change;
      currentTotal = end;

      barData.push([Math.min(start, end), Math.max(start, end)]);

      const isPositive = change >= 0;
      backgroundColors.push(isPositive ? '#3b82f6' : '#f97316');
      borderColors.push(isPositive ? '#2563eb' : '#ea580c');

      labels.push(formatMonthLabel(m));

      barItems.push({
        month: m,
        change,
        start,
        end,
        isPositive
      });
    });

    const waterfallPlugin = {
      id: 'waterfallLinesAndLabels',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();

        const meta = chart.getDatasetMeta(0);
        const bars = meta.data;

        // Draw value labels above / below bars
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';

        bars.forEach((bar, index) => {
          const item = barItems[index];
          if (!item) return;

          const changeFormatted = (item.change >= 0 ? '+' : '') + item.change.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' zł';

          const topY = Math.min(bar.y, bar.base);
          const bottomY = Math.max(bar.y, bar.base);

          if (item.isPositive) {
            ctx.fillStyle = '#ffffff';
            ctx.textBaseline = 'bottom';
            ctx.fillText(changeFormatted, bar.x, topY - 6);
          } else {
            ctx.fillStyle = '#ff944d';
            ctx.textBaseline = 'top';
            ctx.fillText(changeFormatted, bar.x, bottomY + 6);
          }
        });

        ctx.restore();
      }
    };

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Zysk / Strata',
            data: barData,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4,
            borderSkipped: false
          }
        ]
      },
      plugins: [waterfallPlugin],
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#f5f6fa', font: { size: 12, weight: '500' } },
            grid: { color: '#2c3545' }
          },
          y: {
            grace: '18%',
            ticks: {
              color: '#8e9aab',
              callback: (val) => val.toLocaleString('pl-PL') + ' zł'
            },
            grid: { color: '#2c3545' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#181c24',
            titleColor: '#f5f6fa',
            borderColor: '#00f2ff',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const item = barItems[idx];
                return `${formatMonthLabel(item.month)} (${item.month})`;
              },
              label: (context) => {
                const idx = context.dataIndex;
                const item = barItems[idx];
                const changeFormatted = (item.change >= 0 ? '+' : '') + item.change.toFixed(2) + ' zł';
                const endFormatted = item.end.toFixed(2) + ' zł';
                return [
                  ` Wynik miesiąca: ${changeFormatted}`,
                  ` Stan skumulowany: ${endFormatted}`
                ];
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [inwestycje]);

  return <canvas ref={canvasRef} />;
}