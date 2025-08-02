import React from 'react';
import { NoteCard as NoteCardType } from '../types';
import { usePlugin } from '../hooks/usePlugin';

interface NoteCardProps {
  note: NoteCardType;
  onClick: () => void;
  onDragStart?: (note: NoteCardType) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  columnTag?: string; // Tag колонки, в которой находится заметка
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onClick, onDragStart, onDragEnd, isDragging, columnTag }) => {
  const { settings } = usePlugin();

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const getCardHeight = () => {
    switch (settings.cardHeight) {
      case 'compact': return 'note-card-compact';
      case 'expanded': return 'note-card-expanded';
      default: return 'note-card-normal';
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', note.path);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.(note);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  return (
    <div 
      className={`note-card ${getCardHeight()} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{ outline: 'none' }}
    >
      <div className="note-card-header">
        <div className="note-title" title={note.title}>
          {truncateText(note.title, 50)}
        </div>
      </div>
      
      <div className="note-card-body">
        <>
          <div className="note-path" title={note.path}>
            {truncateText(note.path, 40)}
          </div>
          {note.frontmatter?.created && (
            <div className="note-date">
              <small>Created: {formatDate(note.frontmatter.created as string)}</small>
            </div>
          )}
        </>
      </div>
      
      {settings.showTagsOnCards && columnTag && (
        <div className="note-card-footer">
          <div className="note-tags">
            <span className="tag" title={columnTag}>
              #{columnTag}
            </span>
          </div>
        </div>
      )}
      
      <div className="note-card-actions">
        <button 
          className="note-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          title="Open note"
        >
          📝
        </button>
      </div>
    </div>
  );
};

export default NoteCard;