import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, TrendingUp, Activity, Zap, CreditCard, BarChart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart as RechartsBarChart, Bar } from 'recharts';
import apiServerClient from '@/lib/apiServerClient';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

export default function AnalyticsDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const [timePeriod, setTimePeriod] = useState('30');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const response = await apiServerClient.fetch(`/analytics/usage?user_id=${currentUser.id}&time_period=${timePeriod}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [currentUser, timePeriod]);

  const exportToCSV = () => {
    if (!data?.tool_breakdown) return;
    const headers = ['Tool Type', 'Count', 'Credits Used', 'Percentage'];
    const rows = data.tool_breakdown.map(item => [
      item.tool_type,
      item.count,
      item.credits_used,
      item.percentage
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timePeriod}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <>
      <Helmet>
        <title>Analytics - AI SaaS Platform</title>
        <meta name="description" content="View your AI usage analytics and trends." />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Analytics Dashboard</h1>
                <p className="text-muted-foreground">Track your usage and credit consumption</p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={timePeriod} onValueChange={setTimePeriod}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={exportToCSV} disabled={loading || !data}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl bg-[hsl(var(--skeleton))]" />)}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <Card className="bg-card text-card-foreground shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Used</CardTitle>
                    <Zap className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">
                      {data?.tool_breakdown?.reduce((acc, curr) => acc + curr.credits_used, 0) || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                      Active usage
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Generations</CardTitle>
                    <Activity className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{data?.total_generations || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Across all tools</p>
                  </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Most Used Tool</CardTitle>
                    <BarChart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold capitalize truncate">{data?.most_used_tool || 'None'}</div>
                    <p className="text-xs text-muted-foreground mt-1">By generation count</p>
                  </CardContent>
                </Card>
                <Card className="bg-card text-card-foreground shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Credits Remaining</CardTitle>
                    <CreditCard className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{currentUser?.credits_balance || 0}</div>
                    <p className="text-xs text-muted-foreground mt-1">Available to use</p>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-2 mb-8">
              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Usage Trend</CardTitle>
                  <CardDescription>Daily credit consumption</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                  {loading ? <Skeleton className="w-full h-full bg-[hsl(var(--skeleton))]" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={data?.daily_usage || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Line type="monotone" dataKey="total_credits" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Tool Distribution</CardTitle>
                  <CardDescription>Credits used by tool type</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center">
                  {loading ? <Skeleton className="w-full h-full rounded-full max-w-[250px] max-h-[250px] bg-[hsl(var(--skeleton))]" /> : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data?.tool_breakdown || []}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="credits_used"
                          nameKey="tool_type"
                        >
                          {(data?.tool_breakdown || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                          itemStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="bg-card text-card-foreground shadow-sm">
              <CardHeader>
                <CardTitle>Detailed Statistics</CardTitle>
                <CardDescription>Breakdown of usage by tool</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <Skeleton className="w-full h-48 bg-[hsl(var(--skeleton))]" /> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tool Name</TableHead>
                          <TableHead className="text-right">Generations</TableHead>
                          <TableHead className="text-right">Credits Used</TableHead>
                          <TableHead className="text-right">% of Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(data?.tool_breakdown || []).map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium capitalize flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              {item.tool_type}
                            </TableCell>
                            <TableCell className="text-right">{item.count}</TableCell>
                            <TableCell className="text-right font-medium">{item.credits_used}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{item.percentage}%</TableCell>
                          </TableRow>
                        ))}
                        {(!data?.tool_breakdown || data.tool_breakdown.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              No data available for this period
                            </TableCell>
                          </TableRow>
                        )}
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