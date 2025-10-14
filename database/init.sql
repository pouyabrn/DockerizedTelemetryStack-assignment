-- Car Telemetry Database Schema
-- Initialize database tables and indexes

-- Drop existing table if it exists (for clean restarts)
DROP TABLE IF EXISTS telemetry CASCADE;

-- Main telemetry table
CREATE TABLE telemetry (
    id SERIAL PRIMARY KEY,
    vehicle_id VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    speed FLOAT,              -- km/h
    latitude FLOAT,           -- GPS coordinates
    longitude FLOAT,          -- GPS coordinates  
    temperature FLOAT,        -- °C
    fuel_level FLOAT,         -- Percentage
    engine_rpm INTEGER,       -- RPM
    status VARCHAR(20),       -- running/idle/stopped
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common query patterns
-- Index for getting latest data by vehicle
CREATE INDEX idx_vehicle_timestamp ON telemetry(vehicle_id, timestamp DESC);

-- Index for timestamp-based queries (history)
CREATE INDEX idx_timestamp ON telemetry(timestamp DESC);

-- Index for vehicle lookups
CREATE INDEX idx_vehicle_id ON telemetry(vehicle_id);

-- Optional: Create a view for latest telemetry per vehicle
CREATE OR REPLACE VIEW latest_telemetry AS
SELECT DISTINCT ON (vehicle_id) 
    id,
    vehicle_id,
    timestamp,
    speed,
    latitude,
    longitude,
    temperature,
    fuel_level,
    engine_rpm,
    status,
    created_at
FROM telemetry
ORDER BY vehicle_id, timestamp DESC;

-- No sample data - database starts empty
-- Data only appears when test generator is running

-- Display success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Created table: telemetry';
    RAISE NOTICE 'Created indexes: idx_vehicle_timestamp, idx_timestamp, idx_vehicle_id';
    RAISE NOTICE 'Created view: latest_telemetry';
    RAISE NOTICE 'Database is empty - run test generator to add data';
END $$;

