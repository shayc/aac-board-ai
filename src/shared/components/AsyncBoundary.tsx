import { ErrorState } from "@shared/components/ErrorState";
import { LoadingState } from "@shared/components/LoadingState";
import { type ReactElement, type ReactNode, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactElement;
}

export function AsyncBoundary({
  children,
  loadingFallback = <LoadingState />,
  errorFallback = <ErrorState />,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
