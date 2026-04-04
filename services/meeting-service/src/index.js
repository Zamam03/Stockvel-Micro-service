const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;

// Fix paths - from meeting-service/src to shared folder (3 levels up)
const admin = require('../../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'meeting-service', status: 'OK', timestamp: new Date().toISOString() });
});

// ========== MEETING MANAGEMENT ENDPOINTS ==========

/**
 * POST /meetings
 * Treasurer/Admin schedules a meeting for a group
 */
app.post('/meetings', verifyToken, async (req, res) => {
    try {
        const {
            groupId,
            title,
            description,
            scheduledDate,
            location,
            meetingType = 'general'
        } = req.body;

        if (!groupId || !title || !scheduledDate) {
            return res.status(400).json({
                error: 'groupId, title, and scheduledDate are required'
            });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Only Treasurer/Admin or group creator can schedule
        if (!['Treasurer', 'Admin'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({
                error: 'Only Treasurers, Admins, or group creator can schedule meetings'
            });
        }

        const meetingRef = await db.collection('meetings').add({
            groupId,
            title,
            description: description || '',
            scheduledDate: admin.firestore.Timestamp.fromDate(new Date(scheduledDate)),
            location: location || 'TBD',
            meetingType,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'scheduled',
            agenda: [],
            minutes: '',
            attendees: []
        });

        res.status(201).json({
            message: 'Meeting scheduled successfully',
            meetingId: meetingRef.id
        });
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({ error: error.message || 'Failed to schedule meeting' });
    }
});

/**
 * GET /meetings/group/:groupId
 * Get all meetings for a group
 */
app.get('/meetings/group/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        const meetingsSnapshot = await db.collection('meetings')
            .where('groupId', '==', groupId)
            .orderBy('scheduledDate', 'desc')
            .get();

        const meetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate
        }));

        res.json({ meetings, total: meetings.length });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch meetings' });
    }
});

/**
 * GET /meetings/group/:groupId/upcoming
 * Get upcoming meetings for a group
 */
app.get('/meetings/group/:groupId/upcoming', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();
        const now = new Date();

        const meetingsSnapshot = await db.collection('meetings')
            .where('groupId', '==', groupId)
            .where('scheduledDate', '>=', now)
            .where('status', '==', 'scheduled')
            .orderBy('scheduledDate', 'asc')
            .get();

        const meetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            scheduledDate: doc.data().scheduledDate?.toDate?.() || doc.data().scheduledDate
        }));

        res.json({ meetings, total: meetings.length });
    } catch (error) {
        console.error('Error fetching upcoming meetings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch upcoming meetings' });
    }
});

/**
 * GET /meetings/:meetingId
 * Get meeting details
 */
