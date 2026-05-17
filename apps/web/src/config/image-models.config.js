export const IMAGE_MODELS = {
  'dalle3': {
    id: 'dalle3',
    name: 'DALL-E 3',
    description: 'Advanced image generation by OpenAI',
    icon: '🎨',
    badgeClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
    iconColor: 'text-orange-500',
    supportedSizes: ['1024x1024', '1024x1792', '1792x1024'],
    supportedQualities: ['standard', 'hd'],
    endpoint: '/image-generation/dalle3'
  },
  'dall-e-2': {
    id: 'dall-e-2',
    name: 'DALL-E 2',
    description: 'High-quality image generation',
    icon: '🎨',
    provider: 'openai',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    iconColor: 'text-blue-500',
    supportedSizes: ['256x256', '512x512', '1024x1024'],
    supportedQualities: ['standard'], // Updated: DALL-E 2 only supports 'standard' quality
    endpoint: '/image-generation/dalle2'
  },
  'sd3': {
    id: 'sd3',
    name: 'Stable Diffusion 3',
    description: 'Advanced image generation with style control',
    icon: '🎨',
    badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
    iconColor: 'text-purple-500',
    supportedSizes: ['1024x1024', '1024x1536', '1536x1024'],
    supportedStyles: ['photorealistic', 'cinematic', 'anime', 'illustration', 'sketch'],
    endpoint: '/image-generation/sd3'
  },
  'flux-pro': {
    id: 'flux-pro',
    name: 'Flux Pro',
    description: 'Fast and powerful image generation',
    icon: '⚡',
    badgeClass: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    iconColor: 'text-yellow-500',
    supportedSizes: ['1024x1024', '1024x1536', '1536x1024'],
    supportedStyles: ['default', 'anime', 'realistic'],
    endpoint: '/image-generation/flux'
  },
  'nano-banana-2': {
    id: 'nano-banana-2',
    name: 'Nano Banana 2',
    description: 'Lightweight image generation',
    icon: '🍌',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    iconColor: 'text-green-500',
    supportedSizes: ['256x256', '512x512', '768x768'],
    supportedSteps: [10, 20, 30, 40, 50],
    endpoint: '/image-generation/nano'
  }
};

export function getImageModelConfig(modelId) {
  return IMAGE_MODELS[modelId] || IMAGE_MODELS['dalle3'];
}