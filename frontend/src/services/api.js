/**
 * API Service Layer - Handles all microservice communications
 * Gateway: http://localhost:5000/api
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Helper function to get token from localStorage
export const getAuthToken = () => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      return JSON.parse(user).token;
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(`[API] Request to ${endpoint} with token: ${token.substring(0, 20)}...`);
  } else {
    console.log(`[API] Request to ${endpoint} WITHOUT token`);
  }

  const config = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, config);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    console.error(`[API] Error on ${endpoint}:`, error);
    throw new Error(error.message || error.error || `API Error: ${response.status}`);
  }

  const data = await response.json();
  return data;
};

// ===== AUTH SERVICE =====
export const authAPI = {
  register: (email, password, displayName, role = 'member') =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: { email, password, displayName, role },
    }),

  login: (email, password) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  verifyToken: () => apiRequest('/auth/verify-token'),

  getUserProfile: (userId) => apiRequest(`/auth/user/${userId}`),

  updateUserProfile: (userId, updates) =>
    apiRequest(`/auth/user/${userId}`, {
      method: 'PUT',
      body: updates,
    }),
};

// ===== STOCKVEL SERVICE (Groups & Members) =====
export const groupAPI = {
  // Group Operations
  createGroup: (groupData) =>
    apiRequest('/stockvel/groups', {
      method: 'POST',
      body: groupData,
    }),

  getGroups: () => apiRequest('/stockvel/groups'),

  getGroupDetails: (groupId) => apiRequest(`/stockvel/groups/${groupId}`),

  updateGroup: (groupId, updates) =>
    apiRequest(`/stockvel/groups/${groupId}`, {
      method: 'PUT',
      body: updates,
    }),

  deleteGroup: (groupId) =>
    apiRequest(`/stockvel/groups/${groupId}`, {
      method: 'DELETE',
    }),

  getUserGroups: (userId) => apiRequest(`/stockvel/user/${userId}/groups`),

  // Member Operations
  getGroupMembers: (groupId) => apiRequest(`/stockvel/groups/${groupId}/members`),

  addMember: (groupId, memberId, role = 'member') =>
    apiRequest(`/stockvel/groups/${groupId}/members`, {
      method: 'POST',
      body: { memberId, role },
    }),

  removeMember: (groupId, memberId) =>
    apiRequest(`/stockvel/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  updateMemberRole: (groupId, memberId, role) =>
    apiRequest(`/stockvel/groups/${groupId}/members/${memberId}`, {
      method: 'PUT',
      body: { role },
    }),

  joinGroup: (groupId) =>
    apiRequest(`/stockvel/groups/${groupId}/join`, {
      method: 'POST',
    }),

  leaveGroup: (groupId) =>
    apiRequest(`/stockvel/groups/${groupId}/leave`, {
      method: 'POST',
    }),

  // Member Requests
  sendJoinRequest: (groupId) =>
    apiRequest(`/stockvel/groups/${groupId}/join-request`, {
      method: 'POST',
    }),

  getJoinRequests: (groupId) => apiRequest(`/stockvel/groups/${groupId}/join-requests`),

  approveJoinRequest: (groupId, userId) =>
    apiRequest(`/stockvel/groups/${groupId}/join-requests/${userId}/approve`, {
      method: 'POST',
    }),

  rejectJoinRequest: (groupId, userId) =>
    apiRequest(`/stockvel/groups/${groupId}/join-requests/${userId}/reject`, {
      method: 'POST',
    }),

  // Member Invitation
  inviteMember: (groupId, memberEmail) =>
    apiRequest(`/stockvel/groups/${groupId}/invite`, {
      method: 'POST',
      body: { memberEmail },
    }),

  removeMember: (groupId, memberId) =>
    apiRequest(`/stockvel/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  getUserInvitations: (userId) =>
    apiRequest(`/stockvel/user/${userId}/invitations`),

  acceptInvitation: (invitationId) =>
    apiRequest(`/stockvel/invitations/${invitationId}/accept`, {
      method: 'POST',
    }),

  declineInvitation: (invitationId) =>
    apiRequest(`/stockvel/invitations/${invitationId}/decline`, {
      method: 'POST',
    }),
};

// ===== PAYMENT SERVICE =====
export const paymentAPI = {
  // Contributions
  contribute: (groupId, amount, paymentMethod = 'bank_transfer') =>
    apiRequest('/payment/contribute', {
      method: 'POST',
      body: { groupId, amount, paymentMethod },
    }),

  getContributions: (groupId) =>
    apiRequest(`/payment/contributions/${groupId}`),

  getUserContributions: (userId) =>
    apiRequest(`/payment/contributions/user/${userId}`),

  getContributionHistory: (groupId, memberId) =>
    apiRequest(`/payment/contributions/${groupId}/member/${memberId}`),

  // Treasurer contribution management
  confirmContribution: (contributionId) =>
    apiRequest(`/payment/contributions/${contributionId}/confirm`, {
      method: 'POST',
    }),

  rejectContribution: (contributionId, reason) =>
    apiRequest(`/payment/contributions/${contributionId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  flagContribution: (contributionId, reason) =>
    apiRequest(`/payment/contributions/${contributionId}/flag`, {
      method: 'POST',
      body: { reason },
    }),

  // Payouts
  requestPayout: (groupId, amount, bankDetails) =>
    apiRequest('/payment/payout/request', {
      method: 'POST',
      body: { groupId, amount, bankDetails },
    }),

  getPayoutHistory: (groupId) => apiRequest(`/payment/payout-history/${groupId}`),

  getUserPayoutHistory: (userId) => apiRequest(`/payment/payout-history/user/${userId}`),

  approvePayout: (payoutId) =>
    apiRequest(`/payment/payout/${payoutId}/approve`, {
      method: 'POST',
    }),

  rejectPayout: (payoutId, reason) =>
    apiRequest(`/payment/payout/${payoutId}/reject`, {
      method: 'POST',
      body: { reason },
    }),

  // Statistics
  getPaymentStats: (groupId) => apiRequest(`/payment/stats/${groupId}`),

  // Payment Confirmation (Treasurer only)
  confirmContribution: (contributionId) =>
    apiRequest(`/payment/contributions/${contributionId}/confirm`, {
      method: 'POST',
    }),

  flagContribution: (contributionId, reason) =>
    apiRequest(`/payment/contributions/${contributionId}/flag`, {
      method: 'POST',
      body: { reason },
    }),

  getMissedContributions: (groupId) =>
    apiRequest(`/payment/missed-contributions/${groupId}`),
};

// ===== MEETING SERVICE =====
export const meetingAPI = {
  // Meetings
  scheduleMeeting: (groupId, meetingData) =>
    apiRequest('/meeting/meetings', {
      method: 'POST',
      body: { ...meetingData, groupId },
    }),

  getGroupMeetings: (groupId) => apiRequest(`/meeting/meetings/group/${groupId}`),

  getMeetingDetails: (meetingId) => apiRequest(`/meeting/meetings/${meetingId}`),

  updateMeeting: (meetingId, updates) =>
    apiRequest(`/meeting/meetings/${meetingId}`, {
      method: 'PUT',
      body: updates,
    }),

  deleteMeeting: (meetingId) =>
    apiRequest(`/meeting/meetings/${meetingId}`, {
      method: 'DELETE',
    }),

  getUpcomingMeetings: (groupId) =>
    apiRequest(`/meeting/meetings/upcoming/${groupId}`),

  // Agenda
  updateAgenda: (meetingId, agenda) =>
    apiRequest(`/meeting/agenda/${meetingId}`, {
      method: 'PUT',
      body: { agenda },
    }),

  // Minutes
  recordMinutes: (meetingId, minutes) =>
    apiRequest(`/meeting/minutes/${meetingId}`, {
      method: 'PUT',
      body: { minutes },
    }),

  // Attendance
  markAttendance: (meetingId) =>
    apiRequest(`/meeting/meetings/${meetingId}/mark-attended`, {
      method: 'POST',
    }),
};

// ===== ANALYTICS SERVICE =====
export const analyticsAPI = {
  // Compliance Report
  getComplianceReport: (groupId) =>
    apiRequest(`/analytics/dashboard/${groupId}/compliance`),

  // Payout Projections
  getPayoutReport: (groupId) =>
    apiRequest(`/analytics/dashboard/${groupId}/payout-history`),

  // Custom Metrics
  getCustomReport: (groupId) =>
    apiRequest(`/analytics/dashboard/${groupId}/custom`),

  // Export Reports
  exportComplianceCSV: (groupId) => {
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    return fetch(`${API_BASE_URL}/analytics/export/${groupId}?format=csv`, {
      headers,
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `compliance_${groupId}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  },

  exportPayoutPDF: (groupId) =>
    downloadFile(`/analytics/export/payout/${groupId}/pdf`, `payouts_${groupId}.pdf`),
};
