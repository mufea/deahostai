import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGoogleAuth } from '@/hooks/useGoogleAuth.js';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Helmet } from 'react-helmet';

export default function GoogleOAuthCallback() {
  const [searchParams] = useSearchParams();
  const { isLoading, error, handleGoogleCallback } = useGoogleAuth();
  const navigate = useNavigate();
  const hasCalled = useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (code && !hasCalled.current) {
      hasCalled.current = true;
      handleGoogleCallback(code);
    } else if (!code && !hasCalled.current) {
      navigate('/login');
    }
  }, [searchParams, handleGoogleCallback, navigate]);

  return (
    <>
      <Helmet>
        <title>Authenticating... - DEAHost AI</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <div className="max-w-md w-full p-8 text-center bg-card border rounded-2xl shadow-sm">
          {isLoading && !error && (
            <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-6" />
              <h2 className="text-2xl font-bold mb-2">Authenticating with Google</h2>
              <p className="text-muted-foreground">Please wait while we securely log you in...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Authentication Failed</h2>
              <p className="text-muted-foreground mb-8 px-4 leading-relaxed">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.location.reload()}>
                  Try Again
                </Button>
                <Button className="w-full sm:w-auto" onClick={() => navigate('/login')}>
                  Return to Login
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}