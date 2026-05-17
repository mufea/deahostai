import React, { useEffect } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext.jsx';
import { AuthProvider } from '@/contexts/AuthContext.jsx';
import { Toaster } from '@/components/ui/toaster';
import ScrollToTop from '@/components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import PlanRestrictedRoute from '@/components/PlanRestrictedRoute.jsx';
import { GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';
import { initializeLanguage } from '@/lib/languageInit';
import i18n from '@/lib/i18n';

import HomePage from '@/pages/HomePage.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';
import GoogleOAuthCallback from '@/pages/GoogleOAuthCallback.jsx';
import PricingPage from '@/pages/PricingPage.jsx';

import DashboardPage from '@/pages/DashboardPage.jsx';
import ToolsPage from '@/pages/ToolsPage.jsx';
import TextGeneratorPage from '@/pages/TextGeneratorPage.jsx';
import ImageGeneratorPage from '@/pages/ImageGeneratorPage.jsx';
import VideoGeneratorPage from '@/pages/VideoGeneratorPage.jsx';
import MusicGeneratorPage from '@/pages/MusicGeneratorPage.jsx';
import TextToSpeechPage from '@/pages/TextToSpeechPage.jsx';
import PdfChatPage from '@/pages/PdfChatPage.jsx';
import ImageAnalyzerPage from '@/pages/ImageAnalyzerPage.jsx';
import VideoEditorPage from '@/pages/VideoEditorPage.jsx';
import ImageEditorPage from '@/pages/ImageEditorPage.jsx';
import CodeGeneratorPage from '@/pages/CodeGeneratorPage.jsx';

import ReferralPage from '@/pages/ReferralPage.jsx';
import AnalyticsDashboard from '@/pages/AnalyticsDashboard.jsx';
import SubscriptionPage from '@/pages/SubscriptionPage.jsx';
import SettingsPage from '@/pages/SettingsPage.jsx';
import UsageHistoryPage from '@/pages/UsageHistoryPage.jsx';
import SuccessPage from '@/pages/SuccessPage.jsx';
import CancelPage from '@/pages/CancelPage.jsx';
import PrivacyPolicy from '@/pages/PrivacyPolicy.jsx';
import TermsOfService from '@/pages/TermsOfService.jsx';
import CookiePolicy from '@/pages/CookiePolicy.jsx';
import DebugSyncPage from '@/pages/DebugSyncPage.jsx';

function App() {
  const recaptchaKey = import.meta.env.VITE_CAPTCHA_SITE_KEY || 'dummy_key_for_dev';

  useEffect(() => {
    initializeLanguage();
    
    const handleLanguageChange = (lng) => {
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => i18n.off('languageChanged', handleLanguageChange);
  }, []);

  return (
    <ThemeProvider>
      <GoogleReCaptchaProvider reCaptchaKey={recaptchaKey}>
        <Router>
          <AuthProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
              
              {/* Legal Pages */}
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/cookie-policy" element={<CookiePolicy />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
              
              {/* Tool Routes wrapped with PlanRestrictedRoute */}
              <Route path="/text-generator" element={<ProtectedRoute><PlanRestrictedRoute toolId="text-generator"><TextGeneratorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/image-generator" element={<ProtectedRoute><PlanRestrictedRoute toolId="image-generator"><ImageGeneratorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/video-generator" element={<ProtectedRoute><PlanRestrictedRoute toolId="video-generator"><VideoGeneratorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/music-generator" element={<ProtectedRoute><PlanRestrictedRoute toolId="music-generator"><MusicGeneratorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/text-to-speech" element={<ProtectedRoute><PlanRestrictedRoute toolId="text-to-speech"><TextToSpeechPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/pdf-chat" element={<ProtectedRoute><PlanRestrictedRoute toolId="pdf-analyzer"><PdfChatPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/image-analyzer" element={<ProtectedRoute><PlanRestrictedRoute toolId="image-analyzer"><ImageAnalyzerPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/video-editor" element={<ProtectedRoute><PlanRestrictedRoute toolId="video-editor"><VideoEditorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/image-editor" element={<ProtectedRoute><PlanRestrictedRoute toolId="image-editor"><ImageEditorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              <Route path="/code-generator" element={<ProtectedRoute><PlanRestrictedRoute toolId="code-generator"><CodeGeneratorPage /></PlanRestrictedRoute></ProtectedRoute>} />
              
              <Route path="/referral" element={<ProtectedRoute><ReferralPage /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute><SubscriptionPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/usage-history" element={<ProtectedRoute><UsageHistoryPage /></ProtectedRoute>} />
              
              <Route path="/debug-sync" element={<ProtectedRoute><DebugSyncPage /></ProtectedRoute>} />
              
              {/* Payment Callbacks */}
              <Route path="/success" element={<SuccessPage />} />
              <Route path="/cancel" element={<CancelPage />} />
              
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center bg-background px-4">
                    <div className="text-center max-w-md">
                      <h1 className="text-5xl font-extrabold mb-4 text-foreground">404</h1>
                      <p className="text-xl font-medium mb-2 text-foreground">Page Not Found</p>
                      <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist or has been moved.</p>
                      <a href="/" className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                        Back to Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </GoogleReCaptchaProvider>
    </ThemeProvider>
  );
}

export default App;