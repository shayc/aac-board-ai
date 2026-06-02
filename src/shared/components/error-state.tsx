import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { StatusLayout, type StatusLayoutProps } from "./status-layout";

export type ErrorStateProps = Omit<StatusLayoutProps, "kind">;

export function ErrorState({
  icon = <ErrorOutlineIcon />,
  ...props
}: ErrorStateProps) {
  return <StatusLayout kind="error" icon={icon} {...props} />;
}
