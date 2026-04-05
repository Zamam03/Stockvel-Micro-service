import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { groupAPI, paymentAPI } from '../services/api';
import '../styles/Dashboard.css';

// GroupCard component
function GroupCard({ group, onJoin, onLeave, onView, isShowingJoinButton }) {
    return (
        <div className="group-card">
            <div className="group-header">
                <h3>{group.groupName || group.name}</h3>
                <span className={`status-badge ${group.status || 'active'}`}>
                    {group.status || 'Active'}
                </span>
            </div>
            
            <p className="group-description">{group.description}</p>
            
            <div className="group-info-grid">
                <div className="info-item">
                    <span className="label">Members:</span>
                    <span className="value">{group.memberCount || 0}</span>
                </div>
                <div className="info-item">
                    <span className="label">Contribution:</span>
                    <span className="value">R{group.contributionAmount || 0}</span>
                </div>
                <div className="info-item">
                    <span className="label">Frequency:</span>
                    <span className="value">{group.meetingFrequency || 'Monthly'}</span>
                </div>
            </div>
            
            <div className="group-actions">
                <button 
                    className="btn-view"
                    onClick={() => onView(group)}
                >
                    View Details
                </button>
                {isShowingJoinButton ? (
                    <button 
                        className="btn-join"
                        onClick={() => onJoin(group)}
                    >
                        Join Group
                    </button>
                ) : (
                    <button 
                        className="btn-leave"
                        onClick={() => onLeave(group)}
                    >
                        Leave Group
                    </button>
                )}
            </div>
        </div>
    );
}

