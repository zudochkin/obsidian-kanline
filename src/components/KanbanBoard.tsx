import React, { useCallback, useEffect, useState } from 'react';
import { useBoards } from '../hooks/useBoards';
import { useNotes } from '../hooks/useNotes';
import { usePlugin } from '../hooks/usePlugin';
import { hasTag } from '../utils/tagUtils';
import { queryNotesForColumn, isDataviewEnabled } from '../utils/dataviewUtils';
import { NoteCard, Column as ColumnType } from '../types';
import Column from './Column';
import EditColumnModal from './EditColumnModal';
import DataviewErrorBanner from './DataviewErrorBanner';

const KanbanBoard: React.FC = () => {
  const { activeBoard, addColumn, updateColumn, deleteColumn } = useBoards();
  const { notes, loading, error, isAutoRefreshing, moveNote } = useNotes();
  const { settings, app } = usePlugin();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [draggingNote, setDraggingNote] = useState<NoteCard | null>(null);
  const [sourceColumnTag, setSourceColumnTag] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<ColumnType | null>(null);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [columnNotes, setColumnNotes] = useState<Record<string, NoteCard[]>>({});

  const getNotesForColumn = useCallback((column: ColumnType): NoteCard[] => {
    if (settings.useDataviewQueries && isDataviewEnabled(app)) {
      // Use cached column notes for dataview mode
      return columnNotes[column.id] || [];
    } else {
      // Use traditional tag filtering
      return notes.filter(note => hasTag(note.tags, column.tag));
    }
  }, [notes, settings.useDataviewQueries, app, columnNotes]);

  // Load notes for each column when using dataview
  useEffect(() => {
    if (!activeBoard || !settings.useDataviewQueries || !isDataviewEnabled(app)) {
      return;
    }

    const loadColumnNotes = async () => {
      console.log('[KanbanBoard] Loading column notes via Dataview...');
      const newColumnNotes: Record<string, NoteCard[]> = {};
      
      for (const column of activeBoard.columns) {
        try {
          const finalQuery = `${activeBoard.dataviewQuery || ''} and #${column.tag}`.replace(/^and /, '').trim();
          console.log(`[KanbanBoard] Column "${column.name}" query:`, finalQuery);
          const notes = await queryNotesForColumn(app, activeBoard.dataviewQuery, column.tag);
          console.log(`[KanbanBoard] Column "${column.name}" found ${notes.length} notes:`, notes.map(n => n.path));
          newColumnNotes[column.id] = notes;
        } catch (error) {
          console.error(`Error loading notes for column ${column.name}:`, error);
          newColumnNotes[column.id] = [];
        }
      }
      
      setColumnNotes(newColumnNotes);
    };

    loadColumnNotes();
  }, [activeBoard, settings.useDataviewQueries, app, notes]);

  // Update last updated time when notes change
  useEffect(() => {
    setLastUpdated(new Date());
  }, [notes, columnNotes]);
  
  const handleDragStart = useCallback((note: NoteCard, fromColumnTag: string) => {
    console.log('[KanbanBoard] Drag started for note:', note.path, 'from column:', fromColumnTag);
    console.log('[KanbanBoard] Note tags:', note.tags);
    setDraggingNote(note);
    setSourceColumnTag(fromColumnTag);
  }, []);

  const handleDragEnd = useCallback(() => {
    console.log('[KanbanBoard] Drag ended');
    setDraggingNote(null);
    setSourceColumnTag(null);
  }, []);

  const handleDrop = useCallback(async (targetColumnTag: string) => {
    if (!draggingNote || !sourceColumnTag || !activeBoard) {
      console.log('[KanbanBoard] No dragging note, source column, or active board, drop cancelled');
      return;
    }
    
    console.log('[KanbanBoard] Drop event - draggingNote:', draggingNote.path);
    console.log('[KanbanBoard] Source column:', sourceColumnTag, 'Target column:', targetColumnTag);
    
    if (sourceColumnTag !== targetColumnTag) {
      console.log('[KanbanBoard] Moving note from', sourceColumnTag, 'to', targetColumnTag);
      await moveNote(draggingNote.path, sourceColumnTag, targetColumnTag);
    } else {
      console.log('[KanbanBoard] No move needed - same column');
    }
    
    setDraggingNote(null);
    setSourceColumnTag(null);
  }, [draggingNote, sourceColumnTag, moveNote, activeBoard]);

  const handleEditColumn = useCallback((column: ColumnType) => {
    setEditingColumn(column);
    setShowColumnModal(true);
  }, []);

  const handleAddColumn = useCallback(() => {
    setEditingColumn(null);
    setShowColumnModal(true);
  }, []);

  const handleColumnSubmit = useCallback(async (column: ColumnType) => {
    if (!activeBoard) return;
    
    if (editingColumn) {
      // Update existing column
      await updateColumn(activeBoard.id, column.id, {
        name: column.name,
        tag: column.tag,
        color: column.color
      });
    } else {
      // Add new column
      await addColumn(activeBoard.id, {
        name: column.name,
        tag: column.tag,
        color: column.color
      });
    }
  }, [activeBoard, editingColumn, addColumn, updateColumn]);

  const handleColumnDelete = useCallback(async () => {
    if (!activeBoard || !editingColumn) return;
    
    await deleteColumn(activeBoard.id, editingColumn.id);
  }, [activeBoard, editingColumn, deleteColumn]);

  const handleCloseColumnModal = useCallback(() => {
    setEditingColumn(null);
    setShowColumnModal(false);
  }, []);

  const formatLastUpdated = (date: Date) => {
    return date.toLocaleTimeString();
  };

  if (!activeBoard) {
    return (
      <div className="kanban-board-empty">
        <p>No active board selected. Create or select a board to get started.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="kanban-board-loading">
        <p>Loading notes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="kanban-board-error">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      <DataviewErrorBanner 
        show={settings.useDataviewQueries && !isDataviewEnabled(app)}
      />
      
      <div className="kanban-board-header">
        <h3>{activeBoard.name}</h3>
        <div className="board-stats">
          <span>
            {settings.useDataviewQueries && isDataviewEnabled(app) 
              ? `${Object.values(columnNotes).flat().length} total notes`
              : `${notes.length} total notes`
            }
          </span>
          <span>Last updated: {formatLastUpdated(lastUpdated)}</span>
          {settings.autoRefreshEnabled && (
            <span className={`auto-refresh-indicator ${isAutoRefreshing ? 'refreshing' : ''}`}>
              🔄 Auto-refresh: {settings.autoRefreshInterval}s
              {isAutoRefreshing && <span className="refresh-status"> (updating...)</span>}
            </span>
          )}
          <button className="btn-secondary" onClick={handleAddColumn}>
            Add Column
          </button>
        </div>
      </div>
      
      <div className="columns-container">
        {activeBoard.columns.map(column => (
          <Column
            key={column.id}
            column={column}
            notes={getNotesForColumn(column)}
            draggingNote={draggingNote}
            onDragStart={(note) => handleDragStart(note, column.tag)}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onEditColumn={handleEditColumn}
          />
        ))}
      </div>
      
      <EditColumnModal
        isOpen={showColumnModal}
        column={editingColumn}
        onClose={handleCloseColumnModal}
        onSubmit={handleColumnSubmit}
        onDelete={editingColumn ? handleColumnDelete : undefined}
      />
    </div>
  );
};

export default KanbanBoard;