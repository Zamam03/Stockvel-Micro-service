const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

// Fix paths - from payment-service/src to shared folder (3 levels up)
const admin = require('../../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../../shared/middleware/verifyToken');

// Mock payment processing (for school project)
const mockProcessPayment = async (amount, currency, paymentDetails) => {
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock success rate (90% success, 10% failure for testing)
    const shouldSucceed = Math.random() > 0.1;
    
    if (shouldSucceed) {
        return {
            success: true,
            transactionId: `mock_txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: amount,
            currency: currency,
            paymentMethod: paymentDetails.paymentMethod,
            timestamp: new Date().toISOString()
        };
    } else {
        throw new Error('Mock payment failed: Insufficient funds');
    }
};

// Mock bank transfer for payouts
const mockProcessPayout = async (amount, currency, bankDetails) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        success: true,
        transferId: `mock_transfer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        amount: amount,
        currency: currency,
        bankDetails: bankDetails,
        timestamp: new Date().toISOString()
    };
};

app.get('/health', (req, res) => {
    res.json({ service: 'payment-service', status: 'OK', timestamp: new Date().toISOString() });
});

// ========== CONTRIBUTION ENDPOINTS ==========

/**
 * POST /contribute
 * Member makes a contribution to a group
 */
app.post('/contribute', verifyToken, async (req, res) => {
    try {
        const { groupId, amount, paymentMethod, paymentDetails } = req.body;

        if (!groupId || !amount || !paymentMethod) {
            return res.status(400).json({
                error: 'groupId, amount, and paymentMethod are required'
            });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const currency = groupData.currency || 'ZAR';

        // Verify user is a member
        const members = groupData.members || [];
        if (!members.includes(req.user.uid)) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // Process mock payment
        try {
            const paymentResult = await mockProcessPayment(
                parseFloat(amount),
                currency,
                { paymentMethod, ...paymentDetails }
            );

            if (!paymentResult.success) {
                return res.status(400).json({
                    error: 'Payment failed',
                    details: paymentResult.error
                });
            }

            // Record contribution in Firestore (pending treasurer confirmation)
            const contributionRef = await db.collection('contributions').add({
                userId: req.user.uid,
                userEmail: req.user.email,
                groupId,
                amount: parseFloat(amount),
                currency: currency,
                transactionId: paymentResult.transactionId,
                paymentMethod: paymentMethod,
                status: 'pending',
                confirmedAt: null,
                confirmedBy: null,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                month: new Date().toISOString().slice(0, 7)
            });

            // Update user's contribution record
            const userContributionId = `${req.user.uid}_${groupId}`;
            const userContributionRef = db.collection('user-contributions').doc(userContributionId);

            const userContrib = await userContributionRef.get();
            if (userContrib.exists) {
                await userContributionRef.update({
                    totalContributed: admin.firestore.FieldValue.increment(parseFloat(amount)),
                    contributionCount: admin.firestore.FieldValue.increment(1),
                    lastContributionDate: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await userContributionRef.set({
                    userId: req.user.uid,
                    userEmail: req.user.email,
                    groupId,
                    totalContributed: parseFloat(amount),
                    contributionCount: 1,
                    lastContributionDate: admin.firestore.FieldValue.serverTimestamp(),
                    createdAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }

            res.status(201).json({
                message: 'Contribution processed successfully',
                contributionId: contributionRef.id,
                amount: parseFloat(amount),
                transactionId: paymentResult.transactionId,
                status: 'completed'
            });
        } catch (paymentError) {
            console.error('Payment error:', paymentError);
            
            // Log failed contribution
            await db.collection('contributions').add({
                userId: req.user.uid,
                userEmail: req.user.email,
                groupId,
                amount: parseFloat(amount),
                currency: currency,
                paymentMethod: paymentMethod,
                status: 'failed',
                error: paymentError.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(400).json({
                error: 'Payment processing failed',
                details: paymentError.message
            });
        }
    } catch (error) {
        console.error('Error processing contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to process contribution' });
    }
});

/**
 * GET /contributions/:groupId
 * Get all contributions for a group (Treasurer/Admin only)
 */
app.get('/contributions/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Verify access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Treasurers and Admins can view contributions' });
        }

        const contributionsSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .orderBy('timestamp', 'desc')
            .get();

        const contributions = contributionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp
        }));

        res.json({ contributions, total: contributions.length });
    } catch (error) {
        console.error('Error fetching contributions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch contributions' });
    }
});

/**
 * GET /user-contributions/:userId/:groupId
 * Get a user's contributions to a specific group
 */
