FROM postgres:15-alpine

# Copy initialization script
COPY init.sql /docker-entrypoint-initdb.d/

# Set default environment variables (can be overridden)
ENV POSTGRES_DB=car_telemetry
ENV POSTGRES_USER=telemetry
ENV POSTGRES_PASSWORD=telemetry123

# Expose PostgreSQL port
EXPOSE 5432

