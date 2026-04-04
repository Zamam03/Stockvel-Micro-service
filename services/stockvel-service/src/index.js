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
    console.log(`Ì¥ù Stockvel Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
