import { useRef } from 'react';
import { Bar, getElementAtEvent } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TopicChart({ chartData, onUnitClick }) {
  const chartRef = useRef();

  const onClick = (event) => {
    // Check if onUnitClick prop exists before proceeding
    if (!onUnitClick) return;

    const { current: chart } = chartRef;
    if (!chart) return;

    // Get the specific element (bar) that was clicked
    const element = getElementAtEvent(chart, event);

    if (element.length > 0) {
      const index = element[0].index;
      const clickedUnitName = chartData[index].topic; // This is the Unit Name
      
      console.log("Bar clicked:", clickedUnitName);
      onUnitClick(clickedUnitName);
    }
  };

  const data = {
    labels: chartData.map(d => d.topic),
    datasets: [{
      label: 'Student Queries',
      data: chartData.map(d => d.count),
      backgroundColor: '#4f46e5',
      hoverBackgroundColor: '#4338ca', // Darker indigo on hover
      borderRadius: 12,
      borderSkipped: false,
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Total Doubts: ${context.raw}`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: '#f1f5f9' },
        ticks: { stepSize: 1 } 
      },
      x: { 
        grid: { display: false } 
      }
    },
    // Changes cursor to pointer when hovering over a bar
    onHover: (event, chartElement) => {
      event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
    }
  };

  return (
    <div className="h-80">
      <Bar 
        ref={chartRef} 
        data={data} 
        options={options} 
        onClick={onClick} 
      />
    </div>
  );
}