import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { AlertCircle, Film, Loader2, Download, Trash2, Search, Play, FileImage as ImageIcon } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import pb from '@/lib/pocketbaseClient.js';
import { useIntegratedAi } from '@/hooks/use-integrated-ai.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import ImageUploadUtility from '@/components/ImageUploadUtility.jsx';
import { useTranslation } from 'react-i18next';

export default function VideoGeneratorPage() {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  // Text to Video State
  const [prompt, setPrompt] = useState('');
  const [textDuration, setTextDuration] = useState('5s');
  const [textStyle, setTextStyle] = useState('cinematic');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [textQuality, setTextQuality] = useState('1080p');

  // Image to Video State
  const [imgFile, setImgFile] = useState(null);
  const [imgPreviewUrl, setImgPreviewUrl] = useState(null);
  const [animStyle, setAnimStyle] = useState('dynamic');
  const [imgDuration, setImgDuration] = useState('5');
  const [imgFps, setImgFps] = useState('24');
  const [imgQuality, setImgQuality] = useState('720p');
  const [motionIntensity, setMotionIntensity] = useState(50);
  const [imgModel, setImgModel] = useState('fal-ai/image-to-video');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [imgResult, setImgResult] = useState(null);

  // Common State
  const [history, setHistory] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [searchStyle, setSearchStyle] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const { messages, isStreaming, sendMessage } = useIntegratedAi();

  const textCreditsCost = calculateTotalCreditsNeeded('video', { quality: textQuality, duration: parseInt(textDuration) });
  const maxLength = 2000;
  
  useEffect(() => {
    fetchHistory();
  }, [currentUser]);

  const fetchHistory = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('_integratedAiVideos').getFullList({
        sort: '-created',
        $autoCancel: false,
      });
      setHistory(records);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handlePromptChange = (e) => {
    const val = e.target.value;
    if (val.length <= maxLength) {
      setPrompt(val);
    } else {
      setPrompt(val.substring(0, maxLength));
      toast({ variant: 'destructive', title: 'Limit reached', description: `Maximum ${maxLength} characters allowed.` });
    }
  };

  const handleTextGenerate = async () => {
    if (!prompt.trim()) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please enter a video prompt.' });
      return;
    }

    if (currentUser?.credits_balance < textCreditsCost) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits for this generation.' });
      return;
    }

    try {
      const fullPrompt = `Create a ${textStyle} video storyboard for: ${prompt}. Duration: ${textDuration}. Aspect Ratio: ${aspectRatio}. Quality: ${textQuality}. Please use the generate_image tool to create 4 keyframes representing this video sequence.`;
      
      await sendMessage(fullPrompt);

      await apiServerClient.fetch('/credits/deduct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_type: 'video', credits_used: textCreditsCost }),
      });

      await pb.collection('_integratedAiVideos').create({
        user_id: currentUser.id,
        type: 'text_to_video',
        prompt: prompt,
        duration: parseInt(textDuration),
        style: textStyle,
        aspect_ratio: aspectRatio,
        quality: textQuality,
        credits_used: textCreditsCost
      }, { $autoCancel: false });

      toast({ title: 'Generation Started', description: `Video storyboard initiated. ${textCreditsCost} credits used.` });
      await refreshUser();
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    }
  };

  const handleImageGenerate = async () => {
    if (!imgFile) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please upload an image first.' });
      return;
    }

    const estimatedCost = calculateTotalCreditsNeeded('video', { quality: imgQuality, duration: parseInt(imgDuration), modelCost: 15 });

    if (currentUser?.credits_balance < estimatedCost) {
      toast({ variant: 'destructive', title: 'Error', description: 'Insufficient credits for this generation.' });
      return;
    }

    setIsGeneratingImg(true);
    setImgResult(null);
    try {
      const formData = new FormData();
      formData.append('image_file', imgFile);
      formData.append('animation_style', animStyle);
      formData.append('duration', parseInt(imgDuration));
      formData.append('fps', parseInt(imgFps));
      formData.append('quality', imgQuality);
      formData.append('model_id', imgModel);
      formData.append('motion_intensity', motionIntensity / 100);

      const response = await apiServerClient.fetch('/video/image-to-video', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Video generation failed.');
      }

      const data = await response.json();
      setImgResult(data);
      toast({ title: 'Success', description: `Video generated successfully! Used ${data.credits_used} credits.` });
      await refreshUser();
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Generation Failed', description: error.message });
    } finally {
      setIsGeneratingImg(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await pb.collection('_integratedAiVideos').delete(id, { $autoCancel: false });
        toast({ title: 'Deleted', description: 'Record removed from history.' });
        fetchHistory();
      } catch (err) {
        toast({ variant: 'destructive', title: 'Error', description: err.message });
      }
    }
  };

  const filteredHistory = history.filter(item => {
    if (filterType !== 'all' && item.type !== filterType) return false;
    if (searchStyle && !((item.style || item.animation_style || '').toLowerCase().includes(searchStyle.toLowerCase()))) return false;
    return true;
  });

  const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
  const generatedFrames = lastAssistantMessage?.images || [];
  const charCount = prompt.length;
  const isAtLimit = charCount >= maxLength;

  return (
    <>
      <Helmet>
        <title>Video Generator - DEAHost AI Platform</title>
        <meta name="description" content="Generate videos from text and images." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Video Generator</h1>
              <p className="text-muted-foreground">Create stunning videos from text descriptions or still images.</p>
            </div>

            {/* Video Generation Tabs - Clear, Responsive Button Labels */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-md">
                <TabsTrigger value="text" className="transition-all duration-200">
                  Text to Video
                </TabsTrigger>
                <TabsTrigger value="image" className="transition-all duration-200">
                  Image to Video
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="mt-6">
                <div className="grid lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-4 bg-card shadow-sm h-fit">
                    <CardHeader>
                      <CardTitle>Storyboard Settings</CardTitle>
                      <CardDescription>Configure your video scene</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Prompt</Label>
                        <Textarea
                          placeholder="Describe the scene you want to create..."
                          className="resize-none h-32 bg-background text-foreground"
                          value={prompt}
                          onChange={handlePromptChange}
                          disabled={isStreaming}
                        />
                        <div className="flex justify-end">
                          <span className={`text-xs font-medium ${isAtLimit ? 'text-destructive' : charCount > maxLength * 0.75 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                            {charCount} / {maxLength} characters
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Aspect Ratio</Label>
                        <Select value={aspectRatio} onValueChange={setAspectRatio} disabled={isStreaming}>
                          <SelectTrigger className="text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="16:9">16:9 (Widescreen)</SelectItem>
                            <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Duration</Label>
                        <Select value={textDuration} onValueChange={setTextDuration} disabled={isStreaming}>
                          <SelectTrigger className="text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5s">5s</SelectItem>
                            <SelectItem value="10s">10s</SelectItem>
                            <SelectItem value="15s">15s</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Visual Style</Label>
                        <Select value={textStyle} onValueChange={setTextStyle} disabled={isStreaming}>
                          <SelectTrigger className="text-foreground">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cinematic">Cinematic</SelectItem>
                            <SelectItem value="animated">Animated / 3D</SelectItem>
                            <SelectItem value="realistic">Photorealistic</SelectItem>
                            <SelectItem value="abstract">Abstract</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex justify-between items-center py-2">
                         <span className="text-sm font-medium">Cost: {textCreditsCost} credits</span>
                      </div>

                      <Button 
                        className="w-full transition-all duration-200 active:scale-[0.98]" 
                        onClick={handleTextGenerate} 
                        disabled={isStreaming || !prompt.trim() || isAtLimit}
                      >
                        {isStreaming ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                        ) : (
                          <><Film className="mr-2 h-4 w-4" /> Generate Storyboard</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="bg-card shadow-sm flex-1">
                      <CardHeader>
                        <CardTitle>Preview Gallery</CardTitle>
                        <CardDescription>Generated sequence frames</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isStreaming && generatedFrames.length === 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map(i => (
                              <Skeleton key={i} className="aspect-video w-full rounded-xl bg-muted" />
                            ))}
                          </div>
                        ) : generatedFrames.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {generatedFrames.map((url, i) => (
                              <div key={i} className="relative group overflow-hidden rounded-xl border">
                                <img src={url} alt={`Frame ${i+1}`} className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Button variant="secondary" size="sm" asChild>
                                    <a href={url} download={`frame-${i}.png`}>
                                      <Download className="mr-2 h-4 w-4" /> Download
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                            <Film className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No sequence generated</h3>
                            <p className="text-sm text-muted-foreground">Adjust settings and click generate to create frames.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="image" className="mt-6">
                <div className="grid lg:grid-cols-12 gap-6">
                  <Card className="lg:col-span-4 bg-card shadow-sm h-fit">
                    <CardHeader>
                      <CardTitle>Image Animation</CardTitle>
                      <CardDescription>Bring your static image to life</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-2">
                        <Label>Source Image</Label>
                        <ImageUploadUtility 
                          onImageSelected={(file, url) => { setImgFile(file); setImgPreviewUrl(url); }} 
                          onError={(err) => toast({ variant: 'destructive', title: 'Upload Error', description: err })}
                          maxSizeMB={10}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Animation Style</Label>
                          <Select value={animStyle} onValueChange={setAnimStyle} disabled={isGeneratingImg}>
                            <SelectTrigger className="text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dynamic">Dynamic</SelectItem>
                              <SelectItem value="smooth_pan">Smooth Pan</SelectItem>
                              <SelectItem value="zoom_in">Zoom In</SelectItem>
                              <SelectItem value="zoom_out">Zoom Out</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Duration</Label>
                          <Select value={imgDuration} onValueChange={setImgDuration} disabled={isGeneratingImg}>
                            <SelectTrigger className="text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="5">5s</SelectItem>
                              <SelectItem value="10">10s</SelectItem>
                              <SelectItem value="20">20s</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>FPS</Label>
                          <Select value={imgFps} onValueChange={setImgFps} disabled={isGeneratingImg}>
                            <SelectTrigger className="text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="24">24 FPS</SelectItem>
                              <SelectItem value="30">30 FPS</SelectItem>
                              <SelectItem value="60">60 FPS</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quality</Label>
                          <Select value={imgQuality} onValueChange={setImgQuality} disabled={isGeneratingImg}>
                            <SelectTrigger className="text-foreground">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="480p">480p</SelectItem>
                              <SelectItem value="720p">720p</SelectItem>
                              <SelectItem value="1080p">1080p</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <Label>Motion Intensity</Label>
                          <span className="text-xs font-medium text-muted-foreground">{motionIntensity}%</span>
                        </div>
                        <Slider 
                          value={[motionIntensity]} 
                          onValueChange={(val) => setMotionIntensity(val[0])} 
                          max={100} 
                          step={1}
                          disabled={isGeneratingImg}
                          className="py-1"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Subtle</span>
                          <span>Balanced</span>
                          <span>Dramatic</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center py-2">
                         <span className="text-sm font-medium">Cost: {calculateTotalCreditsNeeded('video', { quality: imgQuality, duration: parseInt(imgDuration), modelCost: 15 })} credits</span>
                      </div>

                      <Button 
                        className="w-full transition-all duration-200 active:scale-[0.98]" 
                        onClick={handleImageGenerate} 
                        disabled={isGeneratingImg || !imgFile}
                      >
                        {isGeneratingImg ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Animating Image...</>
                        ) : (
                          <><Play className="mr-2 h-4 w-4" /> Generate Video</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-8 flex flex-col gap-6">
                    <Card className="bg-card shadow-sm flex-1">
                      <CardHeader>
                        <CardTitle>Result</CardTitle>
                        <CardDescription>Your animated sequence</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isGeneratingImg ? (
                          <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                            <p className="text-muted-foreground animate-pulse">Processing image and rendering video...</p>
                          </div>
                        ) : imgResult?.video_url ? (
                          <div className="space-y-4">
                            <div className="rounded-xl overflow-hidden border bg-black aspect-video flex items-center justify-center">
                              <video 
                                src={imgResult.video_url} 
                                controls 
                                autoPlay 
                                loop 
                                muted 
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-muted/30 rounded-lg border">
                              <div className="flex gap-4 text-sm text-muted-foreground">
                                <div><span className="font-semibold text-foreground">Duration:</span> {imgResult.duration}s</div>
                                <div><span className="font-semibold text-foreground">Quality:</span> {imgResult.quality}</div>
                                <div><span className="font-semibold text-foreground">Credits:</span> {imgResult.credits_used}</div>
                              </div>
                              <Button asChild>
                                <a href={imgResult.video_url} target="_blank" rel="noreferrer" download="animated_video.mp4">
                                  <Download className="mr-2 h-4 w-4" /> Download Video
                                </a>
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed rounded-xl bg-muted/20">
                            <ImageIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                            <h3 className="text-lg font-medium">No video generated yet</h3>
                            <p className="text-sm text-muted-foreground">Upload an image and adjust settings to animate it.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <Card className="bg-card shadow-sm mt-12">
              <CardHeader>
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <CardTitle>Generation History</CardTitle>
                    <CardDescription>Your past video generations</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[160px] text-foreground">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Generations</SelectItem>
                        <SelectItem value="text_to_video">Text to Video</SelectItem>
                        <SelectItem value="image_to_video">Image to Video</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="relative w-[200px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground pl-9"
                        placeholder="Search styles..."
                        value={searchStyle}
                        onChange={e => setSearchStyle(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No history found matching your filters.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredHistory.map((item) => (
                      <div key={item.id} className="border rounded-xl p-4 flex flex-col hover:shadow-md transition-shadow group">
                        <div className="flex justify-between items-start mb-3">
                          <Badge variant={item.type === 'image_to_video' ? 'default' : 'secondary'} className="capitalize">
                            {item.type === 'image_to_video' ? 'Image to Video' : 'Text to Video'}
                          </Badge>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {item.type === 'image_to_video' && item.image_url ? (
                          <div className="w-full aspect-video rounded-md overflow-hidden bg-muted mb-3 relative">
                            <img src={item.image_url} alt="Source" className="w-full h-full object-cover" />
                            {item.video_url && (
                              <a href={item.video_url} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-8 w-8 text-white" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm line-clamp-3 mb-3 flex-1">{item.prompt}</p>
                        )}
                        
                        <div className="mt-auto pt-3 border-t flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <div><span className="font-medium text-foreground">Style:</span> {item.animation_style || item.style || 'N/A'}</div>
                          <div><span className="font-medium text-foreground">Duration:</span> {item.duration}s</div>
                          <div><span className="font-medium text-foreground">Quality:</span> {item.quality || 'N/A'}</div>
                          <div className="w-full flex justify-between mt-1">
                            <span>{new Date(item.created).toLocaleDateString()}</span>
                            <span className="font-medium">{item.credits_used || 0} credits</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </main>
        </div>
      </div>
    </>
  );
}