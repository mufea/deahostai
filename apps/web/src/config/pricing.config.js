export const PLAN_LEVELS = { 
  free: 0, 
  professional: 1, 
  plus: 2, 
  enterprise: 3 
};

export const pricingConfig = [
  {
    id: 'free',
    tier: 'free',
    nameKey: 'pricing.free',
    defaultName: 'Free',
    price: '$0',
    amount: 0,
    creditsKey: 'pricing.credits.free',
    defaultCredits: '100 credits/month',
    descKey: 'pricing.desc.free',
    defaultDesc: 'Perfect for trying out the platform',
    featuresKeys: [
      'pricing.features.text_gen',
      'pricing.features.image_gen'
    ],
    defaultFeatures: [
      'Text Generator',
      'Image Generator'
    ],
    ctaKey: 'pricing.get_started',
    defaultCta: 'Get Started',
    popular: false
  },
  {
    id: 'professional',
    tier: 'professional',
    nameKey: 'pricing.professional',
    defaultName: 'Professional',
    price: '$19',
    amount: 1900,
    creditsKey: 'pricing.credits.pro',
    defaultCredits: '1,000 credits/month',
    descKey: 'pricing.desc.pro',
    defaultDesc: 'For creators and professionals',
    featuresKeys: [
      'pricing.features.text_gen',
      'pricing.features.image_gen',
      'pricing.features.video_gen',
      'pricing.features.music_gen',
      'pricing.features.code_gen'
    ],
    defaultFeatures: [
      'Text Generator',
      'Image Generator',
      'Video Generator',
      'Music Generator',
      'Code Generator'
    ],
    ctaKey: 'common.upgrade',
    defaultCta: 'Upgrade',
    popular: false
  },
  {
    id: 'plus',
    tier: 'plus',
    nameKey: 'pricing.plus',
    defaultName: 'Plus',
    price: '$49',
    amount: 4900,
    creditsKey: 'pricing.credits.plus',
    defaultCredits: '3,000 credits/month',
    descKey: 'pricing.desc.plus',
    defaultDesc: 'For power users and small teams',
    featuresKeys: [
      'pricing.features.text_gen',
      'pricing.features.image_gen',
      'pricing.features.video_gen',
      'pricing.features.music_gen',
      'pricing.features.code_gen',
      'pricing.features.tts',
      'pricing.features.image_analyzer',
      'pricing.features.pdf_analyzer'
    ],
    defaultFeatures: [
      'Text Generator',
      'Image Generator',
      'Video Generator',
      'Music Generator',
      'Code Generator',
      'Text-to-Speech',
      'Image Analyzer',
      'PDF Analyzer'
    ],
    ctaKey: 'common.upgrade',
    defaultCta: 'Upgrade',
    popular: true
  },
  {
    id: 'enterprise',
    tier: 'enterprise',
    nameKey: 'pricing.enterprise',
    defaultName: 'Enterprise',
    price: '$99',
    amount: 9900,
    creditsKey: 'pricing.credits.enterprise',
    defaultCredits: 'Unlimited credits',
    descKey: 'pricing.enterprise_desc',
    defaultDesc: 'For large teams and organizations',
    featuresKeys: [
      'pricing.features.text_gen',
      'pricing.features.image_gen',
      'pricing.features.video_gen',
      'pricing.features.music_gen',
      'pricing.features.code_gen',
      'pricing.features.tts',
      'pricing.features.image_analyzer',
      'pricing.features.pdf_analyzer',
      'pricing.features.video_editor',
      'pricing.features.image_editor'
    ],
    defaultFeatures: [
      'Text Generator',
      'Image Generator',
      'Video Generator',
      'Music Generator',
      'Code Generator',
      'Text-to-Speech',
      'Image Analyzer',
      'PDF Analyzer',
      'Video Editor',
      'Image Editor'
    ],
    ctaKey: 'common.upgrade',
    defaultCta: 'Upgrade',
    popular: false
  }
];

export const featureMatrixConfig = [
  { featureKey: 'pricing.features.text_gen', defaultFeature: 'Text Generator', free: true, professional: true, plus: true, enterprise: true },
  { featureKey: 'pricing.features.image_gen', defaultFeature: 'Image Generator', free: true, professional: true, plus: true, enterprise: true },
  { featureKey: 'pricing.features.video_gen', defaultFeature: 'Video Generator', free: false, professional: true, plus: true, enterprise: true },
  { featureKey: 'pricing.features.music_gen', defaultFeature: 'Music Generator', free: false, professional: true, plus: true, enterprise: true },
  { featureKey: 'pricing.features.code_gen', defaultFeature: 'Code Generator', free: false, professional: true, plus: true, enterprise: true },
  { featureKey: 'pricing.features.tts', defaultFeature: 'Text-to-Speech', free: false, professional: false, plus: true, enterprise: true },
  { featureKey: 'pricing.features.image_analyzer', defaultFeature: 'Image Analyzer', free: false, professional: false, plus: true, enterprise: true },
  { featureKey: 'pricing.features.pdf_analyzer', defaultFeature: 'PDF Analyzer', free: false, professional: false, plus: true, enterprise: true },
  { featureKey: 'pricing.features.video_editor', defaultFeature: 'Video Editor', free: false, professional: false, plus: false, enterprise: true },
  { featureKey: 'pricing.features.image_editor', defaultFeature: 'Image Editor', free: false, professional: false, plus: false, enterprise: true },
];