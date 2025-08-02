import React, { createContext, useCallback, useMemo, useState } from 'react';
import { App, Plugin } from 'obsidian';
import { KanLineSettings, PluginContextValue } from '../types';

const PluginContext = createContext<PluginContextValue | null>(null);

interface PluginProviderProps {
  children: React.ReactNode;
  plugin: Plugin;
  app: App;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ 
  children, 
  plugin, 
  app 
}) => {
  const [settings, setSettings] = useState<KanLineSettings>((plugin as any).settings);

  const updateSettings = useCallback(async (newSettings: Partial<KanLineSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    await (plugin as any).saveSettings(updatedSettings);
    setSettings(updatedSettings);
  }, [settings, plugin]);

  const value = useMemo(() => ({
    plugin,
    app,
    settings,
    updateSettings
  }), [plugin, app, settings, updateSettings]);

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};

export default PluginContext;