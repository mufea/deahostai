import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import routes from './routes/index.js';
import { errorMiddleware } from './middleware/error.js';
import { globalRateLimit } from './middleware/global-rate-limit.js';
import logger from './utils/logger.js';
import { BodyLimit } from './constants/common.js';

const app = express();

app.set('trust proxy', true);

logger.info('[SERVER]', '========== STARTING DEAHOST AI TOOLS SERVER ==========');
logger.info('[SERVER]', 'Timestamp: ' + new Date().toISOString());
logger.info('[SERVER]', 'Node environment: ' + (process.env.NODE_ENV || 'development'));
logger.info('[SERVER]', 'Port: ' + (process.env.PORT || 3001));

// Check OpenAI API key status
const openaiKeyStatus = process.env.OPENAI_API_KEY ? 'configured' : 'NOT CONFIGURED';
logger.info('[SERVER]', 'OPENAI_API_KEY status: ' + openaiKeyStatus);

process.on('uncaughtException', (error) => {
	logger.error('[SERVER]', '❌ Uncaught exception: ' + error.message);
	logger.error('[SERVER]', 'Stack: ' + error.stack);
});
  
process.on('unhandledRejection', (reason, promise) => {
	logger.error('[SERVER]', '❌ Unhandled rejection: ' + reason);
});

process.on('SIGINT', async () => {
	logger.info('[SERVER]', 'Interrupted');
	process.exit(0);
});

process.on('SIGTERM', async () => {
	logger.info('[SERVER]', 'SIGTERM signal received');
	await new Promise(resolve => setTimeout(resolve, 3000));
	logger.info('[SERVER]', 'Exiting');
	process.exit();
});

app.use(helmet());
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(morgan('combined'));
app.use(globalRateLimit);
app.use(express.json({
	limit: BodyLimit,
}));
app.use(express.urlencoded({ 
	extended: true,
	limit: BodyLimit,
}));

logger.info('[SERVER]', 'Registering routes...');
app.use('/', routes());
logger.info('[SERVER]', '✓ Routes registered');

app.use(errorMiddleware);

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found' });
});

const port = process.env.PORT || 3001;

app.listen(port, () => {
	logger.info('[SERVER]', '========== DEAHOST AI TOOLS SERVER READY ==========');
	logger.info('[SERVER]', '🚀 Server running on http://localhost:' + port);
	logger.info('[SERVER]', 'Timestamp: ' + new Date().toISOString());
	logger.info('[SERVER]', 'Ready to accept requests');
});

export default app;