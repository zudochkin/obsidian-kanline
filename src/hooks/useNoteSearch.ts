import { useCallback } from 'react';
import { useTagManager } from './useTagManager';
import { usePlugin } from './usePlugin';
import { NoteCard } from '../types';
import { getFileTitle } from '../utils/fileUtils';
import { extractTagsFromContent, extractTagsFromFrontmatter } from '../utils/tagUtils';

export const useNoteSearch = () => {
  const { findNotesByTag } = useTagManager();
  const { app } = usePlugin();

  const findNotesByTags = useCallback(async (tags: string[]): Promise<NoteCard[]> => {
    const allNotes: NoteCard[] = [];
    const seenPaths = new Set<string>();

    for (const tag of tags) {
      const notes = await findNotesByTag(tag);
      for (const note of notes) {
        if (!seenPaths.has(note.path)) {
          allNotes.push(note);
          seenPaths.add(note.path);
        }
      }
    }

    return allNotes;
  }, [findNotesByTag]);

  const searchNotes = useCallback(async (query: string): Promise<NoteCard[]> => {
    const files = app.vault.getMarkdownFiles();
    const results: NoteCard[] = [];

    for (const file of files) {
      const cache = app.metadataCache.getFileCache(file);
      const title = getFileTitle(file, app);
      
      if (title.toLowerCase().includes(query.toLowerCase())) {
        const content = await app.vault.read(file);
        const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
        const contentTags = extractTagsFromContent(content);
        const allTags = [...frontmatterTags, ...contentTags];

        results.push({
          path: file.path,
          title,
          tags: allTags,
          frontmatter: cache?.frontmatter
        });
      }
    }

    return results;
  }, [app]);

  const searchNotesByContent = useCallback(async (query: string): Promise<NoteCard[]> => {
    const files = app.vault.getMarkdownFiles();
    const results: NoteCard[] = [];

    for (const file of files) {
      const content = await app.vault.read(file);
      const cache = app.metadataCache.getFileCache(file);
      
      if (content.toLowerCase().includes(query.toLowerCase())) {
        const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
        const contentTags = extractTagsFromContent(content);
        const allTags = [...frontmatterTags, ...contentTags];

        results.push({
          path: file.path,
          title: getFileTitle(file, app),
          tags: allTags,
          frontmatter: cache?.frontmatter
        });
      }
    }

    return results;
  }, [app]);

  return {
    findNotesByTags,
    searchNotes,
    searchNotesByContent
  };
};