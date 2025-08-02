import React, { useCallback, useEffect, useState } from 'react';
import { useBoards } from '../hooks/useBoards';
import { DEFAULT_BOARD_COLUMNS } from '../utils/constants';
import KanbanBoard from './KanbanBoard';
import CreateBoardModal from './CreateBoardModal';
import EditBoardModal from './EditBoardModal';
import ConfirmModal from './ConfirmModal';

const BoardManager: React.FC = () => {
  const { boards, activeBoard, setActiveBoard, createBoard, updateBoard, deleteBoard, loading } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string>('');

  useEffect(() => {
    console.log('[BoardManager] useEffect - boards:', boards.length, 'selectedBoardId:', selectedBoardId);
    if (selectedBoardId && boards.find(b => b.id === selectedBoardId)) {
      console.log('[BoardManager] Setting active board from selectedBoardId:', selectedBoardId);
      setActiveBoard(selectedBoardId);
    } else if (boards.length > 0) {
      console.log('[BoardManager] Setting first board as active:', boards[0].id, boards[0].name);
      setActiveBoard(boards[0].id);
      setSelectedBoardId(boards[0].id);
    } else {
      console.log('[BoardManager] No boards available');
    }
  }, [selectedBoardId, boards, setActiveBoard]);

  const handleBoardSelect = useCallback((boardId: string) => {
    setActiveBoard(boardId);
    setSelectedBoardId(boardId);
  }, [setActiveBoard]);

  const handleCreateBoard = useCallback(() => {
    setShowCreateModal(true);
  }, []);

  const handleCreateBoardSubmit = useCallback(async (name: string) => {
    const columns = DEFAULT_BOARD_COLUMNS.map((col, index) => ({
      id: `col-${Date.now()}-${index}`,
      name: col.name,
      tag: col.tag,
      order: col.order
    }));

    await createBoard({
      name,
      columns
    });
  }, [createBoard]);

  const handleEditBoard = useCallback(() => {
    setShowEditModal(true);
  }, []);

  const handleEditBoardSubmit = useCallback(async (boardId: string, updates: { name: string; dataviewQuery?: string }) => {
    await updateBoard(boardId, updates);
    setShowEditModal(false);
  }, [updateBoard]);

  const handleDeleteBoard = useCallback((boardId: string) => {
    setBoardToDelete(boardId);
    setShowDeleteModal(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (boardToDelete) {
      await deleteBoard(boardToDelete);
      setBoardToDelete('');
    }
    setShowDeleteModal(false);
  }, [deleteBoard, boardToDelete]);

  if (loading) return <div>Loading boards...</div>;

  return (
    <div className="board-manager">
      <div className="board-header">
        <h2>Note Board Manager</h2>
        <button onClick={handleCreateBoard} className="create-board-btn">
          Create New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <div className="no-boards">
          <p>No boards created yet. Create your first board to get started!</p>
        </div>
      ) : (
        <div className="board-selector">
          <label htmlFor="board-select">Select Board:</label>
          <select 
            id="board-select"
            value={selectedBoardId} 
            onChange={(e) => handleBoardSelect(e.target.value)}
          >
            {boards.map(board => (
              <option key={board.id} value={board.id}>
                {board.name} ({board.columns.length} columns)
              </option>
            ))}
          </select>
          
          {activeBoard && (
            <>
              <button 
                onClick={handleEditBoard}
                className="btn-secondary"
              >
                Edit Board
              </button>
              <button 
                onClick={() => handleDeleteBoard(activeBoard.id)}
                className="delete-board-btn"
              >
                Delete Board
              </button>
            </>
          )}
        </div>
      )}

      {activeBoard && <KanbanBoard />}
      
      <CreateBoardModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateBoardSubmit}
      />

      <EditBoardModal
        isOpen={showEditModal}
        board={activeBoard}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditBoardSubmit}
      />
      
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Board"
        message={`Are you sure you want to delete "${boards.find(b => b.id === boardToDelete)?.name}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteModal(false)}
      />
    </div>
  );
};

export default BoardManager;