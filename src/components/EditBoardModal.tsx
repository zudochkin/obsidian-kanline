import React, { useEffect, useState } from 'react';
import { Board } from '../types';

interface EditBoardModalProps {
  isOpen: boolean;
  board: Board | null;
  onClose: () => void;
  onSubmit: (boardId: string, updates: { name: string; dataviewQuery?: string }) => void;
}

const EditBoardModal: React.FC<EditBoardModalProps> = ({ 
  isOpen, 
  board, 
  onClose, 
  onSubmit 
}) => {
  const [name, setName] = useState('');
  const [dataviewQuery, setDataviewQuery] = useState('');

  useEffect(() => {
    if (board) {
      setName(board.name);
      setDataviewQuery(board.dataviewQuery || '');
    } else {
      setName('');
      setDataviewQuery('');
    }
  }, [board]);

  if (!isOpen || !board) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(board.id, {
        name: name.trim(),
        dataviewQuery: dataviewQuery.trim() || undefined
      });
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setDataviewQuery('');
    onClose();
  };

  return (
    <div className="kanline-plugin">
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Edit Board</h3>
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="form-group">
              <label htmlFor="board-name">Board Name:</label>
              <input
                id="board-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter board name..."
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="board-dataview-query">Dataview Query (Optional):</label>
              <textarea
                id="board-dataview-query"
                value={dataviewQuery}
                onChange={(e) => setDataviewQuery(e.target.value)}
                placeholder='Enter global dataview query (e.g., "project/tasks")'
                rows={3}
              />
              <small className="form-help">
                Global query for this board. Column tags will be combined with this query using AND logic.
                Example: If board query is "project/tasks" and column tag is "todo", 
                the final query will be "project/tasks" and #todo
              </small>
            </div>
            
            <div className="modal-buttons">
              <button type="button" onClick={handleClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Update Board
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBoardModal;