import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { pricingConfig, featureMatrixConfig } from '@/config/pricing.config';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Check, X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PricingPage() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>{t('pricing.title', 'Pricing')} - DEAHost AI</title>
        <meta name="description" content={t('pricing.subtitle', 'Choose the perfect plan for your AI needs')} />
      </Helmet>

      <div className="min-h-screen bg-background flex flex-col">
        <Header />

        <main className="flex-1 py-16 md:py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-balance text-foreground">{t('pricing.title', 'Subscription Plans')}</h1>
              <p className="text-xl text-muted-foreground">{t('pricing.subtitle', 'Choose the perfect plan for your AI needs')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24 items-stretch">
              {pricingConfig.map((plan) => (
                <div key={plan.id} className={cn(`plan-card plan-card-${plan.tier}`, plan.popular ? "pt-8" : "pt-6")}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                      <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1 uppercase tracking-wider text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="px-6 mb-4">
                    <h3 className="text-2xl font-bold text-foreground">{t(plan.nameKey, plan.defaultName)}</h3>
                    <div className="mt-4 flex items-baseline text-[var(--price-size)] font-extrabold text-[color:var(--price-color)]">
                      {plan.price}
                      {plan.id !== 'free' && <span className="ml-1 text-xl font-medium text-muted-foreground">/mo</span>}
                    </div>
                    <p className="text-sm font-medium text-primary mt-2">{t(plan.creditsKey, plan.defaultCredits)}</p>
                  </div>
                  <div className="px-6 text-muted-foreground text-sm mb-6 min-h-[40px]">
                    {t(plan.descKey, plan.defaultDesc)}
                  </div>
                  <div className="px-6 flex-1 flex flex-col">
                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.defaultFeatures.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-primary shrink-0" />
                          <span className="text-sm text-foreground font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pb-6 mt-auto">
                      <Link to="/signup" className="block">
                        <Button className="w-full h-12 text-base font-semibold shadow-sm group" variant={plan.popular ? 'default' : 'outline'}>
                          {t(plan.ctaKey, plan.defaultCta)}
                          <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="max-w-6xl mx-auto">
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
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}