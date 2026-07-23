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