app.get('/meetings/:meetingId', async (req, res) => {
    try {
        const { meetingId } = req.params;
        const db = admin.firestore();

        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();
        res.json({ 
            meeting: { 
                id: meetingId, 
                ...meetingData,
                scheduledDate: meetingData.scheduledDate?.toDate?.() || meetingData.scheduledDate
            } 
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch meeting' });
    }
});

/**
 * PUT /meetings/:meetingId/agenda
 * Add or update meeting agenda
 */
app.put('/meetings/:meetingId/agenda', verifyToken, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { agenda } = req.body;

        if (!agenda || !Array.isArray(agenda)) {
            return res.status(400).json({ error: 'agenda must be an array' });
        }

        const db = admin.firestore();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();

        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();
        if (meetingData.createdBy !== req.user.uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Only creator or Admin can update agenda' });
        }

        await db.collection('meetings').doc(meetingId).update({
            agenda,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Agenda updated successfully' });
    } catch (error) {
        console.error('Error updating agenda:', error);
        res.status(500).json({ error: error.message || 'Failed to update agenda' });
    }
});

/**
 * POST /meetings/:meetingId/mark-attended
 * Mark attendee as present
 */
app.post('/meetings/:meetingId/mark-attended', verifyToken, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const db = admin.firestore();

        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();
        const attendees = meetingData.attendees || [];

        if (!attendees.includes(req.user.uid)) {
            attendees.push(req.user.uid);
            await db.collection('meetings').doc(meetingId).update({
                attendees: attendees,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({ message: 'Attendance marked', attendeeCount: attendees.length });
    } catch (error) {
        console.error('Error marking attendance:', error);
        res.status(500).json({ error: error.message || 'Failed to mark attendance' });
    }
});

/**
 * PUT /meetings/:meetingId/minutes
 * Record meeting minutes (Treasurer/Admin only)
 */
app.put('/meetings/:meetingId/minutes', verifyToken, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { minutes } = req.body;

        if (!minutes) {
            return res.status(400).json({ error: 'minutes is required' });
        }

        const db = admin.firestore();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();

        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();
        if (!['Treasurer', 'Admin'].includes(req.user.role) &&
            meetingData.createdBy !== req.user.uid) {
            return res.status(403).json({
                error: 'Only Treasurers, Admins, or meeting creator can record minutes'
            });
        }

        await db.collection('meetings').doc(meetingId).update({
            minutes,
            status: 'completed',
            completedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Meeting minutes recorded successfully' });
    } catch (error) {
        console.error('Error recording minutes:', error);
        res.status(500).json({ error: error.message || 'Failed to record minutes' });
    }
});

/**
 * PUT /meetings/:meetingId/status
 * Update meeting status
 */
app.put('/meetings/:meetingId/status', verifyToken, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const { status } = req.body;

        if (!['scheduled', 'ongoing', 'completed', 'cancelled'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const db = admin.firestore();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();

        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();
        if (meetingData.createdBy !== req.user.uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.collection('meetings').doc(meetingId).update({
            status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: `Meeting status changed to ${status}` });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: error.message || 'Failed to update status' });
    }
});

/**
 * POST /meetings/:meetingId/notify
 * Send notifications to group members about meeting
 */
app.post('/meetings/:meetingId/notify', verifyToken, async (req, res) => {
    try {
        const { meetingId } = req.params;
        const db = admin.firestore();

        const meetingDoc = await db.collection('meetings').doc(meetingId).get();
        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        const meetingData = meetingDoc.data();

        // Get group members (assuming members array exists)
        const groupDoc = await db.collection('groups').doc(meetingData.groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const members = groupData.members || [];

        // Create notifications for each member
        const notifications = [];
        for (const memberId of members) {
            const notificationRef = await db.collection('notifications').add({
                userId: memberId,
                type: 'meeting',
                title: `Meeting: ${meetingData.title}`,
                message: `A new meeting has been scheduled: ${meetingData.title} on ${meetingData.scheduledDate?.toDate?.() || meetingData.scheduledDate}`,
                meetingId,
                groupId: meetingData.groupId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
            notifications.push(notificationRef.id);
        }

        res.json({
            message: 'Notifications sent to group members',
            notificationCount: members.length
        });
    } catch (error) {
        console.error('Error sending notifications:', error);
        res.status(500).json({ error: error.message || 'Failed to send notifications' });
    }
});

/**
 * GET /notifications/:userId
 * Get notifications for a user
 */
app.get('/notifications/:userId', verifyToken, async (req, res) => {
    try {
        const { userId } = req.params;

        if (req.user.uid !== userId && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const db = admin.firestore();
        const notificationsSnapshot = await db.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(50)
            .get();

        const notifications = notificationsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
        }));

        res.json({ notifications, total: notifications.length });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
});

/**
 * PUT /notifications/:notificationId/read
 * Mark notification as read
 */
app.put('/notifications/:notificationId/read', verifyToken, async (req, res) => {
    try {
        const { notificationId } = req.params;
        const db = admin.firestore();

        const notificationDoc = await db.collection('notifications').doc(notificationId).get();
        if (!notificationDoc.exists) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        const notificationData = notificationDoc.data();
        if (notificationData.userId !== req.user.uid && req.user.role !== 'Admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await db.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: error.message || 'Failed to mark notification as read' });
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
    console.log(`í³… Meeting Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
