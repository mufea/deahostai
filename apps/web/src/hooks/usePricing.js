import { useMemo } from 'react';
import { pricingConfig, featureMatrixConfig } from '@/config/pricing.config';

export function usePricing() {
  const getAllPlans = useMemo(() => {
    return () => pricingConfig;
  }, []);

  const getPlanById = useMemo(() => {
    return (id) => pricingConfig.find(plan => plan.id === id || plan.tier === id);
  }, []);

  const getPlanFeatures = useMemo(() => {
    return () => featureMatrixConfig;
  }, []);

  const getPlanPrice = useMemo(() => {
    return (id) => {
      const plan = getPlanById(id);
      return plan ? plan.price : null;
    };
  }, [getPlanById]);

  return {
    plans: pricingConfig,
    featureMatrix: featureMatrixConfig,
    getAllPlans,
    getPlanById,
    getPlanFeatures,
    getPlanPrice
  };
}