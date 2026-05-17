import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { toolsConfig } from '@/config/tools.config.js';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowRight, Zap } from 'lucide-react';

export default function ToolsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = ['all', ...new Set(toolsConfig.map(tool => tool.category))];

  const filteredTools = toolsConfig.filter(tool => {
    const matchesSearch = t(tool.nameKey, tool.defaultName).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t(tool.descKey, tool.defaultDesc).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || tool.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <Helmet>
        <title>{t('nav.all_tools', 'All Tools')} - DEAHost AI</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('nav.all_tools', 'All Tools')}</h1>
                <p className="text-muted-foreground mt-1">Explore our suite of AI-powered generation tools.</p>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
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
                    <SelectTrigger className="w-[140px] bg-background">
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
                          <Badge variant="outline" className={`badge-tier-${tool.requiredPlan} uppercase text-[10px] tracking-wider`}>
                            {tool.requiredPlan === 'free' ? 'Free' : tool.requiredPlan === 'coming_soon' ? 'Coming Soon' : `${tool.requiredPlan}+`}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-1">{t(tool.nameKey, tool.defaultName)}</CardTitle>
                        <CardDescription className="line-clamp-2">{t(tool.descKey, tool.defaultDesc)}</CardDescription>
                      </CardHeader>
                      <CardContent className="mt-auto flex justify-end">
                        <Link to={tool.href} className="w-full">
                          <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                            {tool.status === 'coming_soon' ? 'Coming Soon' : 'Open Tool'}
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