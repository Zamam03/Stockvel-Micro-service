const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;
const admin = require('../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../shared/middleware/verifyToken');

// Initialize Stripe (can be replaced with Yoco)
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

app.get('/health', (req, res) => {
    res.json({ service: 'payment-service', status: 'OK' });
});

// ========== CONTRIBUTION ENDPOINTS ==========

/**
 * POST /contribute
 * Member makes a contribution to a group
 */
app.post('/contribute', verifyToken, async (req, res) => {
    try {
        const { groupId, amount, paymentMethodId } = req.body;

        if (!groupId || !amount || !paymentMethodId) {
            return res.status(400).json({
                error: 'groupId, amount, and paymentMethodId are required'
            });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Verify user is a member
        if (!groupData.members.includes(req.user.uid)) {
            return res.status(403).json({ error: 'You are not a member of this group' });
        }

        // Process payment via Stripe
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: groupData.currency.toLowerCase() || 'zar',
                payment_method: paymentMethodId,
                confirm: true,
                metadata: {
                    groupId,
                    userId: req.user.uid,
                    userEmail: req.user.email
                }
            });

            if (paymentIntent.status !== 'succeeded') {
                return res.status(400).json({
                    error: 'Payment failed',
                    paymentStatus: paymentIntent.status
                });
            }

            // Record contribution in Firestore
            const contributionRef = await db.collection('contributions').add({
                userId: req.user.uid,
                groupId,
                amount: parseFloat(amount),
                currency: groupData.currency,
                paymentIntentId: paymentIntent.id,
                status: 'completed', // pending, completed, failed
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                month: new Date().toISOString().slice(0, 7) // YYYY-MM
            });

            // Update user's contribution record
            const userContributionRef = db.collection('user-contributions').doc(
                `${req.user.uid}_${groupId}`
            );

            const userContrib = await userContributionRef.get();
            if (userContrib.exists) {
                await userContributionRef.update({
                    totalContributed: admin.firestore.FieldValue.increment(parseFloat(amount)),
                    contributionCount: admin.firestore.FieldValue.increment(1),
                    lastContributionDate: admin.firestore.FieldValue.serverTimestamp()
                });
            } else {
                await userContributionRef.set({
                    userId: req.user.uid,
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
                paymentIntentId: paymentIntent.id
            });
        } catch (stripeError) {
            console.error('Stripe error:', stripeError);
            
            // Log failed contribution
            await db.collection('contributions').add({
                userId: req.user.uid,
                groupId,
                amount: parseFloat(amount),
                currency: groupData.currency,
                status: 'failed',
                error: stripeError.message,
                timestamp: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(400).json({
                error: 'Payment processing failed',
                details: stripeError.message
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
            ...doc.data()
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
        const userContribRef = db.collection('user-contributions').doc(
            `${userId}_${groupId}`
        );

        const userContrib = await userContribRef.get();
        if (!userContrib.exists) {
            return res.json({
                totalContributed: 0,
                contributionCount: 0,
                lastContributionDate: null
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
                byMonth[month] = { total: 0, count: 0 };
            }
            byMonth[month].total += data.amount;
            byMonth[month].count++;
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

        if (!groupId || !memberId || !amount || !bankDetails) {
            return res.status(400).json({
                error: 'groupId, memberId, amount, and bankDetails are required'
            });
        }

        const db = admin.firestore();
        const groupDoc = await db.collection('groups').doc(groupId).get();

        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        // Create payout record
        const payoutRef = await db.collection('payouts').add({
            groupId,
            memberId,
            amount: parseFloat(amount),
            bankDetails, // { accountName, accountNumber, bankName, branchCode }
            status: 'pending', // pending, processing, completed, failed
            initiatedBy: req.user.uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(201).json({
            message: 'Payout initiated successfully',
            payoutId: payoutRef.id,
            status: 'pending'
        });
    } catch (error) {
        console.error('Error initiating payout:', error);
        res.status(500).json({ error: error.message || 'Failed to initiate payout' });
    }
});

/**
 * POST /payout/:payoutId/process
 * Process a payout (transfer funds)
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
            return res.status(400).json({ error: 'Payout is not in pending status' });
        }

        try {
            // Process transfer via Stripe (or alternative banking API)
            // This is a mock - in production, use proper banking integration
            const transfer = await stripe.transfers.create({
                amount: Math.round(payoutData.amount * 100),
                currency: 'zar',
                destination: payoutData.bankDetails.stripeAccountId || 'acct_test',
                metadata: {
                    payoutId,
                    memberId: payoutData.memberId,
                    groupId: payoutData.groupId
                }
            });

            // Update payout status
            await db.collection('payouts').doc(payoutId).update({
                status: 'completed',
                transferId: transfer.id,
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({
                message: 'Payout processed successfully',
                transferId: transfer.id
            });
        } catch (stripeError) {
            console.error('Stripe transfer error:', stripeError);

            await db.collection('payouts').doc(payoutId).update({
                status: 'failed',
                error: stripeError.message,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(400).json({
                error: 'Payout processing failed',
                details: stripeError.message
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
            ...doc.data()
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
            ...doc.data()
        }));

        res.json({ payouts, total: payouts.length });
    } catch (error) {
        console.error('Error fetching member payouts:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch payouts' });
    }
});

app.listen(PORT, () => {
    console.log(`💳 Payment Service running on port ${PORT}`);
});
