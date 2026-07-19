import type { Locale, LocalizedString } from "@paraglide/runtime";
import { useUiLocale } from "./language-store";

interface MessageOptions {
  locale?: Locale;
}

type Message<Inputs extends object> = (
  inputs: Inputs,
  options?: MessageOptions,
) => LocalizedString;

type MessageInputs<Inputs extends object> = keyof Inputs extends never
  ? [inputs?: Inputs]
  : [inputs: Inputs];

export type Translate = <Inputs extends object>(
  message: Message<Inputs>,
  ...inputs: MessageInputs<Inputs>
) => LocalizedString;

export function useTranslate(): Translate {
  const uiLocale = useUiLocale();

  return <Inputs extends object>(
    message: Message<Inputs>,
    ...inputs: MessageInputs<Inputs>
  ) => message(inputs[0] ?? ({} as Inputs), { locale: uiLocale });
}
