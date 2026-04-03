const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;
const admin = require('../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../shared/middleware/verifyToken');

const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { Readable } = require('stream');

app.get('/health', (req, res) => {
    res.json({ service: 'analytics-service', status: 'OK' });
});

// ========== ANALYTICS ENDPOINTS ==========

/**
 * GET /dashboard/:groupId/contribution-compliance
 * Dashboard Report 1: Contribution compliance per member over time
 */
app.get('/dashboard/:groupId/contribution-compliance', verifyToken, async (req, res) => {
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

        // Get group members and their contribution records
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();

        const complianceData = [];
        for (const doc of userContribsSnapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                complianceData.push({
                    userId: data.userId,
                    userName: userData.displayName,
                    email: userData.email,
                    totalContributed: data.totalContributed,
                    contributionCount: data.contributionCount,
                    lastContributionDate: data.lastContributionDate,
                    expectedContributions: data.contributionCount, // Can be calculated based on group setup
                    complianceRate: 100 // Percentage
                });
            }
        }

        res.json({
            report: 'Contribution Compliance per Member',
            groupId,
            data: complianceData,
            summary: {
                totalMembers: complianceData.length,
                averageComplianceRate: complianceData.reduce((sum, d) => sum + d.complianceRate, 0) / complianceData.length,
                totalContributions: complianceData.reduce((sum, d) => sum + d.totalContributed, 0)
            }
        });
    } catch (error) {
        console.error('Error generating compliance report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});

/**
 * GET /dashboard/:groupId/payout-history
 * Dashboard Report 2: Payout history and upcoming payout projections
 */
app.get('/dashboard/:groupId/payout-history', verifyToken, async (req, res) => {
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

        // Get all payouts
        const payoutsSnapshot = await db.collection('payouts')
            .where('groupId', '==', groupId)
            .orderBy('createdAt', 'desc')
            .get();

        const payoutHistory = [];
        const completedPayouts = [];
        let totalPayedOut = 0;

        for (const doc of payoutsSnapshot.docs) {
            const data = doc.data();
            payoutHistory.push(data);

            if (data.status === 'completed') {
                completedPayouts.push(data);
                totalPayedOut += data.amount;
            }
        }

        // Project upcoming payouts
        const upcomingProjections = calculatePayoutProjections(groupData, completedPayouts);

        res.json({
            report: 'Payout History and Projections',
            groupId,
            payoutHistory: payoutHistory.slice(0, 50), // Last 50
            projections: upcomingProjections,
            summary: {
                totalPayedOut,
                completedPayouts: completedPayouts.length,
                pendingPayouts: payoutHistory.filter(p => p.status === 'pending').length,
                averagePayoutAmount: totalPayedOut / (completedPayouts.length || 1)
            }
        });
    } catch (error) {
        console.error('Error generating payout report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});

/**
 * GET /dashboard/:groupId/custom
 * Dashboard Report 3: Custom view (savings growth, member retention, etc.)
 */
app.get('/dashboard/:groupId/custom', verifyToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const db = admin.firestore();

        // Verify access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();

        // Get all contributions for this group
        const contributionsSnapshot = await db.collection('contributions')
            .where('groupId', '==', groupId)
            .where('status', '==', 'completed')
            .get();

        // Calculate metrics
        const contributions = contributionsSnapshot.docs.map(doc => doc.data());
        const totalSavings = contributions.reduce((sum, c) => sum + c.amount, 0);
        const memberCount = groupData.memberCount || 0;

        // Get current prime rate for projections
        const primeRate = 11.75; // Fetched from stockvel-service in real scenario
        const projectedGrowth = calculateProjectedGrowth(totalSavings, primeRate);

        res.json({
            report: 'Custom Analytics View',
            groupId,
            metrics: {
                totalSavings,
                memberCount,
                averageSavingsPerMember: totalSavings / (memberCount || 1),
                totalContributions: contributions.length,
                groupStartDate: groupData.startDate,
                currentStatus: groupData.status,
                targetFund: groupData.targetFund,
                progressToTarget: groupData.targetFund ? 
                    (totalSavings / groupData.targetFund * 100).toFixed(2) + '%' : 'N/A'
            },
            projections: {
                projectedGrowthRate: primeRate + '%',
                projectedSavingsIn3Months: (totalSavings * (1 + primeRate / 100 / 4)).toFixed(2),
                projectedSavingsIn6Months: (totalSavings * (1 + primeRate / 100 / 2)).toFixed(2),
                projectedSavingsIn1Year: (totalSavings * (1 + primeRate / 100)).toFixed(2)
            }
        });
    } catch (error) {
        console.error('Error generating custom report:', error);
        res.status(500).json({ error: error.message || 'Failed to generate report' });
    }
});

/**
 * GET /export/compliance/:groupId/csv
 * Export contribution compliance report as CSV
 */
app.get('/export/compliance/:groupId/csv', verifyToken, async (req, res) => {
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

        // Get compliance data
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();

        const csvData = [];
        for (const doc of userContribsSnapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                csvData.push({
                    'Member Name': userData.displayName,
                    'Email': userData.email,
                    'Total Contributed': data.totalContributed,
                    'Contribution Count': data.contributionCount,
                    'Last Contribution Date': data.lastContributionDate?.toDate?.() || 'N/A'
                });
            }
        }

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="compliance_${groupId}_${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: error.message || 'Failed to export' });
    }
});

/**
 * GET /export/payout/:groupId/csv
 * Export payout history as CSV
 */
app.get('/export/payout/:groupId/csv', verifyToken, async (req, res) => {
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
            .get();

        const csvData = [];
        for (const doc of payoutsSnapshot.docs) {
            const data = doc.data();
            csvData.push({
                'Payout ID': doc.id,
                'Member ID': data.memberId,
                'Amount': data.amount,
                'Status': data.status,
                'Created Date': data.createdAt?.toDate?.() || 'N/A',
                'Completed Date': data.completedAt?.toDate?.() || 'N/A'
            });
        }

        const parser = new Parser();
        const csv = parser.parse(csvData);

        res.header('Content-Type', 'text/csv');
        res.header('Content-Disposition', `attachment; filename="payouts_${groupId}_${Date.now()}.csv"`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting CSV:', error);
        res.status(500).json({ error: error.message || 'Failed to export' });
    }
});

/**
 * GET /export/compliance/:groupId/pdf
 * Export compliance report as PDF
 */
app.get('/export/compliance/:groupId/pdf', verifyToken, async (req, res) => {
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

        // Create PDF
        const doc = new PDFDocument();
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', `attachment; filename="compliance_${groupId}_${Date.now()}.pdf"`);

        doc.pipe(res);

        // Add header
        doc.fontSize(20).text('Contribution Compliance Report', 100, 50);
        doc.fontSize(12).text(`Group: ${groupData.groupName}`, 100, 100);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 100, 120);

        // Add data
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();

        let yPosition = 160;
        doc.fontSize(10).text('Member Name | Total Contributed | Contributions', 100, yPosition);
        yPosition += 20;

        for (const docSnapshot of userContribsSnapshot.docs) {
            const data = docSnapshot.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                doc.text(
                    `${userData.displayName} | R${data.totalContributed.toFixed(2)} | ${data.contributionCount}`,
                    100,
                    yPosition
                );
                yPosition += 15;
            }
        }

        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ error: error.message || 'Failed to export' });
    }
});

