export const MODELS_CONFIG = {
  'gpt-4o': { provider: 'openai', type: 'text', name: 'GPT-4o', input_price: 0.005, output_price: 0.015, max_tokens: 128000 },
  'gpt-4-turbo': { provider: 'openai', type: 'text', name: 'GPT-4 Turbo', input_price: 0.01, output_price: 0.03, max_tokens: 128000 },
  'gpt-3.5-turbo': { provider: 'openai', type: 'text', name: 'GPT-3.5 Turbo', input_price: 0.0005, output_price: 0.0015, max_tokens: 4096 },
  'dall-e-3': { provider: 'openai', type: 'image', name: 'DALL-E 3', price_per_image: 0.08, sizes: ['1024x1024', '1024x1792', '1792x1024'] },
  'dall-e-2': { provider: 'openai', type: 'image', name: 'DALL-E 2', price_per_image: 0.02, sizes: ['256x256', '512x512', '1024x1024'] },
  'gemini-2.0-flash': { provider: 'gemini', type: 'text', name: 'Gemini 2.0 Flash', input_price: 0.075, output_price: 0.3, max_tokens: 1000000 },
  'gemini-1.5-pro': { provider: 'gemini', type: 'text', name: 'Gemini 1.5 Pro', input_price: 0.0035, output_price: 0.0105, max_tokens: 1000000 },
  'gemini-1.5-flash': { provider: 'gemini', type: 'text', name: 'Gemini 1.5 Flash', input_price: 0.000075, output_price: 0.0003, max_tokens: 1000000 },
  'imagen-3': { provider: 'gemini', type: 'image', name: 'Imagen 3', price_per_image: 0.04, sizes: ['1024x1024', '1024x1536', '1536x1024'] },
  'claude-3-5-sonnet': { provider: 'anthropic', type: 'text', name: 'Claude 3.5 Sonnet', input_price: 0.003, output_price: 0.015, max_tokens: 200000 },
  'claude-3-opus': { provider: 'anthropic', type: 'text', name: 'Claude 3 Opus', input_price: 0.015, output_price: 0.075, max_tokens: 200000 },
  'claude-3-sonnet': { provider: 'anthropic', type: 'text', name: 'Claude 3 Sonnet', input_price: 0.003, output_price: 0.015, max_tokens: 200000 },
  'claude-3-haiku': { provider: 'anthropic', type: 'text', name: 'Claude 3 Haiku', input_price: 0.00025, output_price: 0.00125, max_tokens: 200000 },
  'grok-2': { provider: 'xai', type: 'text', name: 'Grok-2', input_price: 0.002, output_price: 0.01, max_tokens: 131072 },
  'grok-vision-beta': { provider: 'xai', type: 'text', name: 'Grok Vision Beta', input_price: 0.005, output_price: 0.015, max_tokens: 131072 },
  'flux-pro': { provider: 'fal', type: 'image', name: 'Flux Pro', price_per_image: 0.05, sizes: ['1024x1024', '1024x1536', '1536x1024'] },
  'flux-realism': { provider: 'fal', type: 'image', name: 'Flux Realism', price_per_image: 0.03, sizes: ['1024x1024', '1024x1536', '1536x1024'] },
  'stable-diffusion-3': { provider: 'fal', type: 'image', name: 'Stable Diffusion 3', price_per_image: 0.02, sizes: ['1024x1024', '1024x1536', '1536x1024'] },
  'deepseek-chat': { provider: 'deepseek', type: 'text', name: 'Deepseek Chat', input_price: 0.00014, output_price: 0.00028, max_tokens: 4096 },
  'deepseek-coder': { provider: 'deepseek', type: 'text', name: 'Deepseek Coder', input_price: 0.00014, output_price: 0.00028, max_tokens: 4096 },
};

export function getModelConfig(modelId) {
  return MODELS_CONFIG[modelId] || null;
}

export function getModelsByType(type) {
  return Object.entries(MODELS_CONFIG).filter(([, config]) => config.type === type).map(([id, config]) => ({ id, ...config }));
}

export function getModelsByProvider(provider) {
  return Object.entries(MODELS_CONFIG).filter(([, config]) => config.provider === provider).map(([id, config]) => ({ id, ...config }));
}