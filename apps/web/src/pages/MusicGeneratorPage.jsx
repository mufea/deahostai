import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { AlertCircle, Music, Loader2, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient.js';
import { Skeleton } from '@/components/ui/skeleton.jsx';

export default function MusicGeneratorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('electronic');
  const [mood, setMood] = useState('energetic');
  const [duration, setDuration] = useState('30');
  const [bpm, setBpm] = useState([120]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [history, setHistory] = useState([]);

  const creditsCost = 3;
  const showWarning = currentUser && currentUser.credits_balance < creditsCost;

  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('_integratedAiMusic').getFullList({
        filter: `user_id = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setHistory(records);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a music prompt.' });
      return;
    }

    if (showWarning) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits.' });
      return;
    }

    setIsGenerating(true);
    setCurrentAudio(null);

    try {
      const response = await apiServerClient.fetch('/music/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          genre,
          mood,
          duration: parseInt(duration),
          bpm: bpm[0]
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate music');
      }

      const data = await response.json();
      setCurrentAudio(data.musicUrl);

      await apiServerClient.fetch('/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_type: 'music', credits_used: creditsCost }),
      });

      toast({ title: 'Success', description: `Music generated successfully! ${creditsCost} credits used.` });
      await refreshUser();
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Music Generator - AI SaaS Platform</title>
        <meta name="description" content="Generate custom royalty-free music using AI." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Music Generator</h1>
              <p className="text-muted-foreground">Generate custom audio tracks based on your vibe ({creditsCost} credits per track)</p>
            </div>

            {showWarning && (
              <Alert className="mb-6 border-destructive/50 bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">
                  Low credit balance. You have {currentUser?.credits_balance || 0} credits remaining.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid lg:grid-cols-12 gap-6 mb-8">
              <Card className="lg:col-span-5 bg-card text-card-foreground shadow-sm h-fit">
                <CardHeader>
                  <CardTitle>Track Settings</CardTitle>
                  <CardDescription>Define the feeling and style</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Prompt describing the music</Label>
                    <Textarea
                      placeholder="e.g. A fast-paced cyberpunk chase scene..."
                      className="resize-none h-24 bg-background"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Genre</Label>
                      <Select value={genre} onValueChange={setGenre} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electronic">Electronic</SelectItem>
                          <SelectItem value="classical">Classical</SelectItem>
                          <SelectItem value="jazz">Jazz</SelectItem>
                          <SelectItem value="ambient">Ambient</SelectItem>
                          <SelectItem value="hip-hop">Hip-Hop</SelectItem>
                          <SelectItem value="pop">Pop</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mood</Label>
                      <Select value={mood} onValueChange={setMood} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="happy">Happy</SelectItem>
                          <SelectItem value="sad">Sad</SelectItem>
                          <SelectItem value="energetic">Energetic</SelectItem>
                          <SelectItem value="calm">Calm</SelectItem>
                          <SelectItem value="dramatic">Dramatic</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Target BPM</Label>
                      <span className="text-sm font-medium">{bpm[0]} BPM</span>
                    </div>
                    <Slider
                      value={bpm}
                      onValueChange={setBpm}
                      min={60}
                      max={180}
                      step={1}
                      disabled={isGenerating}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Duration</Label>
                    <Select value={duration} onValueChange={setDuration} disabled={isGenerating}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Seconds</SelectItem>
                        <SelectItem value="30">30 Seconds</SelectItem>
                        <SelectItem value="60">60 Seconds</SelectItem>
                        <SelectItem value="120">2 Minutes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleGenerate} 
                    disabled={isGenerating || showWarning || !prompt.trim()}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Composing Audio...
                      </>
                    ) : (
                      <>
                        <Music className="mr-2 h-4 w-4" />
                        Generate Track
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-7 flex flex-col gap-6">
                <Card className="bg-card text-card-foreground shadow-sm">
                  <CardHeader>
                    <CardTitle>Now Playing</CardTitle>
                  </CardHeader>
                  <CardContent className="min-h-[200px] flex flex-col items-center justify-center p-8">
                    {isGenerating ? (
                      <div className="text-center w-full">
                        <Skeleton className="w-full h-12 rounded-full mb-4 bg-[hsl(var(--skeleton))]" />
                        <p className="text-sm text-muted-foreground animate-pulse">Our AI composers are rendering your track...</p>
                      </div>
                    ) : currentAudio ? (
                      <div className="w-full bg-muted/40 p-6 rounded-2xl border flex flex-col items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                          <Music className="h-8 w-8 text-primary" />
                        </div>
                        <audio controls src={currentAudio} autoPlay className="w-full" />
                        <Button variant="outline" className="w-full sm:w-auto" asChild>
                          <a href={currentAudio} download="generated-track.mp3">
                            <Download className="mr-2 h-4 w-4" />
                            Download MP3
                          </a>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Music className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>No track generated yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-card text-card-foreground shadow-sm flex-1">
                  <CardHeader>
                    <CardTitle>Library</CardTitle>
                    <CardDescription>Your generated music history</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {history.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Your music library is empty.</p>
                    ) : (
                      <div className="space-y-4">
                        {history.map(item => (
                          <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                            <Button variant="secondary" size="icon" className="shrink-0 rounded-full h-10 w-10" onClick={() => setCurrentAudio(item.music_url)}>
                              <Music className="h-4 w-4" />
                            </Button>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-medium text-sm truncate">{item.prompt}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <span className="capitalize">{item.genre}</span> • 
                                <span className="capitalize">{item.mood}</span> • 
                                <span>{item.duration}s</span>
                              </div>
                            </div>
                            {item.music_url && (
                              <Button variant="ghost" size="icon" asChild>
                                <a href={item.music_url} download={`track-${item.id}.mp3`}>
                                  <Download className="h-4 w-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}