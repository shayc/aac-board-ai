const LIBRARY = "library";
const ABOUT = "about";

export const ROUTE_PATTERNS = { LIBRARY, ABOUT } as const;

export const LIBRARY_PATH = `/${LIBRARY}` as const;
export const ABOUT_PATH = `/${ABOUT}` as const;