app.get('/user-contributions/:userId/:groupId', verifyToken, async (req, res) => {
    try {
        const { userId, groupId } = req.params;

        // Users can only view their own contributions or if authorized
        if (req.user.uid !== userId && !['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized to view these contributions' });
        }

        const db = admin.firestore();
        const userContributionId = `${userId}_${groupId}`;
        const userContribRef = db.collection('user-contributions').doc(userContributionId);

        const userContrib = await userContribRef.get();
        if (!userContrib.exists) {
            return res.json({
                totalContributed: 0,
                contributionCount: 0,
                lastContributionDate: null,
                userId: userId,
                groupId: groupId
            });
        }

        res.json(userContrib.data());
    } catch (error) {
        console.error('Error fetching user contributions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch contributions' });
    }
});

/**
 * POST /contributions/:contributionId/confirm
 * Treasurer confirms/accepts a contribution
 */
app.post('/contributions/:contributionId/confirm', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Treasurer') {
            return res.status(403).json({ error: 'Only Treasurers can confirm contributions' });
        }

        const { contributionId } = req.params;
        const db = admin.firestore();

        const contributionDoc = await db.collection('contributions').doc(contributionId).get();
        if (!contributionDoc.exists) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        const contribution = contributionDoc.data();

        if (contribution.status !== 'pending') {
            return res.status(400).json({ error: `Contribution is not pending (current: ${contribution.status})` });
        }

        // Confirm the contribution
        await db.collection('contributions').doc(contributionId).update({
            status: 'confirmed',
            confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
            confirmedBy: req.user.uid
        });

        // Update user-contributions to include this in their total
        const userContributionId = `${contribution.userId}_${contribution.groupId}`;
        const userContribRef = db.collection('user-contributions').doc(userContributionId);

        const userContrib = await userContribRef.get();
        if (userContrib.exists) {
            await userContribRef.update({
                totalContributed: admin.firestore.FieldValue.increment(contribution.amount),
                confirmedAmount: admin.firestore.FieldValue.increment(contribution.amount)
            });
        }

        res.json({
            message: 'Contribution confirmed',
            contributionId: contributionId,
            amount: contribution.amount
        });
    } catch (error) {
        console.error('Error confirming contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to confirm contribution' });
    }
});

/**
 * POST /contributions/:contributionId/flag
 * Treasurer flags a contribution as missed
 */
app.post('/contributions/:contributionId/flag', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Treasurer') {
            return res.status(403).json({ error: 'Only Treasurers can flag contributions' });
        }

        const { contributionId } = req.params;
        const { reason } = req.body;
        const db = admin.firestore();

        const contributionDoc = await db.collection('contributions').doc(contributionId).get();
        if (!contributionDoc.exists) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        const contribution = contributionDoc.data();

        // Flag the contribution
        await db.collection('contributions').doc(contributionId).update({
            status: 'flagged',
            flaggedAt: admin.firestore.FieldValue.serverTimestamp(),
            flaggedBy: req.user.uid,
            flagReason: reason || 'Missed contribution'
        });

        res.json({
            message: 'Contribution flagged',
            contributionId: contributionId,
            status: 'flagged'
        });
    } catch (error) {
        console.error('Error flagging contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to flag contribution' });
    }
});

/**
 * POST /contributions/:contributionId/reject
 * Treasurer rejects a pending contribution
 */
app.post('/contributions/:contributionId/reject', verifyToken, async (req, res) => {
    try {
        if (req.user.role !== 'Treasurer') {
            return res.status(403).json({ error: 'Only Treasurers can reject contributions' });
        }

        const { contributionId } = req.params;
        const { reason } = req.body;
        const db = admin.firestore();

        const contributionDoc = await db.collection('contributions').doc(contributionId).get();
        if (!contributionDoc.exists) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        const contribution = contributionDoc.data();

        if (contribution.status !== 'pending') {
            return res.status(400).json({ error: `Can only reject pending contributions (current: ${contribution.status})` });
        }

        // Reject the contribution
        await db.collection('contributions').doc(contributionId).update({
            status: 'rejected',
            rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
            rejectedBy: req.user.uid,
            rejectionReason: reason || 'Rejected by treasurer'
        });

        res.json({
            message: 'Contribution rejected',
            contributionId: contributionId,
            status: 'rejected'
        });
    } catch (error) {
        console.error('Error rejecting contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to reject contribution' });
    }
});

/**
 * GET /contributions/:groupId/by-month
 * Get contributions grouped by month
 */
