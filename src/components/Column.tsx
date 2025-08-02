import React, { useState } from 'react';
import { Column as ColumnType, NoteCard } from '../types';
import { useNotes } from '../hooks/useNotes';
import NoteCardComponent from './NoteCard';

interface ColumnProps {
  column: ColumnType;
  notes: NoteCard[];
  draggingNote: NoteCard | null;
  onDragStart: (note: NoteCard) => void;
  onDragEnd: () => void;
  onDrop: (targetColumnTag: string) => Promise<void>;
  onEditColumn?: (column: ColumnType) => void;
}

const Column: React.FC<ColumnProps> = ({ column, notes, draggingNote, onDragStart, onDragEnd, onDrop, onEditColumn }) => {
  const { openNote } = useNotes();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleNoteClick = async (notePath: string) => {
    await openNote(notePath);
  };

  const handleDragStart = (note: NoteCard) => {
    onDragStart(note);
  };

  const handleDragEnd = () => {
    onDragEnd();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const notePath = e.dataTransfer.getData('text/plain');
    console.log('[Column] Drop event - notePath:', notePath, 'draggingNote:', draggingNote?.path);
    
    if (!draggingNote || notePath !== draggingNote.path) {
      console.log('[Column] Drop cancelled - note mismatch');
      return;
    }
    
    await onDrop(column.tag);
  };

  return (
    <div 
      className={`column ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="column-header">
        <div className="column-header-main">
          <h4 className="column-title" style={{ color: column.color }}>{column.name}</h4>
          <span className="note-count">{notes.length}</span>
        </div>
        <div className="column-header-actions">
          <span className="column-tag">#{column.tag}</span>
          {onEditColumn && (
            <button 
              className="column-edit-btn"
              onClick={() => onEditColumn(column)}
              title="Edit column"
            >
              ⚙️
            </button>
          )}
        </div>
      </div>
      
      <div className="column-content">
        {notes.length === 0 ? (
          <div className="empty-column">
            <div className="empty-message">
              <p>No notes with #{column.tag} tag</p>
              <small>Add #{column.tag} tag to notes to see them here</small>
            </div>
          </div>
        ) : (
          <div className="column-notes">
            {notes.map(note => (
              <NoteCardComponent
                key={note.path}
                note={note}
                onClick={() => handleNoteClick(note.path)}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={draggingNote?.path === note.path}
                columnTag={column.tag}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="column-footer">
        <small>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</small>
      </div>
    </div>
  );
};

export default Column;