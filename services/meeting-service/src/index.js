const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;
const admin = require('../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../shared/middleware/verifyToken');

app.get('/health', (req, res) => {
    res.json({ service: 'meeting-service', status: 'OK' });
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
            meetingType = 'general' // general, voting, payout
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
            scheduledDate: new Date(scheduledDate),
            location: location || 'TBD',
            meetingType,
            createdBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            status: 'scheduled', // scheduled, ongoing, completed, cancelled
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
 * GET /meetings/:groupId
 * Get all meetings for a group
 */
app.get('/meetings/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        const meetingsSnapshot = await db.collection('meetings')
            .where('groupId', '==', groupId)
            .orderBy('scheduledDate', 'desc')
            .get();

        const meetings = meetingsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({ meetings, total: meetings.length });
    } catch (error) {
        console.error('Error fetching meetings:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch meetings' });
    }
});

/**
 * GET /meetings/:groupId/upcoming
 * Get upcoming meetings for a group
 */
app.get('/meetings/:groupId/upcoming', async (req, res) => {
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
            ...doc.data()
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

        res.json({ meeting: { id: meetingId, ...meetingDoc.data() } });
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
        const { agenda } = req.body; // Array of agenda items

        if (!agenda || !Array.isArray(agenda)) {
            return res.status(400).json({ error: 'agenda must be an array' });
        }

        const db = admin.firestore();
        const meetingDoc = await db.collection('meetings').doc(meetingId).get();

        if (!meetingDoc.exists) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Verify permission
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
        if (!meetingData.attendees) {
            meetingData.attendees = [];
        }

        // Add user to attendees if not already present
        if (!meetingData.attendees.includes(req.user.uid)) {
            meetingData.attendees.push(req.user.uid);
            await db.collection('meetings').doc(meetingId).update({
                attendees: meetingData.attendees
            });
        }

        res.json({ message: 'Attendance marked', attendeeCount: meetingData.attendees.length });
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

        // Verify permission
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

        // Get group members
        const groupDoc = await db.collection('groups').doc(meetingData.groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const members = groupData.members || [];

        // Create notifications for each member
        for (const memberId of members) {
            await db.collection('notifications').add({
                userId: memberId,
                type: 'meeting',
                title: `Meeting: ${meetingData.title}`,
                message: `A new meeting has been scheduled: ${meetingData.title}`,
                meetingId,
                groupId: meetingData.groupId,
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });
        }

        res.json({
            message: 'Notifications sent to all group members',
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

        // Users can only view their own notifications
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
            ...doc.data()
        }));

        res.json({ notifications, total: notifications.length });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
    }
});

app.listen(PORT, () => {
    console.log(`📅 Meeting Service running on port ${PORT}`);
});
