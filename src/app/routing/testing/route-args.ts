import {
  type LoaderFunctionArgs,
  type Params,
  RouterContextProvider,
} from "react-router";

interface RouteArgsOptions {
  params?: Params;
  signal?: AbortSignal;
}

export function routeArgs(
  url: string,
  { params = {}, signal }: RouteArgsOptions = {},
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
