#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "  SERVICE STATUS"
echo "════════════════════════════════════════════════════════════════"

check_service() {
    local name=$1
    local port=$2
    local url=$3
    
    if curl -s "http://localhost:$port$url" > /dev/null 2>&1; then
        echo -e "   ✅ $name (port $port) - RUNNING"
        return 0
    else
        echo -e "   ❌ $name (port $port) - STOPPED"
        return 1
    fi
}

echo -e "\nBackend Services:"
echo "────────────────────────────────────────────────────────────────"
check_service "Auth Service" 4001 "/health"
check_service "Payment Service" 4002 "/health"
check_service "Stockvel Service" 4003 "/health"
check_service "Meeting Service" 4004 "/health"
check_service "Analytics Service" 4005 "/health"
check_service "API Gateway" 5000 "/health"

echo -e "\nFrontend:"
echo "────────────────────────────────────────────────────────────────"
if curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "   ✅ Frontend (port 3000) - RUNNING"
else
    echo -e "   ❌ Frontend (port 3000) - STOPPED"
fi

echo ""
