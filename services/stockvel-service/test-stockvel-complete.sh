#!/bin/bash

echo "========================================="
echo "STOKVEL SERVICE - COMPLETE TEST"
echo "========================================="

# Register admin
echo -e "\n1. Registering Admin..."
curl -s -X POST http://localhost:4001/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockvel.com","password":"Admin123!","displayName":"Stockvel Admin","role":"Admin"}'

# Login as admin
echo -e "\n2. Logging in as Admin..."
ADMIN_LOGIN=$(curl -s -X POST http://localhost:4001/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@stockvel.com","password":"Admin123!"}')
ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"idToken":"[^"]*"' | cut -d'"' -f4)
echo "✅ Admin token obtained"

# Create group
echo -e "\n3. Creating Group..."
CREATE_RES=$(curl -s -X POST http://localhost:4003/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "groupName": "School Project Stokvel",
    "description": "A stokvel for the school project",
    "contributionAmount": 1000,
    "meetingFrequency": "monthly",
    "startDate": "2026-04-15",
    "targetFund": 100000
  }')
echo "$CREATE_RES"
GROUP_ID=$(echo "$CREATE_RES" | grep -o '"groupId":"[^"]*"' | cut -d'"' -f4)
echo "✅ Group created: $GROUP_ID"

# Get group details
echo -e "\n4. Getting Group Details..."
curl -s "http://localhost:4003/groups/$GROUP_ID"

# Get SA Prime Rate
echo -e "\n5. Getting SA Prime Rate..."
curl -s "http://localhost:4003/sa-prime-rate"

# Get all groups
echo -e "\n6. Getting All Groups..."
curl -s "http://localhost:4003/groups"

# Get group members
echo -e "\n7. Getting Group Members..."
curl -s "http://localhost:4003/groups/$GROUP_ID/members"

# Update group
echo -e "\n8. Updating Group..."
curl -s -X PUT "http://localhost:4003/groups/$GROUP_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"description": "Updated description for the school project stokvel"}'

echo -e "\n✅ Stockvel Service tests completed!"
