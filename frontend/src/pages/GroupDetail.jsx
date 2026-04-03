// src/pages/GroupDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupAPI, paymentAPI, meetingAPI, analyticsAPI } from '../services/api';
import '../styles/GroupDetail.css';

export default function GroupDetail() {
    const { groupId } = useParams();
    const { currentUser, userRole } = useAuth();
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [contributions, setContributions] = useState([]);
    const [joinRequests, setJoinRequests] = useState([]);
    const [meetings, setMeetings] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchGroupData();
    }, [groupId]);

    async function fetchGroupData() {
        try {
            const groupData = await groupAPI.getGroupDetails(groupId);
            setGroup(groupData.group);

            const membersData = await groupAPI.getGroupMembers(groupId);
            setMembers(membersData.members);

            const meetingsData = await meetingAPI.getGroupMeetings(groupId);
            setMeetings(meetingsData.meetings);

            if (['Admin', 'Treasurer'].includes(userRole)) {
                const contribData = await paymentAPI.getContributions(groupId);
                setContributions(contribData.contributions);

                const requestsData = await groupAPI.getJoinRequests(groupId);
                setJoinRequests(requestsData.requests || []);
            }
        } catch (error) {
            console.error('Error fetching group data:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div className="loading">Loading group details...</div>;
    if (!group) return <div className="error">Group not found</div>;

    const isMember = group.members?.includes(currentUser?.uid);

    return (
        <div className="group-detail-container">
            <div className="group-detail-header">
                <h1>{group.groupName}</h1>
                <p>{group.description}</p>
                <div className="group-meta">
                    <span>Members: {group.memberCount}</span>
                    <span>Contribution: R{group.contributionAmount}</span>
                    <span>Frequency: {group.meetingFrequency}</span>
                </div>
            </div>

            <div className="group-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab ${activeTab === 'members' ? 'active' : ''}`}
                    onClick={() => setActiveTab('members')}
                >
                    Members ({members.length})
                </button>
                {isMember && (
                    <button
                        className={`tab ${activeTab === 'contributions' ? 'active' : ''}`}
                        onClick={() => setActiveTab('contributions')}
                    >
                        Contributions
                    </button>
                )}
                {['Admin', 'Treasurer'].includes(userRole) && (
                    <button
                        className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
                        onClick={() => setActiveTab('requests')}
                    >
                        Join Requests ({joinRequests.length})
                    </button>
                )}
                <button
                    className={`tab ${activeTab === 'meetings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meetings')}
                >
                    Meetings
                </button>
                {['Admin', 'Treasurer'].includes(userRole) && (
                    <button
                        className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                )}
            </div>

            <div className="group-content">
                {activeTab === 'overview' && (
                    <OverviewTab group={group} isMember={isMember} groupId={groupId} />
                )}

                {activeTab === 'members' && (
                    <MembersTab members={members} />
                )}

                {activeTab === 'contributions' && isMember && (
                    <ContributionsTab groupId={groupId} contributions={contributions} />
                )}

                {activeTab === 'requests' && ['Admin', 'Treasurer'].includes(userRole) && (
                    <JoinRequestsTab requests={joinRequests} onApprovalChange={fetchGroupData} />
                )}

                {activeTab === 'meetings' && (
                    <MeetingsTab meetings={meetings} groupId={groupId} isMember={isMember} />
                )}

                {activeTab === 'analytics' && ['Admin', 'Treasurer'].includes(userRole) && (
                    <AnalyticsTab groupId={groupId} />
                )}
            </div>
        </div>
    );
}

function OverviewTab({ group, isMember, groupId }) {
    const [showJoinButton, setShowJoinButton] = useState(!isMember);

    async function handleJoinGroup() {
        try {
            await groupAPI.requestToJoinGroup(groupId);
            alert('Join request submitted!');
            setShowJoinButton(false);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    return (
        <div className="overview-section">
            <div className="overview-card">
                <h3>Group Information</h3>
                <p><strong>Name:</strong> {group.groupName}</p>
                <p><strong>Description:</strong> {group.description}</p>
                <p><strong>Contribution Amount:</strong> R{group.contributionAmount}</p>
                <p><strong>Meeting Frequency:</strong> {group.meetingFrequency}</p>
                <p><strong>Status:</strong> {group.status}</p>
                <p><strong>Max Members:</strong> {group.maxMembers || 'Unlimited'}</p>
                {showJoinButton && (
                    <button className="btn-primary" onClick={handleJoinGroup}>
                        Request to Join
                    </button>
                )}
            </div>
        </div>
    );
}

function MembersTab({ members }) {
    return (
        <div className="members-section">
            <h3>Group Members ({members.length})</h3>
            <div className="members-list">
                {members.map((member) => (
                    <div key={member.uid} className="member-item">
                        <h4>{member.displayName}</h4>
                        <p>{member.email}</p>
                        <span className="role-badge">{member.role}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContributionsTab({ groupId, contributions }) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleContribute() {
        if (!amount) return alert('Please enter an amount');
        
        setLoading(true);
        try {
            // Note: This would need Stripe setup in frontend
            // For now, just show the concept
            alert('Contribution feature requires payment gateway setup');
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="contributions-section">
            <div className="contribute-form">
                <h3>Make a Contribution</h3>
                <input
                    type="number"
                    placeholder="Amount (R)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.01"
                />
                <button onClick={handleContribute} disabled={loading}>
                    {loading ? 'Processing...' : 'Contribute'}
                </button>
            </div>

            <div className="contributions-history">
                <h3>Recent Contributions</h3>
                {contributions.length === 0 ? (
                    <p>No contributions yet</p>
                ) : (
                    contributions.slice(0, 10).map((contrib) => (
                        <div key={contrib.id} className="contribution-item">
                            <span>{new Date(contrib.timestamp?.toDate?.()).toLocaleDateString()}</span>
                            <span>R{contrib.amount}</span>
                            <span className="status">{contrib.status}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function JoinRequestsTab({ requests, onApprovalChange }) {
    async function handleApprove(requestId) {
        try {
            await groupAPI.approveJoinRequest(requestId);
            alert('Request approved!');
            onApprovalChange();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    async function handleReject(requestId) {
        try {
            await groupAPI.rejectJoinRequest(requestId);
            alert('Request rejected');
            onApprovalChange();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    if (requests.length === 0) return <p>No pending join requests</p>;

    return (
        <div className="requests-section">
            <h3>Pending Join Requests</h3>
            {requests.map((request) => (
                <div key={request.id} className="request-item">
                    <div className="request-info">
                        <p><strong>User ID:</strong> {request.userId}</p>
                        <p><strong>Status:</strong> {request.status}</p>
                    </div>
                    <div className="request-actions">
                        <button className="btn-success" onClick={() => handleApprove(request.id)}>
                            Approve
                        </button>
                        <button className="btn-danger" onClick={() => handleReject(request.id)}>
                            Reject
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

function MeetingsTab({ meetings, groupId, isMember }) {
    return (
        <div className="meetings-section">
            <h3>Meetings</h3>
            {meetings.length === 0 ? (
                <p>No meetings scheduled</p>
            ) : (
                meetings.map((meeting) => (
                    <div key={meeting.id} className="meeting-item">
                        <h4>{meeting.title}</h4>
                        <p>{meeting.description}</p>
                        <p><strong>Date:</strong> {new Date(meeting.scheduledDate).toLocaleDateString()}</p>
                        <p><strong>Location:</strong> {meeting.location}</p>
                        <p><strong>Status:</strong> {meeting.status}</p>
                    </div>
                ))
            )}
        </div>
    );
}

function AnalyticsTab({ groupId }) {
    const [report, setReport] = useState(null);
    const [reportType, setReportType] = useState('compliance');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function fetchReport() {
            setLoading(true);
            try {
                let data;
                if (reportType === 'compliance') {
                    data = await analyticsAPI.getComplianceReport(groupId);
                } else if (reportType === 'payout') {
                    data = await analyticsAPI.getPayoutReport(groupId);
                } else {
                    data = await analyticsAPI.getCustomReport(groupId);
                }
                setReport(data);
            } catch (error) {
                console.error('Error fetching report:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [groupId, reportType]);

    return (
        <div className="analytics-section">
            <h3>Analytics & Reports</h3>
            <div className="report-selector">
                <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="compliance">Contribution Compliance</option>
                    <option value="payout">Payout History</option>
                    <option value="custom">Custom Analytics</option>
                </select>
            </div>

            {loading ? (
                <p>Loading report...</p>
            ) : report ? (
                <div className="report-content">
                    <pre>{JSON.stringify(report, null, 2)}</pre>
                </div>
            ) : null}
        </div>
    );
}
