import 'dotenv/config';
import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import pocketbaseClient from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { getMusicGenerationPromptWithLanguage } from '../constants/prompts.js';

const router = express.Router();

router.use(pocketbaseAuth);

const MUBERT_API_KEY = process.env.MUBERT_API_KEY;

router.post('/generate', async (req, res) => {
  const { prompt, genre = 'electronic', mood = 'energetic', duration = 30, bpm = 120, language = 'en' } = req.body;
  const userId = req.pocketbaseUserId;

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  if (typeof prompt !== 'string' || prompt.trim().length === 0) {
    return res.status(400).json({ error: 'prompt must be a non-empty string' });
  }

  if (typeof duration !== 'number' || duration < 10 || duration > 600) {
    return res.status(400).json({ error: 'duration must be a number between 10 and 600 seconds' });
  }

  if (typeof bpm !== 'number' || bpm < 60 || bpm > 200) {
    return res.status(400).json({ error: 'bpm must be a number between 60 and 200' });
  }

  if (!MUBERT_API_KEY) {
    throw new Error('MUBERT_API_KEY is not configured');
  }

  const response = await fetch('https://api.mubert.com/v1/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MUBERT_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      genre,
      mood,
      duration,
      bpm,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    logger.error(`Mubert API error: ${response.status} ${errorData}`);
    throw new Error(`Mubert API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.music_url) {
    throw new Error('No music URL returned from Mubert API');
  }

  // Store record in _integratedAiMusic collection
  const musicRecord = await pocketbaseClient.collection('_integratedAiMusic').create({
    user_id: userId,
    prompt,
    genre,
    mood,
    duration,
    bpm,
    music_url: data.music_url,
    mubert_id: data.id || null,
    language_code: language,
  });

  logger.info(`Music generated for user ${userId}: ${prompt}, language: ${language}`);

  res.json({
    musicUrl: data.music_url,
    duration,
    genre,
    mood,
    language,
    recordId: musicRecord.id,
  });
});

export default router;