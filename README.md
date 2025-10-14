# F1 Telemetry Dashboard - Real-time Car Data Stack

yo so basically i built this thing to track F1 cars in real-time. it's a full dockerized stack that receives telemetry data, stores it in postgres, and shows it on a dashboard. pretty neat stuff.

## What This Actually Does

imagine you have race cars sending data every 50ms (yeah, 20 times per second 😭). this system:
- catches that data via TCP sockets
- stores it in a database
- serves it through a REST API
- shows it on a live dashboard

basically telemetry → backend → database → API → frontend → your screen

## Tech Stack

```
Backend:   Node.js + Express
Frontend:  React + Vite + Chart.js  
Database:  PostgreSQL 15
Deploy:    Docker + docker-compose
```

---

## Backend - The Brain

### Technologies & Approach

so i wrote the backend in **Node.js** because it's good at handling concurrent connections and i'm comfortable with it. here's how i built it:

**TCP Receiver (Port 8080)**
- listens for incoming telemetry data via TCP sockets
- each car connects, sends JSON data, gets an acknowledgment
- validates the data before storing (can't trust everything lol)
- uses Node's `net` module for raw TCP

**REST API (Port 3000)**
- express.js for the HTTP server
- CORS enabled so frontend can talk to it
- endpoints for latest data, history, stats, all that good stuff
- proper error handling (mostly)

**Database Layer**
- uses `pg` library for PostgreSQL
- connection pooling (max 20 connections)
- prepared statements to avoid SQL injection
- graceful shutdown to close connections properly

**Architecture Decisions:**
- separated concerns: telemetry receiver is one module, API is another
- winston for logging (helps when debugging at 2am)
- environment variables for config (never hardcode credentials!)
- health checks so docker knows if it's alive

basically i wanted it to handle high-frequency data (60 points/sec) without choking. node's event loop is perfect for this - non-blocking I/O means one connection waiting doesn't block others.

the code is modular - `server.js` starts everything, `telemetry-receiver.js` handles TCP, `api.js` has all the endpoints, `database.js` talks to postgres. clean separation.

---

## Frontend - The Vibes

### How I Built It (I Know Nothing About Frontend 😭)

full disclosure: i don't know react that well so i basically vibe-coded this entire thing. grabbed some components from shadcn/ui, threw in chart.js for graphs, and tailwind because writing CSS is pain.

**The Vibe Coding Process:**
1. started with create-vite
2. googled "how to make cards in react"
3. found shadcn/ui, copied their components
4. threw tailwind classes until it looked decent
5. added chart.js and hoped for the best
6. dark theme because light theme hurts eyes

**Actual Technical Stuff:**
- **React 18** with hooks (useState, useEffect everywhere)
- **Vite** for dev server and building (way faster than webpack)
- **Chart.js** for all the graphs (speed, rpm, temperature)
- **Axios** for API calls (fetch is fine but axios is easier)
- **Tailwind CSS** for styling (utility classes go brrrr)

**How It Works:**
- polls the API every 50ms (yeah, aggressive polling but it works)
- vehicle cards update live with latest data
- click a card → shows charts for that vehicle
- separate admin page for database stats
- current location map shows where car is (just one red dot, simple)

**Components Structure:**
```
App.jsx              → main dashboard, handles routing
VehicleCard.jsx      → shows individual car data
AllCharts.jsx        → speed/rpm/temp graphs + location map
CurrentLocationMap.jsx → just plots current position
ModernAdmin.jsx      → database admin panel with hamburger menu
```

the polling could be websockets but honestly 50ms polling works fine for this. don't fix what ain't broke.

---

## Database - PostgreSQL

### Why PostgreSQL?

**Real talk:** i picked postgres because:
1. it's reliable af
2. handles time-series data well
3. has good indexing (needed for fast queries)
4. i know how to use it
5. works great with node.js

### Schema Design

```sql
CREATE TABLE telemetry (
  id SERIAL PRIMARY KEY,
  vehicle_id VARCHAR(50) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  speed DECIMAL(10,2),
  latitude DECIMAL(10,6),
  longitude DECIMAL(10,6),
  temperature DECIMAL(5,2),
  fuel_level DECIMAL(5,2),
  engine_rpm INTEGER,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes (important!):**
- `idx_vehicle_id` → fast lookups by vehicle
- `idx_timestamp` → time-based queries
- `idx_vehicle_timestamp` → combined index for "get latest for each vehicle"

### How It Works

**Data Flow:**
1. telemetry comes in via TCP
2. backend validates it
3. INSERT query to postgres
4. returns the new row ID
5. frontend queries it via REST API

**Performance:**
- with indexes, queries are fast even with 100k+ rows
- connection pooling prevents connection overhead
- no persistent volume = fresh start every time (keeps it clean)

**Why No Volume?**
decided to not persist data because:
- this is a demo/testing setup
- fresh data on each restart is cleaner
- don't need historical data piling up
- if you need persistence, just uncomment the volume in docker-compose

### Database Stats

the admin panel shows:
- total records
- per-vehicle counts
- database size
- average/min/max speed, rpm, temp
- latest 200 rows

---

## Docker Setup

### Architecture

three containers:
```
telemetry-db       → postgres database
telemetry-backend  → node.js (api + tcp receiver)
telemetry-frontend → react app (served with 'serve')
```

### Docker Configs

**Database (postgres:15-alpine):**
- runs postgres in a container
- no volume = data is ephemeral (fresh on restart)
- health check: `pg_isready`

**Backend (node:18-alpine):**
- multi-stage? nah, simple is better
- installs wget for health checks
- exposes ports 3000 (api) and 8080 (tcp)
- health check hits `/api/health`

**Frontend (node:18-alpine → production):**
- **Stage 1:** build the react app with vite
- **Stage 2:** serve static files with `serve`
- multi-stage build keeps image small (393KB JS vs god knows what)

**Networking:**
- all containers on `telemetry-network` bridge
- can talk to each other by service name
- frontend → `http://backend:3000` (doesn't work, used localhost instead lol)

**Health Checks:**
- db: checks postgres is ready
- backend: checks API endpoint
- frontend: none needed (just serves static files)

---

## How to Run Everything

### 1. Start the Stack

```bash
docker compose up -d
```

this builds all images (first time takes a minute), starts all containers, waits for health checks.

### 2. Start Test Data Generator

```bash
node scripts/test-telemetry.js
```

sends F1 telemetry data every 50ms. you'll see:
```
[CAR-001] Point 245/1178 | 156.3 km/h | 6234 RPM | 35.2°C
[CAR-001] ✓ ID: 1547
```

### 3. Access the Dashboard

**Main Dashboard:**
```
http://localhost:5173
```

**Admin Panel:**
```
http://localhost:5173/#/admin
```

### 4. Stop Everything

```bash
# Stop test generator: Ctrl+C

# Stop docker containers:
docker compose down
```

### Fresh Start (Wipe Everything)

```bash
docker compose down
docker compose up -d
```

database starts fresh every time (no persistent volume).

---

## Testing

### Manual Testing

**Test if backend receives data:**
```bash
# Send fake data via TCP
echo '{"vehicle_id":"TEST-001","speed":100,"latitude":0,"longitude":0,"temperature":30,"fuel_level":50,"engine_rpm":5000,"status":"running","timestamp":"2025-10-14T12:00:00Z"}' | nc localhost 8080
```

**Test API endpoints:**
```bash
# Latest data
curl http://localhost:3000/api/telemetry/latest

# History
curl http://localhost:3000/api/telemetry/history?vehicle_id=CAR-001&limit=10

# Stats
curl http://localhost:3000/api/stats

# System info
curl http://localhost:3000/api/system
```

### Check Logs

```bash
# Backend logs
docker logs telemetry-backend -f

# Database logs
docker logs telemetry-db

# All logs
docker compose logs -f
```

### Verify Everything Works

```bash
# Check containers are running
docker compose ps

# Should see:
# telemetry-db       Up (healthy)
# telemetry-backend  Up (healthy)
# telemetry-frontend Up
```

---

## API Reference

### GET /api/telemetry/latest
Returns latest data for all vehicles.

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "vehicle_id": "CAR-001",
      "speed": 156.3,
      "latitude": -297.5,
      "longitude": 111.2,
      "temperature": 35.2,
      "fuel_level": 67.3,
      "engine_rpm": 6234,
      "status": "running"
    }
  ]
}
```

### GET /api/telemetry/history
Get historical data.

**Query Params:**
- `vehicle_id` (optional) - filter by vehicle
- `limit` (optional) - max records (default: 100, max: 1000)

### GET /api/stats
Database statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_records": 15847,
    "vehicle_counts": [...],
    "database_size": "12 MB",
    "averages": {
      "speed": "125.3",
      "rpm": "5847"
    }
  }
}
```

