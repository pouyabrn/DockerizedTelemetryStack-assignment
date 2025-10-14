import { useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { Card, CardHeader, CardTitle, CardContent } from './Card'
import { CurrentLocationMap } from './CurrentLocationMap'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export function AllCharts({ data, vehicleId }) {
  const timeLabels = data.map(d => new Date(d.timestamp).toLocaleTimeString())

  // Speed Chart
  const speedData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Speed (km/h)',
        data: data.map(d => d.speed),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  // RPM Chart
  const rpmData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Engine RPM',
        data: data.map(d => d.engine_rpm),
        borderColor: 'rgb(156, 163, 175)',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  // Temperature Chart
  const tempData = {
    labels: timeLabels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: data.map(d => d.temperature),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'rgb(229, 231, 235)',
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxTicksLimit: 10,
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
      y: {
        ticks: {
          color: 'rgb(156, 163, 175)',
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        },
      },
    },
  }

  return (
    <div className="space-y-6">
      {/* Speed Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Speed - {vehicleId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={speedData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* RPM Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Engine RPM - {vehicleId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={rpmData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Temperature Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Temperature - {vehicleId}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={tempData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle>📍 Current Location</CardTitle>
        </CardHeader>
        <CardContent>
          <CurrentLocationMap vehicleId={vehicleId} currentPosition={data[data.length - 1]} />
        </CardContent>
      </Card>
    </div>
  )
}

