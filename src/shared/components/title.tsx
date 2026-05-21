const APP_NAME = "AAC Board AI";

export interface TitleProps {
  children: string | undefined;
}

export function Title({ children }: TitleProps) {
  if (!children) {
    return null;
  }
  return <title>{`${children} | ${APP_NAME}`}</title>;
}
