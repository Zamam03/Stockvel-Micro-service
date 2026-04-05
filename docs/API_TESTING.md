# API Testing Guide - cURL Examples

## Base URLs
- Local: `http://localhost:5000/api`
- Docker: `http://gateway:5000/api`

## Authentication Flow

### 1. Register User (Admin)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin@123",
    "displayName": "Admin User",
    "role": "Admin"
  }'
```

### 2. Register User (Member)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "member@example.com",
    "password": "Member@123",
    "displayName": "Member User",
    "role": "Member"
  }'
```

### 3. Register User (Treasurer)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "treasurer@example.com",
    "password": "Treasurer@123",
    "displayName": "Treasurer User",
    "role": "Treasurer"
  }'
```

**Save the returned `uid` for subsequent requests**

---

## Group Management

### 1. Create Group (Admin only)
```bash
curl -X POST http://localhost:5000/api/stockvel/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "groupName": "Weekly Savings Club",
    "description": "Saving together for the future",
    "contributionAmount": 500,
    "currency": "ZAR",
    "meetingFrequency": "weekly",
    "maxMembers": 25,
    "payoutOrder": "rotating",
    "startDate": "2024-01-01",
    "targetFund": 15000
  }'
```

**Save the returned `groupId` for subsequent requests**

### 2. Get All Groups
```bash
curl -X GET "http://localhost:5000/api/stockvel/groups?status=active&limit=10" \
  -H "Authorization: Bearer {TOKEN}"
```

### 3. Get Group Details
```bash
curl -X GET http://localhost:5000/api/stockvel/groups/{groupId} \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Update Group Settings (Admin/Treasurer)
```bash
curl -X PUT http://localhost:5000/api/stockvel/groups/{groupId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "contributionAmount": 600,
    "meetingFrequency": "monthly",
    "maxMembers": 30
  }'
```

### 5. Get User's Groups
```bash
curl -X GET http://localhost:5000/api/stockvel/user/{userId}/groups \
  -H "Authorization: Bearer {TOKEN}"
```

### 6. Get Group Members
```bash
curl -X GET http://localhost:5000/api/stockvel/groups/{groupId}/members \
  -H "Authorization: Bearer {TOKEN}"
```

---

## Member Management

### 1. Invite Member to Group (Admin/Treasurer)
```bash
curl -X POST http://localhost:5000/api/stockvel/groups/{groupId}/invite \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "email": "member@example.com"
  }'
```

### 2. Request to Join Group (Member)
```bash
curl -X POST http://localhost:5000/api/stockvel/groups/{groupId}/join-request \
  -H "Authorization: Bearer {MEMBER_TOKEN}"
```

### 3. View Join Requests (Admin/Treasurer)
```bash
curl -X GET http://localhost:5000/api/stockvel/groups/{groupId}/join-requests \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 4. Approve Join Request (Admin/Treasurer)
```bash
curl -X POST http://localhost:5000/api/stockvel/join-requests/{requestId}/approve \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 5. Reject Join Request (Admin/Treasurer)
```bash
curl -X POST http://localhost:5000/api/stockvel/join-requests/{requestId}/reject \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 6. Remove Member from Group (Admin/Treasurer)
```bash
curl -X POST http://localhost:5000/api/stockvel/groups/{groupId}/remove-member \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "memberId": "{userId}"
  }'
```

---

## Contributions & Payments

### 1. Make Contribution (Member)
```bash
curl -X POST http://localhost:5000/api/payment/contribute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {MEMBER_TOKEN}" \
  -d '{
    "groupId": "{groupId}",
    "amount": 500,
    "paymentMethodId": "pm_test_visa"
  }'
```

### 2. Get Group Contributions (Treasurer/Admin)
```bash
curl -X GET http://localhost:5000/api/payment/contributions/{groupId} \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 3. Get User Contributions
```bash
curl -X GET http://localhost:5000/api/payment/user-contributions/{userId}/{groupId} \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Get Contributions by Month
```bash
curl -X GET http://localhost:5000/api/payment/contributions/{groupId}/by-month \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 5. Initiate Payout (Treasurer)
```bash
curl -X POST http://localhost:5000/api/payment/payout/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {TREASURER_TOKEN}" \
  -d '{
    "groupId": "{groupId}",
    "memberId": "{userId}",
    "amount": 12500,
    "bankDetails": {
      "accountName": "Member Name",
      "accountNumber": "1234567890",
      "bankName": "ABSA",
      "branchCode": "250127"
    }
  }'
```

### 6. Process Payout (Admin)
```bash
curl -X POST http://localhost:5000/api/payment/payout/{payoutId}/process \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 7. Get Group Payouts
```bash
curl -X GET http://localhost:5000/api/payment/payouts/{groupId} \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 8. Get Member Payouts
```bash
curl -X GET http://localhost:5000/api/payment/member-payouts/{userId}/{groupId} \
  -H "Authorization: Bearer {TOKEN}"
```

---

## Meeting Management

### 1. Schedule Meeting (Treasurer/Admin)
```bash
curl -X POST http://localhost:5000/api/meetings/meetings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "groupId": "{groupId}",
    "title": "Monthly Stokvel Meeting",
    "description": "Review contributions and discuss payouts",
    "scheduledDate": "2024-02-15T18:00:00Z",
    "location": "Community Center",
    "meetingType": "general"
  }'
```

