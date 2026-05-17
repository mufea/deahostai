export const creditsConfig = {
  baseCosts: {
    'text': 2,
    'image': 5,
    'video': 10,
    'code': 5,
    'tts': 3,
    'pdf': 5,
    'image_analysis': 3,
    'video_edit': 8,
    'image_edit': 4
  },
  multipliers: {
    textLength: {
      thresholds: [
        { min: 500, multiplier: 1.5 },
        { min: 100, multiplier: 1.2 },
        { min: 0, multiplier: 1.0 }
      ]
    },
    imageResolution: {
      '256x256': 0.5,
      '512x512': 1.0,
      '768x768': 1.3,
      '1024x1024': 1.5,
      'default': 1.8 // Larger than 1024x1024
    },
    videoQuality: {
      '480p': 1.0,
      '720p': 1.5,
      '1080p': 2.0
    },
    videoDuration: {
      thresholds: [
        { min: 30, multiplier: 2.0 },
        { min: 20, multiplier: 1.5 },
        { min: 10, multiplier: 1.2 },
        { min: 0, multiplier: 1.0 }
      ]
    }
  },
  rules: {
    freeCreditsForNewUsers: 100,
    rolloverEnabled: false,
    expirationDays: 30
  },
  packages: [
    { id: 'pack-sm', name: 'Starter Pack', credits: 500, price: 9.99 },
    { id: 'pack-md', name: 'Pro Pack', credits: 2000, price: 29.99 },
    { id: 'pack-lg', name: 'Elite Pack', credits: 5000, price: 59.99 }
  ]
};