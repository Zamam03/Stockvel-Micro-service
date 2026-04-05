# Stokvel Management Platform - Complete Implementation Guide

## Overview

This is a comprehensive microservices-based Stokvel (South African rotating savings group) management platform built with Node.js, Express, Firebase, and React. The platform addresses all the requirements for member grouping, onboarding, contributions tracking, meetings management, payments, analytics, and SA data integration.

## Architecture

### Microservices

1. **Auth Service** (Port 4001)
   - User registration and authentication
   - Role-based access control (Member, Treasurer, Admin)
   - Custom Firebase claims management
   - User profile management

2. **Stockvel Service** (Port 4003)
   - Group creation and configuration
   - Member management and multi-group support
   - Join requests and invitations workflow
   - SA prime lending rate integration

3. **Payment Service** (Port 4002)
   - Contribution processing (Stripe/Yoco integration)
   - Contribution tracking and history
   - Payout management and disbursements
   - Payment status tracking

4. **Meeting Service** (Port 4004)
   - Meeting scheduling and management
   - Agenda management
   - Meeting minutes recording
   - Member notifications
   - Attendance tracking

5. **Analytics Service** (Port 4005)
   - Dashboard reports (3+ types)
   - Contribution compliance tracking
   - Payout history and projections
   - Custom analytics view
   - CSV and PDF export capabilities

6. **API Gateway** (Port 5000)
   - Routes requests to appropriate microservices
   - Centralized API endpoint

### Database

- **Firebase Authentication**: User authentication and role management
- **Firestore**: Data persistence
  - `users`: User profiles and group memberships
  - `groups`: Stokvel group configurations
  - `contributions`: Contribution records
  - `payouts`: Payout history
  - `meetings`: Meeting schedules and details
  - `join-requests`: Group join request tracking
  - `invitations`: Group invitations
  - `notifications`: User notifications
  - `user-contributions`: User-level contribution aggregation

## Key Features Implemented

### 1. Member Grouping Criteria
- **Multi-group membership**: Members can belong to multiple stokvel groups
- **No restrictions**: Users can join as many groups as they want for different purposes
- **Flexible account setup**: Account creation doesn't restrict group membership

### 2. Member Onboarding Flow
- **Admin/Treasurer invitations**: Admins and Treasurers can invite members
- **Member join requests**: Members can request to join groups
- **Approval workflow**: Admins/Treasurers can approve or decline requests
- **Flexible workflow**: Matches real-life stokvel behavior

### 3. Group Size Management
- **Configurable max members**: Each group can set a maximum member limit
- **Unlimited option**: No default maximum, can be left unlimited
- **Dynamic capacity checks**: System validates capacity before accepting new members

### 4. User Verification (3 Roles)
- **Member**: Regular group participant
- **Treasurer**: Can manage payments and confirm contributions
- **Admin**: Can create groups, manage members, and access all features

### 5. Group Management
- **Create and configure**: Admins/Treasurers can create groups
- **Define parameters**: Contribution amounts, payout order, meeting frequency
- **Member management**: Invite members, manage existing members
- **Group status**: Track active, paused, or completed status

### 6. Contribution Tracking
- **Member view**: Members can view their contributions
- **Treasurer management**: Treasurers confirm payments and flag missed contributions
- **Payment processing**: Integration with Stripe/Yoco
- **Contribution history**: Track all contributions by member and month

### 7. Meeting Management
- **Meeting scheduling**: Treasurers/Admins can schedule meetings
- **Agenda management**: Post and manage meeting agendas
- **Minutes recording**: Record meeting minutes after completion
- **Member notifications**: Automatic notifications for upcoming meetings
- **Attendance tracking**: Track who attended each meeting

### 8. Payments Integration
- **Online contributions**: Members can make payments via Stripe/Yoco
- **Payout disbursements**: Treasurers can initiate payouts
- **Payment tracking**: Track contribution and payout status
- **Bank details management**: Secure bank information for disbursements

### 9. SA Data Integration
**Current Implementation: Mock data with proper structure for real integration**

The service includes:
- Endpoint for SA prime lending rate: `/api/stockvel/sa-prime-rate`
- Returns both prime rate and repo rate
- Structured for easy integration with real SARB data

**Recommended Data Sources:**
1. **SARB (South African Reserve Bank)**
   - Official URL: https://www.sarb.co.za/
   - Direct API: Not publicly available, but rates are published weekly
   - Reliability: (Official source)

