import { useSetPageTitle } from "./page-title-store";

export interface PageTitleProps {
  children: string | undefined;
}

export function PageTitle({ children }: PageTitleProps) {
  useSetPageTitle(children);

  if (!children) {
    return null;
  }

  return <title>{children}</title>;
}
