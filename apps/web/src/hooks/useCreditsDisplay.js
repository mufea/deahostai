import { useAuth } from '@/contexts/AuthContext.jsx';

export function useCreditsDisplay() {
  const { currentUser, refreshUser } = useAuth();
  
  const credits = currentUser?.credits_balance || 0;
  const isNoCredits = credits <= 0;
  const isLowCredit = credits > 0 && credits < 5;
  
  let creditStatus = 'normal';
  if (isNoCredits) {
    creditStatus = 'error';
  } else if (isLowCredit) {
    creditStatus = 'warning';
  }

  return {
    credits,
    isNoCredits,
    isLowCredit,
    creditStatus,
    refreshCredits: refreshUser
  };
}