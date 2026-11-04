import { m } from "@paraglide/messages.js";
import { useTranslate } from "@shared/language/use-translate";
import { RouteErrorPage } from "./route-error-page";

export function NotFound() {
  const t = useTranslate();

  return <RouteErrorPage title={t(m.errorPageNotFound)} />;
}
