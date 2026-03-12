import { ErrorFallback } from "@shared/components/ErrorFallback";
import { LoadingIndicator } from "@shared/components/LoadingIndicator";
import { type ReactNode, type ReactElement, Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

export interface AsyncBoundaryProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
  errorFallback?: ReactElement;
}

export function AsyncBoundary({
  children,
  loadingFallback = <LoadingIndicator />,
  errorFallback = <ErrorFallback />,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={loadingFallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}
