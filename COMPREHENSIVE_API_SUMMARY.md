# Stockvel Microservices - Comprehensive API Summary

## 1. MICROSERVICES OVERVIEW

### Architecture
- **API Gateway** (Port 5000) - Routes all `/api/*` requests to appropriate services
- **Auth Service** (Port 4001) - User authentication and role management
- **Stockvel Service** (Port 4003) - Group management and membership
- **Payment Service** (Port 4002) - Contributions and payouts
- **Meeting Service** (Port 4004) - Meeting scheduling and management
- **Analytics Service** (Port 4005) - Reports and analytics
- **Frontend** (Port 3000) - React application

---

## 2. COMPLETE API ENDPOINT REFERENCE

### AUTH SERVICE (Port 4001, accessed via `/api/auth`)

#### Authentication Endpoints

**POST /register**
- Creates a new user with specified role
- Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "displayName": "User Name",
  "role": "Member" // or "Treasurer", "Admin"
}
```
- Response (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "uid": "user_id_123",
    "email": "user@example.com",
    "displayName": "User Name",
    "role": "Member"
  }
}
```

**POST /login**
- Authenticates user and returns Firebase token
- Request:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```
- Response (200):
```json
{
  "message": "Login successful",
  "idToken": "firebase_id_token_string",
  "refreshToken": "refresh_token",
  "expiresIn": "3600",
  "localId": "user_uid",
  "email": "user@example.com",
  "role": "Member"
}
```
- **ISSUE**: Frontend expects `token` field but service returns `idToken`

**POST /verify-token** (requires auth)
- Verifies JWT token and returns user info
- Headers: `Authorization: Bearer {idToken}`
- Response (200):
```json
{
  "message": "Token verified",
  "user": {
    "uid": "user_id_123",
    "email": "user@example.com",
    "role": "Member",
    "displayName": "User Name",
    "groupIds": ["group1", "group2"],
    "isActive": true
  }
}
```

#### User Management Endpoints

**GET /user/:uid** (requires auth)
- Get user profile
- Response (200):
```json
{
  "user": {
    "uid": "user_123",
    "email": "user@example.com",
    "displayName": "User Name",
    "role": "Member",
    "groupIds": ["group1"],
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

**PUT /user/:uid** (requires auth)
- Update user profile (non-role fields)
- Request:
```json
{
  "displayName": "New Name",
  "phoneNumber": "+27123456789"
}
```
- Response (200):
```json
{
  "message": "User profile updated successfully"
}
```

**POST /change-role** (requires auth, Admin only)
- Change a user's role
- Request:
```json
{
  "userId": "user_to_change_uid",
  "newRole": "Treasurer" // Member, Treasurer, or Admin
}
```
- Response (200):
```json
{
  "message": "User role changed to Treasurer"
}
```

**POST /add-to-group** (requires auth, Admin only)
- Add user to a group
- Request:
```json
{
  "userId": "user_uid",
  "groupId": "group_id"
}
```
- Response (200):
```json
{
  "message": "User added to group successfully"
}
```

---

### STOCKVEL SERVICE (Port 4003, accessed via `/api/stockvel`)

#### Group Management Endpoints

**POST /groups** (requires auth, Admin/Treasurer only)
- Create a new stokvel group
- Request:
```json
{
  "groupName": "Weekly Savings Club",
  "description": "Saving together for the future",
  "contributionAmount": 500,
  "currency": "ZAR",
  "meetingFrequency": "monthly", // weekly, monthly, quarterly
  "maxMembers": 25, // null for unlimited
  "payoutOrder": "rotating",
  "startDate": "2024-01-01",
  "targetFund": 15000
}
```
- Response (201):
```json
{
  "message": "Group created successfully",
  "groupId": "group_123"
}
```

**GET /groups** (no auth required)
- Get all active groups with pagination
- Query params: `status=active` (default), `limit=50`, `offset=0`
- Response (200):
```json
{
  "groups": [
    {
      "id": "group_123",
      "groupName": "Weekly Savings Club",
      "description": "Saving together",
      "contributionAmount": 500,
      "currency": "ZAR",
      "meetingFrequency": "monthly",
      "maxMembers": 25,
      "memberCount": 12,
      "status": "active",
      "createdBy": "user_123",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

**GET /groups/:groupId** (no auth required)
- Get specific group details
- Response (200):
```json
{
  "group": {
    "id": "group_123",
    "groupName": "Weekly Savings Club",
    "description": "Saving together",
    "contributionAmount": 500,
    "currency": "ZAR",
    "meetingFrequency": "monthly",
    "maxMembers": 25,
    "memberCount": 12,
    "status": "active",
    "createdBy": "user_123",
    "payoutOrder": "rotating",
    "startDate": "2024-01-01T00:00:00Z",
    "targetFund": 15000,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**PUT /groups/:groupId** (requires auth, Creator/Admin only)
- Update group settings
- Request:
```json
{
  "contributionAmount": 600,
  "meetingFrequency": "weekly",
  "maxMembers": 30,
  "status": "active"
}
```
- Response (200):
```json
{
  "message": "Group updated successfully"
}
```

**GET /user/:userId/groups** (requires auth)
- Get all groups that a user belongs to
- **ISSUE**: This endpoint may not be properly implemented
- Expected Response (200):
```json
{
  "groups": [
    {
      "id": "group_123",
      "groupName": "Weekly Savings Club",
      "memberCount": 12,
      "status": "active"
    }
  ],
  "total": 1
}
```

**GET /groups/:groupId/members** (no auth required)
- Get all members of a group
- Response (200):
```json
{
  "members": [
    {
      "uid": "user_123",
      "email": "user@example.com",
      "displayName": "User Name",
      "role": "Member",
      "groupIds": ["group_123"]
    }
  ],
  "total": 1
}
```

#### SA Data Integration

**GET /sa-prime-rate** (no auth required)
- Get South African prime lending rate
- Response (200):
```json
{
  "primeLendingRate": 11.75,
  "repoRate": 10.75,
  "source": "SARB Mock Data (School Project)",
  "lastUpdated": "2024-01-15T10:30:00Z"
}
```
- **NOTE**: Currently returns mock data. Should integrate with actual SARB API

---

### PAYMENT SERVICE (Port 4002, accessed via `/api/payment`)

#### Contribution Endpoints

**POST /contribute** (requires auth)
- Process a contribution/payment from member
- Request:
```json
{
  "groupId": "group_123",
  "amount": 500,
  "paymentMethod": "card", // card, eft, cash
  "paymentDetails": {
    "cardLast4": "4242"
  }
}
```
- Response (201):
```json
{
  "message": "Contribution processed successfully",
  "contributionId": "contrib_123",
  "amount": 500,
  "transactionId": "mock_txn_1234567890",
  "status": "completed"
}
```

**GET /contributions/:groupId** (requires auth, Treasurer/Admin only)
- Get all contributions for a group
- Response (200):
```json
{
  "contributions": [
    {
      "id": "contrib_123",
      "userId": "user_123",
      "userEmail": "user@example.com",
      "groupId": "group_123",
      "amount": 500,
      "currency": "ZAR",
      "transactionId": "mock_txn_123",
      "paymentMethod": "card",
      "status": "completed",
      "timestamp": "2024-01-15T10:30:00Z",
      "month": "2024-01"
    }
  ],
  "total": 1
}
```

**GET /user-contributions/:userId/:groupId** (requires auth)
- Get a user's contribution summary for a specific group
- Response (200):
```json
{
  "userId": "user_123",
  "groupId": "group_123",
  "totalContributed": 1500,
  "contributionCount": 3,
  "lastContributionDate": "2024-01-15T10:30:00Z"
}
```

**GET /contributions/:groupId/by-month** (requires auth, Treasurer/Admin only)
- Get contributions grouped by month
- Response (200):
```json
{
  "byMonth": {
    "2024-01": {
      "total": 5000,
      "count": 10,
      "transactions": [
        {
          "amount": 500,
          "userEmail": "user1@example.com",
          "timestamp": "2024-01-15T10:30:00Z"
        }
      ]
    }
  }
}
```

#### Payout Endpoints

**POST /payout/initiate** (requires auth, Treasurer/Admin only)
- Initiate a payout for a member
- Request:
```json
{
  "groupId": "group_123",
  "memberId": "user_456",
  "amount": 5000,
  "bankDetails": {
    "bankName": "FirstBank",
    "accountNumber": "1234567890",
    "accountName": "Member Name",
    "branchCode": "123456"
  }
}
```
- Response (201):
```json
{
  "message": "Payout initiated successfully",
  "payoutId": "payout_123",
  "status": "pending",
  "amount": 5000
}
```

**POST /payout/:payoutId/process** (requires auth, Admin only)
- Process/complete a pending payout
- Response (200):
```json
{
  "message": "Payout processed successfully",
  "payoutId": "payout_123",
  "status": "completed",
  "transferId": "mock_transfer_123",
  "amount": 5000
}
```

**GET /payouts/:groupId** (requires auth, Treasurer/Admin only)
- Get all payouts for a group
- Response (200):
```json
{
  "payouts": [
    {
      "id": "payout_123",
      "groupId": "group_123",
      "memberId": "user_456",
      "memberName": "Member Name",
      "amount": 5000,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "total": 1
}
```

---

### MEETING SERVICE (Port 4004, accessed via `/api/meetings`)

#### Meeting Management Endpoints

**POST /meetings** (requires auth, Treasurer/Admin/Creator only)
- Schedule a meeting for a group
- Request:
```json
{
  "groupId": "group_123",
  "title": "Monthly Stokvel Meeting",
  "description": "Discuss contributions and payouts",
  "scheduledDate": "2024-02-15T18:00:00Z",
  "location": "Community Center, Room 101",
  "meetingType": "general" // general, payout, special
}
```
- Response (201):
```json
{
  "message": "Meeting scheduled successfully",
  "meetingId": "meeting_123"
}
```

**GET /meetings/group/:groupId** (no auth required)
- Get all meetings for a group (ordered by date descending)
- Response (200):
```json
{
  "meetings": [
    {
      "id": "meeting_123",
      "groupId": "group_123",
      "title": "Monthly Stokvel Meeting",
      "description": "Discuss contributions",
      "scheduledDate": "2024-02-15T18:00:00Z",
      "location": "Community Center",
      "meetingType": "general",
      "status": "scheduled", // scheduled, ongoing, completed, cancelled
      "createdBy": "user_123",
      "attendees": ["user_123", "user_456"],
      "agenda": [],
      "minutes": "",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

**GET /meetings/group/:groupId/upcoming** (no auth required)
- Get upcoming/future meetings for a group
- Response (200): Same as above (filtered for scheduledDate >= now)

**GET /meetings/:meetingId** (no auth required)
- Get specific meeting details
- Response (200): Single meeting object

**PUT /meetings/:meetingId/agenda** (requires auth, Creator/Admin only)
- Set or update meeting agenda
- Request:
```json
{
  "agenda": [
    "Review previous minutes",
    "Discuss contributions",
    "Plan next payout",
    "Q&A"
  ]
}
```
- Response (200):
```json
{
  "message": "Agenda updated successfully"
}
```

**POST /meetings/:meetingId/mark-attended** (requires auth)
- Mark current user as attending
- Response (200):
```json
{
  "message": "Attendance marked",
  "attendeeCount": 5
}
```

**PUT /meetings/:meetingId/minutes** (requires auth, Treasurer/Admin/Creator only)
- Record meeting minutes after completion
- Request:
```json
{
  "minutes": "Discussed Q1 contributions. Approved 3 payouts. Next meeting scheduled for March 15."
}
```
- Response (200):
```json
{
  "message": "Meeting minutes recorded successfully"
}
```

**PUT /meetings/:meetingId/status** (requires auth, Creator/Admin only)
- Update meeting status
- Request:
```json
{
  "status": "completed" // scheduled, ongoing, completed, cancelled
}
```
- Response (200):
```json
{
  "message": "Meeting status updated"
}
```

---

### ANALYTICS SERVICE (Port 4005, accessed via `/api/analytics`)

#### Dashboard Reports

**GET /dashboard/:groupId/contribution-compliance** (requires auth, Treasurer/Admin/Creator only)
- Report 1: Member-by-member contribution tracking
- Response (200):
```json
{
  "report": "Contribution Compliance per Member",
  "groupId": "group_123",
  "groupName": "Weekly Savings Club",
  "generatedAt": "2024-01-15T10:30:00Z",
  "data": [
    {
      "userId": "user_123",
      "userName": "Member One",
      "email": "member1@example.com",
      "totalContributed": 2000,
      "contributionCount": 4,
      "lastContributionDate": "2024-01-15T10:30:00Z",
      "expectedContributions": 4,
      "complianceRate": "100.00"
    }
  ],
  "summary": {
    "totalMembers": 5,
    "averageComplianceRate": "95.50",
    "totalContributions": 10000,
    "totalExpectedContributions": 10500
  }
}
```

**GET /dashboard/:groupId/payout-history** (requires auth, Treasurer/Admin/Creator only)
- Report 2: Payout history and future projections
- Response (200):
```json
{
  "report": "Payout History and Projections",
  "groupId": "group_123",
  "groupName": "Weekly Savings Club",
  "generatedAt": "2024-01-15T10:30:00Z",
  "payoutHistory": [
    {
      "id": "payout_123",
      "memberId": "user_123",
      "memberName": "Member One",
      "amount": 5000,
      "status": "completed",
      "createdAt": "2024-01-15T10:30:00Z",
      "completedAt": "2024-01-15T11:00:00Z"
    }
  ],
  "projections": [
    {
      "month": "Next Month",
      "projectedAmount": 6000,
      "expectedRecipients": 2
    },
    {
      "month": "In 3 Months",
      "projectedAmount": 18000,
      "expectedRecipients": 5
    }
  ],
  "summary": {
    "totalPayedOut": "10000.00",
    "completedPayouts": 2,
    "pendingPayouts": 0,
    "failedPayouts": 0,
    "averagePayoutAmount": "5000.00"
  }
}
```

**GET /dashboard/:groupId/custom** (requires auth, Treasurer/Admin/Creator only)
- Report 3: Custom analytics (savings growth, member retention, etc.)
- Response (200):
```json
{
  "report": "Custom Analytics View",
  "groupId": "group_123",
  "groupName": "Weekly Savings Club",
  "generatedAt": "2024-01-15T10:30:00Z",
  "metrics": {
    "totalSavings": "25000.00",
    "memberCount": 5,
    "activeContributors": 5,
    "averageSavingsPerMember": "5000.00",
    "totalContributions": 50,
    "groupStartDate": "2024-01-01T00:00:00Z",
    "currentStatus": "active",
    "targetFund": 50000,
    "progressToTarget": "50.00%"
  },
  "projections": {
    "projectedGrowthRate": "11.75%",
    "projectedSavingsIn3Months": "25295.75",
    "projectedSavingsIn6Months": "26593.00",
    "projectedSavingsIn1Year": "27943.75"
  }
}
```

#### Export Endpoints (for file downloads)

**GET /export/compliance/:groupId/csv**
- Export compliance report as CSV file
- Returns: Binary CSV file

**GET /export/compliance/:groupId/pdf**
- Export compliance report as PDF file
- Returns: Binary PDF file

**GET /export/payout/:groupId/csv**
- Export payout report as CSV file
- Returns: Binary CSV file

**GET /export/payout/:groupId/pdf**
- Export payout report as PDF file
- Returns: Binary PDF file

---

## 3. REQUEST/RESPONSE FORMAT STANDARDS

### Authentication Header
All protected endpoints require:
```
Authorization: Bearer {idToken}
```

### Error Responses
All services follow standard error format:
```json
{
  "error": "Description of what went wrong",
  "details": "Optional additional information"
}
```

Common HTTP Status Codes:
- **200**: Success
- **201**: Created
- **400**: Bad request (missing/invalid fields)
- **401**: Unauthorized (missing/invalid token)
- **403**: Forbidden (insufficient permissions)
- **404**: Not found
- **500**: Internal server error

### Timestamp Format
All timestamps are ISO 8601 format:
```
2024-01-15T10:30:00Z  // UTC
```

### Currency
All monetary values in **ZAR (South African Rand)**

---

## 4. FRONTEND INTEGRATION STATUS

### Current Pages

#### Login Page ([Login.jsx](frontend/src/pages/Login.jsx))
- ✅ Calls `/api/auth/login`
- ❌ **ISSUE**: Stores token from wrong field (expects `token` but gets `idToken`)
- ❌ Stores `uid` but auth service returns `localId`

#### Register Page ([Register.jsx](frontend/src/pages/Register.jsx))
- ⚠️ Not fully reviewed - likely has similar token issues

#### Dashboard Page ([Dashboard.jsx](frontend/src/pages/Dashboard.jsx))
- ✅ Calls `/api/stockvel/groups?status=active`
- ❌ **ISSUE**: Calls `/stockvel/user/{userId}/groups` - endpoint path may be incorrect
- ✅ Basic group list display
- ⚠️ Partial CreateGroupForm implementation
- ❌ Missing member management (invites, join requests)
- ❌ Missing payment/contribution flow

#### GroupDetail Page ([GroupDetail.jsx](frontend/src/pages/GroupDetail.jsx))
- ✅ Calls `/api/stockvel/groups/{groupId}`
- ✅ Calls `/api/stockvel/groups/{groupId}/members`
- ❌ **ISSUE**: Calls `/api/meetings/meetings/{groupId}` but service uses `/meetings/group/{groupId}`
- ❌ **ISSUE**: Calls `/api/payment/contributions/{groupId}` - endpoint may not exist
- ⚠️ Incomplete tab implementations (Overview, Members, Contributions, Meetings, Analytics)
- ❌ No way to create contributions/payments
- ❌ No way to create/update meetings
- ❌ No way to view detailed analytics reports

### Missing Features

1. **Member Management**
   - ❌ Invite members to group
   - ❌ Join request workflow
   - ❌ Approve/reject join requests
   - ❌ Remove members

2. **Payment/Contribution Flow**
   - ❌ Make contribution UI
   - ❌ Payment method selection
   - ❌ Contribution status tracking
   - ❌ Failed payment handling

3. **Meeting Management**
   - ❌ Create meeting form
   - ❌ Update agenda
   - ❌ Mark attendance
   - ❌ Record minutes

4. **Analytics Dashboard**
   - ❌ Display compliance report
   - ❌ Display payout projections
   - ❌ Display custom metrics
   - ❌ Export to CSV/PDF

5. **User Profile**
   - ❌ View profile
   - ❌ Edit profile
   - ❌ View contribution history

---

## 5. CRITICAL ISSUES TO FIX

### Issue 1: Authentication Token Field Mismatch
**Problem**: Login endpoint returns `idToken` but frontend expects `token`
**Location**: 
- Backend: [auth-service/src/index.js](services/auth-service/src/index.js) line ~145
- Frontend: [frontend/src/pages/Login.jsx](frontend/src/pages/Login.jsx) line ~24

**Solution**: Either:
- Option A: Change backend to return `token: data.idToken`
- Option B: Change frontend to store `idToken` instead

### Issue 2: Incorrect Meeting Endpoint Path
**Problem**: Frontend calls `/api/meetings/meetings/{groupId}` but service uses `/meetings/group/{groupId}`
**Location**:
- Frontend: [GroupDetail.jsx](frontend/src/pages/GroupDetail.jsx) line ~40
- Backend: [meeting-service/src/index.js](services/meeting-service/src/index.js) line ~75

**Solution**: Update frontend to use correct path

### Issue 3: Missing/Incorrect User Groups Endpoint
**Problem**: Frontend calls `/stockvel/user/{userId}/groups` which may not be properly implemented
**Solution**: Verify endpoint exists and returns correct format

### Issue 4: Role-Based Authorization
**Problem**: Frontend doesn't check user role before showing certain UI
**Solution**: Add role checks before rendering treasurer/admin features

---

## 6. DATABASE SCHEMA

### Firestore Collections

**users**
```json
{
  "uid": "string",
  "email": "string",
  "displayName": "string",
  "role": "Member|Treasurer|Admin",
  "groupIds": ["array of group IDs"],
  "isActive": "boolean",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**groups**
```json
{
  "groupName": "string",
  "description": "string",
  "contributionAmount": "number",
  "currency": "string (ZAR)",
  "meetingFrequency": "string",
  "maxMembers": "number or null",
  "memberCount": "number",
  "members": ["array of user IDs"],
  "createdBy": "string (user ID)",
  "status": "active|paused|completed",
  "payoutOrder": "string",
  "startDate": "timestamp",
  "targetFund": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**contributions**
```json
{
  "userId": "string",
  "userEmail": "string",
  "groupId": "string",
  "amount": "number",
  "currency": "string",
  "transactionId": "string",
  "paymentMethod": "card|eft|cash",
  "status": "completed|failed",
  "month": "string (YYYY-MM)",
  "timestamp": "timestamp"
}
```

**meetings**
```json
{
  "groupId": "string",
  "title": "string",
  "description": "string",
  "scheduledDate": "timestamp",
  "location": "string",
  "meetingType": "string",
  "status": "scheduled|ongoing|completed|cancelled",
  "agenda": ["array of strings"],
  "minutes": "string",
  "attendees": ["array of user IDs"],
  "createdBy": "string",
  "createdAt": "timestamp"
}
```

**payouts**
```json
{
  "groupId": "string",
  "memberId": "string",
  "memberEmail": "string",
  "amount": "number",
  "status": "pending|processing|completed|failed",
  "bankDetails": {
    "bankName": "string",
    "accountNumber": "string",
    "accountName": "string",
    "branchCode": "string"
  },
  "initiatedBy": "string",
  "createdAt": "timestamp",
  "completedAt": "timestamp",
  "updatedAt": "timestamp"
}
```

**user-contributions**
```json
{
  "userId": "string",
  "groupId": "string",
  "totalContributed": "number",
  "contributionCount": "number",
  "lastContributionDate": "timestamp",
  "createdAt": "timestamp"
}
```

---

## 7. DEPLOYMENT NOTES

### Docker Compose Setup
- All services containerized
- Frontend (3000), Gateway (5000), Auth (4001), Payment (4002), Stockvel (4003), Meetings (4004), Analytics (4005)
- Shared volume for Firebase config and middleware
- Environment variables passed via docker-compose.yml

### Firebase Configuration
- Requires Firebase project and credentials
- `firebaseServiceAccountKey.json` in `shared/firebase/`
- Environment variables: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, etc.

---

## 8. NEXT STEPS FOR FRONTEND REWRITE

1. **Fix authentication flow** - Align token fields
2. **Correct API endpoint paths** - Sync with actual service implementations
3. **Implement missing pages/components**:
   - Member management UI
   - Payment/contribution UI
   - Analytics dashboard UI
   - User profile page
4. **Add error handling** - Proper error messages and retry logic
5. **Add loading states** - Show spinners during API calls
6. **Role-based UI rendering** - Hide features based on user role
7. **Form validation** - Client-side validation before submission
8. **State management** - Consider Context API or Redux for better state handling
