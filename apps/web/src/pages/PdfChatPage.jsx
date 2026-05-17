import React, { useState, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, UploadCloud, FileText, X, Send, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiServerClient from '@/lib/apiServerClient';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const [pdfFile, setPdfFile] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const creditsCost = calculateTotalCreditsNeeded('pdf');
  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB
  const MAX_MESSAGE_LENGTH = 2000;
  const showWarning = currentUser && currentUser.credits_balance < creditsCost;

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const validateAndSetFile = (file) => {
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      toast({ variant: 'destructive', title: 'Invalid file', description: 'Please upload a valid PDF file.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File too large', description: 'File size exceeds 15 MB limit. Please upload a smaller file.' });
      return;
    }

    setPdfFile(file);
    setPageNumber(1);
    setMessages([]);
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const trimmedInput = input.trim();
    
    if (!trimmedInput || isLoading) {
      return;
    }

    if (trimmedInput.length > MAX_MESSAGE_LENGTH) {
      toast({
        variant: 'destructive',
        title: 'Message too long',
        description: `Maximum ${MAX_MESSAGE_LENGTH} characters allowed.`,
      });
      return;
    }

    if (!pdfFile) {
      toast({
        variant: 'destructive',
        title: 'No PDF uploaded',
        description: 'Please upload a PDF document first.',
      });
      return;
    }

    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Call the /chat endpoint
      const response = await apiServerClient.fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedInput,
          conversationHistory: conversationHistory,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to get response from AI');
      }

      const data = await response.json();

      // CRITICAL: Extract response.response from API response
      const aiResponseText = data.response;
      const tokensUsed = data.tokens;

      if (!aiResponseText) {
        throw new Error('No response content received from AI');
      }

      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: aiResponseText,
        timestamp: new Date(),
        tokens: tokensUsed,
      };

      setMessages(prev => [...prev, aiMessage]);

      // Deduct credits
      try {
        await apiServerClient.fetch('/credits/deduct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            tool_type: 'pdf', 
            credits_used: creditsCost,
          }),
        });
        
        await refreshUser();
        
        toast({ 
          title: 'Credits deducted', 
          description: `${creditsCost} credits used. Tokens: ${tokensUsed.input} in, ${tokensUsed.output} out.`,
        });
      } catch (creditError) {
        console.error('Failed to deduct credits:', creditError);
        toast({ 
          variant: 'destructive', 
          title: 'Warning', 
          description: 'Response received but credits may not have been deducted.',
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message to chat
      const errorMessage = {
        role: 'assistant',
        content: 'Failed to get response. Please try again.',
        timestamp: new Date(),
        isError: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to send message. Please try again.',
      });
    } finally {
      setIsLoading(false);
      // Focus input after response
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val.length <= MAX_MESSAGE_LENGTH) {
      setInput(val);
    }
  };

  const charCount = input.length;
  const isNearLimit = charCount > MAX_MESSAGE_LENGTH * 0.75;
  const isAtLimit = charCount >= MAX_MESSAGE_LENGTH;

  return (
    <>
      <Helmet>
        <title>PDF Chat - DEAHost AI Platform</title>
        <meta name="description" content="Chat with your PDF documents using AI." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64 flex flex-col h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
            <div className="mb-4 shrink-0">
              <h1 className="text-3xl font-bold mb-2">PDF Chat</h1>
              <p className="text-muted-foreground">Upload a document and ask questions ({creditsCost} credits per message)</p>
            </div>

            {showWarning && (
              <Alert className="mb-4 shrink-0 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Low credit balance. You have {currentUser?.credits_balance || 0} credits remaining.
                  You need at least {creditsCost} credits to chat with a PDF.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex-1 grid lg:grid-cols-2 gap-6 min-h-0">
              {/* PDF Viewer Panel */}
              <div className="bg-card text-card-foreground rounded-2xl shadow-sm border flex flex-col overflow-hidden">
                {!pdfFile ? (
                  <div 
                    className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-muted-foreground/25 rounded-2xl m-4 bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <UploadCloud className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Upload PDF Document</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-2">
                      Drag and drop your PDF file here, or click to browse.
                    </p>
                    <div className="text-xs text-muted-foreground text-center space-y-1">
                      <p>Supported format: PDF</p>
                      <p>Maximum file size: 15 MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    <div className="p-3 border-b flex items-center justify-between bg-muted/30">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-5 w-5 text-primary shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium truncate">{pdfFile.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {(pdfFile.size / (1024 * 1024)).toFixed(2)} MB / 15 MB
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setPdfFile(null);
                          setMessages([]);
                        }}
                        className="p-1.5 hover:bg-muted rounded-md text-muted-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto bg-muted/10 flex justify-center p-4">
                      <Document
                        file={pdfFile}
                        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                        loading={<div className="animate-pulse text-muted-foreground">Loading PDF...</div>}
                        className="max-w-full"
                      >
                        <Page 
                          pageNumber={pageNumber} 
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          className="shadow-lg"
                          width={Math.min(window.innerWidth - 64, 600)}
                        />
                      </Document>
                    </div>
                    {numPages && (
                      <div className="p-3 border-t flex items-center justify-center gap-4 bg-muted/30">
                        <button 
                          disabled={pageNumber <= 1}
                          onClick={() => setPageNumber(p => p - 1)}
                          className="px-3 py-1 bg-background border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                        >
                          Prev
                        </button>
                        <span className="text-sm font-medium">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button 
                          disabled={pageNumber >= numPages}
                          onClick={() => setPageNumber(p => p + 1)}
                          className="px-3 py-1 bg-background border rounded-md disabled:opacity-50 hover:bg-muted transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Chat Panel */}
              <div className="bg-card text-card-foreground rounded-2xl shadow-sm border flex flex-col overflow-hidden relative">
                {!pdfFile && (
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
                    <div className="max-w-sm">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">Upload a PDF to start chatting</h3>
                      <p className="text-muted-foreground text-sm">
                        The AI needs document context before it can answer your questions.
                      </p>
                    </div>
                  </div>
                )}

                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b bg-muted/30">
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                  {messages.length > 0 && (
                    <button
                      onClick={() => setMessages([])}
                      disabled={isLoading}
                      className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                  {messages.length === 0 && pdfFile && (
                    <div className="text-center text-muted-foreground py-8">
                      <p className="text-sm">Ask questions about your PDF document</p>
                    </div>
                  )}

                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-3 shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : msg.isError
                            ? 'bg-destructive/10 text-destructive rounded-bl-sm border border-destructive/50'
                            : 'bg-muted text-foreground rounded-bl-sm border'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-xs font-medium opacity-70">
                            {msg.role === 'user' ? 'You' : 'AI'}
                          </span>
                          <span className="text-xs opacity-50">
                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        {msg.tokens && (
                          <div className="mt-2 text-xs opacity-60">
                            Tokens: {msg.tokens.input} in, {msg.tokens.output} out
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] rounded-2xl px-5 py-3 bg-muted text-foreground rounded-bl-sm border shadow-sm">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">AI is thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background">
                  <form onSubmit={handleSendMessage} className="flex flex-col gap-2 w-full">
                    <div className="flex gap-3 w-full">
                      <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask a question about the PDF..."
                        className="flex-1 rounded-xl border bg-background px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isLoading || !pdfFile}
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !input.trim() || isAtLimit || !pdfFile}
                        className="rounded-xl bg-primary px-6 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm flex items-center gap-2"
                      >
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        Send
                      </button>
                    </div>
                    <div className="flex justify-end px-1">
                      <span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : isNearLimit ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {charCount} / {MAX_MESSAGE_LENGTH} characters {isAtLimit && '(Maximum reached)'}
                      </span>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}