### 2. Get Group Meetings
```bash
curl -X GET http://localhost:5000/api/meetings/meetings/{groupId} \
  -H "Authorization: Bearer {TOKEN}"
```

### 3. Get Upcoming Meetings
```bash
curl -X GET http://localhost:5000/api/meetings/meetings/{groupId}/upcoming \
  -H "Authorization: Bearer {TOKEN}"
```

### 4. Update Meeting Agenda (Treasurer/Admin)
```bash
curl -X PUT http://localhost:5000/api/meetings/meetings/{meetingId}/agenda \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "agenda": [
      {"item": "Review contributions", "duration": 15},
      {"item": "Discuss next payout", "duration": 20},
      {"item": "Plan future activities", "duration": 15}
    ]
  }'
```

### 5. Mark Attendance (Member)
```bash
curl -X POST http://localhost:5000/api/meetings/meetings/{meetingId}/mark-attended \
  -H "Authorization: Bearer {MEMBER_TOKEN}"
```

### 6. Record Meeting Minutes (Treasurer/Admin)
```bash
curl -X PUT http://localhost:5000/api/meetings/meetings/{meetingId}/minutes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -d '{
    "minutes": "Discussed Q1 contributions. All members paid. Next payout scheduled for March 15. Agreed to increase contribution to R600 from April."
  }'
```

### 7. Send Notifications (Treasurer/Admin)
```bash
curl -X POST http://localhost:5000/api/meetings/meetings/{meetingId}/notify \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 8. Get User Notifications
```bash
curl -X GET http://localhost:5000/api/meetings/notifications/{userId} \
  -H "Authorization: Bearer {TOKEN}"
```

---

## Analytics & Reporting

### 1. Get Contribution Compliance Report
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard/{groupId}/contribution-compliance \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 2. Get Payout History & Projections
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard/{groupId}/payout-history \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 3. Get Custom Analytics
```bash
curl -X GET http://localhost:5000/api/analytics/dashboard/{groupId}/custom \
  -H "Authorization: Bearer {ADMIN_TOKEN}"
```

### 4. Export Compliance as CSV
```bash
curl -X GET http://localhost:5000/api/analytics/export/compliance/{groupId}/csv \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -o compliance_report.csv
```

### 5. Export Payouts as CSV
```bash
curl -X GET http://localhost:5000/api/analytics/export/payout/{groupId}/csv \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -o payout_report.csv
```

### 6. Export Compliance as PDF
```bash
curl -X GET http://localhost:5000/api/analytics/export/compliance/{groupId}/pdf \
  -H "Authorization: Bearer {ADMIN_TOKEN}" \
  -o compliance_report.pdf
```

---

## SA Data

### Get South African Prime Rate
```bash
curl -X GET http://localhost:5000/api/stockvel/sa-prime-rate \
  -H "Authorization: Bearer {TOKEN}"
```

---

## System Health

### Check Gateway Health
```bash
curl http://localhost:5000/health
```

### Check Auth Service Health
```bash
curl http://localhost:4001/health
```

### Check Payment Service Health
```bash
curl http://localhost:4002/health
```

### Check Stockvel Service Health
```bash
curl http://localhost:4003/health
```

### Check Meeting Service Health
```bash
curl http://localhost:4004/health
```

### Check Analytics Service Health
```bash
curl http://localhost:4005/health
```

---

## Sample Test Workflow

### Complete workflow from scratch:

```bash
# 1. Register admin
ADMIN_TOKEN=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin@123","displayName":"Admin","role":"Admin"}' \
  | jq -r '.user.uid')

# 2. Register member
MEMBER_TOKEN=$(curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"member@test.com","password":"Member@123","displayName":"Member","role":"Member"}' \
  | jq -r '.user.uid')

# 3. Create group
GROUP_ID=$(curl -X POST http://localhost:5000/api/stockvel/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"groupName":"Test Group","contributionAmount":500,"meetingFrequency":"monthly","startDate":"2024-01-01"}' \
  | jq -r '.groupId')

# 4. Member requests to join
REQUEST_ID=$(curl -X POST http://localhost:5000/api/stockvel/groups/$GROUP_ID/join-request \
  -H "Authorization: Bearer $MEMBER_TOKEN" \
  | jq -r '.requestId')

# 5. Admin approves request
curl -X POST http://localhost:5000/api/stockvel/join-requests/$REQUEST_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 6. View analytics
curl -X GET http://localhost:5000/api/analytics/dashboard/$GROUP_ID/custom \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq .
```

---

## Notes

- Replace `{TOKEN}` with actual Firebase ID token from user login
- Replace `{groupId}` with actual group ID from group creation
- Replace `{userId}` with actual user ID (uid)
- Stripe payment methods require valid test cards or Stripe tokens
- All timestamps should be in ISO 8601 format
- Use `| jq .` to pretty-print JSON responses

## Tools

- **cURL**: Command-line HTTP client
- **Postman**: GUI for API testing
- **Insomnia**: Alternative API client

---

**Test responsibly and always use test keys during development!**
