import {
  type LoaderFunctionArgs,
  type Params,
  RouterContextProvider,
} from "react-router";

interface LoaderArgsOptions {
  params?: Params;
  signal?: AbortSignal;
}

export function loaderArgs(
  url: string,
  { params = {}, signal }: LoaderArgsOptions = {},
): LoaderFunctionArgs {
  const request = new Request(url, { signal });

  return {
    request,
    url: new URL(request.url),
    pattern: "",
    params,
    context: new RouterContextProvider(),
  };
}
