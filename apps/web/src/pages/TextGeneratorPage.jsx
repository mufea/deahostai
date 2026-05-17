import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTranslation } from '@/hooks/useTranslation.jsx';
import { useCredits } from '@/hooks/useCredits.js';
import { useCreditsDisplay } from '@/hooks/useCreditsDisplay.js';
import { useGenerationHistory } from '@/hooks/useGenerationHistory.js';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import CreditsDisplay from '@/components/CreditsDisplay.jsx';
import GenerationHistory from '@/components/GenerationHistory.jsx';
import ModelSelector, { getModelConfig } from '@/components/ModelSelector.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { AlertCircle, Copy, Check, Loader2, FileText, Sparkles, Zap } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { cn } from '@/lib/utils.js';

export default function TextGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const { credits, isNoCredits, isLowCredit, creditStatus, refreshCredits } = useCreditsDisplay();
  const { history, addToHistory, deleteHistoryItem, clearAllHistory } = useGenerationHistory();
  
  // Model state with localStorage persistence
  const [selectedModel, setSelectedModel] = useState(() => {
    const saved = localStorage.getItem('textGeneratorPreferredModel');
    // Map old names to standard IDs for consistency
    if (saved === 'claude-4' || saved === 'claude-3-5-sonnet') {
      return 'claude';
    }
    if (saved === 'gemini-2.5-flash') {
      return 'gemini';
    }
    if (saved === 'grok-4') {
      return 'xai';
    }
    return saved || 'openai';
  });

  const [prompt, setPrompt] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [lastGeneratedModel, setLastGeneratedModel] = useState(null);
  const [lastTokensUsed, setLastTokensUsed] = useState(null);

  // Persist model selection
  useEffect(() => {
    localStorage.setItem('textGeneratorPreferredModel', selectedModel);
  }, [selectedModel]);

  const calculatedCost = calculateTotalCreditsNeeded('text', { length: prompt.length || 100, modelCost: 10 });
  const hasInsufficientCredits = currentUser && credits < calculatedCost;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    
    if (isNoCredits || hasInsufficientCredits) {
      setError('Insufficient credits for this request. Please upgrade your plan or purchase more credits.');
      return;
    }

    if (isLowCredit) {
      toast({
        title: 'Low Credits Warning',
        description: 'You are running low on credits. Consider upgrading soon.',
        variant: 'warning',
      });
    }

    const currentPrompt = prompt.trim();
    const currentModel = selectedModel;
    
    setIsGenerating(true);
    setError(null);
    setResult('');
    setCurrentHistoryId(null);
    setLastGeneratedModel(null);
    setLastTokensUsed(null);

    try {
      let endpoint = '/chat/unified';
      let payload = { message: currentPrompt, model: currentModel };
      
      // Use specific endpoints for models as requested
      if (currentModel === 'gemini') {
        endpoint = '/chat/gemini';
        payload = { message: currentPrompt };
      } else if (currentModel === 'deepseek') {
        endpoint = '/chat/deepseek';
        payload = { message: currentPrompt };
      } else if (currentModel === 'claude') {
        endpoint = '/chat/claude';
        payload = { 
          message: currentPrompt,
          temperature: temperature,
          maxTokens: maxTokens
        };
      } else if (currentModel === 'xai') {
        endpoint = '/chat/xai';
        payload = { message: currentPrompt };
      }

      let response;
      try {
        response = await apiServerClient.fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (fetchErr) {
        // Network errors or CORS issues
        throw new Error('Network error: Please check your connection');
      }

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // Ignore parsing errors for fallback
        }

        let errorMsg = errorData.error || errorData.message || 'Failed to generate text. Please try again.';
        
        // Handle specific API errors gracefully
        if (currentModel === 'gemini') {
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'Gemini API error: Invalid API key';
          } else if (response.status === 429) {
            errorMsg = 'Rate limited: Please try again later';
          }
        } else if (currentModel === 'deepseek') {
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'Deepseek API error: Invalid API key';
          } else if (response.status === 429) {
            errorMsg = 'Deepseek Rate limited: Please try again later';
          }
        } else if (currentModel === 'claude') {
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'Claude API error: invalid key';
          } else if (response.status === 429) {
            errorMsg = 'Claude API rate limited';
          }
        } else if (currentModel === 'xai') {
          if (response.status === 401 || response.status === 403) {
            errorMsg = 'X.AI API error: Invalid API key';
          } else if (response.status === 429) {
            errorMsg = 'X.AI rate limited: Please try again later';
          }
        }
        
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      const generatedText = data.response;
      let returnedModel = data.model || currentModel;
      
      // Map backend model names to our frontend IDs
      if (returnedModel === 'claude-3-5-sonnet' || returnedModel === 'claude-4-sonnet' || returnedModel === 'claude-sonnet-4') {
        returnedModel = 'claude';
      }
      if (returnedModel === 'gemini-2.5-flash') {
        returnedModel = 'gemini';
      }
      if (returnedModel === 'grok-4') {
        returnedModel = 'xai';
      }
      
      let tokensUsed = 0;
      let tokenDetails = null;
      
      if (currentModel === 'gemini' || currentModel === 'xai') {
        tokensUsed = (data.tokens?.input || 0) + (data.tokens?.output || 0);
      } else if (currentModel === 'deepseek') {
        tokensUsed = data.tokens?.output || 0;
      } else if (currentModel === 'claude') {
        tokensUsed = (data.tokens?.input || 0) + (data.tokens?.output || 0);
        tokenDetails = data.tokens; // Store the object for detailed display
      } else {
        tokensUsed = data.tokens?.total || 0;
      }
      
      if (!generatedText) {
        throw new Error('Received empty response from the server.');
      }

      setResult(generatedText);
      setLastGeneratedModel(returnedModel);
      setLastTokensUsed(tokenDetails || tokensUsed);
      
      addToHistory(currentPrompt, generatedText, tokensUsed, returnedModel);
      setPrompt('');
      await refreshCredits();
      
    } catch (err) {
      // Fallback to OpenAI logic if a different provider failed
      if (currentModel !== 'openai') {
        toast({
          title: `${getModelConfig(currentModel).name} Unavailable`,
          description: `The provider failed. Falling back to OpenAI.`,
          variant: 'destructive',
          duration: 5000,
        });
        setSelectedModel('openai');
        setError(`${err.message}. We switched your model to OpenAI. You can try generating again.`);
      } else {
        setError(err.message || 'An unexpected error occurred while generating text.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    toast({
      title: 'Copied to clipboard',
      description: 'The generated text has been copied to your clipboard.',
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const handleLoadHistory = (item) => {
    setPrompt(item.prompt);
    setResult(item.response);
    setCurrentHistoryId(item.id);
    
    let historyModel = item.model || 'openai';
    // Map old model names to current IDs
    if (historyModel === 'claude-4' || historyModel === 'claude-3-5-sonnet' || historyModel === 'claude-sonnet-4') {
      historyModel = 'claude';
    }
    if (historyModel === 'gemini-2.5-flash') {
      historyModel = 'gemini';
    }
    if (historyModel === 'grok-4') {
      historyModel = 'xai';
    }
    
    setSelectedModel(historyModel);
    setLastGeneratedModel(historyModel);
    setLastTokensUsed(item.tokensUsed || 0);
    setError(null);
  };

  const handleDeleteHistoryItem = (id) => {
    deleteHistoryItem(id);
    if (currentHistoryId === id) {
      setCurrentHistoryId(null);
      setPrompt('');
      setResult('');
      setLastGeneratedModel(null);
      setLastTokensUsed(null);
    }
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setCurrentHistoryId(null);
    setPrompt('');
    setResult('');
    setLastGeneratedModel(null);
    setLastTokensUsed(null);
  };

  const resultModelConfig = lastGeneratedModel ? getModelConfig(lastGeneratedModel) : null;
  const ResultModelIcon = resultModelConfig?.icon;

  return (
    <>
      <Helmet>
        <title>Text Generator - DEAHost AI Platform</title>
        <meta name="description" content="Generate high-quality text content using advanced AI models." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
            <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground tracking-tight">
                  AI Text Generator
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl">
                  Create articles, emails, summaries, and more in seconds across multiple AI models.
                </p>
              </div>
              <div className="shrink-0">
                <ModelSelector 
                  selectedModel={selectedModel} 
                  onModelChange={setSelectedModel}
                  disabled={isGenerating}
                />
              </div>
            </div>

            {/* Credits Display */}
            <div className="mb-8">
              <CreditsDisplay 
                creditsRemaining={credits} 
                creditStatus={creditStatus} 
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Input Form */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Your Prompt
                    </CardTitle>
                    <CardDescription>
                      Be as specific as possible for the best results.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {hasInsufficientCredits && !isNoCredits && (
                      <Alert variant="destructive" className="bg-destructive/10 border-destructive/20">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Insufficient credits. You need at least {calculatedCost} credits.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="E.g., Write a professional email to a client apologizing for a delay in delivering the project report..."
                        className="min-h-[200px] resize-y bg-background text-foreground focus-visible:ring-primary/50 text-base leading-relaxed p-4"
                        disabled={isGenerating}
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                        <span>Press Cmd/Ctrl + Enter to generate</span>
                        <span>Cost: ~{calculatedCost} credits</span>
                      </div>
                    </div>

                    <Button 
                      onClick={handleGenerate} 
                      disabled={isGenerating || !prompt.trim() || hasInsufficientCredits || isNoCredits}
                      className="w-full h-12 text-base font-medium shadow-sm"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Text
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Middle Column: Output Display */}
              <div className="lg:col-span-5">
                <Card className="border-border/50 shadow-sm h-full min-h-[500px] flex flex-col">
                  <CardHeader className="pb-4 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-xl">Generated Result</CardTitle>
                    {result && !isGenerating && !error && (
                      <div className="flex items-center gap-3">
                        {resultModelConfig && (
                          <div className={cn("model-badge shadow-sm bg-background", resultModelConfig.badgeClass)}>
                            <ResultModelIcon className="w-3.5 h-3.5" />
                            {resultModelConfig.name}
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCopy}
                          className="h-8 gap-1.5"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-green-500" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-6 flex flex-col">
                    {isGenerating ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground space-y-4 py-12">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 text-primary animate-spin" />
                        </div>
                        <p className="text-sm font-medium animate-pulse">AI is crafting your text...</p>
                      </div>
                    ) : error ? (
                      <Alert variant="destructive" className="bg-destructive/5 border-destructive/20 my-auto">
                        <AlertCircle className="h-5 w-5" />
                        <AlertTitle className="text-base font-semibold mb-2">Generation Failed</AlertTitle>
                        <AlertDescription className="text-sm leading-relaxed">
                          {error}
                        </AlertDescription>
                      </Alert>
                    ) : result ? (
                      <div className="flex flex-col h-full">
                        <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none flex-1">
                          <div className="whitespace-pre-wrap leading-relaxed text-foreground">
                            {result}
                          </div>
                        </div>
                        {lastTokensUsed !== null && (
                          <div className="mt-6 pt-4 border-t flex justify-end">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                              <Zap className="w-3 h-3 text-primary" />
                              {typeof lastTokensUsed === 'object' 
                                ? `Input: ${lastTokensUsed.input || 0} | Output: ${lastTokensUsed.output || 0} tokens`
                                : `${lastTokensUsed} tokens used`}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-60 py-12 text-center">
                        <FileText className="w-16 h-16 mb-4 stroke-[1.5]" />
                        <p className="text-lg font-medium text-foreground">No content yet</p>
                        <p className="max-w-[250px] mt-2 text-sm">
                          Select a model, enter a prompt on the left, and click generate to see the results here.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right Column: History Sidebar */}
              <div className="lg:col-span-3 h-[500px] lg:h-auto">
                <GenerationHistory 
                  history={history}
                  onLoadHistory={handleLoadHistory}
                  onDeleteItem={handleDeleteHistoryItem}
                  onClearAll={handleClearAllHistory}
                  currentItemId={currentHistoryId}
                />
              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}