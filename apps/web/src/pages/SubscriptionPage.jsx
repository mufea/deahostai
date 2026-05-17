import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { pricingConfig, featureMatrixConfig } from '@/config/pricing.config';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiServerClient from '@/lib/apiServerClient';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { cn } from '@/lib/utils';

export default function SubscriptionPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSubscription() {
      if (!currentUser) return;
      try {
        const records = await pb.collection('subscriptions').getFullList({
          filter: `user_id = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false,
        });
        if (records.length > 0) {
          setSubscription(records[0]);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      }
    }
    fetchSubscription();
  }, [currentUser]);

  const handleUpgrade = async (tierConfig) => {
    if (tierConfig.tier === 'free') {
      toast({ title: 'Already on free plan', description: 'You are currently on the free plan.' });
      return;
    }

    setLoading(tierConfig.tier);

    try {
      const response = await apiServerClient.fetch('/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          subscription_tier: tierConfig.tier,
          amount: tierConfig.amount,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create transaction');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to start checkout',
      });
      setLoading(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>{t('pricing.title', 'Subscription Plans')} - DEAHost AI</title>
        <meta name="description" content={t('pricing.subtitle', 'Choose the perfect plan for your AI needs')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h1 className="text-4xl font-extrabold mb-4 text-foreground">{t('pricing.title', 'Subscription Plans')}</h1>
              <p className="text-xl text-muted-foreground">{t('pricing.subtitle', 'Choose the perfect plan for your AI needs')}</p>
            </div>

            <Card className="bg-card text-card-foreground mb-8 max-w-3xl mx-auto shadow-md border-primary/20">
              <CardHeader>
                <CardTitle>{t('pricing.current_plan', 'Current Plan')}</CardTitle>
                <CardDescription>Your active plan and balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="text-2xl font-bold capitalize text-foreground">{currentUser?.subscription_tier || 'Free'} Plan</p>
                      <Badge variant={subscription?.status === 'active' || !subscription ? 'default' : 'secondary'}>
                        {subscription?.status || 'Active'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Using the default billing cycle.
                    </p>
                  </div>
                  <div className="text-left sm:text-right bg-muted/50 p-3 rounded-lg border w-full sm:w-auto">
                    <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium">Current Balance</p>
                    <p className="text-3xl font-extrabold text-primary">{currentUser?.credits_balance || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {pricingConfig.map((tierConfig) => (
                <div key={tierConfig.id} className={cn(`plan-card plan-card-${tierConfig.tier}`, tierConfig.popular ? "pt-8" : "pt-6")}>
                  {tierConfig.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1 uppercase tracking-wider text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="px-6 mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{t(tierConfig.nameKey, tierConfig.defaultName)}</h3>
                    <div className="mt-4 flex items-baseline text-[var(--price-size)] font-extrabold text-[color:var(--price-color)]">
                      {tierConfig.price}
                      {tierConfig.tier !== 'free' && <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>}
                    </div>
                    <p className="text-sm font-medium text-primary mt-2">{t(tierConfig.creditsKey, tierConfig.defaultCredits)}</p>
                  </div>
                  <div className="px-6 text-muted-foreground text-sm mb-6 min-h-[40px]">
                    {t(tierConfig.descKey, tierConfig.defaultDesc)}
                  </div>
                  <div className="px-6 flex-1 flex flex-col">
                    <ul className="space-y-3 mb-8 flex-1">
                      {tierConfig.defaultFeatures.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm text-foreground font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pb-6 mt-auto">
                      <Button
                        className="w-full h-12 text-base font-semibold shadow-sm"
                        variant={tierConfig.popular ? 'default' : 'outline'}
                        onClick={() => handleUpgrade(tierConfig)}
                        disabled={
                          loading === tierConfig.tier ||
                          (currentUser?.subscription_tier || 'free') === tierConfig.tier
                        }
                      >
                        {loading === tierConfig.tier ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                        ) : (currentUser?.subscription_tier || 'free') === tierConfig.tier ? (
                          t('pricing.current_plan', 'Current Plan')
                        ) : tierConfig.tier === 'free' ? (
                          t('pricing.downgrade', 'Downgrade')
                        ) : (
                          t('common.upgrade', 'Upgrade')
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-24 max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-foreground">{t('pricing.compare_features', 'Compare Features')}</h2>
              </div>
              <div className="overflow-x-auto rounded-2xl border bg-card shadow-sm">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[250px] font-semibold text-foreground py-4">Feature</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Free</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Professional</TableHead>
                      <TableHead className="text-center bg-primary/5 text-primary font-bold border-x border-primary/20 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-1 bg-primary"></div>
                        Plus
                      </TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Enterprise</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {featureMatrixConfig.map((row, i) => (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-foreground">{t(row.featureKey, row.defaultFeature)}</TableCell>
                        <TableCell className="text-center">
                          {row.free ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <X className="h-5 w-5 mx-auto text-muted-foreground/30" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.professional ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <X className="h-5 w-5 mx-auto text-muted-foreground/30" />}
                        </TableCell>
                        <TableCell className="text-center bg-primary/5 border-x border-primary/10">
                          {row.plus ? <Check className="h-5 w-5 mx-auto text-primary" /> : <X className="h-5 w-5 mx-auto text-muted-foreground/30" />}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.enterprise ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <X className="h-5 w-5 mx-auto text-muted-foreground/30" />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}