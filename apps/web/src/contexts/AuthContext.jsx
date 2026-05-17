import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';
import { initializeLanguage } from '@/lib/languageInit';

const AuthContext = createContext(null);

const generateUniqueReferralCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF_';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  const refreshUser = useCallback(async () => {
    if (pb.authStore.isValid && pb.authStore.model) {
      try {
        const user = await pb.collection('users').getOne(pb.authStore.model.id, { $autoCancel: false });
        setCurrentUser(user);
        initializeLanguage(user.language);
        return user;
      } catch (error) {
        console.error('Failed to refresh user:', error);
        pb.authStore.clear();
        setCurrentUser(null);
      }
    }
    return null;
  }, []);

  useEffect(() => {
    refreshUser().finally(() => {
      if (!pb.authStore.isValid) {
        initializeLanguage();
      }
      setInitialLoading(false);
    });
  }, [refreshUser]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const authData = await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      setCurrentUser(authData.record);
      initializeLanguage(authData.record.language);
      toast({
        title: 'Welcome back',
        description: 'You have successfully logged in.',
      });
      return authData.record;
    } catch (error) {
      let errorMessage = 'Invalid email or password.';
      if (error.response?.message) {
        errorMessage = error.response.message;
      }
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email, password, passwordConfirm, name) => {
    setAuthError(null);
    const savedLang = localStorage.getItem('app_language') || 'en';
    
    let user = null;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const referral_code = generateUniqueReferralCode();
        user = await pb.collection('users').create({
          email,
          password,
          passwordConfirm,
          name,
          language: savedLang,
          subscription_tier: 'free',
          credits_balance: 100,
          credits_limit: 100,
          referral_code
        }, { $autoCancel: false });
        break; // Success, exit retry loop
      } catch (error) {
        attempts++;
        console.error(`Signup error (attempt ${attempts}/${maxAttempts}):`, error);
        
        const errorString = JSON.stringify(error).toLowerCase();
        const isUniqueError = error.response?.data?.referral_code?.code === 'validation_not_unique' || 
                              errorString.includes('unique');
        
        if (isUniqueError && attempts < maxAttempts) {
          continue; // Retry with new code
        }
        
        let errorMessage = 'Signup failed. Please try again.';
        
        // Extract specific field validation errors from PocketBase response
        if (error.response?.data) {
          const fieldErrors = Object.entries(error.response.data)
            .filter(([field]) => field !== 'referral_code') // Hide internal referral code errors
            .map(([field, err]) => {
              const fieldName = field.charAt(0).toUpperCase() + field.slice(1);
              return `${fieldName}: ${err.message}`;
            })
            .join(' | ');
            
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
        
        setAuthError(errorMessage);
        throw new Error(errorMessage);
      }
    }

    if (!user) {
      const fallbackError = 'Signup failed. Please try again.';
      setAuthError(fallbackError);
      throw new Error(fallbackError);
    }

    try {
      await pb.collection('users').authWithPassword(email, password, { $autoCancel: false });
      setCurrentUser(user);
      initializeLanguage(savedLang);
      
      toast({
        title: 'Account created',
        description: 'Welcome to AI SaaS Platform. You have 100 free credits.',
      });
      return user;
    } catch (authError) {
      console.error('Auto-login after signup failed:', authError);
      throw new Error('Account created, but auto-login failed. Please log in manually.');
    }
  };

  // NEVER use async/await here directly connected to click handlers, to prevent Safari popup blocking
  const loginWithGoogle = () => {
    setAuthError(null);
    return pb.collection('users').authWithOAuth2({ provider: 'google' })
      .then(authData => {
        setCurrentUser(authData.record);
        initializeLanguage(authData.record.language || 'en');
        toast({ title: 'Welcome', description: 'Signed in with Google successfully.' });
        return authData.record;
      })
      .catch(error => {
        setAuthError(error.message);
        throw error;
      });
  };

  const signupWithGoogle = () => {
    setAuthError(null);
    return pb.collection('users').authWithOAuth2({ provider: 'google' })
      .then(authData => {
        setCurrentUser(authData.record);
        initializeLanguage(authData.record.language || 'en');
        toast({ title: 'Account ready', description: 'Signed up with Google successfully.' });
        return authData.record;
      })
      .catch(error => {
        setAuthError(error.message);
        throw error;
      });
  };

  const logout = () => {
    pb.authStore.clear();
    setCurrentUser(null);
    navigate('/');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  const value = {
    currentUser,
    login,
    signup,
    loginWithGoogle,
    signupWithGoogle,
    logout,
    refreshUser,
    isAuthenticated: !!currentUser,
    error: authError,
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}