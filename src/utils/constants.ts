export const DEFAULT_SETTINGS = {
  boards: [],
  showTagsOnCards: true,
  cardHeight: 'normal' as const,
  useDataviewQueries: false,
  dataviewFallback: true,
  autoRefreshEnabled: true,
  autoRefreshInterval: 5 // seconds
};

export const PLUGIN_NAME = 'KanLine Manager';
export const PLUGIN_ID = 'kanline-manager';

export const CARD_HEIGHTS = {
  compact: 'compact',
  normal: 'normal', 
  expanded: 'expanded'
} as const;

export const DEFAULT_BOARD_COLUMNS = [
  { name: 'To Do', tag: 'todo', order: 0 },
  { name: 'In Progress', tag: 'doing', order: 1 },
  { name: 'Done', tag: 'done', order: 2 }
];