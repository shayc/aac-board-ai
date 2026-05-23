import { StateLayout, type StateLayoutProps } from "./state-layout";

export type EmptyStateProps = Omit<StateLayoutProps, "kind">;

export function EmptyState(props: EmptyStateProps) {
  return <StateLayout kind="empty" {...props} />;
}