// ========== HELPER FUNCTIONS ==========

function calculatePayoutProjections(groupData, completedPayouts) {
    // Simple projection based on group configuration
    const totalMembers = groupData.memberCount || 0;
    const contributionAmount = groupData.contributionAmount || 0;
    const meetingFrequency = groupData.meetingFrequency || 'monthly';

    let frequencyMultiplier = 1;
    if (meetingFrequency === 'weekly') frequencyMultiplier = 4;
    if (meetingFrequency === 'monthly') frequencyMultiplier = 1;
    if (meetingFrequency === 'quarterly') frequencyMultiplier = 0.25;

    const nextPayoutAmount = contributionAmount * totalMembers * frequencyMultiplier;

    return [
        {
            month: 'Next Month',
            projectedAmount: nextPayoutAmount,
            expectedRecipients: Math.ceil(totalMembers / (completedPayouts.length + 1))
        },
        {
            month: 'In 3 Months',
            projectedAmount: nextPayoutAmount * 3,
            expectedRecipients: totalMembers
        }
    ];
}

function calculateProjectedGrowth(totalSavings, primeRate) {
    return {
        rate: primeRate,
        amount3Months: (totalSavings * (1 + primeRate / 100 / 4)).toFixed(2),
        amount6Months: (totalSavings * (1 + primeRate / 100 / 2)).toFixed(2),
        amount1Year: (totalSavings * (1 + primeRate / 100)).toFixed(2)
    };
}

app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on port ${PORT}`);
});
