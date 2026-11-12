// Run before first paint to prevent a theme flash.
// The external file allows CSP to forbid inline scripts.
{
  const mode = localStorage.getItem("mui-mode") ?? "system";
  const isDark =
    mode === "system"
      ? matchMedia("(prefers-color-scheme: dark)").matches
      : mode === "dark";
  document.documentElement.classList.add(isDark ? "dark" : "light");
}