app.get('/contributions/:groupId/by-month', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Verify access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Only Treasurers and Admins can view contributions' });
        }

        const contributionsSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .where('status', '==', 'completed')
            .get();

        // Group by month
        const byMonth = {};
        contributionsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const month = data.month || 'unknown';
            if (!byMonth[month]) {
                byMonth[month] = { total: 0, count: 0, transactions: [] };
            }
            byMonth[month].total += data.amount;
            byMonth[month].count++;
            byMonth[month].transactions.push({
                amount: data.amount,
                userEmail: data.userEmail,
                timestamp: data.timestamp?.toDate?.() || data.timestamp
            });
        });

        res.json({ byMonth });
    } catch (error) {
        console.error('Error fetching contributions by month:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch contributions' });
    }
});

// ========== PAYOUT ENDPOINTS ==========

/**
 * POST /payout/initiate
 * Treasurer initiates a payout (for a specific member)
 */
app.post('/payout/initiate', verifyToken, async (req, res) => {
    try {
        // Only Treasurer or Admin can initiate payout
        if (!['Treasurer', 'Admin'].includes(req.user.role)) {
            return res.status(403).json({
                error: 'Only Treasurers and Admins can initiate payouts'
            });
        }

        const { groupId, memberId, amount, bankDetails } = req.body;

        if (!groupId || !memberId || !amount) {
            return res.status(400).json({
                error: 'groupId, memberId, and amount are required'
            });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Get member details
        const userDoc = await db.collection('users').doc(memberId).get();
        const memberEmail = userDoc.exists ? userDoc.data().email : 'unknown';

        // Create payout record
        const payoutRef = await db.collection('payouts').add({
            groupId,
            memberId,
            memberEmail,
            amount: parseFloat(amount),
            bankDetails: bankDetails || { 
                bankName: 'Mock Bank', 
                accountNumber: '****1234',
                accountName: memberEmail
            },
            status: 'pending', // pending, processing, completed, failed
            initiatedBy: req.user.uid,
            initiatedByEmail: req.user.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            message: 'Payout initiated successfully',
            payoutId: payoutRef.id,
            status: 'pending',
            amount: parseFloat(amount)
        });
    } catch (error) {
        console.error('Error initiating payout:', error);
        res.status(500).json({ error: error.message || 'Failed to initiate payout' });
    }
});

/**
 * POST /payout/:payoutId/process
 * Process a payout (mock transfer)
 */
app.post('/payout/:payoutId/process', verifyToken, async (req, res) => {
    try {
        // Only Admin can process payout
        if (req.user.role !== 'Admin') {
            return res.status(403).json({
                error: 'Only Admins can process payouts'
            });
        }

        const { payoutId } = req.params;
        const db = admin.firestore();

        const payoutDoc = await db.collection('payouts').doc(payoutId).get();
        if (!payoutDoc.exists) {
            return res.status(404).json({ error: 'Payout not found' });
        }

        const payoutData = payoutDoc.data();

        if (payoutData.status !== 'pending') {
            return res.status(400).json({ error: `Payout is not in pending status (current: ${payoutData.status})` });
        }

        try {
            // Process mock payout transfer
            const transferResult = await mockProcessPayout(
                payoutData.amount,
                'ZAR',
                payoutData.bankDetails
            );

            // Update payout status
            await db.collection('payouts').doc(payoutId).update({
                status: 'completed',
                transferId: transferResult.transferId,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                transferDetails: transferResult
            });

            res.json({
                message: 'Payout processed successfully',
                payoutId: payoutId,
                transferId: transferResult.transferId,
                status: 'completed'
            });
        } catch (transferError) {
            console.error('Transfer error:', transferError);

            await db.collection('payouts').doc(payoutId).update({
                status: 'failed',
                error: transferError.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(400).json({
                error: 'Payout processing failed',
                details: transferError.message
            });
        }
    } catch (error) {
        console.error('Error processing payout:', error);
        res.status(500).json({ error: error.message || 'Failed to process payout' });
    }
});

/**
 * GET /payouts/:groupId
 * Get all payouts for a group
 */
app.get('/payouts/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Verify access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const payoutsSnapshot = await db.collection('payouts')
            .where('groupId', '==', groupId)
            .orderBy('createdAt', 'desc')
            .get();

        const payouts = payoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt
        }));

        res.json({ payouts, total: payouts.length });
    } catch (error) {
        console.error('Error fetching payouts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch payouts' });
    }
});

/**
 * GET /member-payouts/:memberId/:groupId
 * Get payout history for a specific member in a group
 */
