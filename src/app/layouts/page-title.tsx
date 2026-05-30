import { APP_NAME } from "@app/app-info";
import { useSetPageTitle } from "./page-title-store";

export interface PageTitleProps {
  children: string | undefined;
}

export function PageTitle({ children }: PageTitleProps) {
  useSetPageTitle(children);
  if (!children) {
    return null;
  }

  return <title>{`${children} | ${APP_NAME}`}</title>;
}
