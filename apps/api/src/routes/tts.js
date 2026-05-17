import express from 'express';
import { pocketbaseAuth } from '../middleware/pocketbase-auth.js';
import logger from '../utils/logger.js';
import { getTTSPromptWithLanguage } from '../constants/prompts.js';

const router = express.Router();

router.use(pocketbaseAuth);

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const voiceMap = {
  alloy: '21m00Tcm4TlvDq8ikWAM',
  echo: '29vD33N1CtxCmqQRPOHJ',
  fable: 'EXAVITQu4vr4xnSDxMaL',
  onyx: 'cgSgspJ2msLIdFDN1l6d',
  nova: '4ZWDe7sQvrF4rWjQP1zK',
  shimmer: 'XB0fDUnXU5powFXDhCwa',
  james: '21m00Tcm4TlvDq8ikWAM',
  michael: '29vD33N1CtxCmqQRPOHJ',
  david: 'EXAVITQu4vr4xnSDxMaL',
  alex: 'cgSgspJ2msLIdFDN1l6d',
  sarah: '4ZWDe7sQvrF4rWjQP1zK',
  emma: 'XB0fDUnXU5powFXDhCwa',
  lisa: '4ZWDe7sQvrF4rWjQP1zK',
  jessica: 'XB0fDUnXU5powFXDhCwa',
  narrator: '21m00Tcm4TlvDq8ikWAM',
  storyteller: 'EXAVITQu4vr4xnSDxMaL'
};

router.post('/generate', async (req, res) => {
  const { text, voice = 'alloy', speed = 1.0, language = 'en' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'text must be a non-empty string' });
  }

  if (text.length > 2000) {
    return res.status(400).json({ error: 'text exceeds maximum length of 2000 characters' });
  }

  if (!voiceMap[voice]) {
    return res.status(400).json({
      error: `Invalid voice. Must be one of: ${Object.keys(voiceMap).join(', ')}`,
    });
  }

  if (typeof speed !== 'number' || speed < 0.5 || speed > 2.0) {
    return res.status(400).json({ error: 'speed must be a number between 0.5 and 2.0' });
  }

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY is not configured');
  }

  const voiceId = voiceMap[voice];

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_monolingual_v1',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    logger.error(`ElevenLabs API error: ${response.status} ${errorData}`);
    throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
  }

  const audioBuffer = await response.arrayBuffer();
  const audioBase64 = Buffer.from(audioBuffer).toString('base64');
  const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

  const estimatedDuration = Math.ceil((text.length / 5) / (speed * 150));

  logger.info(`TTS generated for user ${req.pocketbaseUserId}: ${text.length} characters, language: ${language}`);

  res.json({
    audioUrl,
    duration: estimatedDuration,
    language,
  });
});

export default router;