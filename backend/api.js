import express from 'express';
import os from 'os';
import logger from './logger.js';
import { 
  getLatestTelemetry, 
  getTelemetryHistory, 
  getVehicles,
  pool 
} from './database.js';

const router = express.Router();

// System information endpoint
router.get('/system', (req, res) => {
  const networkInterfaces = os.networkInterfaces();
  const ipAddresses = [];
  
  Object.keys(networkInterfaces).forEach(ifname => {
    networkInterfaces[ifname].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ipAddresses.push({ interface: ifname, address: iface.address });
      }
    });
  });

  res.json({
    success: true,
    data: {
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      cpus: os.cpus().length,
      totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
      uptime: `${(os.uptime() / 3600).toFixed(2)} hours`,
      ipAddresses: ipAddresses.length > 0 ? ipAddresses : [{ interface: 'docker', address: 'localhost' }],
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    }
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Get latest telemetry for all vehicles
router.get('/telemetry/latest', async (req, res) => {
  try {
    const data = await getLatestTelemetry();
    res.json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (err) {
    logger.error('Error in /telemetry/latest:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch latest telemetry' 
    });
  }
});

// Get telemetry history for a specific vehicle
router.get('/telemetry/history', async (req, res) => {
  const { vehicle_id, limit } = req.query;
  
  if (!vehicle_id) {
    return res.status(400).json({ 
      success: false, 
      error: 'vehicle_id parameter is required' 
    });
  }
  
  try {
    const maxLimit = Math.min(parseInt(limit) || 100, 1000); // cap at 1000
    const data = await getTelemetryHistory(vehicle_id, maxLimit);
    
    res.json({
      success: true,
      vehicle_id: vehicle_id,
      count: data.length,
      data: data
    });
  } catch (err) {
    logger.error('Error in /telemetry/history:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch telemetry history' 
    });
  }
});

// Get list of all vehicles
router.get('/telemetry/vehicles', async (req, res) => {
  try {
    const vehicles = await getVehicles();
    res.json({
      success: true,
      count: vehicles.length,
      vehicles: vehicles
    });
  } catch (err) {
    logger.error('Error in /telemetry/vehicles:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch vehicles' 
    });
  }
});

// Get recent telemetry rows (for admin page)
router.get('/telemetry/recent', async (req, res) => {
  try {
    logger.info('GET /api/telemetry/recent');
    const limit = Math.min(parseInt(req.query.limit) || 50, 500);
    
    const result = await pool.query(`
      SELECT 
        id, vehicle_id, speed, latitude, longitude, 
        temperature, fuel_level, engine_rpm, status, 
        created_at
      FROM telemetry
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching recent telemetry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent telemetry'
    });
  }
});

// Database statistics endpoint
router.get('/stats', async (req, res) => {
  try {
    logger.info('GET /api/stats');
    
    // Get total count
    const countResult = await pool.query('SELECT COUNT(*) as total FROM telemetry');
    const total = parseInt(countResult.rows[0].total);
    
    // Get count per vehicle
    const vehicleCountResult = await pool.query(`
      SELECT vehicle_id, COUNT(*) as count 
      FROM telemetry 
      GROUP BY vehicle_id 
      ORDER BY vehicle_id
    `);
    
    // Get database size
    const dbSizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_database_size(current_database())) as db_size
    `);
    
    // Get table size
    const tableSizeResult = await pool.query(`
      SELECT pg_size_pretty(pg_total_relation_size('telemetry')) as table_size
    `);
    
    // Get latest timestamp
    const latestResult = await pool.query(`
      SELECT MAX(created_at) as latest_timestamp FROM telemetry
    `);
    
    // Get oldest timestamp
    const oldestResult = await pool.query(`
      SELECT MIN(created_at) as oldest_timestamp FROM telemetry
    `);
    
    // Get average speed, rpm, temp
    const avgResult = await pool.query(`
      SELECT 
        AVG(speed) as avg_speed,
        AVG(engine_rpm) as avg_rpm,
        AVG(temperature) as avg_temp,
        MAX(speed) as max_speed,
        MIN(speed) as min_speed
      FROM telemetry
    `);
    
    res.json({
      success: true,
      data: {
        total_records: total,
        vehicle_counts: vehicleCountResult.rows,
        database_size: dbSizeResult.rows[0].db_size,
        table_size: tableSizeResult.rows[0].table_size,
        latest_timestamp: latestResult.rows[0].latest_timestamp,
        oldest_timestamp: oldestResult.rows[0].oldest_timestamp,
        averages: {
          speed: parseFloat(avgResult.rows[0].avg_speed || 0).toFixed(2),
          rpm: parseFloat(avgResult.rows[0].avg_rpm || 0).toFixed(0),
          temperature: parseFloat(avgResult.rows[0].avg_temp || 0).toFixed(2),
          max_speed: parseFloat(avgResult.rows[0].max_speed || 0).toFixed(2),
          min_speed: parseFloat(avgResult.rows[0].min_speed || 0).toFixed(2)
        }
      }
    });
  } catch (error) {
    logger.error('Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics'
    });
  }
});

export default router;

