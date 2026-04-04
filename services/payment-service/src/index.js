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

            // Record contribution in Firestore
            const contributionRef = await db.collection('contributions').add({
                userId: req.user.uid,
                userEmail: req.user.email,
                groupId,
                amount: parseFloat(amount),
                currency: currency,
                transactionId: paymentResult.transactionId,
                paymentMethod: paymentMethod,
                status: 'completed',
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                month: new Date().toISOString().slice(0, 7) // YYYY-MM
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
    console.log(`í²³ Payment Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Mode: Mock Payments (for school project)`);
});

module.exports = app;
