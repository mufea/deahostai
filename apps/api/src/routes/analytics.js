import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(pocketbaseAuth);

const VALID_TOOL_TYPES = ['text', 'image', 'tts', 'pdf'];
const TIME_PERIODS = {
  7: 7 * 24 * 60 * 60 * 1000,
  30: 30 * 24 * 60 * 60 * 1000,
  90: 90 * 24 * 60 * 60 * 1000,
  all: null,
};

router.get('/usage', async (req, res) => {
  const { user_id, time_period = '30' } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id query parameter is required' });
  }

  const period = parseInt(time_period, 10);
  if (!Object.hasOwn(TIME_PERIODS, period) && time_period !== 'all') {
    return res.status(400).json({ error: 'time_period must be 7, 30, 90, or "all"' });
  }

  const user = await pocketbaseClient.collection('users').getOne(user_id).catch(() => null);
  if (!user) {
    throw new Error('User not found');
  }

  let filter = `user_id = "${user_id}"`;

  if (time_period !== 'all') {
    const periodMs = TIME_PERIODS[period];
    const cutoffDate = new Date(Date.now() - periodMs).toISOString();
    filter += ` && created >= "${cutoffDate}"`;
  }

  const creditHistory = await pocketbaseClient
    .collection('credit_history')
    .getFullList({
      filter,
      sort: 'created',
    });

  const dailyUsageMap = {};
  const toolBreakdownMap = {};
  let totalGenerations = 0;

  creditHistory.forEach((record) => {
    const date = new Date(record.created).toISOString().split('T')[0];
    const toolType = record.tool_type || 'unknown';
    const creditsUsed = Math.abs(record.credits_used || 0);

    if (!dailyUsageMap[date]) {
      dailyUsageMap[date] = 0;
    }
    dailyUsageMap[date] += creditsUsed;

    if (!toolBreakdownMap[toolType]) {
      toolBreakdownMap[toolType] = {
        count: 0,
        credits_used: 0,
      };
    }
    toolBreakdownMap[toolType].count += 1;
    toolBreakdownMap[toolType].credits_used += creditsUsed;

    if (VALID_TOOL_TYPES.includes(toolType)) {
      totalGenerations += 1;
    }
  });

  const dailyUsage = Object.entries(dailyUsageMap)
    .map(([date, total_credits]) => ({
      date,
      total_credits,
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const totalCreditsUsed = Object.values(toolBreakdownMap).reduce(
    (sum, tool) => sum + tool.credits_used,
    0
  );

  const toolBreakdown = Object.entries(toolBreakdownMap)
    .map(([tool_type, data]) => ({
      tool_type,
      count: data.count,
      credits_used: data.credits_used,
      percentage: totalCreditsUsed > 0 ? ((data.credits_used / totalCreditsUsed) * 100).toFixed(2) : 0,
    }))
    .sort((a, b) => b.credits_used - a.credits_used);

  const mostUsedTool = toolBreakdown.length > 0 ? toolBreakdown[0].tool_type : null;

  logger.info(`Analytics retrieved for user ${user_id}: ${totalGenerations} generations, ${totalCreditsUsed} credits used`);

  res.json({
    daily_usage: dailyUsage,
    tool_breakdown: toolBreakdown,
    total_generations: totalGenerations,
    most_used_tool: mostUsedTool,
  });
});

export default router;