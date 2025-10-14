import net from 'net';
import { CAR_001_DATA } from './car-001-data.js';
import { CAR_002_DATA } from './car-002-data.js';
import { CAR_003_DATA } from './car-003-data.js';

// Configuration
const TELEMETRY_HOST = 'localhost';
const TELEMETRY_PORT = 8080;
const UPDATE_INTERVAL = 50; // 0.05 seconds

// Static F1 data for each car
const VEHICLE_DATA = {
  'CAR-001': CAR_001_DATA,
  'CAR-002': CAR_002_DATA,
  'CAR-003': CAR_003_DATA
};

const VEHICLES = Object.keys(VEHICLE_DATA);

// Vehicle state tracking
const vehicleStates = {};

// Initialize vehicle states
VEHICLES.forEach(vehicleId => {
  vehicleStates[vehicleId] = {
    dataPoints: VEHICLE_DATA[vehicleId],
    currentIndex: 0,
    fuel_level: 50 + Math.random() * 50,
  };
});

console.log(`🏎️  F1 Telemetry Generator - Silverstone Circuit`);
console.log('='.repeat(60));
console.log(`Target: ${TELEMETRY_HOST}:${TELEMETRY_PORT}`);
console.log(`Vehicles: ${VEHICLES.join(', ')}`);
console.log(`Update interval: ${UPDATE_INTERVAL}ms`);
console.log(`Data points: ${CAR_001_DATA.length} per vehicle`);
console.log('='.repeat(60) + '\n');

// Get telemetry point for a vehicle
function getTelemetryPoint(vehicleId) {
  const state = vehicleStates[vehicleId];
  const dataPoint = state.dataPoints[state.currentIndex];
  
  // Move to next point (loop back to start)
  state.currentIndex = (state.currentIndex + 1) % state.dataPoints.length;
  
  // Decrease fuel
  state.fuel_level -= Math.random() * 0.1;
  if (state.fuel_level < 0) state.fuel_level = 100;
  
  // Randomize temperature based on speed (20-50°C)
  const speedFactor = dataPoint.speed / 300;
  const temperature = 20 + speedFactor * 25 + (Math.random() - 0.5) * 5;
  
  return {
    vehicle_id: vehicleId,
    speed: parseFloat(dataPoint.speed.toFixed(1)),
    latitude: parseFloat(dataPoint.y.toFixed(6)),
    longitude: parseFloat(dataPoint.x.toFixed(6)),
    temperature: parseFloat(temperature.toFixed(1)),
    fuel_level: parseFloat(state.fuel_level.toFixed(1)),
    engine_rpm: parseInt(dataPoint.rpm),
    status: dataPoint.speed > 10 ? 'running' : 'idle',
    timestamp: new Date().toISOString()
  };
}

// Send telemetry data
function sendTelemetry(vehicleId) {
  const client = new net.Socket();
  
  client.connect(TELEMETRY_PORT, TELEMETRY_HOST, () => {
    const telemetry = getTelemetryPoint(vehicleId);
    const json = JSON.stringify(telemetry);
    
    console.log(`[${vehicleId}] Point ${vehicleStates[vehicleId].currentIndex}/${vehicleStates[vehicleId].dataPoints.length} | ${telemetry.speed} km/h | ${telemetry.engine_rpm} RPM | ${telemetry.temperature}°C`);
    
    client.write(json);
  });
  
  client.on('data', (data) => {
    const response = JSON.parse(data.toString());
    if (response.success) {
      console.log(`[${vehicleId}] ✓ ID: ${response.id}`);
    }
    client.destroy();
  });
  
  client.on('error', (err) => {
    console.error(`[${vehicleId}] Error:`, err.message);
  });
}

// Start sending data
VEHICLES.forEach(vehicleId => {
  setTimeout(() => sendTelemetry(vehicleId), Math.random() * 500);
});

// Continuous updates
setInterval(() => {
  VEHICLES.forEach(vehicleId => {
    setTimeout(() => sendTelemetry(vehicleId), Math.random() * 30);
  });
}, UPDATE_INTERVAL);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping F1 telemetry generator...');
  process.exit(0);
});
