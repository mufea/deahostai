export const MODELS_CONFIG = {
  openai: {
    'gpt-4o': {
      id: 'gpt-4o',
      name: 'GPT-4 Omni',
      provider: 'openai',
      type: 'chat',
      pricing: { input: 0.005, output: 0.015 },
      maxTokens: 128000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Most capable model, optimized for reasoning and complex tasks',
    },
    'gpt-4-turbo': {
      id: 'gpt-4-turbo',
      name: 'GPT-4 Turbo',
      provider: 'openai',
      type: 'chat',
      pricing: { input: 0.01, output: 0.03 },
      maxTokens: 128000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'High-performance model with extended context window',
    },
    'gpt-3.5-turbo': {
      id: 'gpt-3.5-turbo',
      name: 'GPT-3.5 Turbo',
      provider: 'openai',
      type: 'chat',
      pricing: { input: 0.0005, output: 0.0015 },
      maxTokens: 4096,
      capabilities: ['function_calling'],
      description: 'Fast and cost-effective model for general tasks',
    },
    'dall-e-3': {
      id: 'dall-e-3',
      name: 'DALL-E 3',
      provider: 'openai',
      type: 'image',
      pricing: { per_image: 0.08 },
      sizes: ['1024x1024', '1024x1792', '1792x1024'],
      capabilities: ['image_generation', 'high_quality'],
      description: 'Advanced image generation with superior quality and detail',
    },
    'dall-e-2': {
      id: 'dall-e-2',
      name: 'DALL-E 2',
      provider: 'openai',
      type: 'image',
      pricing: { per_image: 0.02 },
      sizes: ['256x256', '512x512', '1024x1024'],
      capabilities: ['image_generation'],
      description: 'Reliable image generation model',
    },
  },
  gemini: {
    'gemini-2.0-flash': {
      id: 'gemini-2.0-flash',
      name: 'Gemini 2.0 Flash',
      provider: 'gemini',
      type: 'chat',
      pricing: { input: 0.075, output: 0.3 },
      maxTokens: 1000000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Latest ultra-fast model with massive context window',
    },
    'gemini-1.5-pro': {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      provider: 'gemini',
      type: 'chat',
      pricing: { input: 0.0035, output: 0.0105 },
      maxTokens: 1000000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Professional-grade model with extended context',
    },
    'gemini-1.5-flash': {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      provider: 'gemini',
      type: 'chat',
      pricing: { input: 0.000075, output: 0.0003 },
      maxTokens: 1000000,
      capabilities: ['vision', 'function_calling'],
      description: 'Fast and efficient model for quick responses',
    },
    'imagen-3': {
      id: 'imagen-3',
      name: 'Imagen 3',
      provider: 'gemini',
      type: 'image',
      pricing: { per_image: 0.04 },
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      capabilities: ['image_generation'],
      description: 'Google\'s advanced image generation model',
    },
  },
  anthropic: {
    'claude-3-5-sonnet': {
      id: 'claude-3-5-sonnet',
      name: 'Claude 3.5 Sonnet',
      provider: 'anthropic',
      type: 'chat',
      pricing: { input: 0.003, output: 0.015 },
      maxTokens: 200000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Latest Claude model with improved reasoning',
    },
    'claude-3-opus': {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'anthropic',
      type: 'chat',
      pricing: { input: 0.015, output: 0.075 },
      maxTokens: 200000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Most capable Claude model for complex reasoning',
    },
    'claude-3-sonnet': {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'anthropic',
      type: 'chat',
      pricing: { input: 0.003, output: 0.015 },
      maxTokens: 200000,
      capabilities: ['vision', 'function_calling', 'json_mode'],
      description: 'Balanced model for general-purpose tasks',
    },
    'claude-3-haiku': {
      id: 'claude-3-haiku',
      name: 'Claude 3 Haiku',
      provider: 'anthropic',
      type: 'chat',
      pricing: { input: 0.00025, output: 0.00125 },
      maxTokens: 200000,
      capabilities: ['vision'],
      description: 'Fast and compact model for quick tasks',
    },
  },
  xai: {
    'grok-2': {
      id: 'grok-2',
      name: 'Grok-2',
      provider: 'xai',
      type: 'chat',
      pricing: { input: 0.002, output: 0.01 },
      maxTokens: 131072,
      capabilities: ['vision', 'function_calling'],
      description: 'X AI\'s advanced reasoning model',
    },
    'grok-1': {
      id: 'grok-1',
      name: 'Grok-1',
      provider: 'xai',
      type: 'chat',
      pricing: { input: 0.0015, output: 0.008 },
      maxTokens: 131072,
      capabilities: ['vision'],
      description: 'X AI\'s general-purpose model',
    },
  },
  fal_ai: {
    'fal-ai/flux-pro': {
      id: 'fal-ai/flux-pro',
      name: 'Flux Pro',
      provider: 'fal_ai',
      type: 'image',
      pricing: { per_image: 0.05 },
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      capabilities: ['image_generation', 'high_quality'],
      description: 'Professional-grade image generation',
    },
    'fal-ai/flux-realism': {
      id: 'fal-ai/flux-realism',
      name: 'Flux Realism',
      provider: 'fal_ai',
      type: 'image',
      pricing: { per_image: 0.03 },
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      capabilities: ['image_generation'],
      description: 'Realistic image generation model',
    },
    'fal-ai/flux-dev': {
      id: 'fal-ai/flux-dev',
      name: 'Flux Dev',
      provider: 'fal_ai',
      type: 'image',
      pricing: { per_image: 0.025 },
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      capabilities: ['image_generation'],
      description: 'Development version of Flux model',
    },
    'fal-ai/stable-diffusion-3-large': {
      id: 'fal-ai/stable-diffusion-3-large',
      name: 'Stable Diffusion 3 Large',
      provider: 'fal_ai',
      type: 'image',
      pricing: { per_image: 0.02 },
      sizes: ['1024x1024', '1024x1536', '1536x1024'],
      capabilities: ['image_generation'],
      description: 'Large version of Stable Diffusion 3',
    },
  },
  deepseek: {
    'deepseek-chat': {
      id: 'deepseek-chat',
      name: 'Deepseek Chat',
      provider: 'deepseek',
      type: 'chat',
      pricing: { input: 0.00014, output: 0.00028 },
      maxTokens: 4096,
      capabilities: ['function_calling'],
      description: 'Deepseek\'s conversational model',
    },
    'deepseek-coder': {
      id: 'deepseek-coder',
      name: 'Deepseek Coder',
      provider: 'deepseek',
      type: 'chat',
      pricing: { input: 0.00014, output: 0.00028 },
      maxTokens: 4096,
      capabilities: ['function_calling'],
      description: 'Deepseek\'s code generation model',
    },
  },
};