2. **Alternative: Quandl API**
   - Dataset: "South African Central Bank Rates"
   - Requires API key (free tier available)
   - Reliability: 

3. **Banking APIs with Rate Data**
   - Investec API
   - FNB API
   - Standard Bank Open Banking API

**Implementation Notes:**
- Current mock returns 11.75% prime rate and 10.75% repo rate
- Update the endpoint to fetch real data from SARB
- Cache rates to avoid API rate limits (update daily)
- Use rates for savings growth projections

### 10. Analytics & Reporting
**Three Dashboard Reports:**

1. **Contribution Compliance per Member**
   - Shows member-by-member contribution history
   - Tracks total contributions and contribution count
   - Calculates compliance rates
   - Exportable as CSV and PDF

2. **Payout History and Projections**
   - Lists all completed and pending payouts
   - Projects upcoming payouts based on group configuration
   - Shows total paid out and average payout amount
   - Tracks payment status

3. **Custom Analytics View**
   - Total savings in the group
   - Member count and average savings per member
   - Progress toward group target fund
   - Savings growth projections using prime rate:
     - 3-month projection
     - 6-month projection
     - 1-year projection

**Export Formats:**
- CSV: Easily imported to Excel/Sheets
- PDF: Professional reports for records

## Installation & Setup

### Prerequisites
- Node.js 20+
- Docker (optional, for containerization)
- Firebase account and credentials
- Stripe/Yoco API keys (for payment processing)

### Environment Setup

1. **Firebase Setup**
```bash
# Follow FIREBASE_SETUP.md for:
# - Creating Firebase project
# - Enabling Authentication
# - Setting up Firestore Database
# - Obtaining service account key
# - Getting web app config
```

2. **Create .env files**

**Frontend (.env in frontend/)**
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Payment Service (.env in services/payment-service/)**
```env
STRIPE_SECRET_KEY=sk_test_your_key
PORT=4002
```

3. **Install Dependencies**
```bash
# Install all service dependencies
cd services/auth-service && npm install
cd ../payment-service && npm install
cd ../stockvel-service && npm install
cd ../meeting-service && npm install
cd ../analytics-service && npm install
cd ../../gateway && npm install
cd ../frontend && npm install
```

### Running the Application

**Option 1: Docker Compose**
```bash
docker-compose up -d
```

**Option 2: Manual Start**
```bash
# Terminal 1: Auth Service
cd services/auth-service && PORT=4001 npm start

# Terminal 2: Payment Service
cd services/payment-service && PORT=4002 npm start

# Terminal 3: Stockvel Service
cd services/stockvel-service && PORT=4003 npm start

# Terminal 4: Meeting Service
cd services/meeting-service && PORT=4004 npm start

# Terminal 5: Analytics Service
cd services/analytics-service && PORT=4005 npm start

# Terminal 6: Gateway
cd gateway && PORT=5000 npm start

# Terminal 7: Frontend
cd frontend && npm run dev
```

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (use Firebase SDK on client)
- `POST /api/auth/verify-token` - Verify token validity
- `GET /api/auth/user/:uid` - Get user profile
- `PUT /api/auth/user/:uid` - Update user profile
- `POST /api/auth/change-role` - Admin only: change user role
- `GET /api/auth/users` - Admin only: list all users

### Groups
- `POST /api/stockvel/groups` - Create group
- `GET /api/stockvel/groups` - Get all groups
- `GET /api/stockvel/groups/:groupId` - Get group details
- `PUT /api/stockvel/groups/:groupId` - Update group
- `GET /api/stockvel/user/:userId/groups` - Get user's groups
- `GET /api/stockvel/groups/:groupId/members` - Get group members
- `POST /api/stockvel/groups/:groupId/invite` - Invite member
- `POST /api/stockvel/groups/:groupId/join-request` - Request to join
- `GET /api/stockvel/groups/:groupId/join-requests` - Get join requests
- `POST /api/stockvel/join-requests/:requestId/approve` - Approve request
- `POST /api/stockvel/join-requests/:requestId/reject` - Reject request
- `POST /api/stockvel/groups/:groupId/remove-member` - Remove member

### Payments
- `POST /api/payment/contribute` - Make contribution
- `GET /api/payment/contributions/:groupId` - Get group contributions
- `GET /api/payment/user-contributions/:userId/:groupId` - Get user contributions
- `GET /api/payment/payouts/:groupId` - Get group payouts
- `POST /api/payment/payout/initiate` - Initiate payout
- `POST /api/payment/payout/:payoutId/process` - Process payout

