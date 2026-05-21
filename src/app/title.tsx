import { APP_NAME } from "@app/app-info";

export interface TitleProps {
  children: string | undefined;
}

export function Title({ children }: TitleProps) {
  if (!children) {
    return null;
  }
  return <title>{`${children} | ${APP_NAME}`}</title>;
}
