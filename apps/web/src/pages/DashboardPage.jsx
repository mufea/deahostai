import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '@/hooks/useTranslation';
import { useTools } from '@/hooks/useTools';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowRight, Zap, RefreshCw } from 'lucide-react';

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { tools } = useTools();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const categories = ['all', ...new Set(tools.map(tool => tool.category))];

  const filteredTools = tools.filter(tool => {
    const matchesSearch = t(tool.nameKey, tool.defaultName).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t(tool.descKey, tool.defaultDesc).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Helmet>
        <title>{t('nav.dashboard', 'Dashboard')} - DEAHost AI</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('dashboard.welcome', 'Welcome back')}, {currentUser?.name?.split(' ')[0] || 'Creator'}</h1>
                <p className="text-muted-foreground mt-1">Ready to create something amazing today?</p>
              </div>
              <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border">
                <div className="px-3 py-1">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('common.credits', 'Credits')}</p>
                  <p className="text-xl font-bold text-primary">{currentUser?.credits_balance || 0}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing} className="h-8 w-8 rounded-lg">
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                <Link to="/subscription">
                  <Button size="sm" variant="secondary" className="h-8 shadow-sm">{t('common.upgrade', 'Upgrade')}</Button>
                </Link>
              </div>
            </div>

            <div id="tools" className="pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-foreground">AI Tools</h2>
                <div className="flex w-full sm:w-auto items-center gap-3">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search tools..." 
                      className="pl-9 bg-background"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] bg-background hidden sm:flex">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c} className="capitalize">
                          {c === 'all' ? 'All Categories' : c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredTools.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 rounded-2xl border border-dashed">
                  <p className="text-muted-foreground">No tools found matching your search.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => (
                    <Card key={tool.id} className="bg-card text-card-foreground shadow-sm hover:shadow-md transition-all duration-200 flex flex-col group border-border/50">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-primary/10 text-primary rounded-xl group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                            <tool.icon className="h-6 w-6" />
                          </div>
                          <Badge variant="secondary" className="bg-muted font-medium text-xs flex items-center gap-1">
                            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                            {tool.cost} Credits
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-1">{t(tool.nameKey, tool.defaultName)}</CardTitle>
                        <CardDescription className="line-clamp-2">{t(tool.descKey, tool.defaultDesc)}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto flex justify-end">
                        <Link to={tool.href} className="w-full">
                          <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            Open Tool
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}