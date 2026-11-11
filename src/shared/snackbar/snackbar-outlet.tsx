import { use, useEffect, useRef } from "react";
import { SnackbarOutletContext } from "./snackbar-context";

/**
 * Marks where snackbars render while the surface containing it is mounted.
 *
 * An open drawer or dialog hides the rest of the page from assistive
 * technology and traps focus, so a snackbar rendered in the page behind it is
 * neither announced nor reachable. Place this inside the modal surface so the
 * snackbar lives there instead; the most recently mounted outlet wins.
 */
export function SnackbarOutlet() {
  const registerOutlet = use(SnackbarOutletContext);
  const outletRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outlet = outletRef.current;
    if (!outlet || !registerOutlet) {
      return;
    }

    return registerOutlet(outlet);
  }, [registerOutlet]);

  return <div ref={outletRef} />;
}
