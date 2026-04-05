import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupAPI, meetingAPI, paymentAPI, analyticsAPI } from '../services/api';
import '../styles/GroupDetail.css';

// Tab Components
function OverviewTab({ group }) {
    return (
        <div className="overview-section">
            <div className="overview-grid">
                <div className="overview-card">
                    <h3>Group Information</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="label">Group Name:</span>
                            <span className="value">{group.groupName || group.name}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Description:</span>
                            <span className="value">{group.description || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Status:</span>
                            <span className={`status-badge ${group.status}`}>{group.status || 'Active'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Created:</span>
                            <span className="value">{group.createdAt ? new Date(group.createdAt).toLocaleDateString() : 'N/A'}</span>
                        </div>
                    </div>
                </div>
                
                <div className="overview-card">
                    <h3>Financial Details</h3>
                    <div className="info-list">
                        <div className="info-row">
                            <span className="label">Contribution Amount:</span>
                            <span className="value">R{group.contributionAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Meeting Frequency:</span>
                            <span className="value">{group.meetingFrequency || 'Monthly'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Max Members:</span>
                            <span className="value">{group.maxMembers || 'Unlimited'}</span>
                        </div>
                        <div className="info-row">
                            <span className="label">Current Members:</span>
                            <span className="value">{group.memberCount || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MembersTab({ members, groupId, userRole, isAdmin, onRefresh }) {
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState('');
    const [loading, setLoading] = useState(false);

    async function handleAddMember() {
        if (!newMemberEmail.trim()) return;
        setLoading(true);
        try {
            await groupAPI.addMember(groupId, newMemberEmail, 'member');
            setNewMemberEmail('');
            setShowAddMember(false);
            onRefresh();
        } catch (err) {
            alert('Error adding member: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleRemoveMember(memberId) {
        if (!window.confirm('Remove this member?')) return;
        try {
            await groupAPI.removeMember(groupId, memberId);
            onRefresh();
        } catch (err) {
            alert('Error removing member: ' + err.message);
        }
    }

    return (
        <div className="members-section">
            <div className="section-header">
                <h3>Group Members ({members.length})</h3>
                {isAdmin && (
                    <button 
                        className="btn-secondary"
                        onClick={() => setShowAddMember(!showAddMember)}
                    >
                        {showAddMember ? 'Cancel' : 'Add Member'}
                    </button>
                )}
            </div>

            {showAddMember && (
                <div className="add-member-form">
                    <input
                        type="email"
                        placeholder="Member email address"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                    />
                    <button 
                        onClick={handleAddMember}
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Adding...' : 'Add'}
                    </button>
                </div>
            )}

            <div className="members-list">
                {members.map((member) => (
                    <div key={member.uid || member._id} className="member-card">
                        <div className="member-info">
                            <h4>{member.displayName || member.name}</h4>
                            <p className="email">{member.email}</p>
                            <span className="role-badge">{member.role || 'Member'}</span>
                        </div>
                        {isAdmin && member.uid !== member._id && (
                            <button
                                className="btn-remove"
                                onClick={() => handleRemoveMember(member.uid || member._id)}
                            >
                                Remove
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function ContributionsTab({ groupId, currentUser }) {
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
    const [contributions, setContributions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        fetchContributions();
    }, []);

    async function fetchContributions() {
        setHistoryLoading(true);
        try {
            const data = await paymentAPI.getContributions(groupId);
            setContributions(Array.isArray(data) ? data : data.contributions || []);
        } catch (err) {
            console.error('Error fetching contributions:', err);
        } finally {
            setHistoryLoading(false);
        }
    }

    async function handleContribute(e) {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;
        
        setLoading(true);
        try {
            await paymentAPI.contribute(groupId, parseFloat(amount), paymentMethod);
            setAmount('');
            alert('Contribution recorded successfully!');
            fetchContributions();
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="contributions-section">
            <div className="contribute-form-card">
                <h3>Make a Contribution</h3>
                <form onSubmit={handleContribute}>
                    <div className="form-group">
                        <label htmlFor="amount">Amount (R)</label>
                        <input
                            id="amount"
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="method">Payment Method</label>
                        <select 
                            id="method"
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value)}
                        >
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="card">Card</option>
                            <option value="cash">Cash</option>
                            <option value="mobile_wallet">Mobile Wallet</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="btn-primary">
                        {loading ? 'Processing...' : 'Contribute'}
                    </button>
                </form>
            </div>

            <div className="contributions-history-card">
                <h3>Contribution History</h3>
                {historyLoading ? (
                    <p>Loading...</p>
                ) : contributions.length === 0 ? (
                    <p className="empty">No contributions yet</p>
                ) : (
                    <div className="contributions-table">
                        <div className="table-header">
                            <span>Date</span>
                            <span>Amount</span>
                            <span>Method</span>
                            <span>Status</span>
                        </div>
                        {contributions.slice(0, 20).map((contrib, idx) => (
                            <div key={contrib.id || idx} className="table-row">
                                <span>{new Date(contrib.timestamp || contrib.createdAt).toLocaleDateString()}</span>
                                <span className="amount">R{parseFloat(contrib.amount).toFixed(2)}</span>
                                <span>{contrib.paymentMethod || contrib.method || 'Bank'}</span>
                                <span className={`status ${contrib.status || 'completed'}`}>
                                    {contrib.status || 'Completed'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MeetingsTab({ groupId, currentUser }) {
    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        scheduledDate: '',
        location: ''
    });
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchMeetings();
    }, []);

    async function fetchMeetings() {
        setLoading(true);
        try {
            const data = await meetingAPI.getGroupMeetings(groupId);
            setMeetings(Array.isArray(data) ? data : data.meetings || []);
        } catch (err) {
            console.error('Error fetching meetings:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateMeeting(e) {
        e.preventDefault();
        setFormLoading(true);
        try {
            await meetingAPI.scheduleMeeting(groupId, formData);
            setFormData({ title: '', description: '', scheduledDate: '', location: '' });
            setShowForm(false);
            alert('Meeting scheduled successfully!');
            fetchMeetings();
        } catch (err) {
            alert('Error: ' + err.message);
        } finally {
            setFormLoading(false);
        }
    }

    return (
        <div className="meetings-section">
            <div className="section-header">
                <h3>Group Meetings</h3>
                <button 
                    className="btn-secondary"
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? 'Cancel' : 'Schedule Meeting'}
                </button>
            </div>

            {showForm && (
                <div className="meeting-form-card">
                    <form onSubmit={handleCreateMeeting}>
                        <div className="form-group">
                            <label htmlFor="title">Meeting Title *</label>
                            <input
                                id="title"
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                            />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="date">Date & Time *</label>
                                <input
                                    id="date"
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    id="location"
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                        </div>
                        <button type="submit" disabled={formLoading} className="btn-primary">
                            {formLoading ? 'Scheduling...' : 'Schedule Meeting'}
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <p>Loading meetings...</p>
            ) : meetings.length === 0 ? (
                <p className="empty">No meetings scheduled yet</p>
            ) : (
                <div className="meetings-list">
                    {meetings.map((meeting) => (
                        <div key={meeting.id || meeting._id} className="meeting-card">
                            <div className="meeting-header">
                                <h4>{meeting.title}</h4>
                                <span className={`status-badge ${meeting.status || 'scheduled'}`}>
                                    {meeting.status || 'Scheduled'}
                                </span>
                            </div>
                            {meeting.description && <p>{meeting.description}</p>}
                            <div className="meeting-details">
                                <span>📅 {new Date(meeting.scheduledDate).toLocaleString()}</span>
                                {meeting.location && <span>📍 {meeting.location}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AnalyticsTab({ groupId, userRole }) {
    const [report, setReport] = useState(null);
    const [reportType, setReportType] = useState('compliance');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, [reportType]);

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

    async function handleDownloadCSV() {
        try {
            await analyticsAPI.exportComplianceCSV(groupId);
        } catch (error) {
            alert('Error downloading: ' + error.message);
        }
    }

    return (
        <div className="analytics-section">
            <div className="section-header">
                <h3>Analytics & Reports</h3>
                <select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    className="report-selector"
                >
                    <option value="compliance">Contribution Compliance</option>
                    <option value="payout">Payout History</option>
                    <option value="custom">Custom Metrics</option>
                </select>
            </div>

            {['compliance', 'payout'].includes(reportType) && (
                <button onClick={handleDownloadCSV} className="btn-secondary">
                    📥 Download CSV
                </button>
            )}

            {loading ? (
                <p>Loading report...</p>
            ) : report ? (
                <div className="report-content">
                    <pre>{JSON.stringify(report, null, 2)}</pre>
                </div>
            ) : (
                <p>No data available</p>
            )}
        </div>
    );
}

// Main Component
export default function GroupDetail() {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    
    const [group, setGroup] = useState(null);
    const [members, setMembers] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const isAdmin = ['admin', 'treasurer'].includes(userRole?.toLowerCase());

    useEffect(() => {
        if (!currentUser?.uid) {
            navigate('/login');
            return;
        }
        fetchGroupData();
    }, [currentUser, groupId, navigate]);

    async function fetchGroupData() {
        setLoading(true);
        setError('');
        try {
            const groupData = await groupAPI.getGroupDetails(groupId);
            setGroup(groupData.group || groupData);

            const membersData = await groupAPI.getGroupMembers(groupId);
            setMembers(Array.isArray(membersData) ? membersData : membersData.members || []);
        } catch (err) {
            setError(err.message || 'Failed to load group details');
            console.error('Error fetching group data:', err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="group-detail-container">
                <div className="loading-spinner">Loading group details...</div>
            </div>
        );
    }

    if (error || !group) {
        return (
            <div className="group-detail-container">
                <button onClick={() => navigate('/dashboard')} className="btn-back">
                    ← Back to Dashboard
                </button>
                <div className="error-banner">
                    {error || 'Group not found'}
                </div>
            </div>
        );
    }

    return (
        <div className="group-detail-container">
            <button onClick={() => navigate('/dashboard')} className="btn-back">
                ← Back to Dashboard
            </button>
            
            <div className="group-detail-header">
                <div className="header-content">
                    <h1>{group.groupName || group.name}</h1>
                    <p className="subtitle">{group.description || 'No description'}</p>
                </div>
                <div className="header-stats">
                    <stat-item>
                        <span className="stat-value">{members.length}</span>
                        <span className="stat-label">Members</span>
                    </stat-item>
                    <stat-item>
                        <span className="stat-value">R{group.contributionAmount?.toFixed(2) || '0.00'}</span>
                        <span className="stat-label">Contribution</span>
                    </stat-item>
                    <stat-item>
                        <span className="stat-value">{group.meetingFrequency || 'Monthly'}</span>
                        <span className="stat-label">Frequency</span>
                    </stat-item>
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
                    Members
                </button>
                <button
                    className={`tab ${activeTab === 'contributions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('contributions')}
                >
                    Contributions
                </button>
                <button
                    className={`tab ${activeTab === 'meetings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('meetings')}
                >
                    Meetings
                </button>
                {isAdmin && (
                    <button
                        className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        Analytics
                    </button>
                )}
            </div>

            <div className="group-content">
                {activeTab === 'overview' && <OverviewTab group={group} />}
                {activeTab === 'members' && (
                    <MembersTab 
                        members={members} 
                        groupId={groupId}
                        userRole={userRole}
                        isAdmin={isAdmin}
                        onRefresh={fetchGroupData}
                    />
                )}
                {activeTab === 'contributions' && (
                    <ContributionsTab groupId={groupId} currentUser={currentUser} />
                )}
                {activeTab === 'meetings' && (
                    <MeetingsTab groupId={groupId} currentUser={currentUser} />
                )}
                {activeTab === 'analytics' && isAdmin && (
                    <AnalyticsTab groupId={groupId} userRole={userRole} />
                )}
            </div>
        </div>
    );
}

