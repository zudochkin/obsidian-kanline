import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Board, BoardContextValue, Column } from '../types';
import PluginContext from './PluginContext';
import { generateId } from '../utils/fileUtils';

const BoardContext = createContext<BoardContextValue | null>(null);

interface BoardProviderProps {
  children: React.ReactNode;
}

export const BoardProvider: React.FC<BoardProviderProps> = ({ children }) => {
  const pluginContext = useContext(PluginContext);
  if (!pluginContext) {
    throw new Error('BoardProvider must be used within PluginProvider');
  }

  const { settings, updateSettings } = pluginContext;
  const [activeBoard, setActiveBoardState] = useState<Board | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setActiveBoard = useCallback((boardId: string) => {
    console.log('[BoardContext] setActiveBoard called with boardId:', boardId);
    console.log('[BoardContext] Available boards:', settings.boards.map(b => ({ id: b.id, name: b.name })));
    const board = settings.boards.find(b => b.id === boardId);
    console.log('[BoardContext] Found board:', board?.name || 'null');
    setActiveBoardState(board || null);
  }, [settings.boards]);

  const createBoard = useCallback(async (boardData: Omit<Board, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const newBoard: Board = {
        ...boardData,
        id: generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await updateSettings({
        boards: [...settings.boards, newBoard]
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings]);

  const updateBoard = useCallback(async (boardId: string, updates: Partial<Board>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBoards = settings.boards.map(board =>
        board.id === boardId 
          ? { ...board, ...updates, updatedAt: new Date() }
          : board
      );
      
      await updateSettings({ boards: updatedBoards });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings]);

  const deleteBoard = useCallback(async (boardId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const filteredBoards = settings.boards.filter(board => board.id !== boardId);
      await updateSettings({ boards: filteredBoards });
      
      if (activeBoard?.id === boardId) {
        setActiveBoardState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings, activeBoard]);

  const addColumn = useCallback(async (boardId: string, column: Omit<Column, 'id' | 'order'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBoards = settings.boards.map(board => {
        if (board.id === boardId) {
          const newColumn: Column = {
            ...column,
            id: generateId(),
            order: board.columns.length
          };
          return {
            ...board,
            columns: [...board.columns, newColumn],
            updatedAt: new Date()
          };
        }
        return board;
      });
      
      await updateSettings({ boards: updatedBoards });
      
      // Update active board if it's the one being modified
      if (activeBoard?.id === boardId) {
        const updatedBoard = updatedBoards.find(b => b.id === boardId);
        if (updatedBoard) {
          setActiveBoardState(updatedBoard);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings, activeBoard]);

  const updateColumn = useCallback(async (boardId: string, columnId: string, updates: Partial<Column>) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBoards = settings.boards.map(board => {
        if (board.id === boardId) {
          const updatedColumns = board.columns.map(column =>
            column.id === columnId 
              ? { ...column, ...updates }
              : column
          );
          return {
            ...board,
            columns: updatedColumns,
            updatedAt: new Date()
          };
        }
        return board;
      });
      
      await updateSettings({ boards: updatedBoards });
      
      // Update active board if it's the one being modified
      if (activeBoard?.id === boardId) {
        const updatedBoard = updatedBoards.find(b => b.id === boardId);
        if (updatedBoard) {
          setActiveBoardState(updatedBoard);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings, activeBoard]);

  const deleteColumn = useCallback(async (boardId: string, columnId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedBoards = settings.boards.map(board => {
        if (board.id === boardId) {
          const filteredColumns = board.columns.filter(column => column.id !== columnId);
          // Reorder remaining columns
          const reorderedColumns = filteredColumns.map((column, index) => ({
            ...column,
            order: index
          }));
          return {
            ...board,
            columns: reorderedColumns,
            updatedAt: new Date()
          };
        }
        return board;
      });
      
      await updateSettings({ boards: updatedBoards });
      
      // Update active board if it's the one being modified
      if (activeBoard?.id === boardId) {
        const updatedBoard = updatedBoards.find(b => b.id === boardId);
        if (updatedBoard) {
          setActiveBoardState(updatedBoard);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [settings.boards, updateSettings, activeBoard]);

  const value = useMemo(() => ({
    boards: settings.boards,
    activeBoard,
    setActiveBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    addColumn,
    updateColumn,
    deleteColumn,
    loading,
    error
  }), [settings.boards, activeBoard, setActiveBoard, createBoard, updateBoard, deleteBoard, addColumn, updateColumn, deleteColumn, loading, error]);

  return (
    <BoardContext.Provider value={value}>
      {children}
    </BoardContext.Provider>
  );
};

export default BoardContext;