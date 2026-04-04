const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Health check endpoint for each service
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002',
    stockvel: process.env.STOCKVEL_SERVICE_URL || 'http://localhost:4003',
    meetings: process.env.MEETING_SERVICE_URL || 'http://localhost:4004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4005',
};

console.log('í´§ Service URLs:');
console.log(`   Auth Service: ${services.auth}`);
console.log(`   Payment Service: ${services.payment}`);
console.log(`   Stockvel Service: ${services.stockvel}`);
console.log(`   Meeting Service: ${services.meetings}`);
console.log(`   Analytics Service: ${services.analytics}`);

// Proxy middleware configuration
const proxyOptions = {
    changeOrigin: true,
    onError: (err, req, res) => {
        console.error('Proxy Error:', err.message);
        res.status(500).json({ 
            error: 'Service unavailable', 
            details: err.message,
            service: req.baseUrl
        });
    },
    onProxyReq: (proxyReq, req, res) => {
        // Forward the authorization header
        if (req.headers.authorization) {
            proxyReq.setHeader('Authorization', req.headers.authorization);
        }
    }
};

// Route to each microservice
app.use('/api/auth', createProxyMiddleware({ ...proxyOptions, target: services.auth }));
app.use('/api/payment', createProxyMiddleware({ ...proxyOptions, target: services.payment }));
app.use('/api/stockvel', createProxyMiddleware({ ...proxyOptions, target: services.stockvel }));
app.use('/api/meetings', createProxyMiddleware({ ...proxyOptions, target: services.meetings }));
app.use('/api/analytics', createProxyMiddleware({ ...proxyOptions, target: services.analytics }));

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        message: 'Welcome to the Stockvel Microservices API Gateway',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            payment: '/api/payment',
            stockvel: '/api/stockvel',
            meetings: '/api/meetings',
            analytics: '/api/analytics'
        }
    });
});

// Gateway health check
app.get('/health', async (req, res) => {
    const healthStatus = {};
    
    // Check each service health
    const checkService = async (name, url) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${url}/health`, { signal: controller.signal });
            clearTimeout(timeoutId);
            healthStatus[name] = response.ok ? 'UP' : 'DOWN';
        } catch (error) {
            healthStatus[name] = 'DOWN';
        }
    };
    
    await Promise.all([
        checkService('auth', services.auth),
        checkService('payment', services.payment),
        checkService('stockvel', services.stockvel),
        checkService('meetings', services.meetings),
        checkService('analytics', services.analytics)
    ]);
    
    const allUp = Object.values(healthStatus).every(status => status === 'UP');
    
    res.json({
        gateway: 'UP',
        timestamp: new Date().toISOString(),
        services: healthStatus,
        overall: allUp ? 'ALL_SERVICES_UP' : 'SOME_SERVICES_DOWN'
    });
});

// 404 handler for undefined routes
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Gateway Error:', err);
    res.status(500).json({ 
        error: 'Gateway internal error',
        message: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`\níº€ API Gateway is running on port ${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   Gateway URL: http://localhost:${PORT}\n`);
    console.log('í³‹ Available Routes:');
    console.log(`   POST   /api/auth/register`);
    console.log(`   POST   /api/auth/login`);
    console.log(`   GET    /api/auth/verify-token`);
    console.log(`   POST   /api/payment/contribute`);
    console.log(`   GET    /api/payment/summary/:groupId`);
    console.log(`   POST   /api/stockvel/groups`);
    console.log(`   GET    /api/stockvel/groups`);
    console.log(`   POST   /api/meetings/meetings`);
    console.log(`   GET    /api/meetings/meetings/:meetingId`);
    console.log(`   GET    /api/analytics/health`);
});

module.exports = app;
