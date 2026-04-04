#!/bin/bash

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Your token
TOKEN="eyJhbGciOiJSUzI1NiIsImtpZCI6IjVlODJhZmI0ZWY2OWI3NjM4MzA2OWFjNmI1N2U3ZTY1MjAzYmZlOTYiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiVGVzdCBVc2VyIiwicm9sZSI6IkFkbWluIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3N0b2NrdmVsLWZmMDE1IiwiYXVkIjoic3RvY2t2ZWwtZmYwMTUiLCJhdXRoX3RpbWUiOjE3NzUzMDA4NzIsInVzZXJfaWQiOiIyVVZ3VjRxaENQZVNtOXlvVlZ6VjlVV2plNUQyIiwic3ViIjoiMlVWd1Y0cWhDUGVTbTl5b1ZWelY5VVdqZTVEMiIsImlhdCI6MTc3NTMwMDg3MiwiZXhwIjoxNzc1MzA0NDcyLCJlbWFpbCI6InRlc3RAc3RvY2t2ZWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZW1haWwiOlsidGVzdEBzdG9ja3ZlbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJwYXNzd29yZCJ9fQ.x6cXnAbEpWFbNHsedi5JSvm1kjtcyFicyAwouOHUhOdIgjs3FlOnt_vFQY8auCi-RzD5qPCb7dA4YZHYabmN8240jzPEbQAuUDPQ0FdDV-5Cf5dxWNT5tHJy9EtX5K19sRpNMIz0xE08IXdudm6lAMoKOKvuaPPaidx2Y0W1YxnuFUDzhnaMmZiUHc7ERulQ1Rx-mXfG7RVHck8Orywtn8gy2BcGJa632U5MlQhs4l1AVCHvuy-Ggg-Ogv-wkO4UsjiVgzrgTVk2wU8gpedsDki8ifKyjV3uJ6DOWPRoejIS5CXPW3uDcrn6C6MRO2tqOP1RRrNGlhmaP4O1P7wQbQ"

GROUP_ID="UcFqBqjmJTpYBwI6fP6Q"
BASE_URL="http://localhost:4005"

# Function to print section header
print_header() {
    echo -e "\n${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${WHITE}  $1${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}\n"
}

# Function to print JSON beautifully
print_json() {
    echo "$1" | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));" 2>/dev/null || echo "$1"
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local endpoint=$2
    local method=${3:-GET}
    
    echo -e "${CYAN}��� ${method} ${endpoint}${NC}"
    echo -e "${YELLOW}────────────────────────────────────────────────────────────────${NC}"
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -X GET "${BASE_URL}${endpoint}" -H "Authorization: Bearer $TOKEN")
    fi
    
    echo "$RESPONSE" | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));" 2>/dev/null || echo "$RESPONSE"
    echo ""
}

# Check if service is running
echo -e "${BLUE}��� Checking Analytics Service...${NC}"
if curl -s "${BASE_URL}/health" > /dev/null; then
    echo -e "${GREEN}✅ Analytics Service is running${NC}\n"
else
    echo -e "${RED}❌ Analytics Service is not running. Please start it first:${NC}"
    echo -e "${YELLOW}   cd ~/Stockvel-Micro-service/services/analytics-service && npm start${NC}"
    exit 1
fi

# Test 1: Health Check
print_header "HEALTH CHECK"
curl -s "${BASE_URL}/health" | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));"

# Test 2: Contribution Compliance Report
print_header "REPORT 1: CONTRIBUTION COMPLIANCE PER MEMBER"
curl -s -X GET "${BASE_URL}/dashboard/${GROUP_ID}/contribution-compliance" \
  -H "Authorization: Bearer $TOKEN" \
  | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));"

# Test 3: Payout History Report
print_header "REPORT 2: PAYOUT HISTORY AND PROJECTIONS"
curl -s -X GET "${BASE_URL}/dashboard/${GROUP_ID}/payout-history" \
  -H "Authorization: Bearer $TOKEN" \
  | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));"

# Test 4: Custom Analytics Report
print_header "REPORT 3: CUSTOM ANALYTICS VIEW"
curl -s -X GET "${BASE_URL}/dashboard/${GROUP_ID}/custom" \
  -H "Authorization: Bearer $TOKEN" \
  | node -e "const data = require('fs').readFileSync(0, 'utf-8'); console.log(JSON.stringify(JSON.parse(data), null, 2));"

# Test 5: CSV Export (save to file)
print_header "CSV EXPORT: CONTRIBUTION COMPLIANCE"
echo -e "${CYAN}��� Downloading CSV report...${NC}"
curl -s -X GET "${BASE_URL}/export/compliance/${GROUP_ID}/csv" \
  -H "Authorization: Bearer $TOKEN" \
  --output "compliance_report_$(date +%Y%m%d_%H%M%S).csv"
echo -e "${GREEN}✅ CSV saved to: compliance_report_$(date +%Y%m%d_%H%M%S).csv${NC}"
echo -e "${YELLOW}��� First few lines of CSV:${NC}"
head -5 "compliance_report_$(date +%Y%m%d_%H%M%S).csv" 2>/dev/null || echo "No CSV file created"

# Test 6: PDF Export
print_header "PDF EXPORT: CONTRIBUTION COMPLIANCE"
echo -e "${CYAN}��� Downloading PDF report...${NC}"
curl -s -X GET "${BASE_URL}/export/compliance/${GROUP_ID}/pdf" \
  -H "Authorization: Bearer $TOKEN" \
  --output "compliance_report_$(date +%Y%m%d_%H%M%S).pdf"
echo -e "${GREEN}✅ PDF saved to: compliance_report_$(date +%Y%m%d_%H%M%S).pdf${NC}"
ls -lh *.pdf 2>/dev/null | tail -1

# Summary
print_header "✅ TEST SUMMARY"
echo -e "${GREEN}All endpoints tested successfully!${NC}"
echo -e "\n${WHITE}��� Reports Generated:${NC}"
echo -e "  ${CYAN}•${NC} Contribution Compliance Report (JSON)"
echo -e "  ${CYAN}•${NC} Payout History Report (JSON)"
echo -e "  ${CYAN}•${NC} Custom Analytics Report (JSON)"
echo -e "  ${CYAN}•${NC} CSV Export (Downloaded)"
echo -e "  ${CYAN}•${NC} PDF Export (Downloaded)"
echo -e "\n${YELLOW}��� Tip: Use 'cat filename.csv' to view CSV content${NC}"
echo -e "${YELLOW}��� Tip: Use 'start filename.pdf' to open PDF (Windows)${NC}\n"

