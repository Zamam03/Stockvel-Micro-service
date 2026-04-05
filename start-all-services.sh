#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}     STOKVEL MICROSERVICES - START ALL SERVICES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Function to check if a port is in use
is_port_in_use() {
    netstat -an 2>/dev/null | grep ":$1 " | grep -q LISTEN
    return $?
}

# Function to kill process on a port
kill_port() {
    echo -e "${YELLOW}   Stopping service on port $1...${NC}"
    pid=$(netstat -ano 2>/dev/null | grep ":$1 " | grep LISTEN | awk '{print $5}' | head -1)
    if [ -n "$pid" ]; then
        taskkill //PID $pid //F 2>/dev/null || true
        sleep 1
    fi
}

# Function to install dependencies in a directory
install_deps() {
    local dir=$1
    local name=$2
    
    echo -e "${YELLOW}   Installing dependencies for $name...${NC}"
    cd "$dir" || return 1
    
    if [ -f "package.json" ]; then
        npm install --silent 2>/dev/null
        echo -e "${GREEN}   ✅ $name dependencies installed${NC}"
    else
        echo -e "${RED}   ⚠️  No package.json found in $dir${NC}"
    fi
}

# Function to start a service
start_service() {
    local name=$1
    local port=$2
    local dir=$3
    
    echo -e "\n${GREEN}▶ Starting $name on port $port...${NC}"
    
    # Kill existing process on port
    kill_port $port
    
    # Navigate to service directory
    cd "$dir" || { echo -e "${RED}   Failed to cd to $dir${NC}"; return 1; }
    
    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        install_deps "$dir" "$name"
    fi
    
    # Start the service in background
    npm start > "/tmp/$name.log" 2>&1 &
    
    # Wait for service to start
    sleep 3
    
    # Check if service started
    if curl -s "http://localhost:$port/health" > /dev/null 2>&1; then
        echo -e "${GREEN}   ✅ $name is running on port $port${NC}"
        return 0
    else
        echo -e "${RED}   ❌ $name failed to start on port $port${NC}"
        echo -e "${YELLOW}   Check log: /tmp/$name.log${NC}"
        return 1
    fi
}

# Clean up function
cleanup() {
    echo -e "\n${YELLOW}Shutting down all services...${NC}"
    kill_port 4001
    kill_port 4002
    kill_port 4003
    kill_port 4004
    kill_port 4005
    kill_port 5000
    kill_port 3000
    echo -e "${GREEN}All services stopped.${NC}"
    exit 0
}

# Trap Ctrl+C
trap cleanup SIGINT SIGTERM

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INSTALLING SHARED DEPENDENCIES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Install shared folder dependencies
if [ -d "$HOME/Stockvel-Micro-service/shared" ]; then
    install_deps "$HOME/Stockvel-Micro-service/shared" "Shared Folder"
else
    echo -e "${RED}   ⚠️  Shared folder not found${NC}"
fi

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INSTALLING BACKEND SERVICES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Install all backend services dependencies
install_deps "$HOME/Stockvel-Micro-service/services/auth-service" "Auth Service"
install_deps "$HOME/Stockvel-Micro-service/services/payment-service" "Payment Service"
install_deps "$HOME/Stockvel-Micro-service/services/stockvel-service" "Stockvel Service"
install_deps "$HOME/Stockvel-Micro-service/services/meeting-service" "Meeting Service"
install_deps "$HOME/Stockvel-Micro-service/services/analytics-service" "Analytics Service"
install_deps "$HOME/Stockvel-Micro-service/gateway" "API Gateway"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STARTING BACKEND SERVICES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Start Auth Service (port 4001)
start_service "Auth Service" 4001 "$HOME/Stockvel-Micro-service/services/auth-service"

# Start Payment Service (port 4002)
start_service "Payment Service" 4002 "$HOME/Stockvel-Micro-service/services/payment-service"

# Start Stockvel Service (port 4003)
start_service "Stockvel Service" 4003 "$HOME/Stockvel-Micro-service/services/stockvel-service"

# Start Meeting Service (port 4004)
start_service "Meeting Service" 4004 "$HOME/Stockvel-Micro-service/services/meeting-service"

# Start Analytics Service (port 4005)
start_service "Analytics Service" 4005 "$HOME/Stockvel-Micro-service/services/analytics-service"

# Start Gateway (port 5000)
start_service "API Gateway" 5000 "$HOME/Stockvel-Micro-service/gateway"

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  INSTALLING FRONTEND DEPENDENCIES${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Install frontend dependencies
cd "$HOME/Stockvel-Micro-service/frontend"
if [ ! -d "node_modules" ]; then
    install_deps "$HOME/Stockvel-Micro-service/frontend" "Frontend"
fi

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  STARTING FRONTEND${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"

# Start Frontend (port 3000)
cd "$HOME/Stockvel-Micro-service/frontend"

# Kill existing frontend
kill_port 3000

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install --silent 2>/dev/null
fi

# Start frontend
echo -e "${GREEN}▶ Starting Frontend on port 3000...${NC}"
npm run dev > "/tmp/frontend.log" 2>&1 &

sleep 5

if curl -s "http://localhost:3000" > /dev/null 2>&1; then
    echo -e "${GREEN}   ✅ Frontend is running on port 3000${NC}"
else
    echo -e "${YELLOW}   ⚠️  Frontend may still be starting...${NC}"
fi

echo -e "\n${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ ALL SERVICES STARTED!${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "${YELLOW}📋 Service URLs:${NC}"
echo -e "   🔐 Auth Service:      ${GREEN}http://localhost:4001${NC}"
echo -e "   💳 Payment Service:   ${GREEN}http://localhost:4002${NC}"
echo -e "   🤝 Stockvel Service:  ${GREEN}http://localhost:4003${NC}"
echo -e "   📅 Meeting Service:   ${GREEN}http://localhost:4004${NC}"
echo -e "   📊 Analytics Service: ${GREEN}http://localhost:4005${NC}"
echo -e "   🚪 API Gateway:       ${GREEN}http://localhost:5000${NC}"
echo -e "   🎨 Frontend:          ${GREEN}http://localhost:3000${NC}"
echo -e ""
echo -e "${YELLOW}📝 Log files:${NC}"
echo -e "   Check logs in /tmp/*.log"
echo -e ""
echo -e "${YELLOW}⚠️  Press Ctrl+C to stop all services${NC}"
echo -e ""

# Keep the script running
wait
