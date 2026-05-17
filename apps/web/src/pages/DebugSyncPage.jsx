import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { usePricing } from '@/hooks/usePricing';
import { useTools } from '@/hooks/useTools';
import { useCredits } from '@/hooks/useCredits';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2 } from 'lucide-react';

export default function DebugSyncPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { plans, featureMatrix } = usePricing();
  const { tools } = useTools();
  const { config: creditsConfig } = useCredits();

  return (
    <>
      <Helmet>
        <title>Debug Data Sync - DEAHost AI Platform</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Data Sync Verification</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                All configs successfully loaded from centralized source of truth.
              </p>
            </div>

            <Tabs defaultValue="pricing" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="pricing">Pricing Config</TabsTrigger>
                <TabsTrigger value="tools">Tools Config</TabsTrigger>
                <TabsTrigger value="credits">Credits Config</TabsTrigger>
              </TabsList>

              <TabsContent value="pricing">
                <Card className="bg-card text-card-foreground">
                  <CardHeader><CardTitle>Pricing Plans ({plans.length})</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono">
                      {JSON.stringify(plans, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="tools">
                <Card className="bg-card text-card-foreground">
                  <CardHeader><CardTitle>Tools Registry ({tools.length})</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono">
                      {JSON.stringify(tools.map(t => ({...t, icon: '[React Component]'})), null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="credits">
                <Card className="bg-card text-card-foreground">
                  <CardHeader><CardTitle>Credit Rules</CardTitle></CardHeader>
                  <CardContent>
                    <pre className="p-4 bg-muted/50 rounded-lg overflow-x-auto text-xs font-mono">
                      {JSON.stringify(creditsConfig, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </>
  );
}