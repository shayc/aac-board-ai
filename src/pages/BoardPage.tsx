import { Board } from "@features/board/components/Board/Board";
import { ErrorFallback } from "@shared/components/ErrorFallback";
import { ErrorBoundary } from "react-error-boundary";

export function BoardPage() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Board />
    </ErrorBoundary>
  );
}
