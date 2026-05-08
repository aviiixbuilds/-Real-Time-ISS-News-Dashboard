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
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5,
          fill: true,
          tension: 0.1,
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
        align: 'end',
        labels: {
          boxWidth: 20,
          usePointStyle: true,
          font: { size: 11 }
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: { display: true, color: 'rgba(0,0,0,0.05)' },
        ticks: { 
          color: '#888', 
          font: { size: 10 },
          maxRotation: 45,
          minRotation: 45
        }
      },
      y: {
        grid: { display: true, color: 'rgba(0,0,0,0.05)' },
        ticks: { color: '#888', font: { size: 10 } },
        suggestedMin: 24000,
        suggestedMax: 26000,
      }
    }
  };

  return (
    <div className="glass-card p-6 h-[500px] flex flex-col animate-fade-in">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">ISS Speed Trend</h3>
      <div className="flex-1 min-h-0">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
