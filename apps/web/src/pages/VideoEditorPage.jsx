import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header.jsx';
import Sidebar from '@/components/Sidebar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Loader2, Scissors, Download, UploadCloud, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast.js';
import apiServerClient from '@/lib/apiServerClient.js';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient.js';

export default function VideoEditorPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const { calculateTotalCreditsNeeded } = useCredits();
  
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState(null);
  const [customVideoFile, setCustomVideoFile] = useState(null);
  const [customVideoUrl, setCustomVideoUrl] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  const creditsCost = calculateTotalCreditsNeeded('video_edit');
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  const MAX_DURATION = 60;

  const [speed, setSpeed] = useState([1.0]);
  const [brightness, setBrightness] = useState([0]);
  const [contrast, setContrast] = useState([0]);
  const [rotation, setRotation] = useState('0');
  const [overlayText, setOverlayText] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');

  useEffect(() => {
    fetchVideos();
  }, [currentUser]);

  const fetchVideos = async () => {
    if (!currentUser) return;
    try {
      const records = await pb.collection('_integratedAiVideos').getFullList({
        filter: `user_id = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false,
      });
      setVideos(records.filter(r => r.video_url));
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      toast({ variant: 'destructive', title: 'Invalid format', description: 'Only MP4, WebM, and MOV are supported.' });
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({ variant: 'destructive', title: 'File too large', description: 'File size exceeds 15 MB limit. Please upload a smaller video.' });
      return;
    }

    const url = URL.createObjectURL(file);
    setCustomVideoFile(file);
    setCustomVideoUrl(url);
    setSelectedVideo({ id: 'custom', video_url: url, prompt: file.name });
    setExportedUrl(null);
  };

  const handleVideoLoadedMetadata = () => {
    if (videoRef.current) {
      const duration = videoRef.current.duration;
      setVideoDuration(duration);
      if (duration > MAX_DURATION) {
        toast({ variant: 'destructive', title: 'Video too long', description: 'Video duration exceeds 1 minute limit. Please trim the video or upload a shorter one.' });
        setCustomVideoFile(null);
        setCustomVideoUrl(null);
        setSelectedVideo(null);
      }
    }
  };

  const handleExport = async () => {
    if (!selectedVideo) {
      toast({ variant: 'destructive', title: 'Error', description: 'Please select a video first.' });
      return;
    }

    setIsExporting(true);
    setExportedUrl(null);

    try {
      const response = await apiServerClient.fetch('/video/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          video_id: selectedVideo.id,
          edits: {
            speed: speed[0],
            brightness: brightness[0],
            contrast: contrast[0],
            rotation: parseInt(rotation),
            textOverlay: overlayText ? { text: overlayText, fontSize: 24, color: 'white', position: 'bottom-center' } : null,
            aspectRatio
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export video');
      }

      const data = await response.json();
      setExportedUrl(data.videoUrl);
      toast({ title: 'Success', description: 'Video exported successfully.' });
      fetchVideos();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Export Failed', description: error.message });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Video Editor - DEAHost AI Platform</title>
        <meta name="description" content="Edit your generated videos with advanced tools." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-2">Video Editor</h1>
              <p className="text-muted-foreground">Enhance and modify your generated videos ({creditsCost} credits)</p>
            </div>

            <div className="grid lg:grid-cols-12 gap-6 h-auto">
              <Card className="lg:col-span-8 bg-card text-card-foreground shadow-sm flex flex-col">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-center">
                    <CardTitle>Preview</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                        Upload Custom
                      </Button>
                      <input 
                        type="file" 
                        accept="video/mp4,video/webm,video/quicktime" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                      />
                      <Select 
                        value={selectedVideo?.id || ''} 
                        onValueChange={(val) => {
                          if (val === 'custom') return;
                          setSelectedVideo(videos.find(v => v.id === val));
                          setCustomVideoFile(null);
                          setCustomVideoUrl(null);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select a video..." />
                        </SelectTrigger>
                        <SelectContent>
                          {customVideoFile && <SelectItem value="custom">{customVideoFile.name}</SelectItem>}
                          {videos.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.prompt || 'Untitled Video'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 p-6 bg-muted/10 flex items-center justify-center min-h-[400px]">
                  {exportedUrl ? (
                    <div className="w-full flex flex-col items-center">
                      <video controls src={exportedUrl} className="max-w-full max-h-[500px] rounded-lg shadow-lg border" />
                      <Button className="mt-6" asChild>
                        <a href={exportedUrl} download="edited-video.mp4">
                          <Download className="mr-2 h-4 w-4" /> Download Export
                        </a>
                      </Button>
                    </div>
                  ) : selectedVideo ? (
                    <div className="relative w-full flex flex-col items-center">
                      <video 
                        ref={videoRef}
                        controls 
                        src={selectedVideo.video_url} 
                        className="max-w-full max-h-[500px] rounded-lg border opacity-80" 
                        onLoadedMetadata={handleVideoLoadedMetadata}
                      />
                      {customVideoFile && (
                        <div className="mt-4 text-xs text-muted-foreground">
                          Video: {customVideoFile.name} ({(customVideoFile.size / (1024 * 1024)).toFixed(2)} MB, {Math.round(videoDuration)} seconds)
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <span className="bg-black/60 text-white px-3 py-1 rounded-md text-sm backdrop-blur-sm">Preview mode (Edits applied on export)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <UploadCloud className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p className="mb-2">Select a video from your library or upload a custom one.</p>
                      <div className="text-xs space-y-1">
                        <p>Supported formats: MP4, WebM, MOV</p>
                        <p>Maximum file size: 15 MB</p>
                        <p>Maximum duration: 1 minute</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-4 bg-card text-card-foreground shadow-sm h-fit">
                <CardHeader>
                  <CardTitle>Editing Tools</CardTitle>
                  <CardDescription>Configure your enhancements</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm"><Label>Playback Speed</Label>
                      <span className="text-muted-foreground">{speed[0]}x</span>
                    </div>
                    <Slider value={speed} onValueChange={setSpeed} min={0.5} max={2.0} step={0.1} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <Label>Brightness</Label>
                      <span className="text-muted-foreground">{brightness[0]}</span>
                    </div>
                    <Slider value={brightness} onValueChange={setBrightness} min={-50} max={50} step={1} />
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <Label>Contrast</Label>
                      <span className="text-muted-foreground">{contrast[0]}</span>
                    </div>
                    <Slider value={contrast} onValueChange={setContrast} min={-50} max={50} step={1} />
                  </div>

                  <div className="space-y-2">
                    <Label>Rotation</Label>
                    <Select value={rotation} onValueChange={setRotation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0° (Original)</SelectItem>
                        <SelectItem value="90">90°</SelectItem>
                        <SelectItem value="180">180°</SelectItem>
                        <SelectItem value="270">270°</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                        <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                        <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        <SelectItem value="4:3">4:3 (Standard)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Text Overlay</Label>
                    <Input 
                      placeholder="Add watermark or text..." 
                      value={overlayText} 
                      onChange={e => setOverlayText(e.target.value)} 
                      className="bg-background text-foreground"
                    />
                  </div>

                  <Button 
                    className="w-full mt-4" 
                    onClick={handleExport} 
                    disabled={isExporting || !selectedVideo}
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing & Exporting...
                      </>
                    ) : (
                      <>
                        <Scissors className="mr-2 h-4 w-4" />
                        Export Video
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