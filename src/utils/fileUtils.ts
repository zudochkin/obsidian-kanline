import { TFile, App } from 'obsidian';

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

export const isValidPath = (path: string): boolean => {
  return Boolean(path) && path.length > 0 && !path.includes('..');
};

export const getFileTitle = (file: TFile, app: App): string => {
  const cache = app.metadataCache.getFileCache(file);
  return cache?.frontmatter?.title || file.basename;
};

export const updateFileContent = async (
  app: App, 
  file: TFile, 
  updater: (content: string) => string
): Promise<void> => {
  const content = await app.vault.read(file);
  const newContent = updater(content);
  await app.vault.modify(file, newContent);
};

export const addTagToFile = async (
  app: App,
  file: TFile,
  tag: string
): Promise<void> => {
  return updateFileContent(app, file, (content) => {
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    return content + `\n\n${normalizedTag}`;
  });
};

export const removeTagFromFile = async (
  app: App,
  file: TFile,
  tag: string
): Promise<void> => {
  return updateFileContent(app, file, (content) => {
    const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
    return content.replace(new RegExp(`\\s*${normalizedTag}\\b`, 'g'), '');
  });
};