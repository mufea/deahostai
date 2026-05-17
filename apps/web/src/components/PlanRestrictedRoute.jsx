import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { toolsConfig } from '@/config/tools.config.js';
import { pricingConfig, PLAN_LEVELS } from '@/config/pricing.config.js';
import { useTranslation } from '@/hooks/useTranslation.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import Header from '@/components/Header.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Lock, Clock, Check, ArrowRight } from 'lucide-react';

export default function PlanRestrictedRoute({ children, toolId }) {
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tool = toolsConfig.find(t => t.id === toolId);
  const userTier = currentUser?.subscription_tier || 'free';
  const requiredTier = tool?.requiredPlan || 'free';

  const requiredPlanConfig = pricingConfig.find(p => p.tier === requiredTier);
  
  // Fallback handling for missing variables
  const toolName = tool?.defaultName || 'this feature';
  const planName = requiredPlanConfig?.defaultName || 'Premium Plan';

  useEffect(() => {
    // Log missing variables for debugging
    if (!tool?.defaultName) {
      console.warn(`PlanRestrictedRoute: Missing tool name for toolId: ${toolId}`);
    }
    if (!requiredPlanConfig?.defaultName) {
      console.warn(`PlanRestrictedRoute: Missing plan name for tier: ${requiredTier}`);
    }
    
    // Verify resolution
    console.log(`PlanRestrictedRoute resolved - Plan: ${planName}, Tool: ${toolName}`);
  }, [toolId, requiredTier, tool?.defaultName, requiredPlanConfig?.defaultName, planName, toolName]);

  if (requiredTier === 'coming_soon') {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="p-6 max-w-4xl mx-auto flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-md w-full text-center border-border shadow-lg">
              <CardContent className="pt-10 pb-10 flex flex-col items-center">
                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold mb-2">
                  {tool ? t(tool.nameKey, toolName) : 'Tool'} {t('pricing.coming_soon', 'is Coming Soon')}
                </h2>
                <p className="text-muted-foreground mb-6">
                  We are working hard to bring this feature to you. Stay tuned!
                </p>
                <Link to="/dashboard">
                  <Button>Back to Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  const hasAccess = PLAN_LEVELS[userTier] >= PLAN_LEVELS[requiredTier];

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-6 max-w-4xl mx-auto flex flex-col items-center justify-center w-full">
            <div className="text-center mb-10">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative shadow-inner">
                {tool && <tool.icon className="w-10 h-10 text-primary" />}
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-card rounded-full flex items-center justify-center border-[3px] border-background shadow-sm">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-balance">
                Unlock {toolName}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {/* CRITICAL FIX: Pass interpolation variables to i18next so {{plan}} and {{tool}} in JSON files are replaced, while providing a JS template literal fallback */}
                {t('pricing.upgrade_to_access', {
                  plan: planName,
                  tool: toolName,
                  defaultValue: `Upgrade to ${planName} to access ${toolName} and boost your productivity with our advanced toolset.`
                })}
              </p>
            </div>

            <Card className={`max-w-2xl w-full border-2 overflow-hidden shadow-xl plan-card-${requiredTier}`}>
              <div className="grid md:grid-cols-2">
                <div className="p-8 border-b md:border-b-0 md:border-r flex flex-col justify-center bg-card/50">
                  <Badge variant="outline" className={`badge-tier-${requiredTier} w-fit mb-4 uppercase tracking-wider`}>
                    {requiredTier} Plan Required
                  </Badge>
                  <h3 className="text-2xl font-bold mb-2">{planName}</h3>
                  <div className="flex items-baseline text-4xl font-extrabold mb-4">
                    {requiredPlanConfig?.price || '$0'}
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>
                  </div>
                  <p className="text-sm font-medium text-primary mb-6">
                    {t(requiredPlanConfig?.creditsKey, requiredPlanConfig?.defaultCredits || '')}
                  </p>
                  
                  <Link to="/subscription" className="mt-auto">
                    <Button size="lg" className="w-full text-base font-semibold shadow-sm group">
                      Upgrade Now
                      <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </Button>
                  </Link>
                </div>
                
                <div className="p-8 bg-muted/20">
                  <h4 className="font-semibold text-foreground mb-4">Everything you get:</h4>
                  <ul className="space-y-4">
                    {(requiredPlanConfig?.defaultFeatures || []).map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary shrink-0" />
                        <span className="text-sm text-foreground font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>

            <div className="mt-8">
              <Link to="/tools">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  Explore other tools
                </Button>
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return children;
}