/**
 * Get model configuration by model ID
 * @param {string} modelId - The model ID (e.g., 'gpt-4o', 'gemini-2.0-flash')
 * @returns {object|null} Model configuration or null if not found
 */
export function getModelConfig(modelId) {
  for (const provider in MODELS_CONFIG) {
    if (MODELS_CONFIG[provider][modelId]) {
      return MODELS_CONFIG[provider][modelId];
    }
  }
  return null;
}

/**
 * Get all models of a specific type
 * @param {string} type - 'chat' or 'image'
 * @returns {array} Array of models with that type
 */
export function getModelsByType(type) {
  const models = [];
  for (const provider in MODELS_CONFIG) {
    for (const modelId in MODELS_CONFIG[provider]) {
      const model = MODELS_CONFIG[provider][modelId];
      if (model.type === type) {
        models.push(model);
      }
    }
  }
  return models;
}

/**
 * Get all models from a specific provider
 * @param {string} provider - Provider name (e.g., 'openai', 'gemini')
 * @returns {array} Array of models from that provider
 */
export function getModelsByProvider(provider) {
  const models = [];
  if (MODELS_CONFIG[provider]) {
    for (const modelId in MODELS_CONFIG[provider]) {
      models.push(MODELS_CONFIG[provider][modelId]);
    }
  }
  return models;
}

/**
 * Get provider name by model ID
 * @param {string} modelId - The model ID
 * @returns {string|null} Provider name or null if not found
 */
export function getProviderByModelId(modelId) {
  for (const provider in MODELS_CONFIG) {
    if (MODELS_CONFIG[provider][modelId]) {
      return provider;
    }
  }
  return null;
}