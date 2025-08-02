import React from 'react';
import { App, Plugin } from 'obsidian';
import { PluginProvider } from '../contexts/PluginContext';
import { BoardProvider } from '../contexts/BoardContext';
import { NotesProvider } from '../contexts/NotesContext';
import BoardManager from './BoardManager';

interface AppRootProps {
  plugin: Plugin;
  app: App;
}

const AppRoot: React.FC<AppRootProps> = ({ plugin, app }) => {
  return (
    <PluginProvider plugin={plugin} app={app}>
      <BoardProvider>
        <NotesProvider>
          <div className="kanline-plugin">
            <BoardManager />
          </div>
        </NotesProvider>
      </BoardProvider>
    </PluginProvider>
  );
};

export default AppRoot;