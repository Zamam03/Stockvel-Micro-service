#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "  INSTALLING ALL DEPENDENCIES"
echo "════════════════════════════════════════════════════════════════"

install_deps() {
    local dir=$1
    local name=$2
    echo -e "\n📦 Installing $name..."
    cd "$dir" && npm install --silent 2>/dev/null
    echo "   ✅ $name done"
}

# Shared
install_deps "$HOME/Stockvel-Micro-service/shared" "Shared"

# Backend services
install_deps "$HOME/Stockvel-Micro-service/services/auth-service" "Auth Service"
install_deps "$HOME/Stockvel-Micro-service/services/payment-service" "Payment Service"
install_deps "$HOME/Stockvel-Micro-service/services/stockvel-service" "Stockvel Service"
install_deps "$HOME/Stockvel-Micro-service/services/meeting-service" "Meeting Service"
install_deps "$HOME/Stockvel-Micro-service/services/analytics-service" "Analytics Service"
install_deps "$HOME/Stockvel-Micro-service/gateway" "API Gateway"

# Frontend
install_deps "$HOME/Stockvel-Micro-service/frontend" "Frontend"

echo -e "\n✅ All dependencies installed!"
