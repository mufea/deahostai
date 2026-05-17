import { useState, useEffect, useCallback } from 'react';

const HISTORY_KEY = 'textGenerationHistory';

export function useGenerationHistory() {
  const [history, setHistory] = useState([]);

  // Load history on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load generation history:', error);
    }
  }, []);

  // Save to localStorage whenever history changes
  const saveHistory = useCallback((newHistory) => {
    setHistory(newHistory);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save generation history:', error);
    }
  }, []);

  const addToHistory = useCallback((prompt, response, tokensUsed = 0, model = 'openai') => {
    const newItem = {
      id: Date.now().toString(),
      prompt,
      response,
      tokensUsed,
      model,
      timestamp: new Date().toISOString()
    };
    
    setHistory(prev => {
      const updated = [newItem, ...prev];
      // Keep only the last 50 items to prevent localStorage bloat
      const trimmed = updated.slice(0, 50);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return trimmed;
    });
  }, []);

  const deleteHistoryItem = useCallback((id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save history', e);
      }
      return updated;
    });
  }, []);

  const clearAllHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

  return {
    history,
    addToHistory,
    deleteHistoryItem,
    clearAllHistory
  };
}