### GET /api/system
Server system information.

### GET /api/track/zandvoort
Returns 866 track points (for the map).

---

## Project Structure

```
.
├── backend/
│   ├── server.js           # main entry point
│   ├── telemetry-receiver.js  # TCP server
│   ├── api.js              # REST endpoints
│   ├── database.js         # postgres connection
│   └── logger.js           # winston logging
│
├── frontend/
│   └── src/
│       ├── App.jsx         # main dashboard
│       └── components/
│           ├── VehicleCard.jsx
│           ├── AllCharts.jsx
│           ├── CurrentLocationMap.jsx
│           └── ModernAdmin.jsx
│
├── database/
│   ├── init.sql            # database schema
│   └── Dockerfile
│
├── scripts/
│   ├── car-001-data.js     # static F1 data (1178 points)
│   ├── car-002-data.js
│   ├── car-003-data.js
│   └── test-telemetry.js   # test generator
│
└── docker-compose.yml      # orchestration
```

---

## F1 Data

the test generator uses **real F1 telemetry data** from Mercedes 2020 Silverstone runs:
- 1,178 data points per vehicle
- real X/Y positions (meters)
- real speed (km/h) and RPM
- temperature is randomized (20-50°C based on speed)

each vehicle loops through its data at 50ms intervals. pretty realistic simulation.

