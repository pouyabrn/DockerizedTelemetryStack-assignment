import { Card, CardHeader, CardTitle, CardContent } from './Card'
import { Gauge, MapPin, Thermometer, Fuel, Activity } from 'lucide-react'

export function VehicleCard({ vehicle }) {
  const statusColor = {
    running: 'text-green-500',
    idle: 'text-yellow-500',
    stopped: 'text-gray-500',
    unknown: 'text-gray-400'
  }[vehicle.status] || 'text-gray-400'

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="text-xl">{vehicle.vehicle_id}</span>
          <span className={`text-sm font-normal ${statusColor}`}>
            {vehicle.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Speed</p>
              <p className="text-lg font-semibold">{vehicle.speed?.toFixed(1) || '0.0'} km/h</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">RPM</p>
              <p className="text-lg font-semibold">{vehicle.engine_rpm || 0}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Temp</p>
              <p className="text-lg font-semibold">{vehicle.temperature?.toFixed(1) || '0.0'}°C</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Fuel className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Fuel</p>
              <p className="text-lg font-semibold">{vehicle.fuel_level?.toFixed(0) || '0'}%</p>
            </div>
          </div>

          <div className="col-span-2 flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Location</p>
              <p className="text-sm font-mono">
                {vehicle.latitude?.toFixed(4)}, {vehicle.longitude?.toFixed(4)}
              </p>
            </div>
          </div>

          <div className="col-span-2">
            <p className="text-xs text-muted-foreground">
              Last update: {formatTime(vehicle.timestamp)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

