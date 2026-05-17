import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Coins } from 'lucide-react';
import { cn } from '@/lib/utils.js';

export default function CreditsDisplay({ creditsRemaining, creditStatus }) {
  const getStatusConfig = () => {
    switch (creditStatus) {
      case 'error':
        return {
          icon: AlertCircle,
          className: 'credit-display-error',
          message: 'No credits remaining. Please upgrade your plan.'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          className: 'credit-display-warning',
          message: 'Low credits. Consider upgrading soon.'
        };
      default:
        return {
          icon: CheckCircle2,
          className: 'credit-display-normal',
          message: 'Credits available for generation.'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-colors duration-300 shadow-sm",
      config.className
    )}>
      <div className="flex items-center gap-3 mb-2 sm:mb-0">
        <div className="p-2 rounded-full bg-background/50 backdrop-blur-sm">
          <Coins className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-base flex items-center gap-2">
            {creditsRemaining} Credits Remaining
          </h3>
          <p className="text-sm opacity-90">{config.message}</p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-sm text-sm font-medium">
        <Icon className="w-4 h-4" />
        <span className="capitalize">{creditStatus} Status</span>
      </div>
    </div>
  );
}