import { useContext } from 'react';
import PluginContext from '../contexts/PluginContext';
import { PluginContextValue } from '../types';

export const usePlugin = (): PluginContextValue => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePlugin must be used within PluginProvider');
  }
  return context;
};