// TEMPORARY: reCAPTCHA disabled for development/testing - re-enable in production
import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { useTheme } from 'next-themes';
// import ReCAPTCHA from 'react-google-recaptcha';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useTranslation } from '@/hooks/useTranslation.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { LogoFull } from '@/components/Logo.jsx';
import apiServerClient from '@/lib/apiServerClient.js';
import { toast } from '@/hooks/use-toast.js';
import LanguageSelector from '@/components/LanguageSelector.jsx';
import { Home, Loader2 } from 'lucide-react';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 mr-2" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // const [recaptchaToken, setRecaptchaToken] = useState(null);
  
  // const recaptchaRef = useRef(null);
  const { theme } = useTheme();
  const { signup, signupWithGoogle, error: authError } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!name.trim()) {
      toast({ variant: 'destructive', title: t('common.error', 'Error'), description: 'Name is required.' });
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({ variant: 'destructive', title: t('common.error', 'Error'), description: 'Please enter a valid email address.' });
      return;
    }

    if (password.length < 8) {
      toast({ variant: 'destructive', title: t('common.error', 'Error'), description: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== passwordConfirm) {
      toast({ variant: 'destructive', title: t('common.error', 'Error'), description: 'Passwords do not match.' });
      return;
    }

    /*
    if (!recaptchaToken) {
      toast({ variant: 'destructive', title: t('common.error', 'Error'), description: 'Please complete the reCAPTCHA verification.' });
      return;
    }
    */

    setLoading(true);
    try {
      /*
      // Verify reCAPTCHA token with backend
      const captchaRes = await apiServerClient.fetch('/recaptcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: recaptchaToken })
      });

      if (!captchaRes.ok) {
        throw new Error('Security verification service unavailable.');
      }

      const captchaData = await captchaRes.json();
      
      if (!captchaData.success) {
        throw new Error(captchaData.error || 'reCAPTCHA verification failed. Please try again.');
      }
      */

      await signup(email, password, passwordConfirm, name);
      navigate('/dashboard');
    } catch (error) {
      /*
      // Reset reCAPTCHA on failure so user can try again
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
      */

      const msg = error.message || 'Failed to create account.';
      const isExists = msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already in use');
      
      toast({
        variant: 'destructive',
        title: t('common.error', 'Error'),
        description: isExists ? 'Account already exists, please sign in instead.' : msg
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setGoogleLoading(true);
    signupWithGoogle()
      .then(() => navigate('/dashboard'))
      .catch((error) => {
        const msg = error.message || 'Failed to authenticate with Google.';
        const isExists = msg.toLowerCase().includes('exist') || msg.toLowerCase().includes('already in use');
        
        toast({
          variant: 'destructive',
          title: t('common.error', 'Error'),
          description: isExists ? 'Account already exists, please sign in instead.' : msg
        });
        setGoogleLoading(false);
      });
  };

  /*
  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const onRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast({
      variant: 'destructive',
      title: 'Verification Expired',
      description: 'Your reCAPTCHA verification expired. Please verify again.'
    });
  };

  const onRecaptchaError = () => {
    setRecaptchaToken(null);
    toast({
      variant: 'destructive',
      title: 'Verification Error',
      description: 'A network error occurred during reCAPTCHA verification. Please check your connection.'
    });
  };

  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || 'your_site_key_here';
  */

  const isAuthErrorExists = authError && (authError.toLowerCase().includes('exist') || authError.toLowerCase().includes('already in use'));

  return (
    <>
      <Helmet>
        <title>{t('nav.signup')} - DEAHost AI</title>
      </Helmet>

      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-12 relative">
        <div className="absolute top-4 left-4 z-20 rtl:right-4 rtl:left-auto">
          <Button variant="outline" size="sm" asChild className="h-[44px] px-4 rounded-full shadow-sm hover:scale-105 hover:border-primary hover:text-primary transition-all bg-background/80 backdrop-blur">
            <Link to="/">
              <Home className="mr-2 rtl:ml-2 rtl:mr-0 h-4 w-4" /> 
              {t('nav.back_home', '← Home')}
            </Link>
          </Button>
        </div>

        <div className="absolute top-4 right-4 z-20 rtl:left-4 rtl:right-auto">
          <LanguageSelector />
        </div>

        <div className="w-full mt-10 flex flex-col items-center">
          <div className="text-center mb-8 flex flex-col items-center">
            <LogoFull className="mb-8" iconSize={48} stacked={true} asLink={false} />
            <h1 className="text-3xl font-bold mb-2">{t('auth.signup_btn')}</h1>
          </div>

          <div className="auth-form-container">
            
            {authError && (
              <div className="mb-6 p-3 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                {isAuthErrorExists ? 'Account already exists, please sign in instead.' : authError}
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="auth-form-fields">
              <div className="space-y-2">
                <Label htmlFor="name">{t('auth.name')}</Label>
                <Input 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="text-foreground bg-background" 
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('auth.email')}</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  className="text-foreground bg-background" 
                  placeholder="john@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input 
                  id="password" 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  minLength={8}
                  className="text-foreground bg-background" 
                  placeholder="Min. 8 characters"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm">{t('auth.confirm_password')}</Label>
                <Input 
                  id="passwordConfirm" 
                  type="password" 
                  value={passwordConfirm} 
                  onChange={(e) => setPasswordConfirm(e.target.value)} 
                  required 
                  minLength={8}
                  className="text-foreground bg-background" 
                  placeholder="Confirm your password"
                />
              </div>

              {/* TEMPORARY: reCAPTCHA component disabled 
              <div className="recaptcha-wrapper">
                <div className="recaptcha-scaler">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={siteKey}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    onChange={onRecaptchaChange}
                    onExpired={onRecaptchaExpired}
                    onErrored={onRecaptchaError}
                  />
                </div>
              </div>
              */}

              <Button type="submit" className="auth-submit-btn mt-4" disabled={loading || googleLoading}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : t('auth.signup_btn')}
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase font-medium">
                <span className="bg-card px-3 text-muted-foreground">OR</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full h-11 flex items-center justify-center font-medium bg-background hover:bg-muted" 
              onClick={handleGoogleSignUp}
              disabled={loading || googleLoading}
            >
              {googleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GoogleIcon />}
              Sign up with Google
            </Button>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                {t('nav.login')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}