// src/pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { groupAPI } from '../services/api';
import '../styles/Dashboard.css';

export default function Dashboard() {
    const { currentUser, userRole } = useAuth();
    const [groups, setGroups] = useState([]);
    const [userGroups, setUserGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('my-groups');

    useEffect(() => {
        async function fetchGroups() {
            try {
                const allGroups = await groupAPI.getGroups('active');
                setGroups(allGroups.groups);

                if (currentUser?.uid) {
                    const myGroups = await groupAPI.getUserGroups(currentUser.uid);
                    setUserGroups(myGroups.groups);
                }
            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchGroups();
    }, [currentUser?.uid]);

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h1>Welcome, {currentUser?.displayName || 'User'}</h1>
                <p>Role: <strong>{userRole}</strong></p>
            </header>

            <div className="dashboard-tabs">
                <button
                    className={`tab ${activeTab === 'my-groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('my-groups')}
                >
                    My Groups ({userGroups.length})
                </button>
                <button
                    className={`tab ${activeTab === 'all-groups' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all-groups')}
                >
                    All Groups
                </button>
                {['Admin', 'Treasurer'].includes(userRole) && (
                    <button
                        className={`tab ${activeTab === 'create-group' ? 'active' : ''}`}
                        onClick={() => setActiveTab('create-group')}
                    >
                        Create Group
                    </button>
                )}
            </div>

            <div className="dashboard-content">
                {loading ? (
                    <div className="loading">Loading...</div>
                ) : (
                    <>
                        {activeTab === 'my-groups' && (
                            <div className="groups-list">
                                <h2>My Stokvel Groups</h2>
                                {userGroups.length === 0 ? (
                                    <p>You're not a member of any groups yet.</p>
                                ) : (
                                    userGroups.map((group) => (
                                        <GroupCard key={group.id} group={group} />
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'all-groups' && (
                            <div className="groups-list">
                                <h2>All Active Groups</h2>
                                {groups.length === 0 ? (
                                    <p>No active groups found.</p>
                                ) : (
                                    groups.map((group) => (
                                        <GroupCard key={group.id} group={group} />
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'create-group' && (
                            <CreateGroupForm />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function GroupCard({ group }) {
    return (
        <div className="group-card">
            <div className="group-header">
                <h3>{group.groupName}</h3>
                <span className="group-status">{group.status}</span>
            </div>
            <p>{group.description}</p>
            <div className="group-details">
                <div className="detail">
                    <span className="label">Members:</span>
                    <span className="value">{group.memberCount || 0}</span>
                </div>
                <div className="detail">
                    <span className="label">Contribution:</span>
                    <span className="value">R{group.contributionAmount}</span>
                </div>
                <div className="detail">
                    <span className="label">Frequency:</span>
                    <span className="value">{group.meetingFrequency}</span>
                </div>
            </div>
            <button className="btn-primary">View Group</button>
        </div>
    );
}

function CreateGroupForm() {
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
            await groupAPI.createGroup(formData);
            alert('Group created successfully!');
            setFormData({
                groupName: '',
                description: '',
                contributionAmount: '',
                meetingFrequency: 'monthly',
                maxMembers: '',
                startDate: ''
            });
        } catch (err) {
            setError(err.message);
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
                    <label>Group Name *</label>
                    <input
                        type="text"
                        value={formData.groupName}
                        onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Contribution Amount (R) *</label>
                        <input
                            type="number"
                            value={formData.contributionAmount}
                            onChange={(e) => setFormData({ ...formData, contributionAmount: e.target.value })}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Meeting Frequency *</label>
                        <select
                            value={formData.meetingFrequency}
                            onChange={(e) => setFormData({ ...formData, meetingFrequency: e.target.value })}
                        >
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Max Members (leave empty for unlimited)</label>
                        <input
                            type="number"
                            value={formData.maxMembers}
                            onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label>Start Date *</label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Group'}
                </button>
            </form>
        </div>
    );
}
