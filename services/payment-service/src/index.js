const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get('/health', (req, res) => {
    res.json({ service: 'payment-service', status: 'OK' });
});

app.post('/contribute', (req, res) => {
    // TODO: Integrate Payment Gateway (Yoco/Stripe)
    res.json({ message: 'Contribution processed successfully' });
});

app.listen(PORT, () => {
    console.log(`💳 Payment Service running on port ${PORT}`);
});
