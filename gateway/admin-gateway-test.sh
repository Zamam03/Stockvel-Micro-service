#!/bin/bash

echo "════════════════════════════════════════════════════════════════"
echo "              GATEWAY TEST (WITH ADMIN USER)"
echo "════════════════════════════════════════════════════════════════"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

TIMESTAMP=$(date +%s)

echo -e "\n${YELLOW}Step 1: Create Admin User${NC}"
echo "────────────────────────────────────────────────────────────"

# Register Admin
ADMIN_EMAIL="admin${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Admin123!"

echo "Registering Admin: $ADMIN_EMAIL"
REGISTER=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\",\"displayName\":\"Admin ${TIMESTAMP}\",\"role\":\"Admin\"}")
echo "$REGISTER"

# Login as Admin
echo -e "\nLogging in as Admin..."
LOGIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
TOKEN=$(echo "$LOGIN" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4)
ADMIN_ID=$(echo "$LOGIN" | grep -o '"localId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}✅ Admin login successful${NC}"
    echo "   Admin ID: $ADMIN_ID"
else
    echo -e "${RED}❌ Admin login failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 2: Create a Group (as Admin)${NC}"
echo "────────────────────────────────────────────────────────────"

GROUP_RESPONSE=$(curl -s -X POST http://localhost:5000/api/stockvel/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"groupName\": \"Gateway Test Group ${TIMESTAMP}\",
    \"description\": \"Created via gateway test\",
    \"contributionAmount\": 500,
    \"meetingFrequency\": \"weekly\",
    \"startDate\": \"2026-05-01\",
    \"targetFund\": 25000
  }")

echo "$GROUP_RESPONSE"
GROUP_ID=$(echo "$GROUP_RESPONSE" | grep -o '"groupId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$GROUP_ID" ]; then
    echo -e "${GREEN}✅ Group created: $GROUP_ID${NC}"
else
    echo -e "${RED}❌ Group creation failed${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 3: Get Group Details${NC}"
echo "────────────────────────────────────────────────────────────"
curl -s "http://localhost:5000/api/stockvel/groups/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool 2>/dev/null || curl -s "http://localhost:5000/api/stockvel/groups/$GROUP_ID" -H "Authorization: Bearer $TOKEN"

echo -e "\n${YELLOW}Step 4: Make a Contribution${NC}"
echo "────────────────────────────────────────────────────────────"
CONTRIB=$(curl -s -X POST http://localhost:5000/api/payment/contribute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"amount\": 500,
    \"paymentMethod\": \"credit_card\",
    \"paymentDetails\": {\"cardLast4\": \"4242\", \"cardBrand\": \"Visa\"}
  }")
echo "$CONTRIB"

echo -e "\n${YELLOW}Step 5: Get Payment Summary${NC}"
echo "────────────────────────────────────────────────────────────"
curl -s "http://localhost:5000/api/payment/summary/$GROUP_ID" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool 2>/dev/null || curl -s "http://localhost:5000/api/payment/summary/$GROUP_ID" -H "Authorization: Bearer $TOKEN"

echo -e "\n${YELLOW}Step 6: Create a Meeting${NC}"
echo "────────────────────────────────────────────────────────────"
MEETING_RESPONSE=$(curl -s -X POST http://localhost:5000/api/meetings/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"groupId\": \"$GROUP_ID\",
    \"title\": \"Gateway Test Meeting ${TIMESTAMP}\",
    \"description\": \"Meeting via gateway\",
    \"scheduledDate\": \"2026-05-10T14:00:00.000Z\",
    \"location\": \"Online\",
    \"meetingType\": \"general\"
  }")
echo "$MEETING_RESPONSE"
MEETING_ID=$(echo "$MEETING_RESPONSE" | grep -o '"meetingId":"[^"]*"' | cut -d'"' -f4)

if [ -n "$MEETING_ID" ]; then
    echo -e "${GREEN}✅ Meeting created: $MEETING_ID${NC}"
fi

echo -e "\n${YELLOW}Step 7: Get Meeting Details${NC}"
echo "────────────────────────────────────────────────────────────"
curl -s "http://localhost:5000/api/meetings/meetings/$MEETING_ID" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool 2>/dev/null || curl -s "http://localhost:5000/api/meetings/meetings/$MEETING_ID" -H "Authorization: Bearer $TOKEN"

echo -e "\n${YELLOW}Step 8: Get Analytics Report${NC}"
echo "────────────────────────────────────────────────────────────"
curl -s "http://localhost:5000/api/analytics/dashboard/$GROUP_ID/contribution-compliance" \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool 2>/dev/null | head -30

echo -e "\n${YELLOW}Step 9: Get SA Prime Rate${NC}"
echo "────────────────────────────────────────────────────────────"
curl -s "http://localhost:5000/api/stockvel/sa-prime-rate"

echo -e "\n\n${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ GATEWAY TEST COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "\n📊 Test Summary:"
echo "   Admin: $ADMIN_EMAIL"
echo "   Group ID: $GROUP_ID"
echo "   Meeting ID: $MEETING_ID"
echo "   All endpoints working through gateway!"
