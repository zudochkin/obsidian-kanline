import React, { useState, useEffect } from 'react';
import { Column } from '../types';

interface EditColumnModalProps {
  isOpen: boolean;
  column: Column | null;
  onClose: () => void;
  onSubmit: (column: Column) => void;
  onDelete?: () => void;
}

const EditColumnModal: React.FC<EditColumnModalProps> = ({
  isOpen,
  column,
  onClose,
  onSubmit,
  onDelete
}) => {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (column) {
      setName(column.name);
      setTag(column.tag);
      setColor(column.color || '#3b82f6');
    } else {
      setName('');
      setTag('');
      setColor('#3b82f6');
    }
  }, [column]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !tag.trim()) {
      return;
    }

    const updatedColumn: Column = {
      id: column?.id || `col-${Date.now()}`,
      name: name.trim(),
      tag: tag.trim().toLowerCase(),
      color: color,
      order: column?.order || 0
    };

    onSubmit(updatedColumn);
    onClose();
  };

  const handleClose = () => {
    setName('');
    setTag('');
    setColor('#3b82f6');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="kanline-plugin">
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>{column ? 'Edit Column' : 'Add Column'}</h3>
            <button className="modal-close" onClick={handleClose}>
              ×
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="form-group">
              <label htmlFor="column-name">Column Name</label>
              <input
                type="text"
                id="column-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter column name..."
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="column-tag">Tag</label>
              <input
                type="text"
                id="column-tag"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="Enter tag (without #)..."
                required
              />
              <small className="form-help">
                Tag used for filtering within board's dataview query results
              </small>
            </div>
            
            <div className="form-group">
              <label htmlFor="column-color">Color</label>
              <div className="color-input-group">
                <input
                  type="color"
                  id="column-color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  placeholder="#3b82f6"
                  className="color-text-input"
                />
              </div>
            </div>
            
            <div className="modal-buttons">
              {column && onDelete && (
                <button 
                  type="button" 
                  className="btn-danger" 
                  onClick={() => {
                    onDelete();
                    onClose();
                  }}
                >
                  Delete Column
                </button>
              )}
              <button type="button" className="btn-secondary" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                {column ? 'Update' : 'Add'} Column
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditColumnModal;