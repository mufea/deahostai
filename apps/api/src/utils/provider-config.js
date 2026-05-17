import 'dotenv/config';
import { MODELS_CONFIG, getModelsByProvider } from '../config/models.config.js';
import logger from './logger.js';

const PROVIDER_API_KEYS = {
  openai: process.env.OPENAI_API_KEY,
  gemini: process.env.GOOGLE_GEMINI_API_KEY,
  anthropic: process.env.ANTHROPIC_API_KEY,
  xai: process.env.XAI_API_KEY,
  fal_ai: process.env.FAL_AI_API_KEY,
  deepseek: process.env.DEEPSEEK_API_KEY,
};

/**
 * Check if a provider has a valid API key configured
 * @param {string} provider - Provider name (e.g., 'openai', 'gemini')
 * @returns {boolean} True if provider is configured with API key
 */
export function isProviderConfigured(provider) {
  const apiKey = PROVIDER_API_KEYS[provider];
  const configured = !!apiKey && apiKey.trim().length > 0;
  logger.info(`[PROVIDER-CONFIG] isProviderConfigured(${provider}): ${configured}`);
  return configured;
}

/**
 * Get all configured providers with valid API keys
 * @returns {array} Array of provider names that are configured
 */
export function getConfiguredProviders() {
  const configured = Object.keys(PROVIDER_API_KEYS).filter(provider => isProviderConfigured(provider));
  logger.info(`[PROVIDER-CONFIG] Configured providers: ${configured.join(', ')}`);
  return configured;
}

/**
 * Get all available models (only from configured providers)
 * @returns {array} Array of available models
 */
export function getAvailableModels() {
  const configuredProviders = getConfiguredProviders();
  const availableModels = [];

  for (const provider of configuredProviders) {
    const models = getModelsByProvider(provider);
    availableModels.push(...models);
  }

  logger.info(`[PROVIDER-CONFIG] Available models: ${availableModels.length}`);
  return availableModels;
}

/**
 * Get available models filtered by type
 * @param {string} type - 'chat' or 'image'
 * @returns {array} Array of available models of that type
 */
export function getAvailableModelsByType(type) {
  return getAvailableModels().filter(model => model.type === type);
}

/**
 * Get available models from a specific provider
 * @param {string} provider - Provider name
 * @returns {array} Array of available models from that provider, or empty if not configured
 */
export function getAvailableModelsByProvider(provider) {
  if (!isProviderConfigured(provider)) {
    logger.warn(`[PROVIDER-CONFIG] Provider '${provider}' is not configured`);
    return [];
  }
  return getModelsByProvider(provider);
}

/**
 * Get API key for a provider
 * @param {string} provider - Provider name
 * @returns {string|null} API key or null if not configured
 */
export function getProviderApiKey(provider) {
  const apiKey = PROVIDER_API_KEYS[provider] || null;
  logger.info(`[PROVIDER-CONFIG] getProviderApiKey(${provider}): ${apiKey ? 'present' : 'missing'}`);
  return apiKey;
}