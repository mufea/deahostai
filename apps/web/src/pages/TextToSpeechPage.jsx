import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Download, Volume2, Loader2, Play } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiServerClient from '@/lib/apiServerClient';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TextToSpeechPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('alloy');
  const [speed, setSpeed] = useState('1.0');
  const [pitch, setPitch] = useState('0');
  const [language, setLanguage] = useState('en');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [history, setHistory] = useState([]);

  const creditsCost = calculateTotalCreditsNeeded('tts');
  const maxLength = 2000;
  const showWarning = currentUser && currentUser.credits_balance < creditsCost;

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('ai_generations').getFullList({
        filter: `user_id = "${currentUser.id}" && tool_type = "tts"`,
        sort: '-created',
        $autoCancel: false,
      });
      setHistory(records);
    } catch (error) {
      console.error('Failed to fetch TTS history:', error);
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      setText(val);
    } else {
      setText(val.substring(0, maxLength));
      toast({ variant: 'destructive', title: 'Limit reached', description: `Maximum ${maxLength} characters allowed.` });
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter some text.' });
      return;
    }
    if (text.length > maxLength) {
      toast({ variant: 'destructive', title: 'Error', description: `Text exceeds ${maxLength} characters.` });
      return;
    }
    if (showWarning) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits.' });
      return;
    }

    setIsGenerating(true);
    setAudioUrl(null);

    try {
      const response = await apiServerClient.fetch('/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed: parseFloat(speed), pitch: parseInt(pitch), language }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate speech');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);

      await apiServerClient.fetch('/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_type: 'tts', credits_used: creditsCost }),
      });

      await pb.collection('ai_generations').create({
        user_id: currentUser.id,
        tool_type: 'tts',
        prompt: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        result: { audioUrl: data.audioUrl, voice, language },
        credits_cost: creditsCost,
      }, { $autoCancel: false });

      toast({ title: 'Success', description: `Speech generated successfully. ${creditsCost} credits used.` });
      await refreshUser();
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const charCount = text.length;
  const isAtLimit = charCount >= maxLength;

  return (
    <>
      <Helmet>
        <title>Text-to-Speech - DEAHost AI Platform</title>
        <meta name="description" content="Convert text to natural-sounding speech." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-5xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Text-to-Speech</h1>
              <p className="text-muted-foreground">Convert text to natural-sounding speech ({creditsCost} credits per generation)</p>
            </div>

            {showWarning && (
              <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Low credit balance. You have {currentUser?.credits_balance || 0} credits remaining.
                  You need at least {creditsCost} credits for text-to-speech.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card className="md:col-span-2 bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Input Text</CardTitle>
                  <CardDescription>Enter the text you want to convert to speech</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type or paste your text here..."
                      className="min-h-[200px] resize-y text-foreground bg-background"
                      value={text}
                      onChange={handleTextChange}
                    />
                    <div className="flex justify-end">
                      <span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : charCount > maxLength * 0.75 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                        {charCount} / {maxLength} characters
                      </span>
                    </div>
                  </div>
                  
                  {audioUrl && (
                    <div className="p-4 bg-muted rounded-xl flex items-center gap-4">
                      <audio controls src={audioUrl} className="w-full" />
                      <Button variant="outline" size="icon" asChild>
                        <a href={audioUrl} download="speech.mp3">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>Configure voice parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Voice / Talent</Label>
                    <Select value={voice} onValueChange={setVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Male Voices</SelectLabel>
                          <SelectItem value="james">James - Professional/Deep</SelectItem>
                          <SelectItem value="michael">Michael - Friendly/Clear</SelectItem>
                          <SelectItem value="david">David - Calm/Warm</SelectItem>
                          <SelectItem value="alex">Alex - Young/Energetic</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Female Voices</SelectLabel>
                          <SelectItem value="sarah">Sarah - Professional/Clear</SelectItem>
                          <SelectItem value="emma">Emma - Friendly/Warm</SelectItem>
                          <SelectItem value="lisa">Lisa - Calm/Soothing</SelectItem>
                          <SelectItem value="jessica">Jessica - Young/Upbeat</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                          <SelectLabel>Neutral / Other</SelectLabel>
                          <SelectItem value="narrator">Narrator - Formal</SelectItem>
                          <SelectItem value="storyteller">Storyteller - Engaging</SelectItem>
                          <SelectItem value="alloy">Alloy - Default</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => toast({ title: 'Preview', description: 'Playing voice sample...' })}>
                      <Play className="mr-2 h-4 w-4" /> Preview Voice
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="id">Indonesian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Speed</Label>
                    <Select value={speed} onValueChange={setSpeed}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0.5">0.5x (Slow)</SelectItem>
                        <SelectItem value="0.75">0.75x (Slower)</SelectItem>
                        <SelectItem value="1.0">1.0x (Normal)</SelectItem>
                        <SelectItem value="1.25">1.25x (Faster)</SelectItem>
                        <SelectItem value="1.5">1.5x (Very Fast)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Pitch</Label>
                    <Select value={pitch} onValueChange={setPitch}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="-2">-2 (Very Low)</SelectItem>
                        <SelectItem value="-1">-1 (Low)</SelectItem>
                        <SelectItem value="0">0 (Normal)</SelectItem>
                        <SelectItem value="1">+1 (High)</SelectItem>
                        <SelectItem value="2">+2 (Very High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || showWarning || !text.trim() || isAtLimit}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Volume2 className="mr-2 h-4 w-4" />
                        Generate Speech
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}