import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext.jsx';
import { pricingConfig } from '@/config/pricing.config.js';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Check, ExternalLink } from 'lucide-react';
import apiServerClient from '@/lib/apiServerClient';

export default function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser, refreshUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [name, setName] = useState(currentUser?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [defaultTextModel, setDefaultTextModel] = useState('gpt-4o');
  const [defaultImageModel, setDefaultImageModel] = useState('dall-e-3');
  
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);

  const currentTier = currentUser?.subscription_tier || 'free';
  const currentPlanDetails = pricingConfig.find(p => p.tier === currentTier);

  useEffect(() => {
    const savedTextModel = localStorage.getItem('default_text_model');
    const savedImageModel = localStorage.getItem('default_image_model');
    if (savedTextModel) setDefaultTextModel(savedTextModel);
    if (savedImageModel) setDefaultImageModel(savedImageModel);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    try {
      const response = await apiServerClient.fetch('/user/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error('Failed to update profile');
      await refreshUser();
      toast({ title: 'Profile updated', description: 'Your profile has been successfully updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to update profile' });
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSavePreferences = async () => {
    setLoadingPreferences(true);
    try {
      localStorage.setItem('default_text_model', defaultTextModel);
      localStorage.setItem('default_image_model', defaultImageModel);
      toast({ title: 'Preferences saved', description: 'Your default models have been updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save preferences.' });
    } finally {
      setLoadingPreferences(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'Error', description: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: 'Error', description: 'Password must be at least 8 characters' });
      return;
    }

    setLoadingPassword(true);
    try {
      const response = await apiServerClient.fetch('/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password changed', description: 'Your password has been successfully updated.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to change password' });
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Settings - DEAHost AI Platform</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        
        <div className="md:pl-64">
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="p-6 max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2 text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account settings and preferences</p>
            </div>

            <div className="space-y-6">
              
              <Card className="bg-card text-card-foreground shadow-sm border-2">
                <CardHeader>
                  <CardTitle>Manage Subscription</CardTitle>
                  <CardDescription>Your current plan and included features</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-muted/30 p-5 rounded-xl border mb-6 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Current Plan</p>
                      <p className="text-2xl font-bold capitalize text-foreground flex items-center gap-2">
                        {currentTier} Plan
                      </p>
                      <p className="text-sm font-medium text-primary mt-1">{currentUser?.credits_balance || 0} credits remaining</p>
                    </div>
                    <Link to="/subscription" className="w-full sm:w-auto">
                      <Button className="w-full sm:w-auto shadow-sm">
                        Upgrade Plan <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 uppercase tracking-wider">Features Included in your plan</h4>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4">
                      {currentPlanDetails?.defaultFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-foreground">
                          <Check className="h-4 w-4 text-green-500 mr-2 shrink-0" />
                          <span className="font-medium">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Model Preferences</CardTitle>
                  <CardDescription>Set your default AI models for generation tools</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Default Text Model</Label>
                      <Select value={defaultTextModel} onValueChange={setDefaultTextModel}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o">GPT-4o (OpenAI)</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (OpenAI)</SelectItem>
                          <SelectItem value="claude-3-opus">Claude 3 Opus (Anthropic)</SelectItem>
                          <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet (Anthropic)</SelectItem>
                          <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</SelectItem>
                          <SelectItem value="deepseek-coder">Deepseek Coder (Deepseek)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Default Image Model</Label>
                      <Select value={defaultImageModel} onValueChange={setDefaultImageModel}>
                        <SelectTrigger className="bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dall-e-3">DALL-E 3 (OpenAI)</SelectItem>
                          <SelectItem value="dall-e-2">DALL-E 2 (OpenAI)</SelectItem>
                          <SelectItem value="flux-pro">Flux Pro (Fal AI)</SelectItem>
                          <SelectItem value="sd3-large">Stable Diffusion 3 (Stability)</SelectItem>
                          <SelectItem value="imagen-3">Imagen 3 (Google)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleSavePreferences} disabled={loadingPreferences} className="mt-4 shadow-sm">
                    {loadingPreferences ? 'Saving...' : 'Save Preferences'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>Update your account details</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full name</Label>
                      <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" value={currentUser?.email || ''} disabled className="bg-muted text-muted-foreground" />
                    </div>
                    <Button type="submit" disabled={loadingProfile} className="shadow-sm">
                      {loadingProfile ? 'Saving...' : 'Save changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground shadow-sm">
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>Customize how the app looks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border">
                    <div>
                      <p className="font-medium text-foreground">Dark mode</p>
                      <p className="text-sm text-muted-foreground">Toggle dark mode theme</p>
                    </div>
                    <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}