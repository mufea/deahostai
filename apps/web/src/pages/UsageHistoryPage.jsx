import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Image as ImageIcon, Calendar } from 'lucide-react';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { format } from 'date-fns';

export default function UsageHistoryPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  
  const [textHistory, setTextHistory] = useState([]);
  const [imageHistory, setImageHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [textFilter, setTextFilter] = useState('all');
  const [imageFilter, setImageFilter] = useState('all');

  useEffect(() => {
    if (!currentUser) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Fetch text generations
        const textRecords = await pb.collection('_integratedAiChat').getFullList({
          sort: '-created',
          $autoCancel: false
        });
        setTextHistory(textRecords);

        // Fetch image generations
        const imageRecords = await pb.collection('_integratedAiImage').getFullList({
          sort: '-created',
          $autoCancel: false
        });
        setImageHistory(imageRecords);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  const filteredText = textFilter === 'all' ? textHistory : textHistory.filter(item => item.model_id === textFilter);
  const filteredImage = imageFilter === 'all' ? imageHistory : imageHistory.filter(item => item.model_id === imageFilter);

  const uniqueTextModels = [...new Set(textHistory.map(item => item.model_id))].filter(Boolean);
  const uniqueImageModels = [...new Set(imageHistory.map(item => item.model_id))].filter(Boolean);

  return (
    <>
      <Helmet>
        <title>Usage History - DEAHost AI Platform</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 md:p-6 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-foreground">Usage History</h1>
              <p className="text-muted-foreground">Review your past generations and credit usage.</p>
            </div>

            <Tabs defaultValue="text" className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1">
                <TabsTrigger value="text" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Text Generations
                </TabsTrigger>
                <TabsTrigger value="image" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Image Generations
                </TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Select value={textFilter} onValueChange={setTextFilter}>
                    <SelectTrigger className="w-[200px] bg-card">
                      <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {uniqueTextModels.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredText.length === 0 ? (
                  <Card className="bg-card border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No text generations found.</CardContent></Card>
                ) : (
                  <div className="space-y-4">
                    {filteredText.map(item => (
                      <Card key={item.id} className="bg-card text-card-foreground shadow-sm">
                        <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{item.model_id || 'Unknown Model'}</Badge>
                            <Badge variant="secondary">{item.credits_used || 0} credits</Badge>
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(item.created), 'MMM d, yyyy HH:mm')}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="mb-4">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Prompt:</p>
                            <p className="text-sm text-foreground line-clamp-2">{item.message}</p>
                          </div>
                          <div className="bg-muted/30 p-3 rounded-lg border">
                            <p className="text-sm font-medium text-muted-foreground mb-1">Response:</p>
                            <p className="text-sm text-foreground line-clamp-3">{item.response}</p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="image" className="space-y-4">
                <div className="flex justify-end mb-4">
                  <Select value={imageFilter} onValueChange={setImageFilter}>
                    <SelectTrigger className="w-[200px] bg-card">
                      <SelectValue placeholder="Filter by model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Models</SelectItem>
                      {uniqueImageModels.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredImage.length === 0 ? (
                  <Card className="bg-card border-dashed"><CardContent className="py-12 text-center text-muted-foreground">No image generations found.</CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredImage.map(item => {
                      const imageUrl = item.image_urls && item.image_urls.length > 0 ? item.image_urls[0] : null;
                      return (
                        <Card key={item.id} className="bg-card text-card-foreground shadow-sm overflow-hidden flex flex-col">
                          {imageUrl && (
                            <div className="aspect-video w-full bg-muted/30 border-b relative">
                              <img src={imageUrl} alt={item.prompt} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          )}
                          <CardContent className="p-4 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{item.model_id || 'Unknown Model'}</Badge>
                              <div className="flex items-center text-xs text-muted-foreground">
                                {format(new Date(item.created), 'MMM d, yyyy')}
                              </div>
                            </div>
                            <p className="text-sm text-foreground line-clamp-3 mb-4 flex-1">{item.prompt}</p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-3 border-t">
                              <span>{item.size || 'Unknown resolution'}</span>
                              <span className="font-medium text-foreground">{item.credits_used || 0} credits</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </>
  );
}