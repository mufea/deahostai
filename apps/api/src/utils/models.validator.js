import 'dotenv/config';
import { MODELS_CONFIG, getModelConfig, getProviderByModelId } from '../config/models.config.js';
import logger from './logger.js';

/**
 * Validate if a model ID exists
 * @param {string} modelId - The model ID to validate
 * @returns {boolean} True if model exists, false otherwise
 */
export function validateModelId(modelId) {
  const config = getModelConfig(modelId);
  const valid = config !== null;
  logger.info(`[MODELS-VALIDATOR] validateModelId(${modelId}): ${valid}`);
  return valid;
}

/**
 * Get full model configuration with validation
 * @param {string} modelId - The model ID
 * @returns {object} Model configuration
 * @throws {Error} If model not found
 */
export function getModelConfigWithValidation(modelId) {
  logger.info(`[MODELS-VALIDATOR] getModelConfigWithValidation(${modelId})`);
  const config = getModelConfig(modelId);
  if (!config) {
    logger.error(`[MODELS-VALIDATOR] Model '${modelId}' not found in config`);
    throw new Error(`Model '${modelId}' not found. Please check the model ID and try again.`);
  }
  logger.info(`[MODELS-VALIDATOR] Model config found: ${JSON.stringify(config)}`);
  return config;
}

/**
 * Get provider name by model ID with validation
 * @param {string} modelId - The model ID
 * @returns {string} Provider name
 * @throws {Error} If model not found
 */
export function getProviderByModelIdWithValidation(modelId) {
  logger.info(`[MODELS-VALIDATOR] getProviderByModelIdWithValidation(${modelId})`);
  const provider = getProviderByModelId(modelId);
  if (!provider) {
    logger.error(`[MODELS-VALIDATOR] Provider not found for model '${modelId}'`);
    throw new Error(`Model '${modelId}' not found. Please check the model ID and try again.`);
  }
  logger.info(`[MODELS-VALIDATOR] Provider found: ${provider}`);
  return provider;
}

/**
 * Calculate credits needed based on model pricing and token count
 * @param {string} modelId - The model ID
 * @param {number} inputTokens - Number of input tokens
 * @param {number} outputTokens - Number of output tokens
 * @returns {number} Credits needed (rounded up)
 * @throws {Error} If model not found or invalid token counts
 */
export function calculateCreditsNeeded(modelId, inputTokens = 0, outputTokens = 0) {
  logger.info(`[MODELS-VALIDATOR] calculateCreditsNeeded(${modelId}, ${inputTokens}, ${outputTokens})`);
  const config = getModelConfigWithValidation(modelId);

  if (typeof inputTokens !== 'number' || inputTokens < 0) {
    throw new Error('inputTokens must be a non-negative number');
  }
  if (typeof outputTokens !== 'number' || outputTokens < 0) {
    throw new Error('outputTokens must be a non-negative number');
  }

  let cost = 0;

  if (config.type === 'chat') {
    const inputCost = (inputTokens / 1000) * (config.pricing.input || 0);
    const outputCost = (outputTokens / 1000) * (config.pricing.output || 0);
    cost = inputCost + outputCost;
  } else if (config.type === 'image') {
    // For image models, assume 1 credit per image
    cost = config.pricing.per_image || 0.04;
  }

  // Convert cost to credits (assuming 1 credit = $0.001)
  const credits = Math.ceil(cost * 1000);
  const finalCredits = Math.max(1, credits); // Minimum 1 credit
  logger.info(`[MODELS-VALIDATOR] Credits calculated: ${finalCredits}`);
  return finalCredits;
}

/**
 * Validate if a model supports a specific capability
 * @param {string} modelId - The model ID
 * @param {string} capability - The capability to check (e.g., 'vision', 'function_calling', 'json_mode', 'image_generation')
 * @returns {boolean} True if model supports capability, false otherwise
 * @throws {Error} If model not found
 */
export function validateModelCapability(modelId, capability) {
  logger.info(`[MODELS-VALIDATOR] validateModelCapability(${modelId}, ${capability})`);
  const config = getModelConfigWithValidation(modelId);
  const supported = config.capabilities && config.capabilities.includes(capability);
  logger.info(`[MODELS-VALIDATOR] Capability supported: ${supported}`);
  return supported;
}

/**
 * Get all capabilities of a model
 * @param {string} modelId - The model ID
 * @returns {array} Array of capabilities
 * @throws {Error} If model not found
 */
export function getModelCapabilities(modelId) {
  logger.info(`[MODELS-VALIDATOR] getModelCapabilities(${modelId})`);
  const config = getModelConfigWithValidation(modelId);
  return config.capabilities || [];
}

/**
 * Validate model type
 * @param {string} modelId - The model ID
 * @param {string} expectedType - Expected type ('chat' or 'image')
 * @returns {boolean} True if model type matches
 * @throws {Error} If model not found
 */
export function validateModelType(modelId, expectedType) {
  logger.info(`[MODELS-VALIDATOR] validateModelType(${modelId}, ${expectedType})`);
  const config = getModelConfigWithValidation(modelId);
  const matches = config.type === expectedType;
  logger.info(`[MODELS-VALIDATOR] Type matches: ${matches}`);
  return matches;
}