import net from 'net';
import logger from './logger.js';
import { insertTelemetry } from './database.js';

// TCP server for receiving telemetry data
let server = null;

// Parse incoming telemetry data (JSON only)
function parseTelemetryData(buffer) {
  const jsonStr = buffer.toString('utf8').trim();
  return JSON.parse(jsonStr);
}

// Validate telemetry data
function validateTelemetry(data) {
  if (!data.vehicle_id) {
    return { valid: false, error: 'Missing vehicle_id' };
  }
  
  // Check for at least one data field
  const hasData = data.speed !== undefined || 
                  data.latitude !== undefined || 
                  data.temperature !== undefined;
  
  if (!hasData) {
    return { valid: false, error: 'No telemetry data provided' };
  }
  
  return { valid: true };
}

// Start TCP server for telemetry reception
export function startTelemetryReceiver(port = 8080) {
  server = net.createServer((socket) => {
    const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
    logger.info(`New telemetry connection from ${clientInfo}`);
    
    socket.on('data', async (data) => {
      try {
        const telemetry = parseTelemetryData(data);
        logger.info(`Received telemetry from ${telemetry.vehicle_id}`);
        
        // Validate the data
        const validation = validateTelemetry(telemetry);
        if (!validation.valid) {
          logger.warn(`Invalid telemetry: ${validation.error}`);
          socket.write(JSON.stringify({ error: validation.error }) + '\n');
          return;
        }
        
        // Insert into database
        const id = await insertTelemetry(telemetry);
        logger.info(`Stored telemetry with id: ${id}`);
        
        // Send acknowledgment
        socket.write(JSON.stringify({ success: true, id }) + '\n');
        
      } catch (err) {
        logger.error(`Error processing telemetry: ${err.message}`);
        socket.write(JSON.stringify({ error: 'Processing failed' }) + '\n');
      }
    });
    
    socket.on('error', (err) => {
      logger.error(`Socket error from ${clientInfo}: ${err.message}`);
    });
    
    socket.on('close', () => {
      logger.info(`Connection closed: ${clientInfo}`);
    });
  });
  
  server.listen(port, () => {
    logger.info(`Telemetry receiver listening on port ${port}`);
  });
  
  server.on('error', (err) => {
    logger.error(`Server error: ${err.message}`);
  });
  
  return server;
}

// Stop the telemetry receiver
export function stopTelemetryReceiver() {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        logger.info('Telemetry receiver stopped');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