---

## Features

**Dashboard:**
- live vehicle cards (updates 20x/sec)
- clickable cards → detailed charts
- speed, rpm, temperature graphs
- current location map (one red dot)

**Admin Panel:**
- hamburger menu sidebar
- database statistics
- latest 200 rows from database
- system info (hostname, IPs, resources)

**Map Visualization:**
- shows ONLY current position
- one big red dot
- updates live
- no history/path (keeps it clean)

---

## Performance

**Data Flow:**
- 3 vehicles × 20 updates/sec = **60 data points per second**
- TCP connection overhead: ~2ms per message
- Database insert: ~5-10ms
- Frontend polling: every 50ms

**Resource Usage:**
- backend: ~50MB RAM
- database: ~100MB RAM (no persistent data)
- frontend: ~20MB RAM (just serving static files)

---

## Common Issues & Fixes

**No data on dashboard:**
- make sure test generator is running: `node scripts/test-telemetry.js`
- check backend logs: `docker logs telemetry-backend -f`

**Containers won't start:**
```bash
docker compose down
docker compose up -d --build
```

**Old data persisting:**
- volumes are disabled in docker-compose
- restart containers for fresh database:
```bash
docker compose down
docker compose up -d
```

**Can't connect to database:**
- check health: `docker compose ps`
- wait for db health check to pass (~10 seconds)

---

## Tech Decisions Explained

**Why Node.js?**
- handles concurrent connections well
- non-blocking I/O perfect for real-time data
- huge ecosystem (express, pg, winston)

**Why Not WebSockets?**
- TCP for telemetry ingestion (lower overhead)
- HTTP polling for frontend (simpler, works fine at 50ms)

**Why PostgreSQL?**
- reliable and battle-tested
- great indexing for time-series data
- complex queries for analytics

**Why React?**
- component-based (cards, charts, etc)
- hooks make state management easy
- huge community (easy to find solutions)

**Why Docker?**
- consistent environment
- easy deployment
- service isolation
- one command to start everything

**Why No Persistent Volume?**
- cleaner for testing/demo
- fresh start each time
- don't need historical data
- easy to enable if needed

---

## What I Learned

building this taught me:
- TCP socket programming in node.js
- handling high-frequency data streams
- postgres indexing strategies
- docker multi-stage builds
- react hooks and polling patterns
- vibe coding a frontend with zero knowledge 😭

the hardest part was honestly the frontend. backend was straightforward - TCP in, validate, store, API out. but making charts look good? pain.

---

## Future Improvements

if i had more time:
- [ ] websockets for frontend (reduce polling overhead)
- [ ] grafana for better analytics
- [ ] redis for caching latest values
- [ ] prometheus metrics
- [ ] proper CI/CD pipeline
- [ ] unit tests (i know, i know 😭)

---

## Credits

**Technologies Used:**
- Node.js, Express, PostgreSQL
- React, Vite, Chart.js, Tailwind CSS
- Docker, docker-compose
- shadcn/ui components

**F1 Data:**
- Mercedes 2020 Silverstone telemetry (simulated in my own engine at https://github.com/pouyabrn/LapPredictionEngine )
- 1,178 real data points per vehicle

---

## License

MIT or whatever. use it, learn from it, improve it.

---

## Final Notes

this was a fun project. started with "let's track some cars" and ended with a full dockerized real-time telemetry stack. backend turned out solid, frontend is... functional (it works!), and docker made deployment ez.

if you're reading this for an interview or something - yeah i built this, all of it. backend from scratch, postgres schema, docker configs, even the vibe-coded frontend. learned a ton doing it.

questions? issues? check the docs or the code. it's all there.

**now go run some telemetry and watch those cars move 🏎️**

---

### Quick Commands Summary

```bash
# Start
docker compose up -d
node scripts/test-telemetry.js

# Stop
docker compose down

# Fresh restart
docker compose down && docker compose up -d

# Logs
docker compose logs -f

# Test API
curl http://localhost:3000/api/telemetry/latest

# Open dashboard
http://localhost:5173
```

that's it. have fun! 😭
