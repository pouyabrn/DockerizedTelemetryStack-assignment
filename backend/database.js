import pg from 'pg';
import logger from './logger.js';

const { Pool } = pg;

// Database connection pool
let pool = null;

// Create a new pool with retry logic
function createPool() {
  return new Pool({
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || 5432,
    database: process.env.POSTGRES_DB || 'car_telemetry',
    user: process.env.POSTGRES_USER || 'telemetry',
    password: process.env.POSTGRES_PASSWORD || 'telemetry123',
    max: 20, // max connections in pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

// Initialize database connection
export async function initDatabase() {
  try {
    pool = createPool();
    
    // Test the connection
    const client = await pool.connect();
    logger.info('Database connected successfully');
    client.release();
    
    return pool;
  } catch (err) {
    logger.error('Failed to connect to database:', err);
    throw err;
  }
}

// Insert telemetry data
export async function insertTelemetry(data) {
  const query = `
    INSERT INTO telemetry (
      vehicle_id, speed, latitude, longitude, 
      temperature, fuel_level, engine_rpm, status, timestamp
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
  `;
  
  const values = [
    data.vehicle_id,
    data.speed || null,
    data.latitude || null,
    data.longitude || null,
    data.temperature || null,
    data.fuel_level || null,
    data.engine_rpm || null,
    data.status || 'unknown',
    data.timestamp || new Date()
  ];

  try {
    const result = await pool.query(query, values);
    return result.rows[0].id;
  } catch (err) {
    logger.error('Error inserting telemetry:', err);
    throw err;
  }
}

// Get latest telemetry for all vehicles
export async function getLatestTelemetry() {
  const query = 'SELECT * FROM latest_telemetry ORDER BY timestamp DESC';
  
  try {
    const result = await pool.query(query);
    return result.rows;
  } catch (err) {
    logger.error('Error fetching latest telemetry:', err);
    throw err;
  }
}

// Get telemetry history for a specific vehicle
export async function getTelemetryHistory(vehicleId, limit = 100) {
  const query = `
    SELECT * FROM telemetry 
    WHERE vehicle_id = $1 
    ORDER BY timestamp DESC 
    LIMIT $2
  `;
  
  try {
    const result = await pool.query(query, [vehicleId, limit]);
    return result.rows;
  } catch (err) {
    logger.error('Error fetching telemetry history:', err);
    throw err;
  }
}

// Get list of all vehicles
export async function getVehicles() {
  const query = 'SELECT DISTINCT vehicle_id FROM telemetry ORDER BY vehicle_id';
  
  try {
    const result = await pool.query(query);
    return result.rows.map(row => row.vehicle_id);
  } catch (err) {
    logger.error('Error fetching vehicles:', err);
    throw err;
  }
}

// Graceful shutdown
export async function closeDatabase() {
  if (pool) {
    await pool.end();
    logger.info('Database pool closed');
  }
}

// Export pool for direct queries (used in api.js)
export { pool };

