import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCredits } from '@/hooks/useCredits.js';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { AlertCircle, Code2, Copy, Download, Maximize2, Minimize2, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Check, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';

import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-swift';
import 'prismjs/components/prism-kotlin';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-typescript';

const LANGUAGES = [
  'JavaScript/TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 
  'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'SQL', 
  'HTML/CSS', 'React/JSX', 'Vue.js', 'Angular', 'Node.js', 
  'Django', 'Flask', 'Spring Boot'
];

export default function CodeGeneratorPage() {
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('JavaScript/TypeScript');
  const [framework, setFramework] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fontSize, setFontSize] = useState('text-sm');
  
  const [history, setHistory] = useState([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [copied, setCopied] = useState(false);

  const creditsCost = calculateTotalCreditsNeeded('code');
  const maxLength = 2000;
  const showWarning = currentUser && currentUser.credits_balance < creditsCost;

  const frameworksOptions = useMemo(() => {
    if (language.includes('JavaScript') || language === 'Node.js' || language.includes('React') || language.includes('Vue') || language.includes('Angular')) {
      return ['React', 'Vue', 'Angular', 'Next.js', 'Express', 'Svelte'];
    }
    if (language === 'Python' || language === 'Django' || language === 'Flask') {
      return ['Django', 'Flask', 'FastAPI', 'Pandas', 'NumPy'];
    }
    if (language === 'Java' || language === 'Spring Boot') {
      return ['Spring Boot', 'Hibernate', 'Maven'];
    }
    if (language === 'C#') {
      return ['.NET', 'ASP.NET', 'Entity Framework'];
    }
    if (language === 'PHP') {
      return ['Laravel', 'Symfony', 'WordPress'];
    }
    if (language === 'Ruby') {
      return ['Rails', 'Sinatra'];
    }
    if (language === 'Go') {
      return ['Gin', 'Echo', 'Gorilla'];
    }
    return [];
  }, [language]);

  useEffect(() => {
    setFramework('none');
  }, [language]);

  useEffect(() => {
    if (generatedCode) {
      Prism.highlightAll();
    }
  }, [generatedCode, isFullScreen, fontSize, expandedHistoryId]);

  useEffect(() => {
    fetchHistory();
  }, [currentUser, page, searchQuery]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      let filterStr = `user_id="${currentUser.id}"`;
      if (searchQuery) {
        filterStr += ` && (prompt ~ "${searchQuery}" || language ~ "${searchQuery}")`;
      }
      
      const result = await pb.collection('_integratedAiCode').getList(page, 10, {
        filter: filterStr,
        sort: '-created',
        $autoCancel: false,
      });
      
      setHistory(result.items);
      setHistoryTotal(result.totalPages);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handlePromptChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      setPrompt(val);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter your code requirements.' });
      return;
    }

    if (prompt.length > maxLength) {
      toast({ variant: 'destructive', title: 'Error', description: `Prompt exceeds ${maxLength} characters.` });
      return;
    }

    if (showWarning) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits.' });
      return;
    }

    setIsGenerating(true);
    setGeneratedCode('');
    setExplanation('');
    setExpandedHistoryId(null);

    try {
      const response = await apiServerClient.fetch('/code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt, 
          language, 
          framework: framework !== 'none' ? framework : undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate code');
      }

      setGeneratedCode(data.code);
      setExplanation(data.explanation);
      
      toast({ title: 'Success', description: 'Code generated successfully.' });
      await refreshUser();
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteHistory = async (id) => {
    if (!window.confirm('Delete this history item?')) return;
    try {
      await pb.collection('_integratedAiCode').delete(id, { $autoCancel: false });
      toast({ title: 'Deleted', description: 'Code history item removed.' });
      if (expandedHistoryId === id) setExpandedHistoryId(null);
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete history item.' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: 'Copied', description: 'Code copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadCode = (code, lang) => {
    const extensionMap = {
      'JavaScript/TypeScript': 'js', 'Python': 'py', 'Java': 'java', 'C++': 'cpp', 
      'C#': 'cs', 'PHP': 'php', 'Ruby': 'rb', 'Go': 'go', 'Rust': 'rs', 
      'Swift': 'swift', 'Kotlin': 'kt', 'SQL': 'sql', 'HTML/CSS': 'html', 
      'React/JSX': 'jsx', 'Vue.js': 'vue', 'Angular': 'ts', 'Node.js': 'js'
    };
    const ext = extensionMap[lang] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-code.${ext}`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPrismLanguageClass = (lang) => {
    const map = {
      'JavaScript/TypeScript': 'language-javascript',
      'Python': 'language-python',
      'Java': 'language-java',
      'C++': 'language-cpp',
      'C#': 'language-csharp',
      'PHP': 'language-php',
      'Ruby': 'language-ruby',
      'Go': 'language-go',
      'Rust': 'language-rust',
      'Swift': 'language-swift',
      'Kotlin': 'language-kotlin',
      'SQL': 'language-sql',
      'HTML/CSS': 'language-markup',
      'React/JSX': 'language-jsx',
      'Vue.js': 'language-javascript',
      'Angular': 'language-typescript',
      'Node.js': 'language-javascript',
    };
    return map[lang] || 'language-javascript';
  };

  const charCount = prompt.length;
  const isAtLimit = charCount >= maxLength;

  const CodeBlock = ({ code, lang }) => (
    <div className={`relative rounded-xl overflow-hidden bg-[#0d0d0d] border border-border/20 shadow-xl flex flex-col ${isFullScreen ? 'fixed inset-4 z-50 h-[calc(100vh-2rem)]' : 'min-h-[400px] h-[calc(100vh-20rem)]'}`}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#1a1b1e] border-b border-border/20 select-none">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-xs font-mono font-medium text-muted-foreground px-2 py-0.5 rounded bg-background/30">
            {lang}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger className="h-7 text-xs bg-background/30 border-transparent text-muted-foreground w-[90px] mr-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text-xs">Small</SelectItem>
              <SelectItem value="text-sm">Medium</SelectItem>
              <SelectItem value="text-base">Large</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/30 rounded-md" onClick={() => copyToClipboard(code)}>
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/30 rounded-md" onClick={() => downloadCode(code, lang)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-background/30 rounded-md" onClick={() => setIsFullScreen(!isFullScreen)}>
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4 md:p-6 custom-scrollbar bg-[#0d0d0d]">
        <pre className={`${fontSize} font-mono leading-relaxed !m-0 !bg-transparent`}>
          <code className={getPrismLanguageClass(lang)}>{code}</code>
        </pre>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        <title>Code Assistant - DEAHost AI Platform</title>
        <meta name="description" content="Generate clean, production-ready code, debug, and optimize in multiple languages." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64 flex flex-col min-h-screen">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
                  <Code2 className="h-8 w-8 text-primary" />
                  Code Assistant
                </h1>
                <p className="text-muted-foreground">Generate, debug, and optimize code with GPT-4o.</p>
              </div>
            </div>

            {showWarning && (
              <Alert className="border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Low credit balance. You need at least {creditsCost} credits to use the Code Assistant.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid lg:grid-cols-12 gap-6">
              <Card className="lg:col-span-4 bg-card text-card-foreground shadow-sm h-fit border-border/50">
                <CardHeader>
                  <CardTitle>Assistant Parameters</CardTitle>
                  <CardDescription>Setup your environment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Language</Label>
                    <Select value={language} onValueChange={setLanguage} disabled={isGenerating}>
                      <SelectTrigger className="bg-background text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map(l => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {frameworksOptions.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-foreground font-semibold">Framework / Library</Label>
                      <Select value={framework} onValueChange={setFramework} disabled={isGenerating}>
                        <SelectTrigger className="bg-background text-foreground">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None (Vanilla)</SelectItem>
                          {frameworksOptions.map(f => (
                            <SelectItem key={f} value={f}>{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label className="text-foreground font-semibold">Instruction / Prompt</Label>
                    <Textarea
                      placeholder="Describe what to build, or paste existing code to debug/optimize..."
                      className="resize-none h-48 bg-background text-foreground"
                      value={prompt}
                      onChange={handlePromptChange}
                      disabled={isGenerating}
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : charCount > maxLength * 0.75 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {charCount} / {maxLength} characters
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full font-medium transition-all duration-200 active:scale-[0.98]" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || showWarning || !prompt.trim() || isAtLimit}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Code2 className="mr-2 h-4 w-4" />
                        Execute Request
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-8 flex flex-col min-h-[400px]">
                {isGenerating ? (
                  <Card className="bg-card text-card-foreground shadow-sm flex-1 border-border/50 flex flex-col overflow-hidden">
                    <div className="flex items-center px-4 py-3 border-b bg-muted/20">
                      <div className="flex gap-2">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="w-3 h-3 rounded-full" />
                      </div>
                      <Skeleton className="w-24 h-4 ml-4" />
                    </div>
                    <div className="p-6 space-y-4 flex-1 bg-[#1d1f21]">
                      <Skeleton className="h-4 w-3/4 bg-muted/20" />
                      <Skeleton className="h-4 w-1/2 bg-muted/20" />
                      <Skeleton className="h-4 w-5/6 bg-muted/20" />
                      <Skeleton className="h-4 w-2/3 bg-muted/20" />
                      <Skeleton className="h-4 w-3/4 bg-muted/20 mt-8" />
                      <Skeleton className="h-4 w-4/5 bg-muted/20" />
                    </div>
                  </Card>
                ) : generatedCode ? (
                  <div className="space-y-6 flex-1 flex flex-col">
                    <CodeBlock code={generatedCode} lang={language} />
                    
                    {explanation && (
                      <Card className="bg-card border-border/50 shadow-sm">
                        <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-primary" />
                            Explanation & Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {explanation}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <Card className="bg-card text-card-foreground shadow-sm flex-1 border-border/50 flex flex-col items-center justify-center p-12 text-center bg-muted/10 border-dashed">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Code2 className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-foreground">Awaiting Instructions</h3>
                    <p className="text-muted-foreground max-w-sm">
                      Provide instructions, constraints, or existing code on the left to get started.
                    </p>
                  </Card>
                )}
              </div>
            </div>

            <div className="pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold">History Log</h2>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search past generations..." 
                    className="pl-9 bg-background" 
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                  />
                </div>
              </div>

              <Card className="bg-card text-card-foreground shadow-sm overflow-hidden border-border/50">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[180px]">Environment</TableHead>
                        <TableHead>Instruction</TableHead>
                        <TableHead className="w-[150px]">Date</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                            {searchQuery ? 'No results found matching your search.' : 'Your generation history will appear here.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        history.map((item) => (
                          <React.Fragment key={item.id}>
                            <TableRow className="group cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setExpandedHistoryId(expandedHistoryId === item.id ? null : item.id)}>
                              <TableCell>
                                <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground border border-border/50">
                                  {item.language}
                                </span>
                                {item.framework && item.framework !== 'none' && (
                                  <span className="ml-2 text-xs text-muted-foreground">{item.framework}</span>
                                )}
                              </TableCell>
                              <TableCell className="font-medium max-w-[300px] truncate text-foreground/90">
                                {item.prompt}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {new Date(item.created).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteHistory(item.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedHistoryId === item.id && (
                              <TableRow className="hover:bg-transparent border-b-2 border-primary/20 bg-muted/10">
                                <TableCell colSpan={4} className="p-4 md:p-6">
                                  <div className="mb-6 bg-background rounded-lg p-4 border border-border/50 shadow-sm">
                                    <h4 className="font-semibold text-sm mb-2 text-foreground flex items-center gap-2">
                                      <Code2 className="w-4 h-4 text-primary" />
                                      Original Prompt
                                    </h4>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.prompt}</p>
                                  </div>
                                  <CodeBlock code={item.generated_code} lang={item.language} />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {historyTotal > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-border/50 bg-muted/20">
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {historyTotal}
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="bg-background"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setPage(p => Math.min(historyTotal, p + 1))}
                        disabled={page === historyTotal}
                        className="bg-background"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </main>
        </div>
      </div>
      {isFullScreen && (
        <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm" onClick={() => setIsFullScreen(false)} />
      )}
    </>
  );
}