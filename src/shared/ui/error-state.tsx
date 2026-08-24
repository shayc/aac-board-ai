import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import { StatusLayout, type StatusLayoutProps } from "./status-layout";

type ErrorStateProps = Omit<StatusLayoutProps, "kind">;

const defaultIcon = <ErrorOutlineIcon />;

export function ErrorState({ icon = defaultIcon, ...props }: ErrorStateProps) {
  return <StatusLayout kind="error" icon={icon} {...props} />;
}
