import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';
import { toolsConfig } from '@/config/tools.config.js';
import { pricingConfig } from '@/config/pricing.config.js';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, ArrowRight, Zap, Shield, BarChart, Download, Layers, Cpu } from 'lucide-react';
import { LogoFull } from '@/components/Logo.jsx';
import LanguageSelector from '@/components/LanguageSelector.jsx';
import ThemeToggle from '@/components/ThemeToggle.jsx';
import Footer from '@/components/Footer.jsx';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const features = [
    { title: 'Multi-Model Support', desc: 'Choose from 20+ AI models for different needs including GPT-4o, Claude 3.5, and Gemini 1.5.', icon: <Layers className="h-6 w-6 text-primary" /> },
    { title: 'Model Comparison', desc: 'Compare results from multiple models side-by-side to find the best output for your prompt.', icon: <BarChart className="h-6 w-6 text-primary" /> },
    { title: 'Real-time Cost Estimation', desc: 'Know exactly how many credits each generation costs before you click generate.', icon: <Cpu className="h-6 w-6 text-primary" /> },
    { title: 'Secure & Private', desc: 'Your data is encrypted and never shared. Enterprise-grade security for all your generations.', icon: <Shield className="h-6 w-6 text-primary" /> },
    { title: 'Fast Generation', desc: 'Get results in seconds with optimized models and dedicated high-performance infrastructure.', icon: <Zap className="h-6 w-6 text-primary" /> },
    { title: 'Save & Export', desc: 'Download results in multiple formats including JSON, Markdown, MP4, and high-res PNG.', icon: <Download className="h-6 w-6 text-primary" /> },
  ];

  return (
    <>
      <Helmet>
        <title>DEAHost AI Platform - AI Tools for Video, Image, Code & More</title>
      </Helmet>

      <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
          <div className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <LogoFull iconSize={28} />
            <nav className="hidden md:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <Link to="#tools" className="text-sm font-medium hover:text-primary">Tools</Link>
              <Link to="/pricing" className="text-sm font-medium hover:text-primary">Pricing</Link>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <LanguageSelector />
              <Link to="/login">
                <Button variant="ghost" className="font-medium hidden sm:inline-flex">{t('nav.login', 'Log In')}</Button>
              </Link>
              <Link to="/signup">
                <Button className="font-medium shadow-md">{t('nav.signup', 'Sign Up')}</Button>
              </Link>
            </div>
          </div>
        </header>

        <section className="relative min-h-[90dvh] flex items-center overflow-hidden pt-16 pb-24">
          <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
          </div>
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 border border-primary/20">
                <span>New: Professional Plan now includes Code Generator</span>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight text-balance max-w-5xl mx-auto">
                The All-in-One <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">AI Creative Suite</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
                Generate videos, images, code, text, music and more with OpenAI, Gemini, Anthropic & Deepseek. Stop paying for multiple subscriptions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" className="text-base px-8 py-6 h-auto shadow-xl hover:shadow-primary/25 hover:-translate-y-0.5 transition-all w-full sm:w-auto">
                    Start Creating Free
                    <ArrowRight className={cn("h-5 w-5", isRtl ? "mr-2 rotate-180" : "ml-2")} />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button size="lg" variant="outline" className="text-base px-8 py-6 h-auto w-full sm:w-auto">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Tools Section */}
        <section id="tools" className="py-24 bg-muted/20 border-y">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">10 Powerful AI Tools</h2>
              <p className="text-lg text-muted-foreground">Access the best models for every task from a single unified dashboard.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {toolsConfig.map((tool, index) => (
                <motion.div key={tool.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: index * 0.1 }}>
                  <Card className="h-full flex flex-col bg-card hover:shadow-lg transition-shadow border-border/50">
                    <CardHeader>
                      <div className="flex justify-between items-start mb-4">
                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                          <tool.icon className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className={`badge-tier-${tool.requiredPlan} uppercase text-[10px] tracking-wider`}>
                          {tool.requiredPlan === 'free' ? 'Free' : tool.requiredPlan === 'coming_soon' ? 'Coming Soon' : `${tool.requiredPlan}+`}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl mb-1">{t(tool.nameKey, tool.defaultName)}</CardTitle>
                      <p className="text-sm text-muted-foreground line-clamp-2">{t(tool.descKey, tool.defaultDesc)}</p>
                    </CardHeader>
                    <CardContent className="mt-auto pt-4 flex-1 flex flex-col justify-end">
                      <Link to={tool.href} className="block w-full">
                        <Button className="w-full group" variant="secondary">
                          {tool.status === 'coming_soon' ? 'Coming Soon' : 'Try Now'}
                          <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">Simple, Transparent Pricing</h2>
              <p className="text-lg text-muted-foreground">Choose the plan that fits your creative needs.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingConfig.map((plan) => (
                <div key={plan.id} className={cn(`plan-card plan-card-${plan.tier}`, plan.popular ? "pt-8" : "pt-6")}>
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <Badge className="bg-primary text-primary-foreground shadow-sm px-3 py-1 uppercase tracking-wider text-xs">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <div className="px-6 mb-4">
                    <h3 className="text-2xl font-bold">{t(plan.nameKey, plan.defaultName)}</h3>
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
                          <span className="text-sm font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="pb-6 mt-auto">
                      <Link to="/signup" className="block">
                        <Button className="w-full h-12 shadow-sm font-semibold group" variant={plan.popular ? 'default' : 'outline'}>
                          {t(plan.ctaKey, plan.defaultCta)}
                          <ArrowRight className="ml-2 h-4 w-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
}