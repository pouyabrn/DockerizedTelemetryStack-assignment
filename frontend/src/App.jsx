import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { VehicleCard } from './components/VehicleCard'
import { StaticButton } from './components/StaticButton'
import { AllCharts } from './components/AllCharts'
import { Card, CardHeader, CardTitle, CardContent } from './components/Card'
import { RefreshCw, Activity, Database } from 'lucide-react'
import ModernAdmin from './components/ModernAdmin'

function App() {
  const [currentPage, setCurrentPage] = useState(window.location.hash === '#/admin' ? 'admin' : 'dashboard')
  const [vehicles, setVehicles] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [historyData, setHistoryData] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Stable list of vehicle IDs (only updates when vehicles change count or IDs)
  const vehicleIds = useMemo(() => {
    return vehicles.map(v => v.vehicle_id).sort()
  }, [vehicles.length])

  // Stable click handler
  const handleViewDetails = useCallback((vehicleId) => {
    setSelectedVehicle(vehicleId)
  }, [])

  // Handle hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPage(window.location.hash === '#/admin' ? 'admin' : 'dashboard')
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Fetch latest telemetry data
  const fetchLatestData = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/telemetry/latest')
      if (response.data.success) {
        // Sort by vehicle_id to maintain consistent order
        const sortedData = response.data.data.sort((a, b) => 
          a.vehicle_id.localeCompare(b.vehicle_id)
        )
        setVehicles(sortedData)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching telemetry:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch history for selected vehicle
  const fetchHistory = async (vehicleId) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/telemetry/history`, {
        params: { vehicle_id: vehicleId, limit: 50 }
      })
      if (response.data.success) {
        setHistoryData(response.data.data.reverse())
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  // Auto-refresh every 0.1 seconds
  useEffect(() => {
    fetchLatestData()
    const interval = setInterval(fetchLatestData, 50) // 0.05 seconds
    return () => clearInterval(interval)
  }, [])

  // Fetch history when vehicle is selected
  useEffect(() => {
    if (selectedVehicle) {
      fetchHistory(selectedVehicle)
      const interval = setInterval(() => fetchHistory(selectedVehicle), 500)
      return () => clearInterval(interval)
    }
  }, [selectedVehicle])

  // Show admin page
  if (currentPage === 'admin') {
    return <ModernAdmin />
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading telemetry data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-600 rounded-lg">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  F1 Telemetry Dashboard
                </h1>
                <p className="text-sm text-gray-400">
                  Real-time monitoring • {vehicles.length} vehicles active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500">Last update</p>
                <p className="text-sm text-white font-mono">{lastUpdate?.toLocaleTimeString()}</p>
              </div>
              <a
                href="#/admin"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Database className="h-5 w-5" />
                Admin
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Live Vehicle Cards */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Live Vehicles</h2>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-gray-400">Receiving data at 50ms</span>
            </div>
          </div>
          {vehicles.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-12 text-center">
              <RefreshCw className="h-12 w-12 animate-spin text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Waiting for telemetry data...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
                {vehicles.map((vehicle) => (
                  <VehicleCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicleIds.map((vehicleId) => (
                  <StaticButton
                    key={vehicleId}
                    vehicleId={vehicleId}
                    onClick={handleViewDetails}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* Historical Charts */}
        {selectedVehicle && historyData.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-foreground">Historical Data</h2>
              <button
                onClick={() => setSelectedVehicle(null)}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors"
              >
                Close Charts
              </button>
            </div>
            <AllCharts data={historyData} vehicleId={selectedVehicle} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
          <p>Dockerized Telemetry Stack • Built with Node.js, PostgreSQL, React</p>
        </div>
      </div>
    </div>
  )
}

export default App

