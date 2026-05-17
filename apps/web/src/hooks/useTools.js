import { useMemo } from 'react';
import { toolsConfig } from '@/config/tools.config';

export function useTools() {
  const getAllTools = useMemo(() => {
    return () => toolsConfig;
  }, []);

  const getToolById = useMemo(() => {
    return (id) => toolsConfig.find(tool => tool.id === id);
  }, []);

  const getToolsByCategory = useMemo(() => {
    return (category) => toolsConfig.filter(tool => tool.category === category);
  }, []);

  const getToolDetails = useMemo(() => {
    return (id) => getToolById(id);
  }, [getToolById]);

  return {
    tools: toolsConfig,
    getAllTools,
    getToolById,
    getToolsByCategory,
    getToolDetails
  };
}