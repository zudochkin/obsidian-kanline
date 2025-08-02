import React, { useState } from 'react';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
}

const CreateBoardModal: React.FC<CreateBoardModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [boardName, setBoardName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (boardName.trim()) {
      onSubmit(boardName.trim());
      setBoardName('');
      onClose();
    }
  };

  const handleClose = () => {
    setBoardName('');
    onClose();
  };

  return (
    <div className="kanline-plugin">
      <div className="modal-overlay" onClick={handleClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Create New Board</h3>
            <button className="modal-close" onClick={handleClose}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-body">
            <div className="form-group">
              <label htmlFor="board-name">Board Name:</label>
              <input
                id="board-name"
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="Enter board name..."
                autoFocus
                required
              />
            </div>
            
            <div className="modal-buttons">
              <button type="button" onClick={handleClose} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                Create Board
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateBoardModal;