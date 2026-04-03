// src/services/api.js
const API_BASE_URL = 'http://localhost:5000/api';

export async function getAuthToken() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.token || null;
}

async function apiCall(endpoint, options = {}) {
    const token = await getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API call failed');
    }

    return response.json();
}

// Auth endpoints
export const authAPI = {
    register: (email, password, displayName, role) =>
        apiCall('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, displayName, role }),
        }),
    verifyToken: () =>
        apiCall('/auth/verify-token', { method: 'POST' }),
    getUser: (uid) =>
        apiCall(`/auth/user/${uid}`),
};

// Group endpoints
export const groupAPI = {
    createGroup: (groupData) =>
        apiCall('/stockvel/groups', {
            method: 'POST',
            body: JSON.stringify(groupData),
        }),
    getGroups: (status = 'active') =>
        apiCall(`/stockvel/groups?status=${status}`),
    getGroupDetails: (groupId) =>
        apiCall(`/stockvel/groups/${groupId}`),
    updateGroup: (groupId, updates) =>
        apiCall(`/stockvel/groups/${groupId}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        }),
    getUserGroups: (userId) =>
        apiCall(`/stockvel/user/${userId}/groups`),
    getGroupMembers: (groupId) =>
        apiCall(`/stockvel/groups/${groupId}/members`),
    inviteToGroup: (groupId, memberId, email) =>
        apiCall(`/stockvel/groups/${groupId}/invite`, {
            method: 'POST',
            body: JSON.stringify({ memberId, email }),
        }),
    requestToJoinGroup: (groupId) =>
        apiCall(`/stockvel/groups/${groupId}/join-request`, {
            method: 'POST',
        }),
    getJoinRequests: (groupId) =>
        apiCall(`/stockvel/groups/${groupId}/join-requests`),
    approveJoinRequest: (requestId) =>
        apiCall(`/stockvel/join-requests/${requestId}/approve`, {
            method: 'POST',
        }),
    rejectJoinRequest: (requestId) =>
        apiCall(`/stockvel/join-requests/${requestId}/reject`, {
            method: 'POST',
        }),
    removeGroupMember: (groupId, memberId) =>
        apiCall(`/stockvel/groups/${groupId}/remove-member`, {
            method: 'POST',
            body: JSON.stringify({ memberId }),
        }),
};

// Payment endpoints
export const paymentAPI = {
    contribute: (groupId, amount, paymentMethodId) =>
        apiCall('/payment/contribute', {
            method: 'POST',
            body: JSON.stringify({ groupId, amount, paymentMethodId }),
        }),
    getContributions: (groupId) =>
        apiCall(`/payment/contributions/${groupId}`),
    getUserContributions: (userId, groupId) =>
        apiCall(`/payment/user-contributions/${userId}/${groupId}`),
    getPayouts: (groupId) =>
        apiCall(`/payment/payouts/${groupId}`),
    initiatePayouts: (groupId, memberId, amount, bankDetails) =>
        apiCall('/payment/payout/initiate', {
            method: 'POST',
            body: JSON.stringify({ groupId, memberId, amount, bankDetails }),
        }),
    processPayout: (payoutId) =>
        apiCall(`/payment/payout/${payoutId}/process`, {
            method: 'POST',
        }),
};

// Meeting endpoints
export const meetingAPI = {
    scheduleMeeting: (groupId, meetingData) =>
        apiCall('/meetings/meetings', {
            method: 'POST',
            body: JSON.stringify({ groupId, ...meetingData }),
        }),
    getGroupMeetings: (groupId) =>
        apiCall(`/meetings/meetings/${groupId}`),
    getUpcomingMeetings: (groupId) =>
        apiCall(`/meetings/meetings/${groupId}/upcoming`),
    getMeetingDetails: (meetingId) =>
        apiCall(`/meetings/meetings/${meetingId}`),
    updateAgenda: (meetingId, agenda) =>
        apiCall(`/meetings/meetings/${meetingId}/agenda`, {
            method: 'PUT',
            body: JSON.stringify({ agenda }),
        }),
    markAttendance: (meetingId) =>
        apiCall(`/meetings/meetings/${meetingId}/mark-attended`, {
            method: 'POST',
        }),
    recordMinutes: (meetingId, minutes) =>
        apiCall(`/meetings/meetings/${meetingId}/minutes`, {
            method: 'PUT',
            body: JSON.stringify({ minutes }),
        }),
    getNotifications: (userId) =>
        apiCall(`/meetings/notifications/${userId}`),
};

// Analytics endpoints
export const analyticsAPI = {
    getComplianceReport: (groupId) =>
        apiCall(`/analytics/dashboard/${groupId}/contribution-compliance`),
    getPayoutReport: (groupId) =>
        apiCall(`/analytics/dashboard/${groupId}/payout-history`),
    getCustomReport: (groupId) =>
        apiCall(`/analytics/dashboard/${groupId}/custom`),
    exportComplianceCSV: (groupId) =>
        apiCall(`/analytics/export/compliance/${groupId}/csv`),
    exportPayoutCSV: (groupId) =>
        apiCall(`/analytics/export/payout/${groupId}/csv`),
};
