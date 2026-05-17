import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Copy, Check, Share2, Users, Gift, Twitter, Linkedin, Mail } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { QRCodeSVG } from 'qrcode.react';

export default function ReferralPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [copied, setCopied] = useState(false);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  const referralLink = `${window.location.origin}/signup?ref=${currentUser?.referral_code || currentUser?.id}`;

  useEffect(() => {
    async function fetchReferrals() {
      if (!currentUser) return;
      try {
        const records = await pb.collection('referrals').getFullList({
          filter: `referrer_id = "${currentUser.id}"`,
          sort: '-created',
          $autoCancel: false,
        });
        setReferrals(records);
      } catch (error) {
        console.error('Failed to fetch referrals:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchReferrals();
  }, [currentUser]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = "Join me on AI SaaS Platform and get 100 free credits!";

  return (
    <>
      <Helmet>
        <title>Referral Program - AI SaaS Platform</title>
        <meta name="description" content="Invite friends and earn free AI credits." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
              <p className="text-muted-foreground">Invite friends and earn 50 free credits for each successful signup.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3 mb-8">
              <Card className="bg-card text-card-foreground shadow-sm md:col-span-2">
                <CardHeader>
                  <CardTitle>Your Referral Link</CardTitle>
                  <CardDescription>Share this link with your network</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value={referralLink} 
                      className="bg-muted font-mono text-sm"
                    />
                    <Button onClick={handleCopy} variant="secondary" className="shrink-0">
                      {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-3">Share via</p>
                    <div className="flex gap-3">
                      <Button variant="outline" size="icon" asChild>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noreferrer">
                          <Twitter className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}`} target="_blank" rel="noreferrer">
                          <Linkedin className="h-4 w-4" />
                        </a>
                      </Button>
                      <Button variant="outline" size="icon" asChild>
                        <a href={`mailto:?subject=${encodeURIComponent("Join AI SaaS Platform")}&body=${encodeURIComponent(shareText + "\n\n" + referralLink)}`}>
                          <Mail className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-3 rounded-xl shadow-sm mb-4">
                  <QRCodeSVG value={referralLink} size={120} />
                </div>
                <p className="text-sm text-muted-foreground">Scan to share instantly</p>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentUser?.total_referrals || 0}</div>
                </CardContent>
              </Card>
              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Bonus Credits Earned</CardTitle>
                  <Gift className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{currentUser?.referral_bonus_credits || 0}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card text-card-foreground shadow-sm">
              <CardHeader>
                <CardTitle>Referral History</CardTitle>
                <CardDescription>Track your successful invites</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-10 bg-muted rounded w-full"></div>
                    <div className="h-10 bg-muted rounded w-full"></div>
                  </div>
                ) : referrals.length === 0 ? (
                  <div className="text-center py-12">
                    <Share2 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">No referrals yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Share your link to start earning credits!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Bonus</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {referrals.map((ref) => (
                          <TableRow key={ref.id}>
                            <TableCell>{new Date(ref.created).toLocaleDateString()}</TableCell>
                            <TableCell className="font-mono text-xs">{ref.referred_user_id}</TableCell>
                            <TableCell className="text-primary font-medium">+{ref.bonus_credits}</TableCell>
                            <TableCell>
                              <Badge variant={ref.status === 'completed' ? 'default' : 'secondary'} className={ref.status === 'completed' ? 'bg-[hsl(var(--status-completed))]' : 'bg-[hsl(var(--status-pending))]'}>
                                {ref.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
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