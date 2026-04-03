const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;
const admin = require('../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'stockvel-service', status: 'OK' });
});

// ========== SA PRIME RATE ENDPOINT ==========

/**
 * GET /sa-prime-rate
 * Get current South African prime lending rate
 * Source: SARB (South African Reserve Bank)
 * Note: In production, integrate with SARB API or use a cached value updated regularly
 */
app.get('/sa-prime-rate', async (req, res) => {
    try {
        // In production: fetch from SARB API or cache
        // For now, returning mock rate. Update this with real data from:
        // https://www.sarb.co.za/ (SARB official rates)
        // or use a service like:
        // - Quandl API (requires API key)
        // - FRED API (Federal Reserve Economic Data)
        // - Alpha Vantage
        const mockRate = 11.75;
        const repoRate = 10.75; // SARB Repo Rate (typically 1% below prime)
        
        res.json({ 
            primeLendingRate: mockRate, 
            repoRate: repoRate,
            source: 'SARB Mock Data',
            message: 'Current SA Prime Lending Rate and Repo Rate',
            lastUpdated: new Date().toISOString(),
            note: 'In production, integrate with SARB API for live rates'
        });
    } catch (error) {
        console.error('Error fetching SA rates:', error);
        res.status(500).json({ error: 'Failed to fetch SA rates' });
    }
});

// ========== GROUP MANAGEMENT ENDPOINTS ==========

/**
 * POST /groups
 * Create a new stokvel group (Admin/Treasurer only)
 */
app.post('/groups', verifyToken, async (req, res) => {
    try {
        // Only Admin or Treasurer can create groups
        if (!['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only Admins and Treasurers can create groups' });
        }

        const {
            groupName,
            description,
            contributionAmount,
            currency = 'ZAR',
            meetingFrequency = 'monthly', // weekly, monthly, quarterly
            maxMembers = null, // null = unlimited
            payoutOrder = 'rotating', // rotating, custom, alphabetical
            startDate,
            targetFund = null
        } = req.body;

        if (!groupName || !contributionAmount || !startDate) {
            return res.status(400).json({
                error: 'groupName, contributionAmount, and startDate are required'
            });
        }

        const db = admin.firestore();
        const groupData = {
            groupName,
            description: description || '',
            contributionAmount: parseFloat(contributionAmount),
            currency,
            meetingFrequency,
            maxMembers,
            payoutOrder,
            startDate: new Date(startDate),
            targetFund: targetFund ? parseFloat(targetFund) : null,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            members: [req.user.uid], // Creator automatically added
            memberCount: 1,
            isActive: true,
            status: 'active' // active, paused, completed
        };

        const groupRef = await db.collection('groups').add(groupData);

        // Add group to creator's profile
        const userRef = db.collection('users').doc(req.user.uid);
        await userRef.update({
            groupIds: admin.firestore.FieldValue.arrayUnion(groupRef.id)
        });

        res.status(201).json({
            message: 'Group created successfully',
            groupId: groupRef.id,
            group: { id: groupRef.id, ...groupData }
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: error.message || 'Failed to create group' });
    }
});

/**
 * GET /groups
 * Get all groups (with optional filtering)
 */
app.get('/groups', async (req, res) => {
    try {
        const { status = 'active', limit = 50, offset = 0 } = req.query;
        const db = admin.firestore();

        let query = db.collection('groups');
        if (status) {
            query = query.where('status', '==', status);
        }

        const groupsSnapshot = await query
            .limit(parseInt(limit))
            .offset(parseInt(offset))
            .get();

        const groups = groupsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ groups, total: groups.length });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch groups' });
    }
});

/**
 * GET /groups/:groupId
 * Get group details by ID
 */
app.get('/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        res.json({ group: { id: groupId, ...groupData } });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch group' });
    }
});

/**
 * PUT /groups/:groupId
 * Update group settings (Admin/Treasurer only)
 */
app.put('/groups/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Only creator or admin can update
        const groupData = groupDoc.data();
        if (groupData.createdBy !== req.user.uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only group creator or Admin can update' });
        }

        const updateData = req.body;
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('groups').doc(groupId).update(updateData);

        res.json({ message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: error.message || 'Failed to update group' });
    }
});

// ========== MEMBER MANAGEMENT ENDPOINTS ==========

/**
 * POST /groups/:groupId/invite
 * Admin/Treasurer invites a member to join the group
 */
app.post('/groups/:groupId/invite', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId, email } = req.body;

        if (!memberId && !email) {
            return res.status(400).json({ error: 'Either memberId or email is required' });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Check permissions
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Admins, Treasurers, or group creator can invite' });
        }

        // Check max members
        if (groupData.maxMembers && groupData.memberCount >= groupData.maxMembers) {
            return res.status(400).json({ error: 'Group has reached maximum member capacity' });
        }

        // Create invitation
        const invitationRef = await db.collection('invitations').add({
            groupId,
            memberId: memberId || null,
            email: email || null,
            invitedBy: req.user.uid,
            status: 'pending', // pending, accepted, rejected
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        res.status(201).json({
            message: 'Invitation sent successfully',
            invitationId: invitationRef.id
        });
    } catch (error) {
        console.error('Error inviting member:', error);
        res.status(500).json({ error: error.message || 'Failed to invite member' });
    }
});

/**
 * POST /groups/:groupId/join-request
 * Member requests to join a group
 */
