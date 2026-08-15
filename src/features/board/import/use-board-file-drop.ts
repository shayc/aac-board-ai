import { useRef, useState, type DragEvent } from "react";
import { isBoardFile } from "./board-file-formats";
import { useImportBoardFiles } from "./use-import-board-files";

interface BoardFileDropHandlers {
  onDragEnter: (event: DragEvent<HTMLElement>) => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragLeave: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

interface UseBoardFileDropReturn {
  isDraggingFiles: boolean;
  dropHandlers: BoardFileDropHandlers;
}

function containsFiles(event: DragEvent<HTMLElement>): boolean {
  return event.dataTransfer.types.includes("Files");
}

export function useBoardFileDrop(): UseBoardFileDropReturn {
  const { importAndOpenBoardFiles } = useImportBoardFiles();
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepthRef = useRef(0);

  function clearDrag() {
    dragDepthRef.current = 0;
    setIsDraggingFiles(false);
  }

  function onDragEnter(event: DragEvent<HTMLElement>) {
    if (!containsFiles(event)) {
      return;
    }

    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }

  function onDragOver(event: DragEvent<HTMLElement>) {
    if (!containsFiles(event)) {
      return;
    }

    event.preventDefault();
  }

  function onDragLeave(event: DragEvent<HTMLElement>) {
    if (!containsFiles(event)) {
      return;
    }

    if (!event.relatedTarget) {
      clearDrag();
      return;
    }

    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      clearDrag();
    }
  }

  function onDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    clearDrag();

    const files = Array.from(event.dataTransfer.files).filter(isBoardFile);
    void importAndOpenBoardFiles(files);
  }

  return {
    isDraggingFiles,
    dropHandlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
