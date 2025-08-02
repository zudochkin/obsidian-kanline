import { App, TFile } from 'obsidian';
import { DataviewAPI, DataviewPlugin, NoteCard } from '../types';
import { getFileTitle } from './fileUtils';
import { extractTagsFromContent, extractTagsFromFrontmatter } from './tagUtils';

export const getDataviewAPI = (app: App): DataviewAPI | null => {
  const dataviewPlugin = (app as any).plugins?.plugins?.dataview as DataviewPlugin;
  return dataviewPlugin?.api || null;
};

export const isDataviewEnabled = (app: App): boolean => {
  return !!getDataviewAPI(app);
};

export const queryNotesByTag = async (app: App, tag: string): Promise<NoteCard[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  try {
    // Dataview query: "list from #tag"
    const pages = api.pages(`#${tag}`);
    const notes: NoteCard[] = [];

    for (const page of pages) {
      const file = app.vault.getAbstractFileByPath(page.file.path);
      if (!file || !(file instanceof TFile)) continue;

      const cache = app.metadataCache.getFileCache(file);
      const content = await app.vault.cachedRead(file);
      
      const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
      const contentTags = extractTagsFromContent(content);
      const allTags = [...frontmatterTags, ...contentTags];

      notes.push({
        path: page.file.path,
        title: page.file.name.replace('.md', '') || getFileTitle(file, app),
        tags: allTags,
        frontmatter: cache?.frontmatter || {}
      });
    }

    return notes;
  } catch (error) {
    console.error('Dataview query error:', error);
    return [];
  }
};

export const queryNotesByMultipleTags = async (app: App, tags: string[]): Promise<NoteCard[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  try {
    // Build query: "list from #tag1 OR #tag2 OR #tag3"
    const tagQueries = tags.map(tag => `#${tag}`).join(' OR ');
    const pages = api.pages(tagQueries);
    const notes: NoteCard[] = [];
    const seenPaths = new Set<string>();

    for (const page of pages) {
      if (seenPaths.has(page.file.path)) continue;
      seenPaths.add(page.file.path);

      const file = app.vault.getAbstractFileByPath(page.file.path);
      if (!file || !(file instanceof TFile)) continue;

      const cache = app.metadataCache.getFileCache(file);
      const content = await app.vault.cachedRead(file);
      
      const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
      const contentTags = extractTagsFromContent(content);
      const allTags = [...frontmatterTags, ...contentTags];

      notes.push({
        path: page.file.path,
        title: page.file.name.replace('.md', '') || getFileTitle(file, app),
        tags: allTags,
        frontmatter: cache?.frontmatter || {}
      });
    }

    return notes;
  } catch (error) {
    console.error('Dataview multi-tag query error:', error);
    return [];
  }
};

export const queryNotesByCustomQuery = async (app: App, query: string): Promise<NoteCard[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  try {
    const pages = api.pages(query);
    const notes: NoteCard[] = [];

    for (const page of pages) {
      const file = app.vault.getAbstractFileByPath(page.file.path);
      if (!file || !(file instanceof TFile)) continue;

      const cache = app.metadataCache.getFileCache(file);
      const content = await app.vault.cachedRead(file);
      
      const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
      const contentTags = extractTagsFromContent(content);
      const allTags = [...frontmatterTags, ...contentTags];

      notes.push({
        path: page.file.path,
        title: page.file.name.replace('.md', '') || getFileTitle(file, app),
        tags: allTags,
        frontmatter: cache?.frontmatter || {}
      });
    }

    return notes;
  } catch (error) {
    console.error('Dataview custom query error:', error);
    return [];
  }
};

export const queryNotesByMultipleQueries = async (app: App, queries: string[]): Promise<NoteCard[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  try {
    const allNotes: NoteCard[] = [];
    const seenPaths = new Set<string>();

    for (const query of queries) {
      const queryNotes = await queryNotesByCustomQuery(app, query);
      
      // Deduplicate notes
      for (const note of queryNotes) {
        if (!seenPaths.has(note.path)) {
          seenPaths.add(note.path);
          allNotes.push(note);
        }
      }
    }

    return allNotes;
  } catch (error) {
    console.error('Dataview multiple queries error:', error);
    return [];
  }
};

export const queryNotesForColumn = async (
  app: App, 
  boardQuery?: string, 
  columnTag?: string
): Promise<NoteCard[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  const finalQuery = buildColumnQuery(boardQuery, columnTag);
  if (!finalQuery.trim()) return [];

  try {
    const pages = api.pages(finalQuery);
    const notes: NoteCard[] = [];

    for (const page of pages) {
      const file = app.vault.getAbstractFileByPath(page.file.path);
      if (!file || !(file instanceof TFile)) continue;

      const cache = app.metadataCache.getFileCache(file);
      const content = await app.vault.cachedRead(file);
      
      const frontmatterTags = extractTagsFromFrontmatter(cache?.frontmatter || {});
      const contentTags = extractTagsFromContent(content);
      const allTags = [...frontmatterTags, ...contentTags];

      notes.push({
        path: page.file.path,
        title: page.file.name.replace('.md', '') || getFileTitle(file, app),
        tags: allTags,
        frontmatter: cache?.frontmatter || {}
      });
    }

    return notes;
  } catch (error) {
    console.error('Dataview column query error:', error);
    return [];
  }
};

export const buildColumnQuery = (boardQuery?: string, columnTag?: string): string => {
  // Build the final query by combining board query and column tag
  if (boardQuery && columnTag) {
    return `${boardQuery} and #${columnTag}`;
  } else if (boardQuery) {
    return boardQuery;
  } else if (columnTag) {
    return `#${columnTag}`;
  } else {
    return '';
  }
};

export const executeDataviewQuery = async (app: App, query: string): Promise<any[]> => {
  const api = getDataviewAPI(app);
  if (!api) return [];

  try {
    return api.pages(query);
  } catch (error) {
    console.error('Dataview query execution error:', error);
    return [];
  }
};