app.post('/groups/:groupId/join-request', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Check if already a member
        if (groupData.members.includes(req.user.uid)) {
            return res.status(400).json({ error: 'Already a member of this group' });
        }

        // Check max members
        if (groupData.maxMembers && groupData.memberCount >= groupData.maxMembers) {
            return res.status(400).json({ error: 'Group has reached maximum member capacity' });
        }

        // Create join request
        const requestRef = await db.collection('join-requests').add({
            groupId,
            userId: req.user.uid,
            status: 'pending', // pending, approved, rejected
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            message: 'Join request submitted',
            requestId: requestRef.id
        });
    } catch (error) {
        console.error('Error submitting join request:', error);
        res.status(500).json({ error: error.message || 'Failed to submit join request' });
    }
});

/**
 * GET /groups/:groupId/join-requests
 * Get pending join requests for a group (Admin/Treasurer only)
 */
app.get('/groups/:groupId/join-requests', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Check permissions
        const groupData = groupDoc.data();
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Admins, Treasurers, or group creator can view requests' });
        }

        const requestsSnapshot = await db.collection('join-requests')
            .where('groupId', '==', groupId)
            .where('status', '==', 'pending')
            .get();

        const requests = requestsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ requests });
    } catch (error) {
        console.error('Error fetching join requests:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch join requests' });
    }
});

/**
 * POST /join-requests/:requestId/approve
 * Approve a join request
 */
app.post('/join-requests/:requestId/approve', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const db = admin.firestore();

        const requestDoc = await db.collection('join-requests').doc(requestId).get();
        if (!requestDoc.exists) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const requestData = requestDoc.data();
        const groupDoc = await db.collection('groups').doc(requestData.groupId).get();
        const groupData = groupDoc.data();

        // Check permissions
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Admins, Treasurers, or group creator can approve' });
        }

        // Update request status
        await db.collection('join-requests').doc(requestId).update({
            status: 'approved',
            approvedBy: req.user.uid,
            approvedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Add member to group
        await db.collection('groups').doc(requestData.groupId).update({
            members: admin.firestore.FieldValue.arrayUnion(requestData.userId),
            memberCount: admin.firestore.FieldValue.increment(1)
        });

        // Add group to user's groupIds
        await db.collection('users').doc(requestData.userId).update({
            groupIds: admin.firestore.FieldValue.arrayUnion(requestData.groupId)
        });

        res.json({ message: 'Join request approved' });
    } catch (error) {
        console.error('Error approving request:', error);
        res.status(500).json({ error: error.message || 'Failed to approve request' });
    }
});

/**
 * POST /join-requests/:requestId/reject
 * Reject a join request
 */
app.post('/join-requests/:requestId/reject', verifyToken, async (req, res) => {
    try {
        const { requestId } = req.params;
        const db = admin.firestore();

        const requestDoc = await db.collection('join-requests').doc(requestId).get();
        if (!requestDoc.exists) {
            return res.status(404).json({ error: 'Request not found' });
        }

        const requestData = requestDoc.data();
        const groupDoc = await db.collection('groups').doc(requestData.groupId).get();
        const groupData = groupDoc.data();

        // Check permissions
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Admins, Treasurers, or group creator can reject' });
        }

        await db.collection('join-requests').doc(requestId).update({
            status: 'rejected',
            rejectedBy: req.user.uid,
            rejectedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Join request rejected' });
    } catch (error) {
        console.error('Error rejecting request:', error);
        res.status(500).json({ error: error.message || 'Failed to reject request' });
    }
});

/**
 * GET /user/:userId/groups
 * Get all groups a user belongs to
 */
app.get('/user/:userId/groups', async (req, res) => {
    try {
        const { userId } = req.params;
        const db = admin.firestore();

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        const groupIds = userData.groupIds || [];

        // Fetch all groups
        const groups = [];
        for (const groupId of groupIds) {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            if (groupDoc.exists) {
                groups.push({
                    id: groupId,
                    ...groupDoc.data()
                });
            }
        }

        res.json({ groups, total: groups.length });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user groups' });
    }
});

/**
 * GET /groups/:groupId/members
 * Get all members of a group with details
 */
app.get('/groups/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const memberIds = groupData.members || [];

        // Fetch member details
        const members = [];
        for (const memberId of memberIds) {
            const userDoc = await db.collection('users').doc(memberId).get();
            if (userDoc.exists) {
                members.push({
                    uid: memberId,
                    ...userDoc.data()
                });
            }
        }

        res.json({ members, total: members.length });
    } catch (error) {
        console.error('Error fetching group members:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch group members' });
    }
});

/**
 * POST /groups/:groupId/remove-member
 * Remove a member from a group
 */
app.post('/groups/:groupId/remove-member', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { memberId } = req.body;

        if (!memberId) {
            return res.status(400).json({ error: 'memberId is required' });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Check permissions
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Admins, Treasurers, or group creator can remove members' });
        }

        // Remove member from group
        await db.collection('groups').doc(groupId).update({
            members: admin.firestore.FieldValue.arrayRemove(memberId),
            memberCount: admin.firestore.FieldValue.increment(-1)
        });

        // Remove group from user's groupIds
        await db.collection('users').doc(memberId).update({
            groupIds: admin.firestore.FieldValue.arrayRemove(groupId)
        });

        res.json({ message: 'Member removed from group' });
    } catch (error) {
        console.error('Error removing member:', error);
        res.status(500).json({ error: error.message || 'Failed to remove member' });
    }
});

app.listen(PORT, () => {
    console.log(`🤝 Stockvel Service running on port ${PORT}`);
});
