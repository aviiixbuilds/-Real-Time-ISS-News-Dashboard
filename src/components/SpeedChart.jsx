import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SpeedChart({ positions }) {
  const chartData = useMemo(() => {
    // Show last 30 measurements as requested
    const last30 = positions.slice(-30);
    const labels = last30.map(p => {
      const date = new Date(p.timestamp * 1000);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    });
    const speeds = last30.map(p => p.speed);

    return {
      labels,
      datasets: [
        {
          label: 'ISS Speed (km/h)',
          data: speeds,
          borderColor: '#ff4d4d',
          backgroundColor: 'rgba(255, 77, 77, 0.1)',
          borderWidth: 3,
          pointRadius: 3,
          pointBackgroundColor: '#ff4d4d',
          pointBorderColor: '#fff',
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4, // Smoother curve like in the screenshot
        },
      ],
    };
  }, [positions]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 20,
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: 'bold' },
          color: '#666'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 12,
        titleFont: { size: 14 },
        bodyFont: { size: 13 },
        cornerRadius: 8,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: true, color: 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: { 
          color: '#888', 
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45,
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        grid: { display: true, color: 'rgba(0,0,0,0.05)', drawBorder: false },
        ticks: { 
          color: '#888', 
          font: { size: 10 },
          padding: 10
        },
        suggestedMin: 24000,
        suggestedMax: 26000,
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="glass-card p-6 h-[500px] flex flex-col animate-fade-in shadow-lg border border-white/20">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">ISS Speed Trend</h3>
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
