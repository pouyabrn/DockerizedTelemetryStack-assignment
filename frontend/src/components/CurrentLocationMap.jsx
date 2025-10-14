import { Scatter } from 'react-chartjs-2';

export function CurrentLocationMap({ vehicleId, currentPosition }) {
  if (!currentPosition) {
    return (
      <div className="h-96 flex items-center justify-center text-gray-400">
        <p>No location data yet...</p>
      </div>
    );
  }

  // Just one point - current position
  const chartData = {
    datasets: [
      {
        label: `${vehicleId} Current Position`,
        data: [{ x: currentPosition.longitude, y: currentPosition.latitude }],
        backgroundColor: 'rgba(239, 68, 68, 1)', // Red
        borderColor: 'rgba(255, 255, 255, 0.9)',
        pointRadius: 15, // BIG DOT
        pointHoverRadius: 18,
        pointBorderWidth: 3,
        showLine: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return [
              `Vehicle: ${vehicleId}`,
              `Position: (${context.parsed.x.toFixed(1)}, ${context.parsed.y.toFixed(1)})`,
              `Speed: ${currentPosition.speed?.toFixed(1)} km/h`,
              `RPM: ${currentPosition.engine_rpm}`
            ];
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(239, 68, 68, 0.5)',
        borderWidth: 2,
      },
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        title: {
          display: true,
          text: 'X Position (m)',
          color: 'rgb(156, 163, 175)',
          font: { size: 12, weight: 'bold' },
        },
      },
      y: {
        type: 'linear',
        ticks: {
          color: 'rgb(100, 116, 139)',
          font: { size: 11 },
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        title: {
          display: true,
          text: 'Y Position (m)',
          color: 'rgb(156, 163, 175)',
          font: { size: 12, weight: 'bold' },
        },
      },
    },
  };

  return (
    <div>
      <div className="h-[500px] bg-slate-900/50 rounded-lg p-4">
        <Scatter data={chartData} options={options} />
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">Vehicle</div>
          <div className="text-white font-bold">{vehicleId}</div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">Current Position</div>
          <div className="text-green-400 font-mono text-xs">
            ({currentPosition.longitude?.toFixed(1)}, {currentPosition.latitude?.toFixed(1)})
          </div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">Speed</div>
          <div className="text-blue-400 font-bold">{currentPosition.speed?.toFixed(1)} km/h</div>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg">
          <div className="text-gray-400 text-xs mb-1">RPM</div>
          <div className="text-purple-400 font-bold">{currentPosition.engine_rpm}</div>
        </div>
      </div>
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg">
          <span className="inline-block w-4 h-4 rounded-full bg-red-500"></span>
          <span className="text-sm text-gray-300">Current Location (Live)</span>
        </div>
      </div>
    </div>
  );
}

