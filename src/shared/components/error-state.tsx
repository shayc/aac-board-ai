import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { StateLayout, type StateLayoutProps } from "./state-layout";

export type ErrorStateProps = Omit<StateLayoutProps, "kind">;

export function ErrorState({
  icon = <ErrorOutlineIcon />,
  ...props
}: ErrorStateProps) {
  return <StateLayout kind="error" icon={icon} {...props} />;
}