// CreateGroupForm component
function CreateGroupForm({ onSuccess, onError }) {
    const [formData, setFormData] = useState({
        groupName: '',
        description: '',
        contributionAmount: '',
        meetingFrequency: 'monthly',
        maxMembers: '',
        startDate: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const dataToSend = {
                ...formData,
                contributionAmount: parseFloat(formData.contributionAmount),
                maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
            };

            await groupAPI.createGroup(dataToSend);
            
            setFormData({
                groupName: '',
                description: '',
                contributionAmount: '',
                meetingFrequency: 'monthly',
                maxMembers: '',
                startDate: ''
            });
            
            onSuccess();
        } catch (err) {
            console.error('Create group error:', err);
            setError('Unable to create group. Please check your information and try again.');
            onError?.('Unable to create group. Please try again later.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="create-group-form">
            <h2>Create New Stokvel Group</h2>
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="groupName">Group Name *</label>
                    <input
                        id="groupName"
                        type="text"
                        value={formData.groupName}
                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                        placeholder="e.g., Savings Circle 2024"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="What is this group about?"
                        rows="4"
                        disabled={loading}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="contributionAmount">Contribution Amount (R) *</label>
                        <input
                            id="contributionAmount"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.contributionAmount}
                            onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                            placeholder="500.00"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="meetingFrequency">Meeting Frequency *</label>
                        <select
                            id="meetingFrequency"
                            value={formData.meetingFrequency}
                            onChange={(e) => setFormData({ ...formData, meetingFrequency: e.target.value })}
                            disabled={loading}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="maxMembers">Max Members (optional)</label>
                        <input
                            id="maxMembers"
                            type="number"
                            min="1"
                            value={formData.maxMembers}
                            onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                            placeholder="Leave empty for unlimited"
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="startDate">Start Date *</label>
                        <input
                            id="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                            disabled={loading}
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary">
                    {loading ? 'Creating Group...' : 'Create Group'}
                </button>
            </form>
        </div>
    );
}

// Main Dashboard component
export default function Dashboard() {
    const [groups, setGroups] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('my-groups');
    const navigate = useNavigate();
    const { currentUser, logout, userRole } = useAuth();

    useEffect(() => {
        if (!currentUser?.uid) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [currentUser, navigate]);

    async function fetchData() {
        setLoading(true);
        setError('');
        try {
            // Fetch all groups
            const allGroupsData = await groupAPI.getGroups();
            setGroups(Array.isArray(allGroupsData) ? allGroupsData : allGroupsData.groups || []);
            
            // Fetch user's groups
            const userGroupsData = await groupAPI.getUserGroups(currentUser.uid);
            setUserGroups(Array.isArray(userGroupsData) ? userGroupsData : userGroupsData.groups || []);
        } catch (err) {
            // Log the error for debugging but don't show it to the user
            console.error('Error fetching data:', err);
            // Silently fail and show empty states instead of error banners
        } finally {
            setLoading(false);
        }
    }

    async function handleJoinGroup(group) {
        try {
            console.log('Joining group:', group.id || group._id);
            await groupAPI.joinGroup(group.id || group._id);
            alert('Successfully joined group!');
            fetchData();
        } catch (err) {
            console.error('Join group error:', err);
            // Show actual error from API if available
            alert(err.message || 'Unable to join the group. Please try again later.');
        }
    }

    async function handleLeaveGroup(group) {
        if (!window.confirm('Are you sure you want to leave this group?')) {
            return;
        }
        try {
            await groupAPI.leaveGroup(group.id || group._id);
            alert('You have left the group');
            fetchData();
        } catch (err) {
            console.error('Leave group error:', err);
            alert('Unable to leave the group. Please try again later.');
        }
    }

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    function handleViewGroup(group) {
        navigate(`/group/${group.id || group._id}`);
    }

    function handleCreateSuccess() {
        fetchData();
        setActiveTab('my-groups');
    }

    const userGroupIds = userGroups.map(g => g.id || g._id);
    const availableGroups = groups.filter(g => !userGroupIds.includes(g.id || g._id));

    return (
        <div className="dashboard-container">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Welcome, {currentUser?.displayName}</h1>
                    <p className="role-badge">Role: {userRole || 'Member'}</p>
                </div>
                <div className="header-right">
                    <button onClick={handleLogout} className="btn-logout">
                        Logout
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'my-groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-groups')}
                >
                    <span className="tab-label">My Groups</span>
                    <span className="tab-count">{userGroups.length}</span>
                </button>
                <button
                    className={`tab ${activeTab === 'browse-groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('browse-groups')}
                >
                    <span className="tab-label">Browse Groups</span>
                    <span className="tab-count">{availableGroups.length}</span>
                </button>
                {userRole?.toLowerCase() === 'admin' && (
                    <button
                        className={`tab ${activeTab === 'create-group' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create-group')}
                    >
                        <span className="tab-label">Create Group</span>
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {loading ? (
                    <div className="loading-spinner">
                        <p>Loading...</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'my-groups' && (
                            <div className="groups-section">
                                <h2>My Stokvel Groups</h2>
                                {userGroups.length === 0 ? (
                                    <div className="empty-state">
                                        <p>You're not a member of any groups yet.</p>
                                        <button 
                                            onClick={() => setActiveTab('browse-groups')}
                                            className="btn-primary"
                                        >
                                            Browse Available Groups
                                        </button>
                                    </div>
                                ) : (
                                    <div className="groups-grid">
                                        {userGroups.map((group) => (
                                            <GroupCard
                                                key={group.id || group._id}
                                                group={group}
                                                onJoin={handleJoinGroup}
                                                onLeave={handleLeaveGroup}
                                                onView={handleViewGroup}
                                                isShowingJoinButton={false}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'browse-groups' && (
                            <div className="groups-section">
                                <h2>Available Groups to Join</h2>
                                {availableGroups.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No available groups at the moment.</p>
                                        {['admin', 'treasurer'].includes(userRole?.toLowerCase()) && (
                                            <button 
                                                onClick={() => setActiveTab('create-group')}
                                                className="btn-primary"
                                            >
                                                Create a New Group
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="groups-grid">
                                        {availableGroups.map((group) => (
                                            <GroupCard
                                                key={group.id || group._id}
                                                group={group}
                                                onJoin={handleJoinGroup}
                                                onLeave={handleLeaveGroup}
                                                onView={handleViewGroup}
                                                isShowingJoinButton={true}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'create-group' && (
                            <CreateGroupForm
                                onSuccess={handleCreateSuccess}
                                onError={(err) => setError(err)}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
