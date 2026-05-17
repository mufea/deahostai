import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiServerClient from '@/lib/apiServerClient';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext.jsx';

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const handleGoogleCallback = async (code) => {
    setIsLoading(true);
    setError(null);
    try {
      // Exchange code for token via our backend endpoint
      const response = await apiServerClient.fetch('/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      // Manually set the PocketBase auth store using the returned token
      pb.authStore.save(data.token, {
        id: data.user_id,
        email: data.email,
        name: data.name,
        avatar: data.avatar
      });

      // Synchronize the local AuthContext state with the newly populated auth store
      await refreshUser();

      toast({
        title: 'Authentication Successful',
        description: 'You have logged in with Google.',
      });
      
      navigate('/dashboard');
    } catch (err) {
      console.error('Google OAuth error:', err);
      setError(err.message || 'An unexpected error occurred during authentication.');
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: err.message || 'Failed to complete Google Sign-In.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, error, handleGoogleCallback };
}