import 'dotenv/config';
import logger from '../utils/logger.js';

export async function callDeepseek({ message, model_id, temperature, top_p, max_tokens, system_prompt }) {
  logger.info(`[DEEPSEEK] Calling Deepseek: model=${model_id}`);
  
  if (!process.env.DEEPSEEK_API_KEY) {
    logger.error('[DEEPSEEK] DEEPSEEK_API_KEY is not configured');
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }

  try {
    logger.info(`[DEEPSEEK] Making API request: model=${model_id}, temp=${temperature}, top_p=${top_p}, max_tokens=${max_tokens}`);
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model_id,
        messages: [
          ...(system_prompt ? [{ role: 'system', content: system_prompt }] : []),
          { role: 'user', content: message },
        ],
        temperature,
        top_p,
        max_tokens,
      }),
    });

    logger.info(`[DEEPSEEK] Response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.text();
      logger.error(`[DEEPSEEK] API error: ${response.status} ${errorData}`);
      throw new Error(`Deepseek API error: ${response.status}`);
    }

    const data = await response.json();
    logger.info(`[DEEPSEEK] Response parsed: choices=${data.choices?.length || 0}`);

    if (!data.choices || data.choices.length === 0) {
      logger.error('[DEEPSEEK] No choices in response');
      throw new Error('No response from Deepseek API');
    }

    const content = data.choices[0].message.content;
    const input_tokens = data.usage.prompt_tokens;
    const output_tokens = data.usage.completion_tokens;

    logger.info(`[DEEPSEEK] Success: tokens=${input_tokens + output_tokens}, content_length=${content?.length || 0}`);

    return { response: content, input_tokens, output_tokens };
  } catch (error) {
    logger.error(`[DEEPSEEK] Error: ${error.message}`);
    logger.error(`[DEEPSEEK] Error details: ${JSON.stringify(error)}`);
    throw error;
  }
}