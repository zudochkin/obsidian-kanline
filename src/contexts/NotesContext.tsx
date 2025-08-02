import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NoteCard, NotesContextValue } from '../types';
import PluginContext from './PluginContext';
import BoardContext from './BoardContext';
import { TFile } from 'obsidian';
import { getFileTitle } from '../utils/fileUtils';
import { extractTagsFromContent, extractTagsFromFrontmatter, hasTag } from '../utils/tagUtils';
import { isDataviewEnabled, queryNotesByMultipleTags, queryNotesByTag } from '../utils/dataviewUtils';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

const NotesContext = createContext<NotesContextValue | null>(null);

interface NotesProviderProps {
  children: React.ReactNode;
}

export const NotesProvider: React.FC<NotesProviderProps> = ({ children }) => {
  const pluginContext = useContext(PluginContext);
  const boardContext = useContext(BoardContext);
  
  if (!pluginContext) {
    throw new Error('NotesProvider must be used within PluginProvider');
  }
  if (!boardContext) {
    throw new Error('NotesProvider must be used within BoardProvider');
  }

  const { app, settings } = pluginContext;
  const { activeBoard } = boardContext;
  const [notes, setNotes] = useState<NoteCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  const findNotesByTagsClassic = useCallback(async (tags: string[]): Promise<NoteCard[]> => {
    const allNotes: NoteCard[] = [];
    const seenPaths = new Set<string>();
    const files = app.vault.getMarkdownFiles();

    for (const file of files) {
      try {
        const cache = app.metadataCache.getFileCache(file);
        const content = await app.vault.read(file);
        
        const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
        const contentTags = extractTagsFromContent(content);
        const allFileTags = [...frontmatterTags, ...contentTags];
        
        const matchesAnyTag = tags.some(tag => hasTag(allFileTags, tag));
        
        if (matchesAnyTag && !seenPaths.has(file.path)) {
          allNotes.push({
            path: file.path,
            title: getFileTitle(file, app),
            tags: allFileTags,
            frontmatter: cache?.frontmatter
          });
          seenPaths.add(file.path);
        }
      } catch (error) {
        console.error('[NotesContext] Error processing file:', file.path, error);
      }
    }
    
    return allNotes;
  }, [app]);

  const findNotesByTags = useCallback(async (tags: string[]): Promise<NoteCard[]> => {
    // Check if user wants to use Dataview queries and if Dataview is available
    const useDataview = settings.useDataviewQueries && isDataviewEnabled(app);
    
    if (useDataview) {
      try {
        const dataviewNotes = await queryNotesByMultipleTags(app, tags);
        return dataviewNotes;
      } catch (error) {
        console.error('[NotesContext] Dataview query failed:', error);
        
        // Fallback to classic method if enabled
        if (settings.dataviewFallback) {
          return await findNotesByTagsClassic(tags);
        }
        
        throw error;
      }
    }
    
    // Use classic method
    return await findNotesByTagsClassic(tags);
  }, [app, settings, findNotesByTagsClassic]);

  const refreshNotes = useCallback(async (isAutoRefresh = false) => {
    if (!activeBoard) {
      return;
    }
    
    if (isAutoRefresh) {
      setIsAutoRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Use dataview queries if available, otherwise fall back to tags
      const useDataview = settings.useDataviewQueries && isDataviewEnabled(app);
      let foundNotes: NoteCard[];
      
      if (useDataview) {
        // In dataview mode, notes are loaded per-column in KanbanBoard
        // We only need to load notes here for drag-and-drop operations
        foundNotes = [];
      } else {
        const allTags = activeBoard.columns.map(col => col.tag);
        foundNotes = await findNotesByTags(allTags);
      }
      
      // For auto-refresh, only update if there are actual changes
      if (isAutoRefresh) {
        setNotes(prevNotes => {
          const hasChanges = JSON.stringify(prevNotes.map(n => ({ path: n.path, tags: n.tags }))) !== 
                            JSON.stringify(foundNotes.map(n => ({ path: n.path, tags: n.tags })));
          if (hasChanges) {
            return foundNotes;
          }
          return prevNotes;
        });
      } else {
        setNotes(foundNotes);
      }
    } catch (err) {
      console.error('[NotesContext] Error in refreshNotes:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      if (isAutoRefresh) {
        setIsAutoRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [activeBoard, findNotesByTags]);

  const moveNote = useCallback(async (noteId: string, fromColumn: string, toColumn: string) => {
    console.log('[NotesContext] moveNote called:', { noteId, fromColumn, toColumn });
    setLoading(true);
    setError(null);
    
    try {
      // Get file using Obsidian vault API
      const file = app.vault.getAbstractFileByPath(noteId);
      if (!(file instanceof TFile)) {
        console.error('[NotesContext] File not found:', noteId);
        throw new Error(`File not found: ${noteId}`);
      }

      console.log('[NotesContext] Found file:', file.path);
      
      // Read current content
      const originalContent = await app.vault.read(file);
      console.log('[NotesContext] Original content length:', originalContent.length);
      
      let newContent = originalContent;
      let hasChanges = false;
      
      // Update inline tags first (more reliable)
      const inlineTagRegex = new RegExp(`#${fromColumn}(?!\\w)`, 'g');
      const inlineMatches = newContent.match(inlineTagRegex);
      console.log('[NotesContext] Inline tag matches for #' + fromColumn + ':', inlineMatches?.length || 0);
      
      if (inlineMatches && inlineMatches.length > 0) {
        newContent = newContent.replace(inlineTagRegex, `#${toColumn}`);
        hasChanges = true;
        console.log('[NotesContext] Replaced inline tags:', inlineMatches.length);
      }
      
      // Update frontmatter tags
      const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
      const frontmatterMatch = newContent.match(frontmatterRegex);
      
      if (frontmatterMatch) {
        console.log('[NotesContext] Found frontmatter block');
        const frontmatterContent = frontmatterMatch[1];
        
        // Handle different frontmatter tag formats
        const tagPatterns = [
          // Array format: tags: ["tag1", "tag2"]
          { regex: /tags:\s*\[(.*?)\]/s, format: 'array' },
          // List format: tags:\n  - tag1\n  - tag2
          { regex: /tags:\s*\n((?:\s*-\s*.+\n?)*)/m, format: 'list' },
          // Single line format: tags: tag1, tag2
          { regex: /tags:\s*([^\n\[]+)/m, format: 'inline' }
        ];
        
        for (const pattern of tagPatterns) {
          const tagMatch = frontmatterContent.match(pattern.regex);
          if (tagMatch) {
            console.log('[NotesContext] Found tags in format:', pattern.format);
            
            let updatedFrontmatter = frontmatterContent;
            
            if (pattern.format === 'array') {
              // Handle array format
              const tagsString = tagMatch[1];
              if (tagsString.includes(`"${fromColumn}"`) || tagsString.includes(`'${fromColumn}'`)) {
                const updatedTagsString = tagsString
                  .replace(new RegExp(`"${fromColumn}"`, 'g'), `"${toColumn}"`)
                  .replace(new RegExp(`'${fromColumn}'`, 'g'), `'${toColumn}'`);
                updatedFrontmatter = frontmatterContent.replace(pattern.regex, `tags: [${updatedTagsString}]`);
                hasChanges = true;
                console.log('[NotesContext] Updated array format tags');
              }
            } else if (pattern.format === 'list') {
              // Handle list format
              const listContent = tagMatch[1];
              if (listContent.includes(`- ${fromColumn}`)) {
                const updatedListContent = listContent.replace(
                  new RegExp(`- ${fromColumn}`, 'g'), 
                  `- ${toColumn}`
                );
                updatedFrontmatter = frontmatterContent.replace(
                  pattern.regex, 
                  `tags:\n${updatedListContent}`
                );
                hasChanges = true;
                console.log('[NotesContext] Updated list format tags');
              }
            } else if (pattern.format === 'inline') {
              // Handle inline format
              const tagsString = tagMatch[1].trim();
              if (tagsString.includes(fromColumn)) {
                const updatedTagsString = tagsString
                  .split(/[,\s]+/)
                  .map(tag => tag.trim() === fromColumn ? toColumn : tag.trim())
                  .join(', ');
                updatedFrontmatter = frontmatterContent.replace(
                  pattern.regex, 
                  `tags: ${updatedTagsString}`
                );
                hasChanges = true;
                console.log('[NotesContext] Updated inline format tags');
              }
            }
            
            if (hasChanges) {
              newContent = newContent.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
              break; // Only process the first matching format
            }
          }
        }
      }
      
      // Save changes using Obsidian API
      if (hasChanges) {
        console.log('[NotesContext] Content has changes, saving file');
        console.log('[NotesContext] Original length:', originalContent.length, 'New length:', newContent.length);
        
        await app.vault.modify(file, newContent);
        console.log('[NotesContext] File saved successfully using app.vault.modify');
        
        // Wait for file system to settle before refreshing
        setTimeout(() => {
          console.log('[NotesContext] Refreshing notes after successful tag change');
          refreshNotes(false); // Force manual refresh
        }, 200);
      } else {
        console.log('[NotesContext] No changes detected in file content');
        console.log('[NotesContext] Search patterns - fromColumn:', fromColumn, 'toColumn:', toColumn);
      }
      
    } catch (err) {
      console.error('[NotesContext] Error in moveNote:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred while moving note');
    } finally {
      setLoading(false);
    }
  }, [app, refreshNotes]);

  const openNote = useCallback(async (notePath: string) => {
    const file = app.vault.getAbstractFileByPath(notePath);
    if (file instanceof TFile) {
      const leaf = app.workspace.getLeaf(false); // false to open in new leaf, not in the sidebar
      await leaf.openFile(file, { active: true });
    }
  }, [app]);

  // Auto-refresh functionality
  useAutoRefresh({
    enabled: settings.autoRefreshEnabled && !!activeBoard,
    interval: settings.autoRefreshInterval,
    onRefresh: () => refreshNotes(true)
  });

  // Only refresh when activeBoard changes, not when refreshNotes function changes
  useEffect(() => {
    if (activeBoard) {
      refreshNotes(false);
    }
  }, [activeBoard?.id]); // Only depend on the board ID, not the whole object or function

  // Stable function references
  const refreshNotesStable = useCallback(() => refreshNotes(false), [refreshNotes]);
  
  const value = useMemo(() => ({
    notes,
    loading,
    error,
    isAutoRefreshing,
    refreshNotes: refreshNotesStable,
    moveNote,
    openNote
  }), [notes, loading, error, isAutoRefreshing, refreshNotesStable, moveNote, openNote]);

  return (
    <NotesContext.Provider value={value}>
      {children}
    </NotesContext.Provider>
  );
};

export default NotesContext;