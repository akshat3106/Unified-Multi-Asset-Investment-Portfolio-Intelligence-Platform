const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes');
const marketRoutes = require('./routes/marketRoutes');
const chatRoutes = require('./routes/chatRoutes');
const auditLogRoutes = require('./routes/auditLogRoutes');
const portfolioAnalysisRoutes = require('./routes/portfolioAnalysisRoutes');
const portfolioRoutes = require('./routes/portfolioRoutes');

const app = module.exports = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

const healthHandler = (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
};
app.get('/api/health', healthHandler);
app.get('/api/v1/health', healthHandler);

app.use('/api/users', userRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/audit-log', auditLogRoutes);
app.use('/api/v1/portfolio', portfolioRoutes);
app.use('/api/v1/portfolio/analyze', portfolioAnalysisRoutes);
