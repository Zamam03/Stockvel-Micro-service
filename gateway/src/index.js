const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));

// Proxy settings
const services = {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:4001',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:4002',
    stockvel: process.env.STOCKVEL_SERVICE_URL || 'http://localhost:4003',
    meetings: process.env.MEETING_SERVICE_URL || 'http://localhost:4004',
    analytics: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:4005',
};

// Routing to microservices
app.use('/api/auth', createProxyMiddleware({ target: services.auth, changeOrigin: true }));
app.use('/api/payment', createProxyMiddleware({ target: services.payment, changeOrigin: true }));
app.use('/api/stockvel', createProxyMiddleware({ target: services.stockvel, changeOrigin: true }));
app.use('/api/meetings', createProxyMiddleware({ target: services.meetings, changeOrigin: true }));
app.use('/api/analytics', createProxyMiddleware({ target: services.analytics, changeOrigin: true }));

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Stockvel Microservices API Gateway' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'Gateway is running', services });
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway is running on port ${PORT}`);
});
