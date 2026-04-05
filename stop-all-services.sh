#!/bin/bash

echo "Stopping all services..."

# Kill processes on each port
for port in 4001 4002 4003 4004 4005 5000 3000; do
    pid=$(netstat -ano 2>/dev/null | grep ":$port " | grep LISTEN | awk '{print $5}' | head -1)
    if [ -n "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)"
        taskkill //PID $pid //F 2>/dev/null || true
    fi
done

echo "All services stopped."
