const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;

// Fix paths - from stockvel-service/src to shared folder (3 levels up)
const admin = require('../../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'stockvel-service', status: 'OK', timestamp: new Date().toISOString() });
});

// ========== SA PRIME RATE ENDPOINT ==========

app.get('/sa-prime-rate', async (req, res) => {
    try {
        const mockRate = 11.75;
        const repoRate = 10.75;
        
        res.json({ 
            primeLendingRate: mockRate, 
            repoRate: repoRate,
            source: 'SARB Mock Data (School Project)',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching SA rates:', error);
        res.status(500).json({ error: 'Failed to fetch SA rates' });
    }
});

// ========== GROUP MANAGEMENT ENDPOINTS ==========

app.post('/groups', verifyToken, async (req, res) => {
    try {
        if (!['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only Admins and Treasurers can create groups' });
        }

        const {
            groupName,
            description,
            contributionAmount,
            currency = 'ZAR',
            meetingFrequency = 'monthly',
            maxMembers = null,
            payoutOrder = 'rotating',
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
            maxMembers: maxMembers ? parseInt(maxMembers) : null,
            payoutOrder,
            startDate: new Date(startDate),
            targetFund: targetFund ? parseFloat(targetFund) : null,
            createdBy: req.user.uid,
            createdByEmail: req.user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            members: [req.user.uid],
            memberCount: 1,
            isActive: true,
            status: 'active'
        };

        const groupRef = await db.collection('groups').add(groupData);

        const userRef = db.collection('users').doc(req.user.uid);
        const userDoc = await userRef.get();
        
        if (userDoc.exists) {
            await userRef.update({
                groupIds: admin.firestore.FieldValue.arrayUnion(groupRef.id)
            });
        } else {
            await userRef.set({
                uid: req.user.uid,
                email: req.user.email,
                groupIds: [groupRef.id],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(201).json({
            message: 'Group created successfully',
            groupId: groupRef.id
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ error: error.message || 'Failed to create group' });
    }
});

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
            ...doc.data(),
            startDate: doc.data().startDate?.toDate?.() || doc.data().startDate,
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json({ groups, total: groups.length });
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch groups' });
    }
});

app.get('/groups/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        res.json({ 
            group: { 
                id: groupId, 
                ...groupData,
                startDate: groupData.startDate?.toDate?.() || groupData.startDate,
                createdAt: groupData.createdAt?.toDate?.() || groupData.createdAt
            } 
        });
    } catch (error) {
        console.error('Error fetching group:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch group' });
    }
});

app.put('/groups/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        if (groupData.createdBy !== req.user.uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only group creator or Admin can update' });
        }

        const updateData = req.body;
        delete updateData.createdBy;
        delete updateData.members;
        delete updateData.memberCount;
        
        updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

        await db.collection('groups').doc(groupId).update(updateData);

        res.json({ message: 'Group updated successfully' });
    } catch (error) {
        console.error('Error updating group:', error);
        res.status(500).json({ error: error.message || 'Failed to update group' });
    }
});

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

// ========== USER GROUPS ENDPOINTS ==========

app.get('/user/:userId/groups', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const db = admin.firestore();

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.json({ groups: [] });
        }

        const groupIds = userDoc.data().groupIds || [];
        const groups = [];

        for (const groupId of groupIds) {
            const groupDoc = await db.collection('groups').doc(groupId).get();
            if (groupDoc.exists) {
                groups.push({
                    id: groupId,
                    ...groupDoc.data(),
                    startDate: groupDoc.data().startDate?.toDate?.() || groupDoc.data().startDate,
                    createdAt: groupDoc.data().createdAt?.toDate?.() || groupDoc.data().createdAt
                });
            }
        }

        res.json({ groups, total: groups.length });
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch user groups' });
    }
});

// ========== GROUP JOIN/LEAVE ENDPOINTS ==========

app.post('/groups/:groupId/join', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.uid;
        const db = admin.firestore();

        console.log(`[JOIN] User ${userId} attempting to join group ${groupId}`);

        // Get group
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            console.log(`[JOIN] Group ${groupId} not found`);
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const members = groupData.members || [];

        console.log(`[JOIN] Group found with ${members.length} members`);

        // Check if already a member
        if (members.includes(userId)) {
            console.log(`[JOIN] User ${userId} is already a member`);
            return res.status(400).json({ error: 'Already a member of this group' });
        }

        // Check max members limit
        if (groupData.maxMembers && members.length >= groupData.maxMembers) {
            console.log(`[JOIN] Group at max capacity (${groupData.maxMembers})`);
            return res.status(400).json({ error: 'Group is at maximum capacity' });
        }

        // Add member to group
        members.push(userId);
        await db.collection('groups').doc(groupId).update({
            members,
            memberCount: members.length,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`[JOIN] Added user ${userId} to group members`);

        // Add group to user's groupIds
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const groupIds = userDoc.data().groupIds || [];
            if (!groupIds.includes(groupId)) {
                groupIds.push(groupId);
                await userRef.update({
                    groupIds,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log(`[JOIN] Updated user ${userId} groupIds with ${groupId}`);
            }
        } else {
            await userRef.set({
                uid: userId,
                email: req.user.email,
                groupIds: [groupId],
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`[JOIN] Created user doc for ${userId} with group ${groupId}`);
        }

        console.log(`[JOIN] ✅ User ${userId} successfully joined group ${groupId}`);

        res.status(200).json({
            message: 'Successfully joined group',
            groupId: groupId
        });
    } catch (error) {
        console.error(`[JOIN] ❌ Error joining group:`, error);
        res.status(500).json({ error: error.message || 'Failed to join group' });
    }
});

app.post('/groups/:groupId/leave', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.uid;
        const db = admin.firestore();

        // Get group
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const members = groupData.members || [];

        // Check if member
        if (!members.includes(userId)) {
            return res.status(400).json({ error: 'Not a member of this group' });
        }

        // Check if last member or creator
        if (members.length === 1 || groupData.createdBy === userId) {
            return res.status(400).json({ error: 'Cannot leave: group creator or last member' });
        }

        // Remove member from group
        const updatedMembers = members.filter(id => id !== userId);
        await db.collection('groups').doc(groupId).update({
            members: updatedMembers,
            memberCount: updatedMembers.length,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Remove group from user's groupIds
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (userDoc.exists) {
            const groupIds = (userDoc.data().groupIds || []).filter(id => id !== groupId);
            await userRef.update({
                groupIds,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.status(200).json({
            message: 'Successfully left group',
            groupId: groupId
        });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ error: error.message || 'Failed to leave group' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
    console.log(`��� Stockvel Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
