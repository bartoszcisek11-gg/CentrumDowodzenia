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
  return <StanKontaBarChart stanyKonta={stanyKonta} />;
}

export function StanKontaBarChart({ stanyKonta = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();
    if (!stanyKonta || stanyKonta.length === 0) return;

    const sorted = [...stanyKonta].sort((a, b) => a.data.localeCompare(b.data));

    const MONTH_NAMES_PL = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ];

    const formatMonthLabel = (mStr) => {
      if (!mStr) return '';
      const parts = mStr.split('-');
      if (parts.length >= 2) {
        const year = parts[0];
        const monthIdx = parseInt(parts[1], 10) - 1;
        if (monthIdx >= 0 && monthIdx < 12) {
          return `${MONTH_NAMES_PL[monthIdx]} ${year}`;
        }
      }
      return mStr;
    };

    let prevKwota = 0;
    const barItems = [];
    const barData = [];
    const backgroundColors = [];
    const borderColors = [];
    const labels = [];

    sorted.forEach((item, idx) => {
      const currentKwota = parseFloat(item.kwota) || 0;
      const start = idx === 0 ? 0 : prevKwota;
      const end = currentKwota;
      const change = end - start;
      prevKwota = currentKwota;

      barData.push([Math.min(start, end), Math.max(start, end)]);

      const isPositive = change >= 0;
      backgroundColors.push(isPositive ? '#3b82f6' : '#f97316');
      borderColors.push(isPositive ? '#2563eb' : '#ea580c');

      labels.push(formatMonthLabel(item.data));

      barItems.push({
        data: item.data,
        change,
        start,
        end,
        isPositive
      });
    });

    const waterfallPlugin = {
      id: 'waterfallLinesAndLabelsStan',
      afterDatasetsDraw(chart) {
        const { ctx } = chart;
        ctx.save();

        const meta = chart.getDatasetMeta(0);
        const bars = meta.data;

        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';

        bars.forEach((bar, index) => {
          if (index === 0) return;
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
            label: 'Stan konta',
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
                return formatMonthLabel(item.data);
              },
              label: (context) => {
                const idx = context.dataIndex;
                const item = barItems[idx];
                const endFormatted = item.end.toFixed(2) + ' zł';
                if (idx === 0) {
                  return [` Stan początkowy: ${endFormatted}`];
                }
                const changeFormatted = (item.change >= 0 ? '+' : '') + item.change.toFixed(2) + ' zł';
                return [
                  ` Zmiana w miesiącu: ${changeFormatted}`,
                  ` Stan oszczędności: ${endFormatted}`
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

export function PortfolioPercentageChart({ portfel = [] }) {
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');

    if (chartInstance.current) chartInstance.current.destroy();
    if (!portfel || portfel.length === 0) return;

    // Zbierz wszystkie unikalne daty wpisów / zakupu
    const datesSet = new Set();
    portfel.forEach(akcja => {
      if (akcja.dataZakupu) datesSet.add(akcja.dataZakupu);
      if (Array.isArray(akcja.historia)) {
        akcja.historia.forEach(h => {
          if (h.data) datesSet.add(h.data);
        });
      }
    });

    const sortedDates = Array.from(datesSet).sort();
    if (sortedDates.length === 0) return;

    const dataPoints = [];
    const labels = [];
    const pointColors = [];

    sortedDates.forEach(date => {
      let totalCost = 0;
      let totalValue = 0;

      portfel.forEach(akcja => {
        // Czy akcja została kupiona przed lub w dniu 'date'
        if (akcja.dataZakupu && akcja.dataZakupu <= date) {
          const cost = parseFloat(akcja.wartoscZakupu) || 0;
          totalCost += cost;

          // Znajdź najnowszą wartość z dnia <= date
          let latestVal = cost;
          let latestDate = akcja.dataZakupu;

          if (Array.isArray(akcja.historia)) {
            akcja.historia.forEach(h => {
              if (h.data && h.data <= date && h.data >= latestDate) {
                latestDate = h.data;
                latestVal = parseFloat(h.wartosc) || 0;
              }
            });
          }
          totalValue += latestVal;
        }
      });

      const profitLoss = totalValue - totalCost;
      const pctChange = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

      labels.push(date);
      dataPoints.push({
        date,
        pctChange,
        totalCost,
        totalValue,
        profitLoss
      });
      pointColors.push(pctChange >= 0 ? '#2ecc71' : '#e74c3c');
    });

    const valuesPct = dataPoints.map(dp => dp.pctChange);

    // Tworzenie gradientu
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    const lastPct = valuesPct[valuesPct.length - 1] || 0;
    if (lastPct >= 0) {
      gradient.addColorStop(0, 'rgba(46, 204, 113, 0.35)');
      gradient.addColorStop(1, 'rgba(46, 204, 113, 0.0)');
    } else {
      gradient.addColorStop(0, 'rgba(231, 76, 60, 0.35)');
      gradient.addColorStop(1, 'rgba(231, 76, 60, 0.0)');
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Zmiana portfela (%)',
            data: valuesPct,
            borderColor: lastPct >= 0 ? '#2ecc71' : '#e74c3c',
            backgroundColor: gradient,
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            pointBackgroundColor: pointColors,
            pointBorderColor: '#181c24',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 8
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            ticks: { color: '#f5f6fa', font: { size: 11, weight: '500' } },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          },
          y: {
            grace: '15%',
            ticks: {
              color: '#8e9aab',
              callback: (val) => (val >= 0 ? '+' : '') + val.toFixed(1) + '%'
            },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#181c24',
            titleColor: '#f5f6fa',
            borderColor: '#00f2ff',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                return `📅 Data: ${labels[idx]}`;
              },
              label: (context) => {
                const idx = context.dataIndex;
                const dp = dataPoints[idx];
                const pctFormatted = (dp.pctChange >= 0 ? '+' : '') + dp.pctChange.toFixed(2) + '%';
                const plFormatted = (dp.profitLoss >= 0 ? '+' : '') + dp.profitLoss.toFixed(2) + ' zł';
                const valFormatted = dp.totalValue.toFixed(2) + ' zł';
                const costFormatted = dp.totalCost.toFixed(2) + ' zł';

                return [
                  ` 📈 Zmiana: ${pctFormatted}`,
                  ` 💰 Wynik kwotowy: ${plFormatted}`,
                  ` 💼 Wartość portfela: ${valFormatted}`,
                  ` 💵 Całkowity wkład: ${costFormatted}`
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
  }, [portfel]);

  return <canvas ref={canvasRef} />;
}
