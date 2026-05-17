import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCredits } from '@/hooks/useCredits.js';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import ModelSelector from '@/components/ModelSelector.jsx';
import { getImageModelConfig } from '@/config/image-models.config.js';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { AlertCircle, Wand2, Download, Loader2, Sparkles, Image as ImageIcon, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { cn } from '@/lib/utils.js';

export default function ImageGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  // App State
  const [selectedModel, setSelectedModel] = useState('dalle3');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState('');
  const [resultModelId, setResultModelId] = useState('');
  const [generationError, setGenerationError] = useState(null);
  const [history, setHistory] = useState([]);
  
  // Model specific options
  const [resolution, setResolution] = useState('1024x1024');
  const [quality, setQuality] = useState('standard');
  const [style, setStyle] = useState('photorealistic');
  const [steps, setSteps] = useState(20);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('imageGenerationHistory');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to parse history');
      }
    }
  }, []);

  // Update available options when model changes
  const activeConfig = getImageModelConfig(selectedModel);
  useEffect(() => {
    if (!activeConfig.supportedSizes.includes(resolution)) {
      setResolution(activeConfig.supportedSizes[0]);
    }
    
    // Dynamically filter quality options and auto-set if needed
    if (activeConfig.supportedQualities && !activeConfig.supportedQualities.includes(quality)) {
      setQuality(activeConfig.supportedQualities[0]); // Auto-sets to 'standard' for DALL-E 2
    }
    
    if (activeConfig.supportedStyles && !activeConfig.supportedStyles.includes(style)) {
      setStyle(activeConfig.supportedStyles[0]);
    }
    if (activeConfig.supportedSteps && !activeConfig.supportedSteps.includes(steps)) {
      setSteps(activeConfig.supportedSteps.includes(20) ? 20 : activeConfig.supportedSteps[0]);
    }
  }, [selectedModel, activeConfig, resolution, quality, style, steps]);

  const calculatedCost = calculateTotalCreditsNeeded('image', { resolution, modelCost: 15 });
  const hasInsufficientCredits = currentUser && currentUser.credits_balance < calculatedCost;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    if (hasInsufficientCredits) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits. Please upgrade your plan.' });
      return;
    }

    setIsGenerating(true);
    setResultImage('');
    setResultModelId('');
    setGenerationError(null);

    try {
      const payload = { prompt: prompt.trim(), size: resolution };
      
      // Inject model-specific parameters
      if (activeConfig.supportedQualities) payload.quality = quality;
      if (activeConfig.supportedStyles) payload.style = style;
      if (activeConfig.supportedSteps) payload.steps = steps;

      if (selectedModel === 'dall-e-2') {
        console.log(`[IMAGE-DALLE2] Using size: ${resolution}, Quality: ${quality}`);
        console.log(`[IMAGE-DALLE2] Request payload:`, payload);
      }

      const response = await apiServerClient.fetch(activeConfig.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (selectedModel === 'dall-e-2') {
        console.log(`[IMAGE-DALLE2] Response from OpenAI (via backend):`, data);
      }

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate image using ${activeConfig.name}`);
      }

      const generatedUrl = data.imageUrl;
      
      setResultImage(generatedUrl);
      setResultModelId(selectedModel); // Use the original selection ID to match configs

      // Add to local history
      const newHistoryItem = {
        id: Date.now().toString(),
        imageUrl: generatedUrl,
        prompt: prompt.trim(),
        modelId: selectedModel,
        timestamp: new Date().toISOString()
      };
      
      const newHistory = [newHistoryItem, ...history].slice(0, 20); // Keep last 20
      setHistory(newHistory);
      localStorage.setItem('imageGenerationHistory', JSON.stringify(newHistory));

      await refreshUser();
      
      toast({
        title: 'Success',
        description: 'Image generated successfully.',
      });
    } catch (error) {
      setGenerationError(error.message || 'An unexpected error occurred during generation.');
      toast({
        variant: 'destructive',
        title: 'Generation Error',
        description: error.message || 'An error occurred during generation.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (url, filename = 'generated-image') => {
    if (!url) return;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `${filename}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(objectUrl);
      document.body.removeChild(a);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to download image.' });
    }
  };

  const renderModelBadge = (modelId) => {
    const config = getImageModelConfig(modelId);
    return (
      <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border", config.badgeClass)}>
        <span className="text-[10px] leading-none">{config.icon}</span>
        {config.name}
      </div>
    );
  };

  return (
    <>
      <Helmet>
        <title>Image Generator - DEAHost AI Platform</title>
        <meta name="description" content="Generate stunning AI images using top-tier models like DALL-E 3, Stable Diffusion, and Flux Pro." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold mb-2 text-foreground flex items-center gap-3">
                  <Sparkles className="w-8 h-8 text-primary" />
                  Image Studio
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  Create stunning visuals using industry-leading AI image models.
                </p>
              </div>
              <div className="shrink-0 z-10">
                <ModelSelector 
                  category="image"
                  selectedModel={selectedModel}
                  onModelChange={setSelectedModel}
                  disabled={isGenerating}
                />
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Generation Controls */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="shadow-lg border-border/60">
                  <CardContent className="p-6 space-y-6">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Your Prompt</Label>
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the image you want to generate in detail..."
                        className="min-h-[160px] resize-y text-base p-4 bg-background focus-visible:ring-primary/50 shadow-sm"
                        disabled={isGenerating}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Size</Label>
                        <Select value={resolution} onValueChange={setResolution} disabled={isGenerating}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activeConfig.supportedSizes.map(res => (
                              <SelectItem key={res} value={res}>{res}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {activeConfig.supportedQualities && (
                        <div className="space-y-2">
                          <Label>Quality</Label>
                          <Select value={quality} onValueChange={setQuality} disabled={isGenerating}>
                            <SelectTrigger>
                              <SelectValue className="capitalize" />
                            </SelectTrigger>
                            <SelectContent>
                              {activeConfig.supportedQualities.map(q => (
                                <SelectItem key={q} value={q} className="capitalize">{q}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {activeConfig.supportedStyles && (
                        <div className="space-y-2 col-span-2">
                          <Label>Style Preset</Label>
                          <Select value={style} onValueChange={setStyle} disabled={isGenerating}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activeConfig.supportedStyles.map(s => (
                                <SelectItem key={s} value={s} className="capitalize">{s.replace('-', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {activeConfig.supportedSteps && (
                        <div className="space-y-2 col-span-2">
                          <Label>Inference Steps</Label>
                          <Select value={steps.toString()} onValueChange={(v) => setSteps(parseInt(v))} disabled={isGenerating}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {activeConfig.supportedSteps.map(s => (
                                <SelectItem key={s} value={s.toString()}>{s} Steps</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {hasInsufficientCredits && (
                      <Alert variant="destructive" className="bg-destructive/10">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient credits. You need {calculatedCost} credits to generate.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground">
                          Cost: {calculatedCost} credits
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Balance: {currentUser?.credits_balance || 0} credits
                        </span>
                      </div>

                      <Button 
                        onClick={handleGenerate} 
                        disabled={isGenerating || !prompt.trim() || hasInsufficientCredits}
                        className="w-full sm:w-auto h-12 px-6 shadow-sm active:scale-[0.98] transition-transform"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-5 w-5" />
                            Generate Image
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: Output & History */}
              <div className="lg:col-span-7 space-y-8 flex flex-col">
                
                {/* Current Output */}
                <div className="min-h-[480px] w-full flex flex-col">
                  {isGenerating ? (
                    <Card className="flex-1 flex flex-col items-center justify-center bg-muted/20 border-dashed border-2">
                      <div className="p-4 rounded-full bg-primary/10 mb-4 animate-pulse">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                      <h3 className="text-xl font-medium text-foreground">Synthesizing Pixels</h3>
                      <p className="text-muted-foreground mt-2">Using {activeConfig.name} to paint your vision...</p>
                    </Card>
                  ) : generationError ? (
                    <Card className="flex-1 flex flex-col items-center justify-center bg-destructive/5 border-dashed border-2 border-destructive/20 p-6 text-center">
                      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
                      <h3 className="text-xl font-semibold text-foreground mb-2">Generation Failed</h3>
                      <p className="text-muted-foreground max-w-md">{generationError}</p>
                      <Button variant="outline" className="mt-6" onClick={() => setGenerationError(null)}>
                        Try Again
                      </Button>
                    </Card>
                  ) : resultImage ? (
                    <Card className="flex-1 overflow-hidden shadow-xl border-border/60 bg-[#0a0a0a] group relative">
                      <div className="absolute top-4 left-4 z-10 flex gap-2 shadow-sm">
                        {renderModelBadge(resultModelId)}
                      </div>
                      <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm" onClick={() => handleDownload(resultImage)} className="shadow-md">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      <div className="w-full h-full flex items-center justify-center p-4">
                        <img 
                          src={resultImage} 
                          alt={prompt} 
                          className="max-w-full max-h-[600px] rounded-lg object-contain shadow-2xl border border-white/10"
                        />
                      </div>
                    </Card>
                  ) : (
                    <Card className="flex-1 flex flex-col items-center justify-center bg-muted/10 border-dashed border-2 opacity-70 p-6 text-center">
                      <ImageIcon className="w-16 h-16 text-muted-foreground mb-4 stroke-1" />
                      <p className="text-lg font-medium text-foreground">Your canvas is empty</p>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                        Select a model, enter a descriptive prompt, and generate your first image.
                      </p>
                    </Card>
                  )}
                </div>

                {/* History Gallery */}
                {history.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-2">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        Recent Creations
                      </h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {history.map((item) => (
                        <div key={item.id} className="group relative rounded-xl overflow-hidden border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1 cursor-pointer">
                          <div className="aspect-square w-full bg-muted overflow-hidden relative">
                            <img 
                              src={item.imageUrl} 
                              alt={item.prompt}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center p-3 text-center">
                              <p className="text-white text-xs line-clamp-3 mb-3">{item.prompt}</p>
                              <Button size="sm" variant="secondary" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); handleDownload(item.imageUrl); }}>
                                <Download className="w-3 h-3 mr-1" /> Save
                              </Button>
                            </div>
                          </div>
                          <div className="p-2 bg-card border-t flex justify-between items-center">
                            {renderModelBadge(item.modelId)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
            </div>
          </main>
        </div>
      </div>
    </>
  );
}