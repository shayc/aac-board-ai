import { createContext } from 'react';
import type { BoardContextValue } from '../../components/CommunicationBoard/types';

export const BoardContext = createContext<BoardContextValue | undefined>(
  undefined
);