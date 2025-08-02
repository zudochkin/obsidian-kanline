import { useContext } from 'react';
import BoardContext from '../contexts/BoardContext';
import { BoardContextValue } from '../types';

export const useBoards = (): BoardContextValue => {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoards must be used within BoardProvider');
  }
  return context;
};