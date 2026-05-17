import { useMemo } from 'react';
import { creditsConfig } from '@/config/credits.config';

export function useCredits() {
  const getCreditCostForTool = useMemo(() => {
    return (toolId) => creditsConfig.baseCosts[toolId] || 1;
  }, []);

  const getCreditCostForModel = useMemo(() => {
    // Allows dynamically passing base cost if a model provides it
    return (modelCost) => modelCost || 1;
  }, []);

  const getCreditMultiplier = useMemo(() => {
    return (toolId, params) => {
      let multiplier = 1;

      if (toolId === 'text' && params?.length) {
        const threshold = creditsConfig.multipliers.textLength.thresholds.find(t => params.length >= t.min);
        if (threshold) multiplier = threshold.multiplier;
      }

      if (toolId === 'image' && params?.resolution) {
        multiplier = creditsConfig.multipliers.imageResolution[params.resolution] || creditsConfig.multipliers.imageResolution.default;
      }

      if (toolId === 'video') {
        let qMult = 1;
        let dMult = 1;
        if (params?.quality) {
          qMult = creditsConfig.multipliers.videoQuality[params.quality] || 1.0;
        }
        if (params?.duration) {
          const durationInt = parseInt(params.duration);
          const threshold = creditsConfig.multipliers.videoDuration.thresholds.find(t => durationInt >= t.min);
          if (threshold) dMult = threshold.multiplier;
        }
        multiplier = qMult * dMult;
      }

      return multiplier;
    };
  }, []);

  const calculateTotalCreditsNeeded = useMemo(() => {
    return (toolId, params) => {
      let base = getCreditCostForTool(toolId);
      if (params?.modelCost) {
        base = params.modelCost; // Model specific overrides base tool cost
      }
      
      const multiplier = getCreditMultiplier(toolId, params);
      return Math.ceil(base * multiplier);
    };
  }, [getCreditCostForTool, getCreditMultiplier]);

  return {
    config: creditsConfig,
    getCreditCostForTool,
    getCreditCostForModel,
    getCreditMultiplier,
    calculateTotalCreditsNeeded
  };
}