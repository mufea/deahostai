import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { AlertCircle, UploadCloud, FileJson, Copy, ScanSearch, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { useIntegratedAi } from '@/hooks/use-integrated-ai.jsx';

export default function ImageAnalyzerPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  
  const { messages, isStreaming, sendMessage, clearMessages } = useIntegratedAi();

  const creditsCost = calculateTotalCreditsNeeded('image_analysis');
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const VALID_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
  const showWarning = currentUser && currentUser.credits_balance < creditsCost;

  const validateAndProcessFile = (file) => {
    if (!file) return;

    if (!VALID_TYPES.includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid format', description: 'Only JPG and PNG files are supported.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File too large', description: 'File size exceeds 5 MB limit. Please upload a smaller image.' });
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    clearMessages();
  };

  const handleFileChange = (e) => {
    validateAndProcessFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    validateAndProcessFile(e.dataTransfer.files[0]);
  };

  const clearSelection = () => {
    setImageFile(null);
    setPreviewUrl(null);
    clearMessages();
  };

  const handleAnalyze = async () => {
    if (!imageFile) return;
    if (showWarning) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits.' });
      return;
    }

    try {
      const prompt = `Analyze this image in extreme detail. Provide structured findings for: 1. Main Description 2. Objects Detected with confidence 3. Dominant Colors with hex 4. Extracted Text (if any) 5. Quality Assessment 6. Tags 7. Sentiment/Mood. Format as clear bullet points and structured sections.`;
      
      await sendMessage(prompt, [imageFile]);

      await apiServerClient.fetch('/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_type: 'image_analysis', credits_used: creditsCost }),
      });

      toast({ title: 'Analysis Complete', description: `Used ${creditsCost} credits.` });
      await refreshUser();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const aiResponse = [...messages].reverse().find(m => m.role === 'assistant')?.content;

  const handleCopy = () => {
    if (aiResponse) {
      navigator.clipboard.writeText(aiResponse);
      toast({ title: 'Copied', description: 'Results copied to clipboard.' });
    }
  };

  const handleExport = () => {
    if (aiResponse) {
      const blob = new Blob([aiResponse], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${Date.now()}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  return (
    <>
      <Helmet>
        <title>Image Analyzer - DEAHost AI Platform</title>
        <meta name="description" content="AI-powered advanced image analysis and data extraction." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Image Analyzer</h1>
              <p className="text-muted-foreground">Advanced insights, object detection, and OCR from any image ({creditsCost} credits per analysis)</p>
            </div>

            {showWarning && (
              <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Low credit balance. You have {currentUser?.credits_balance || 0} credits remaining.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid lg:grid-cols-2 gap-6 h-[calc(100vh-14rem)] min-h-[600px]">
              <Card className="bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="shrink-0 border-b">
                  <CardTitle>Image Input</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-4 flex flex-col relative bg-muted/10">
                  {!previewUrl ? (
                    <div 
                      className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-muted/40 transition-colors cursor-pointer"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <UploadCloud className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">Upload Image to Analyze</h3>
                      <div className="text-muted-foreground text-sm text-center space-y-1">
                        <p>Drag and drop your image, or click to browse.</p>
                        <p>Supported formats: JPG, PNG</p>
                        <p>Maximum file size: 5 MB</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col">
                      <div className="relative flex-1 bg-black/5 rounded-xl border overflow-hidden flex items-center justify-center mb-4">
                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                        <button 
                          onClick={clearSelection}
                          disabled={isStreaming}
                          className="absolute top-2 right-2 p-2 bg-background/80 backdrop-blur-sm rounded-full text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-xs text-muted-foreground mb-4 text-center">
                        File: {imageFile.name} ({(imageFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </div>
                      <Button 
                        className="w-full shrink-0" 
                        onClick={handleAnalyze} 
                        disabled={isStreaming || showWarning}
                      >
                        {isStreaming ? 'Analyzing Image...' : 'Start Analysis'}
                        <ScanSearch className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="shrink-0 border-b flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Analysis Results</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCopy} disabled={!aiResponse || isStreaming}>
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport} disabled={!aiResponse || isStreaming}>
                      <FileJson className="h-4 w-4 mr-2" /> Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-auto bg-muted/5 relative">
                  {isStreaming ? (
                    <div className="p-6 space-y-4">
                      <div className="h-6 w-1/3 bg-muted rounded-md animate-pulse"></div>
                      <div className="h-4 w-full bg-muted rounded-md animate-pulse"></div>
                      <div className="h-4 w-5/6 bg-muted rounded-md animate-pulse"></div>
                      <div className="h-4 w-4/6 bg-muted rounded-md animate-pulse"></div>
                      
                      <div className="h-6 w-1/4 bg-muted rounded-md animate-pulse mt-8"></div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                        <div className="h-10 bg-muted rounded-md animate-pulse"></div>
                      </div>
                    </div>
                  ) : aiResponse ? (
                    <div className="p-6 prose prose-sm dark:prose-invert max-w-none">
                      <div className="whitespace-pre-wrap font-sans">{aiResponse}</div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                      <ScanSearch className="h-12 w-12 mb-4 opacity-20" />
                      <p>Upload an image and run analysis to see insights here.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}