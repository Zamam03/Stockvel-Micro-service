const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Service URLs
const SERVICES = {
    auth: 'http://localhost:4001',
    payment: 'http://localhost:4002',
    stockvel: 'http://localhost:4003',
    meetings: 'http://localhost:4004',
    analytics: 'http://localhost:4005'
};

console.log('\n🚀 Gateway Starting...');
console.log('Services:');
Object.entries(SERVICES).forEach(([name, url]) => {
    console.log(`   ${name}: ${url}`);
});

// Proxy middleware
const createProxy = (serviceUrl) => {
    return (req, res) => {
        // Get the original path and remove the /api/service prefix
        let path = req.originalUrl;
        const serviceName = Object.keys(SERVICES).find(key => SERVICES[key] === serviceUrl);
        
        // Remove /api/servicename from path
        const prefix = `/api/${serviceName}`;
        if (path.startsWith(prefix)) {
            path = path.slice(prefix.length);
        }
        if (!path || path === '') path = '/';
        
        const targetUrl = `${serviceUrl}${path}`;
        console.log(`[${serviceName.toUpperCase()}] ${req.method} ${req.originalUrl} -> ${targetUrl}`);
        
        const options = {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                ...(req.headers.authorization && { 'Authorization': req.headers.authorization })
            }
        };
        
        let body = null;
        if (req.method === 'POST' || req.method === 'PUT') {
            body = JSON.stringify(req.body);
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }
        
        const proxyReq = http.request(targetUrl, options, (proxyRes) => {
            let data = '';
            proxyRes.on('data', chunk => data += chunk);
            proxyRes.on('end', () => {
                res.status(proxyRes.statusCode);
                try {
                    res.json(JSON.parse(data));
                } catch {
                    res.send(data);
                }
            });
        });
        
        proxyReq.on('error', (err) => {
            console.error(`[ERROR] ${serviceName}:`, err.message);
            if (!res.headersSent) {
                res.status(503).json({ error: `${serviceName} service unavailable`, message: err.message });
            }
        });
        
        if (body) proxyReq.write(body);
        proxyReq.end();
    };
};

// Mount proxies
app.use('/api/auth', createProxy(SERVICES.auth));
app.use('/api/payment', createProxy(SERVICES.payment));
app.use('/api/stockvel', createProxy(SERVICES.stockvel));
app.use('/api/meetings', createProxy(SERVICES.meetings));
app.use('/api/analytics', createProxy(SERVICES.analytics));

// Health check
app.get('/health', (req, res) => {
    res.json({ gateway: 'UP', port: PORT, timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.json({ 
        message: 'Stockvel API Gateway', 
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            stockvel: '/api/stockvel',
            payment: '/api/payment',
            meetings: '/api/meetings',
            analytics: '/api/analytics'
        }
    });
});

// 404 handler
app.use((req, res) => {
    if (!res.headersSent) {
        res.status(404).json({ error: 'Route not found', path: req.originalUrl });
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ Gateway running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
});

module.exports = app;
