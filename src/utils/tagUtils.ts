export const normalizeTag = (tag: string): string => {
  return tag.startsWith('#') ? tag.slice(1) : tag;
};

export const formatTag = (tag: string): string => {
  return tag.startsWith('#') ? tag : `#${tag}`;
};

export const extractTagsFromContent = (content: string): string[] => {
  const tagRegex = /#[\w\-_/]+/g;
  const matches = content.match(tagRegex);
  return matches ? matches.map(normalizeTag) : [];
};

export const extractTagsFromFrontmatter = (frontmatter: Record<string, unknown>): string[] => {
  const tags = frontmatter?.tags;
  if (Array.isArray(tags)) {
    return tags.map(tag => normalizeTag(String(tag)));
  }
  if (typeof tags === 'string') {
    return tags.split(',').map(tag => normalizeTag(tag.trim()));
  }
  return [];
};

export const hasTag = (tags: string[], targetTag: string): boolean => {
  const normalizedTarget = normalizeTag(targetTag);
  return tags.some(tag => normalizeTag(tag) === normalizedTarget);
};