### Meetings
- `POST /api/meetings/meetings` - Schedule meeting
- `GET /api/meetings/meetings/:groupId` - Get group meetings
- `GET /api/meetings/meetings/:groupId/upcoming` - Get upcoming meetings
- `GET /api/meetings/meetings/:meetingId` - Get meeting details
- `PUT /api/meetings/meetings/:meetingId/agenda` - Update agenda
- `POST /api/meetings/meetings/:meetingId/mark-attended` - Mark attendance
- `PUT /api/meetings/meetings/:meetingId/minutes` - Record minutes
- `GET /api/meetings/notifications/:userId` - Get user notifications

### Analytics
- `GET /api/analytics/dashboard/:groupId/contribution-compliance` - Compliance report
- `GET /api/analytics/dashboard/:groupId/payout-history` - Payout report
- `GET /api/analytics/dashboard/:groupId/custom` - Custom analytics
- `GET /api/analytics/export/compliance/:groupId/csv` - Export compliance CSV
- `GET /api/analytics/export/payout/:groupId/csv` - Export payout CSV
- `GET /api/analytics/export/compliance/:groupId/pdf` - Export compliance PDF

### SA Data
- `GET /api/stockvel/sa-prime-rate` - Get SA prime rate and repo rate

## Frontend Routes

- `/` - Home page
- `/login` - Login page
- `/register` - Registration page
- `/dashboard` - Main dashboard (my groups, all groups, create group)
- `/group/:groupId` - Group detail (overview, members, contributions, meetings, analytics)

## Testing the Platform

### 1. Create Users
```bash
# Register as Admin
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "displayName": "Admin User",
  "role": "Admin"
}

# Register as Member
POST /api/auth/register
{
  "email": "member@example.com",
  "password": "password123",
  "displayName": "Member User",
  "role": "Member"
}
```

### 2. Create a Group
```bash
POST /api/stockvel/groups
Headers: Authorization: Bearer {token}
{
  "groupName": "Monthly Grocery Fund",
  "description": "Pooling money for groceries",
  "contributionAmount": 500,
  "currency": "ZAR",
  "meetingFrequency": "monthly",
  "maxMembers": 20,
  "startDate": "2024-01-01"
}
```

### 3. Test Join Request
```bash
POST /api/stockvel/groups/{groupId}/join-request
Headers: Authorization: Bearer {memberToken}
```

### 4. Approve Join Request
```bash
POST /api/stockvel/join-requests/{requestId}/approve
Headers: Authorization: Bearer {adminToken}
```

### 5. Make a Contribution
```bash
POST /api/payment/contribute
Headers: Authorization: Bearer {memberToken}
{
  "groupId": "{groupId}",
  "amount": 500,
  "paymentMethodId": "pm_stripe_token"
}
```

## Security Considerations

1. **Authentication**: Firebase handles user auth with secure tokens
2. **Authorization**: Role-based access control on all endpoints
3. **Token verification**: Every request validates auth token
4. **Data isolation**: Users can only access their own data unless authorized
5. **Payment**: Stripe PCI compliance for card processing
6. **Environment variables**: Sensitive keys stored in .env files

## Scalability Notes

- **Database**: Firestore auto-scales for concurrent users
- **Microservices**: Each service can be scaled independently
- **Caching**: Implement Redis for frequently accessed data
- **Load balancing**: Use Kubernetes or cloud load balancers
- **Analytics**: Consider BigQuery for large-scale analytics

## Troubleshooting

### Common Issues

1. **Firebase connection failing**
   - Check firebaseServiceAccountKey.json exists
   - Verify service account has required permissions

2. **Payment processing fails**
   - Ensure Stripe key is valid
   - Check payment method ID format

3. **CORS errors**
   - Verify gateway is running
   - Check proxy configuration

4. **Token verification fails**
   - Ensure token not expired
   - Verify token format includes "Bearer "

## Future Enhancements

1. **Real SARB Integration**: Replace mock rates with live SARB data
2. **SMS Notifications**: Integrate Twilio for SMS alerts
3. **Mobile App**: React Native version of frontend
4. **AI Features**: Predict savings patterns
5. **Blockchain**: Optional immutable transaction ledger
6. **Advanced Reports**: Machine learning-based insights

## Support & Documentation

- Firebase: https://firebase.google.com/docs
- Stripe: https://stripe.com/docs
- Express.js: https://expressjs.com/
- React: https://react.dev/

## License

MIT License - See LICENSE file

---

**Last Updated**: April 2026
**Version**: 1.0.0
