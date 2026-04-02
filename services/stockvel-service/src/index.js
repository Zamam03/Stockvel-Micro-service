const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;

app.get('/health', (req, res) => {
    res.json({ service: 'stockvel-service', status: 'OK' });
});

app.get('/groups', (req, res) => {
    res.json({ groups: [] });
});

// SA Prime Lending Rate (Public Data)
app.get('/sa-prime-rate', async (req, res) => {
    // In a real scenario, this fetches from the SARB or another API cache.
    // We are mocking this API response for architecture completion.
    const mockRate = 11.75;
    res.json({ rate: mockRate, source: 'SARB Mock', message: 'Current SA Prime Lending Rate' });
});

app.listen(PORT, () => {
    console.log(`🤝 Stockvel Service running on port ${PORT}`);
});
