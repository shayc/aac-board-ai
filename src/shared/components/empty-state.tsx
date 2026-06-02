import { StatusLayout, type StatusLayoutProps } from "./status-layout";

export type EmptyStateProps = Omit<StatusLayoutProps, "kind">;

export function EmptyState(props: EmptyStateProps) {
  return <StatusLayout kind="empty" {...props} />;
}
