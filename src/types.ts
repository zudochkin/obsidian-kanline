import { App, Plugin } from 'obsidian';

export interface Board {
  id: string;
  name: string;
  dataviewQuery?: string; // Global dataview query for the board
  columns: Column[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Column {
  id: string;
  name: string;
  tag: string; // Tag used for filtering within board query results
  color?: string;
  order: number;
}

export interface NoteCard {
  path: string;
  title: string;
  tags: string[];
  frontmatter?: Record<string, unknown>;
}

export interface KanLineSettings {
  boards: Board[];
  defaultBoard?: string;
  showTagsOnCards: boolean;
  cardHeight: 'compact' | 'normal' | 'expanded';
  useDataviewQueries: boolean;
  dataviewFallback: boolean;
  autoRefreshEnabled: boolean;
  autoRefreshInterval: number; // in seconds
}

export interface PluginContextValue {
  plugin: Plugin;
  app: App;
  settings: KanLineSettings;
  updateSettings: (settings: Partial<KanLineSettings>) => Promise<void>;
}

export interface BoardContextValue {
  boards: Board[];
  activeBoard: Board | null;
  setActiveBoard: (boardId: string) => void;
  createBoard: (board: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>;
  deleteBoard: (boardId: string) => Promise<void>;
  addColumn: (boardId: string, column: Omit<Column, 'id' | 'order'>) => Promise<void>;
  updateColumn: (boardId: string, columnId: string, updates: Partial<Column>) => Promise<void>;
  deleteColumn: (boardId: string, columnId: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export interface NotesContextValue {
  notes: NoteCard[];
  loading: boolean;
  error: string | null;
  isAutoRefreshing: boolean;
  refreshNotes: () => Promise<void>;
  moveNote: (noteId: string, fromColumn: string, toColumn: string) => Promise<void>;
  openNote: (notePath: string) => void;
}

export interface DataviewAPI {
  pages: (query?: string) => any[];
  page: (path: string) => any;
  current: () => any;
  index: any;
}

export interface DataviewPlugin {
  api: DataviewAPI;
}