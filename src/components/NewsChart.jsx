import { useMemo } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#ff4d4d', '#3a86ff', '#ffbe0b', '#8338ec', '#06d6a0', '#ff006e', '#2196f3', '#ff9800', '#4caf50', '#e91e63'];

export default function NewsChart({ articles }) {
  const chartData = useMemo(() => {
    // Group articles by source
    const sourceCounts = {};
    articles.forEach(article => {
      const source = article.source?.title || 'Unknown';
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });

    const labels = Object.keys(sourceCounts);
    const data = Object.values(sourceCounts);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: COLORS.slice(0, labels.length),
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 8,
        },
      ],
    };
  }, [articles]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: { size: 11 },
          color: '#666',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8,
      },
    },
  };

  if (articles.length === 0) {
    return (
      <div className="glass-card p-6 h-[350px] flex items-center justify-center text-gray-400 text-sm">
        No news data to visualize yet.
      </div>
    );
  }

  return (
    <div className="glass-card p-6 h-[400px] flex flex-col animate-fade-in">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">News Distribution</h3>
      <div className="flex-1 min-h-0">
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}
