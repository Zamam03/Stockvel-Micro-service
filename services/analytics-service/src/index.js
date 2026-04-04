const express = require('express');
const cors = require('cors');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;

// Fix the path based on your actual structure
const admin = require('../../../shared/firebase/firebaseAdmin');
const verifyToken = require('../../../shared/middleware/verifyToken');

const PDFDocument = require('pdfkit');
const { Parser } = require('json2csv');
const { Readable } = require('stream');

// ========== HELPER FUNCTIONS (move to top) ==========

function formatFirestoreTimestamp(timestamp) {
    if (!timestamp) return 'N/A';
    if (timestamp.toDate) return timestamp.toDate().toISOString();
    if (timestamp instanceof Date) return timestamp.toISOString();
    return String(timestamp);
}

function calculatePayoutProjections(groupData, completedPayouts) {
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

// ========== MIDDLEWARE ==========

// Optional: Add request logging
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

app.get('/health', (req, res) => {
    res.json({ 
        service: 'analytics-service', 
        status: 'OK',
        timestamp: new Date().toISOString()
    });
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

        // Verify group exists and user has access
        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const userRole = req.user.role || req.user.firebase?.role;
        
        if (!['Admin', 'Treasurer'].includes(userRole) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized: Insufficient permissions' });
        }

        // Get group members and their contribution records
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();

        const complianceData = [];
        let totalComplianceRate = 0;

        for (const doc of userContribsSnapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                const expectedContributions = groupData.expectedContributionsPerMember || data.contributionCount;
                const complianceRate = expectedContributions > 0 
                    ? (data.contributionCount / expectedContributions) * 100 
                    : 100;
                
                complianceData.push({
                    userId: data.userId,
                    userName: userData.displayName || userData.name || 'Unknown',
                    email: userData.email,
                    totalContributed: data.totalContributed || 0,
                    contributionCount: data.contributionCount || 0,
                    lastContributionDate: formatFirestoreTimestamp(data.lastContributionDate),
                    expectedContributions: expectedContributions,
                    complianceRate: complianceRate.toFixed(2)
                });
                
                totalComplianceRate += complianceRate;
            }
        }

        res.json({
            report: 'Contribution Compliance per Member',
            groupId,
            groupName: groupData.groupName,
            generatedAt: new Date().toISOString(),
            data: complianceData,
            summary: {
                totalMembers: complianceData.length,
                averageComplianceRate: complianceData.length > 0 
                    ? (totalComplianceRate / complianceData.length).toFixed(2) 
                    : 0,
                totalContributions: complianceData.reduce((sum, d) => sum + d.totalContributed, 0),
                totalExpectedContributions: complianceData.reduce((sum, d) => sum + d.expectedContributions, 0)
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

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const userRole = req.user.role || req.user.firebase?.role;
        
        if (!['Admin', 'Treasurer'].includes(userRole) &&
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
            const formattedPayout = {
                id: doc.id,
                memberId: data.memberId,
                memberName: data.memberName || 'Unknown',
                amount: data.amount,
                status: data.status,
                createdAt: formatFirestoreTimestamp(data.createdAt),
                completedAt: formatFirestoreTimestamp(data.completedAt)
            };
            
            payoutHistory.push(formattedPayout);

            if (data.status === 'completed') {
                completedPayouts.push(formattedPayout);
                totalPayedOut += data.amount;
            }
        }

        // Project upcoming payouts
        const upcomingProjections = calculatePayoutProjections(groupData, completedPayouts);

        res.json({
            report: 'Payout History and Projections',
            groupId,
            groupName: groupData.groupName,
            generatedAt: new Date().toISOString(),
            payoutHistory: payoutHistory.slice(0, 50),
            projections: upcomingProjections,
            summary: {
                totalPayedOut: totalPayedOut.toFixed(2),
                completedPayouts: completedPayouts.length,
                pendingPayouts: payoutHistory.filter(p => p.status === 'pending').length,
                failedPayouts: payoutHistory.filter(p => p.status === 'failed').length,
                averagePayoutAmount: completedPayouts.length > 0 
                    ? (totalPayedOut / completedPayouts.length).toFixed(2) 
                    : 0
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
        const contributions = contributionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const totalSavings = contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
        const memberCount = groupData.memberCount || 0;
        
        // Get unique contributors
        const uniqueContributors = new Set(contributions.map(c => c.userId)).size;
        
        // Calculate average contribution per member
        const averageContribution = memberCount > 0 ? totalSavings / memberCount : 0;
        
        // Get current prime rate (in production, fetch from API or database)
        const primeRate = 11.75;
        const projectedGrowth = calculateProjectedGrowth(totalSavings, primeRate);

        res.json({
            report: 'Custom Analytics View',
            groupId,
            groupName: groupData.groupName,
            generatedAt: new Date().toISOString(),
            metrics: {
                totalSavings: totalSavings.toFixed(2),
                memberCount,
                activeContributors: uniqueContributors,
                averageSavingsPerMember: averageContribution.toFixed(2),
                totalContributions: contributions.length,
                groupStartDate: formatFirestoreTimestamp(groupData.startDate),
                currentStatus: groupData.status || 'active',
                targetFund: groupData.targetFund || 0,
                progressToTarget: groupData.targetFund && groupData.targetFund > 0
                    ? ((totalSavings / groupData.targetFund) * 100).toFixed(2) + '%' 
                    : 'N/A'
            },
            projections: {
                projectedGrowthRate: primeRate + '%',
                projectedSavingsIn3Months: projectedGrowth.amount3Months,
                projectedSavingsIn6Months: projectedGrowth.amount6Months,
                projectedSavingsIn1Year: projectedGrowth.amount1Year
            },
            trends: {
                contributionGrowth: calculateContributionGrowth(contributions)
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

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const userRole = req.user.role || req.user.firebase?.role;
        
        if (!['Admin', 'Treasurer'].includes(userRole) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

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
                    'Member Name': userData.displayName || userData.name || 'Unknown',
                    'Email': userData.email || 'N/A',
                    'Total Contributed (R)': data.totalContributed?.toFixed(2) || '0.00',
                    'Contribution Count': data.contributionCount || 0,
                    'Last Contribution Date': formatFirestoreTimestamp(data.lastContributionDate),
                    'Member Since': formatFirestoreTimestamp(userData.createdAt)
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

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const userRole = req.user.role || req.user.firebase?.role;
        
        if (!['Admin', 'Treasurer'].includes(userRole) &&
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
                'Member ID': data.memberId || 'N/A',
                'Member Name': data.memberName || 'N/A',
                'Amount (R)': data.amount?.toFixed(2) || '0.00',
                'Status': data.status || 'pending',
                'Created Date': formatFirestoreTimestamp(data.createdAt),
                'Completed Date': formatFirestoreTimestamp(data.completedAt),
                'Payment Method': data.paymentMethod || 'N/A'
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

        const groupDoc = await db.collection('groups').doc(groupId).get();
        if (!groupDoc.exists) {
            return res.status(404).json({ error: 'Group not found' });
        }

        const groupData = groupDoc.data();
        const userRole = req.user.role || req.user.firebase?.role;
        
        if (!['Admin', 'Treasurer'].includes(userRole) &&
            groupData.createdBy !== req.user.uid) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const doc = new PDFDocument({ margin: 50 });
        
        res.header('Content-Type', 'application/pdf');
        res.header('Content-Disposition', `attachment; filename="compliance_${groupId}_${Date.now()}.pdf"`);
        
        doc.pipe(res);

        // Header
        doc.fontSize(20).text('Contribution Compliance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(14).text(`Group: ${groupData.groupName || 'N/A'}`, { align: 'center' });
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
        doc.moveDown();
        
        // Summary
        doc.fontSize(12).text('Report Summary', { underline: true });
        doc.fontSize(10);
        
        const userContribsSnapshot = await db.collection('user-contributions')
            .where('groupId', '==', groupId)
            .get();
        
        let totalMembers = 0;
        let totalContributions = 0;
        
        for (const docSnapshot of userContribsSnapshot.docs) {
            const data = docSnapshot.data();
            totalMembers++;
            totalContributions += data.totalContributed || 0;
        }
        
        doc.text(`Total Members: ${totalMembers}`);
        doc.text(`Total Contributions: R${totalContributions.toFixed(2)}`);
        doc.text(`Average per Member: R${totalMembers > 0 ? (totalContributions / totalMembers).toFixed(2) : '0.00'}`);
        doc.moveDown();
        
        // Member Details Table
        doc.fontSize(12).text('Member Details', { underline: true });
        doc.fontSize(9);
        
        let yPosition = doc.y;
        const startX = 50;
        
        // Table headers
        doc.text('Member Name', startX, yPosition);
        doc.text('Total (R)', startX + 200, yPosition);
        doc.text('Contributions', startX + 280, yPosition);
        doc.text('Compliance', startX + 360, yPosition);
        
        yPosition += 20;
        
        for (const docSnapshot of userContribsSnapshot.docs) {
            const data = docSnapshot.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            
            if (userDoc.exists && yPosition < 750) {
                const userData = userDoc.data();
                const complianceRate = ((data.contributionCount || 0) / (groupData.expectedContributionsPerMember || 1)) * 100;
                
                doc.text(userData.displayName || 'Unknown', startX, yPosition);
                doc.text(data.totalContributed?.toFixed(2) || '0.00', startX + 200, yPosition);
                doc.text(String(data.contributionCount || 0), startX + 280, yPosition);
                doc.text(complianceRate.toFixed(1) + '%', startX + 360, yPosition);
                
                yPosition += 15;
                
                if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                }
            }
        }
        
        doc.end();
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).json({ error: error.message || 'Failed to export' });
    }
});

// ========== ADDITIONAL HELPER FUNCTIONS ==========

function calculateContributionGrowth(contributions) {
    // Group contributions by month
    const monthlyData = {};
    
    contributions.forEach(contribution => {
        const date = contribution.createdAt?.toDate?.() || new Date(contribution.createdAt);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { amount: 0, count: 0 };
        }
        monthlyData[monthKey].amount += contribution.amount || 0;
        monthlyData[monthKey].count++;
    });
    
    // Convert to array and sort
    return Object.entries(monthlyData)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-6); // Last 6 months
}

// Error handling middleware (add at the end)
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.url}` });
});

app.listen(PORT, () => {
    console.log(`📊 Analytics Service running on port ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
});

module.exports = app; // For testing