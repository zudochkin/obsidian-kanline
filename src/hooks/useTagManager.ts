import { useCallback } from 'react';
import { TFile } from 'obsidian';
import { usePlugin } from './usePlugin';
import { NoteCard } from '../types';
import { getFileTitle } from '../utils/fileUtils';
import { extractTagsFromContent, extractTagsFromFrontmatter, hasTag } from '../utils/tagUtils';

export const useTagManager = () => {
  const { app } = usePlugin();

  const findNotesByTag = useCallback(async (tag: string): Promise<NoteCard[]> => {
    const notes: NoteCard[] = [];
    const files = app.vault.getMarkdownFiles();

    for (const file of files) {
      const cache = app.metadataCache.getFileCache(file);
      const content = await app.vault.read(file);
      
      const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
      const contentTags = extractTagsFromContent(content);
      const allTags = [...frontmatterTags, ...contentTags];
      
      if (hasTag(allTags, tag)) {
        notes.push({
          path: file.path,
          title: getFileTitle(file, app),
          tags: allTags,
          frontmatter: cache?.frontmatter
        });
      }
    }

    return notes;
  }, [app]);

  const updateNoteTag = useCallback(async (notePath: string, oldTag: string, newTag: string): Promise<void> => {
    const file = app.vault.getAbstractFileByPath(notePath);
    if (!(file instanceof TFile)) return;

    const content = await app.vault.read(file);
    const cache = app.metadataCache.getFileCache(file);

    // Update frontmatter tags
    if (cache?.frontmatter?.tags?.includes(oldTag)) {
      await updateFrontmatterTag(file, oldTag, newTag);
    }

    // Update inline tags
    const hasInlineTag = content.includes(`#${oldTag}`);
    if (hasInlineTag) {
      await updateInlineTag(file, oldTag, newTag);
    }
  }, [app]);

  const moveNoteBetweenColumns = useCallback(async (noteId: string, fromColumnTag: string, toColumnTag: string): Promise<void> => {
    await updateNoteTag(noteId, fromColumnTag, toColumnTag);
  }, [updateNoteTag]);

  const updateFrontmatterTag = useCallback(async (file: TFile, oldTag: string, newTag: string) => {
    const content = await app.vault.read(file);
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    
    const match = content.match(frontmatterRegex);
    if (!match) return;

    const frontmatterContent = match[1];
    const updatedFrontmatter = frontmatterContent.replace(
      new RegExp(`(?<=tags:.*?)${oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g'),
      newTag
    );

    const updatedContent = content.replace(frontmatterRegex, `---\n${updatedFrontmatter}\n---`);
    await app.vault.modify(file, updatedContent);
  }, [app]);

  const updateInlineTag = useCallback(async (file: TFile, oldTag: string, newTag: string) => {
    const content = await app.vault.read(file);
    const updatedContent = content.replace(
      new RegExp(`#${oldTag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\w)`, 'g'),
      `#${newTag}`
    );
    await app.vault.modify(file, updatedContent);
  }, [app]);

  return {
    findNotesByTag,
    updateNoteTag,
    moveNoteBetweenColumns,
    updateFrontmatterTag,
    updateInlineTag
  };
};