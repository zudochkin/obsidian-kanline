import { useContext } from 'react';
import NotesContext from '../contexts/NotesContext';
import { NotesContextValue } from '../types';

export const useNotes = (): NotesContextValue => {
  const context = useContext(NotesContext);
  if (!context) {
    throw new Error('useNotes must be used within NotesProvider');
  }
  return context;
};