app.get('/member-payouts/:memberId/:groupId', verifyToken, async (req, res) => {
    try {
        const { memberId, groupId } = req.params;

        // Members can view their own payouts
        if (req.user.uid !== memberId && !['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const db = admin.firestore();
        const payoutsSnapshot = await db.collection('payouts')
            .where('groupId', '==', groupId)
            .where('memberId', '==', memberId)
            .orderBy('createdAt', 'desc')
            .get();

        const payouts = payoutsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
            completedAt: doc.data().completedAt?.toDate?.() || doc.data().completedAt
        }));

        res.json({ payouts, total: payouts.length });
    } catch (error) {
        console.error('Error fetching member payouts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch payouts' });
    }
});

/**
 * GET /summary/:groupId
 * Get payment summary for a group
 */
app.get('/summary/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Verify access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        if (!['Admin', 'Treasurer'].includes(req.user.role) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Get all completed contributions
        const contributionsSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .where('status', '==', 'completed')
            .get();

        // Get all payouts
        const payoutsSnapshot = await db.collection('payouts')
            .where('groupId', '==', groupId)
            .where('status', '==', 'completed')
            .get();

        const totalContributions = contributionsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        const totalPayouts = payoutsSnapshot.docs.reduce((sum, doc) => sum + doc.data().amount, 0);
        const availableBalance = totalContributions - totalPayouts;

        res.json({
            groupId,
            groupName: groupData.groupName,
            summary: {
                totalContributions: totalContributions,
                totalPayouts: totalPayouts,
                availableBalance: availableBalance,
                contributionCount: contributionsSnapshot.size,
                payoutCount: payoutsSnapshot.size
            },
            currency: groupData.currency || 'ZAR'
        });
    } catch (error) {
        console.error('Error fetching payment summary:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch payment summary' });
    }
});

// ========== TREASURER PAYMENT CONFIRMATION ENDPOINTS ==========

/**
 * POST /contributions/:contributionId/confirm
 * Treasurer confirms a contribution
 */
app.post('/contributions/:contributionId/confirm', verifyToken, async (req, res) => {
    try {
        const { contributionId } = req.params;
        const db = admin.firestore();

        // Only Treasurers and Admins can confirm
        if (!['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only Treasurers and Admins can confirm contributions' });
        }

        const contributionDoc = await db.collection('contributions').doc(contributionId).get();
        if (!contributionDoc.exists) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        const contribution = contributionDoc.data();

        if (contribution.status === 'confirmed') {
            return res.status(400).json({ error: 'Contribution already confirmed' });
        }

        await db.collection('contributions').doc(contributionId).update({
            status: 'confirmed',
            confirmedBy: req.user.uid,
            confirmedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            message: 'Contribution confirmed',
            contributionId: contributionId,
            status: 'confirmed'
        });
    } catch (error) {
        console.error('Error confirming contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to confirm contribution' });
    }
});

/**
 * POST /contributions/:contributionId/flag
 * Treasurer flags a missed contribution
 */
app.post('/contributions/:contributionId/flag', verifyToken, async (req, res) => {
    try {
        const { contributionId } = req.params;
        const { reason } = req.body;
        const db = admin.firestore();

        // Only Treasurers and Admins can flag
        if (!['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only Treasurers and Admins can flag contributions' });
        }

        const contributionDoc = await db.collection('contributions').doc(contributionId).get();
        if (!contributionDoc.exists) {
            return res.status(404).json({ error: 'Contribution not found' });
        }

        await db.collection('contributions').doc(contributionId).update({
            status: 'flagged',
            flaggedReason: reason || 'Missed contribution',
            flaggedBy: req.user.uid,
            flaggedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.json({
            message: 'Contribution flagged',
            contributionId: contributionId,
            status: 'flagged'
        });
    } catch (error) {
        console.error('Error flagging contribution:', error);
        res.status(500).json({ error: error.message || 'Failed to flag contribution' });
    }
});

/**
 * GET /missed-contributions/:groupId
 * Get all flagged/missed contributions in a group
 */
app.get('/missed-contributions/:groupId', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Only Treasurers and Admins can view
        if (!['Admin', 'Treasurer'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only Treasurers and Admins can view missed contributions' });
        }

        const missedSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .where('status', '==', 'flagged')
            .orderBy('timestamp', 'desc')
            .get();

        const missedContributions = missedSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate?.() || doc.data().timestamp,
            flaggedAt: doc.data().flaggedAt?.toDate?.() || doc.data().flaggedAt
        }));

        res.json({ missedContributions, total: missedContributions.length });
    } catch (error) {
        console.error('Error fetching missed contributions:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch missed contributions' });
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
    console.log(`��� Payment Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Mode: Mock Payments (for school project)`);
});

module.exports = app;
